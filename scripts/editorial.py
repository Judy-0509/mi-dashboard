from __future__ import annotations

import copy
import functools
import hashlib
import hmac
import ipaddress
import json
import os
import re
import secrets
import shutil
import socket
import tempfile
import threading
import traceback
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Callable
from urllib.parse import unquote, urlsplit


PAGE_KINDS = {
    "sigma": "bullets",
    "weekly": "bullets",
    "ani": "bullets",
    "sell-through": "bullets",
    "flagship-sales": "bullets",
    "pipeline-check": "bullets",
    "pipeline-check-iphone": "bullets",
    "latest-results": "bullets",
    "latest-results-iphone": "bullets",
    "mi-insight": "titled",
    "mi-weekly-sell-through": "regional",
}
REGIONS = ("Total", "USA", "China", "Japan", "Europe", "India")
REVISION_PATTERN = re.compile(r"^sha256:[0-9a-f]{64}$")
VALID_ACTIONS = {
    "initialize",
    "save",
    "mark_reviewed",
    "mark_unreviewed",
    "publish",
    "unpublish",
    "data_reset",
    "restore",
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_time(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


class EditorialError(Exception):
    def __init__(self, message: str, *, code: str = "invalid_request", status: int = 400):
        super().__init__(message)
        self.code = code
        self.status = status


class ConflictError(EditorialError):
    def __init__(self, latest: dict[str, object]):
        super().__init__(
            "다른 편집자가 먼저 저장했습니다.", code="version_conflict", status=409
        )
        self.latest = latest


@dataclass(frozen=True)
class Editor:
    name: str
    ip: str


def validate_editor_name(value: object) -> str:
    if not isinstance(value, str):
        raise EditorialError("편집자 이름을 입력해 주세요.", code="invalid_editor_name")
    normalized = value.strip()
    if not 1 <= len(normalized) <= 40:
        raise EditorialError(
            "편집자 이름은 1~40자여야 합니다.", code="invalid_editor_name"
        )
    return normalized


def validate_password(value: object) -> str:
    if not isinstance(value, str) or not 10 <= len(value) <= 128:
        raise EditorialError(
            "비밀번호는 10~128자여야 합니다.", code="invalid_password"
        )
    return value


def _validate_sentence(value: object, label: str, maximum: int) -> str:
    if not isinstance(value, str):
        raise EditorialError(f"{label}은 문자열이어야 합니다.")
    normalized = value.strip()
    if not 1 <= len(normalized) <= maximum:
        raise EditorialError(f"{label}은 1~{maximum}자여야 합니다.")
    return normalized


def validate_content(kind: str, content: object, *, publishing: bool = False) -> object:
    if kind == "bullets":
        if not isinstance(content, list) or not 1 <= len(content) <= 3:
            raise EditorialError("불릿은 1~3개여야 합니다.")
        return [
            _validate_sentence(value, "불릿", 500)
            for value in content
        ]

    if kind == "titled":
        if not isinstance(content, list) or not 1 <= len(content) <= 3:
            raise EditorialError("소제목은 1~3개여야 합니다.")
        normalized_sections = []
        for section in content:
            if not isinstance(section, dict) or set(section) != {"title", "details"}:
                raise EditorialError("소제목 콘텐츠 형식을 확인해 주세요.")
            details = section["details"]
            if not isinstance(details, list) or not 1 <= len(details) <= 5:
                raise EditorialError("소제목별 세부 문장은 1~5개여야 합니다.")
            normalized_sections.append(
                {
                    "title": _validate_sentence(section["title"], "소제목", 100),
                    "details": [
                        _validate_sentence(value, "세부 문장", 500)
                        for value in details
                    ],
                }
            )
        return normalized_sections

    if kind == "regional":
        if not isinstance(content, dict) or set(content) != set(REGIONS):
            raise EditorialError("고정 지역 키를 확인해 주세요.")
        normalized_regions = {}
        for region in REGIONS:
            details = content[region]
            if not isinstance(details, list) or len(details) > 3:
                raise EditorialError("지역별 세부 문장은 0~3개여야 합니다.")
            normalized_regions[region] = [
                _validate_sentence(value, f"{region} 세부 문장", 500)
                for value in details
            ]
        if publishing and not any(normalized_regions.values()):
            raise EditorialError("공개하려면 적어도 한 지역의 세부 내용이 필요합니다.")
        return normalized_regions

    raise EditorialError("알 수 없는 콘텐츠 형식입니다.")


def _atomic_write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    descriptor, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "wb") as temporary_file:
            temporary_file.write(payload)
            temporary_file.flush()
            os.fsync(temporary_file.fileno())
        os.replace(temporary_path, path)
    finally:
        if temporary_path.exists():
            temporary_path.unlink()


def _read_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def _validate_defaults(value: object) -> dict[str, object]:
    if not isinstance(value, dict) or value.get("schemaVersion") != 1:
        raise EditorialError("기본값 manifest 버전을 확인해 주세요.", status=503)
    pages = value.get("pages")
    if not isinstance(pages, dict) or set(pages) != set(PAGE_KINDS):
        raise EditorialError("기본값 manifest 페이지 구성을 확인해 주세요.", status=503)
    normalized_pages = {}
    for page, expected_kind in PAGE_KINDS.items():
        item = pages[page]
        if not isinstance(item, dict) or item.get("kind") != expected_kind:
            raise EditorialError(f"{page} 기본값 형식을 확인해 주세요.", status=503)
        revision = item.get("dataRevision")
        if not isinstance(revision, str) or not REVISION_PATTERN.fullmatch(revision):
            raise EditorialError(f"{page} dataRevision을 확인해 주세요.", status=503)
        normalized_pages[page] = {
            "kind": expected_kind,
            "dataRevision": revision,
            "content": validate_content(expected_kind, item.get("content")),
        }
    return {"schemaVersion": 1, "pages": normalized_pages}


class EditorialStore:
    def __init__(
        self,
        defaults_path: Path,
        runtime_dir: Path,
        *,
        now: Callable[[], datetime] = utc_now,
    ) -> None:
        self.defaults_path = Path(defaults_path)
        self.runtime_dir = Path(runtime_dir)
        self.content_path = self.runtime_dir / "content.json"
        self.backup_path = self.runtime_dir / "content.json.bak"
        self.history_path = self.runtime_dir / "history.jsonl"
        self._now = now
        self._lock = threading.RLock()
        self._warnings: list[str] = []
        self.read_only = False
        self.runtime_dir.mkdir(parents=True, exist_ok=True)
        self._defaults = self._load_defaults()
        self._defaults_mtime = self.defaults_path.stat().st_mtime_ns
        self._events = self._load_history()
        self._state = self._load_or_initialize_state()
        self._recover_newer_history()
        self.refresh_defaults_if_changed(force=True)

    def _load_defaults(self) -> dict[str, object]:
        try:
            return _validate_defaults(_read_json(self.defaults_path))
        except FileNotFoundError as error:
            raise EditorialError(
                f"기본값 manifest를 찾을 수 없습니다: {self.defaults_path}",
                code="defaults_missing",
                status=503,
            ) from error
        except (OSError, json.JSONDecodeError) as error:
            raise EditorialError(
                "기본값 manifest를 읽을 수 없습니다.",
                code="defaults_invalid",
                status=503,
            ) from error

    def _load_history(self) -> list[dict[str, object]]:
        if not self.history_path.exists():
            return []
        data = self.history_path.read_bytes()
        events: list[dict[str, object]] = []
        valid_end = 0
        offset = 0
        for line in data.splitlines(keepends=True):
            next_offset = offset + len(line)
            if not line.strip():
                valid_end = next_offset
                offset = next_offset
                continue
            try:
                event = json.loads(line.decode("utf-8"))
                if not isinstance(event, dict) or event.get("action") not in VALID_ACTIONS:
                    raise ValueError("invalid history event")
                events.append(event)
                valid_end = next_offset
            except (UnicodeDecodeError, json.JSONDecodeError, ValueError):
                break
            offset = next_offset

        if valid_end < len(data):
            suffix = self._now().strftime("%Y%m%dT%H%M%SZ")
            corrupt_path = self.runtime_dir / f"history.jsonl.corrupt-{suffix}"
            corrupt_path.write_bytes(data[valid_end:])
            self.history_path.write_bytes(data[:valid_end])
            self._warnings.append(
                f"손상된 이력 꼬리를 {corrupt_path.name}으로 분리했습니다."
            )
        return events

    def _valid_state(self, value: object) -> bool:
        if not isinstance(value, dict) or value.get("schemaVersion") != 1:
            return False
        pages = value.get("pages")
        if not isinstance(pages, dict) or set(pages) != set(PAGE_KINDS):
            return False
        for page, kind in PAGE_KINDS.items():
            state = pages.get(page)
            if not isinstance(state, dict):
                return False
            revision = state.get("dataRevision")
            version = state.get("version")
            if (
                state.get("kind") != kind
                or not isinstance(version, int)
                or isinstance(version, bool)
                or version < 1
                or not isinstance(revision, str)
                or not REVISION_PATTERN.fullmatch(revision)
            ):
                return False
            draft = state.get("draft")
            if (
                not isinstance(draft, dict)
                or draft.get("mode") not in {"default", "custom"}
                or not isinstance(draft.get("reviewed"), bool)
                or not isinstance(draft.get("updatedAt"), str)
                or not isinstance(draft.get("updatedBy"), str)
            ):
                return False
            if draft.get("mode") == "custom":
                try:
                    validate_content(kind, draft.get("customContent"))
                except EditorialError:
                    return False
            elif draft.get("customContent") is not None:
                return False
            published = state.get("published")
            if published is not None:
                if (
                    not isinstance(published, dict)
                    or not isinstance(published.get("sourceVersion"), int)
                    or isinstance(published.get("sourceVersion"), bool)
                    or not isinstance(published.get("publishedAt"), str)
                    or not isinstance(published.get("publishedBy"), str)
                ):
                    return False
                try:
                    validate_content(kind, published.get("content"), publishing=True)
                except EditorialError:
                    return False
        return True

    def _try_read_state(self, path: Path) -> dict[str, object] | None:
        try:
            value = _read_json(path)
        except (FileNotFoundError, OSError, json.JSONDecodeError):
            return None
        return value if self._valid_state(value) else None

    def _new_page_state(self, page: str) -> dict[str, object]:
        default = self._defaults["pages"][page]
        return {
            "kind": default["kind"],
            "dataRevision": default["dataRevision"],
            "version": 1,
            "draft": {
                "mode": "default",
                "customContent": None,
                "reviewed": False,
                "updatedAt": iso_time(self._now()),
                "updatedBy": "system",
            },
            "published": None,
        }

    def _load_or_initialize_state(self) -> dict[str, object]:
        content_existed = self.content_path.exists()
        backup_existed = self.backup_path.exists()
        state = self._try_read_state(self.content_path)
        if state is not None:
            return state

        state = self._try_read_state(self.backup_path)
        if state is not None:
            self._warnings.append("content.json을 백업에서 복구했습니다.")
            _atomic_write_json(self.content_path, state)
            return state

        reconstructed = self._reconstruct_from_events()
        if reconstructed is not None:
            self._warnings.append("content.json을 이력에서 복구했습니다.")
            _atomic_write_json(self.content_path, reconstructed)
            return reconstructed

        if content_existed or backup_existed or self.history_path.exists():
            self.read_only = True
            self._warnings.append("편집 상태를 복구할 수 없어 읽기 전용으로 전환했습니다.")
            return {
                "schemaVersion": 1,
                "pages": {page: self._new_page_state(page) for page in PAGE_KINDS},
            }

        state = {
            "schemaVersion": 1,
            "pages": {page: self._new_page_state(page) for page in PAGE_KINDS},
        }
        events = [
            self._make_event(
                page,
                None,
                state["pages"][page],
                "initialize",
                Editor(name="system", ip=""),
            )
            for page in PAGE_KINDS
        ]
        self._persist(state, events)
        return state

    def _reconstruct_from_events(self) -> dict[str, object] | None:
        pages: dict[str, object] = {}
        for event in self._events:
            page = event.get("page")
            after = event.get("after")
            if page in PAGE_KINDS and isinstance(after, dict):
                pages[page] = self._state_from_snapshot(after)
        if set(pages) != set(PAGE_KINDS):
            return None
        state = {"schemaVersion": 1, "pages": pages}
        return state if self._valid_state(state) else None

    def _recover_newer_history(self) -> None:
        changed = False
        pages = copy.deepcopy(self._state["pages"])
        for event in self._events:
            page = event.get("page")
            after = event.get("after")
            if page not in PAGE_KINDS or not isinstance(after, dict):
                continue
            version = event.get("version")
            if isinstance(version, int) and version > pages[page]["version"]:
                pages[page] = self._state_from_snapshot(after)
                changed = True
        if changed:
            self._state = {"schemaVersion": 1, "pages": pages}
            if not self.read_only:
                self._write_state(self._state)
            self._warnings.append("콘텐츠보다 앞선 이력을 적용했습니다.")

    def _resolve_draft(
        self,
        page: str,
        state: dict[str, object],
        defaults: dict[str, object] | None = None,
    ) -> object:
        draft = state["draft"]
        if draft["mode"] == "custom":
            return copy.deepcopy(draft["customContent"])
        source = defaults or self._defaults
        return copy.deepcopy(source["pages"][page]["content"])

    def _snapshot(
        self,
        page: str,
        state: dict[str, object],
        defaults: dict[str, object] | None = None,
    ) -> dict[str, object]:
        snapshot = copy.deepcopy(state)
        snapshot["draftContent"] = self._resolve_draft(page, state, defaults)
        return snapshot

    @staticmethod
    def _state_from_snapshot(snapshot: dict[str, object]) -> dict[str, object]:
        state = copy.deepcopy(snapshot)
        state.pop("draftContent", None)
        return state

    def _make_event(
        self,
        page: str,
        before: dict[str, object] | None,
        after: dict[str, object],
        action: str,
        editor: Editor,
        *,
        before_defaults: dict[str, object] | None = None,
        after_defaults: dict[str, object] | None = None,
        restored_from: int | None = None,
    ) -> dict[str, object]:
        return {
            "eventId": secrets.token_hex(16),
            "page": page,
            "version": after["version"],
            "parentVersion": None if before is None else before["version"],
            "action": action,
            "editor": {"name": editor.name, "ip": editor.ip},
            "timestamp": iso_time(self._now()),
            "before": None
            if before is None
            else self._snapshot(page, before, before_defaults),
            "after": self._snapshot(page, after, after_defaults),
            "restoredFromVersion": restored_from,
        }

    def _append_event(self, event: dict[str, object]) -> None:
        self.runtime_dir.mkdir(parents=True, exist_ok=True)
        with self.history_path.open("a", encoding="utf-8", newline="\n") as history:
            history.write(json.dumps(event, ensure_ascii=False, separators=(",", ":")))
            history.write("\n")
            history.flush()
            os.fsync(history.fileno())

    def _write_state(self, state: dict[str, object]) -> None:
        if self.content_path.exists():
            descriptor, temporary_name = tempfile.mkstemp(
                prefix=".content.json.bak.", dir=self.runtime_dir
            )
            os.close(descriptor)
            temporary_path = Path(temporary_name)
            try:
                shutil.copyfile(self.content_path, temporary_path)
                with temporary_path.open("r+b") as backup_file:
                    os.fsync(backup_file.fileno())
                os.replace(temporary_path, self.backup_path)
            finally:
                if temporary_path.exists():
                    temporary_path.unlink()
        _atomic_write_json(self.content_path, state)

    def _persist(
        self, state: dict[str, object], events: list[dict[str, object]]
    ) -> None:
        for event in events:
            self._append_event(event)
        try:
            self._write_state(state)
        except OSError:
            try:
                self._write_state(state)
            except OSError as error:
                self._events.extend(events)
                self._state = state
                self.read_only = True
                self._warnings.append("콘텐츠 저장 실패로 읽기 전용으로 전환했습니다.")
                raise EditorialError(
                    "콘텐츠를 저장할 수 없습니다.", code="storage_read_only", status=503
                ) from error
        self._events.extend(events)
        self._state = state

    def _ensure_writeable(self) -> None:
        if self.read_only:
            raise EditorialError(
                "편집 저장소가 읽기 전용입니다.", code="storage_read_only", status=503
            )

    def _page_state(self, page: str) -> dict[str, object]:
        if page not in PAGE_KINDS:
            raise EditorialError("알 수 없는 페이지입니다.", code="page_not_found", status=404)
        return self._state["pages"][page]

    def _check_version(self, page: str, expected_version: object) -> dict[str, object]:
        state = self._page_state(page)
        if not isinstance(expected_version, int) or expected_version != state["version"]:
            raise ConflictError(self.editor_page(page, refresh=False))
        return state

    def _editor_view(self, page: str, state: dict[str, object]) -> dict[str, object]:
        default = self._defaults["pages"][page]
        return {
            "page": page,
            "kind": state["kind"],
            "dataRevision": state["dataRevision"],
            "version": state["version"],
            "draft": copy.deepcopy(state["draft"]),
            "draftContent": self._resolve_draft(page, state),
            "defaultContent": copy.deepcopy(default["content"]),
            "published": copy.deepcopy(state["published"]),
            "readOnly": self.read_only,
            "warnings": list(self._warnings),
        }

    def refresh_defaults_if_changed(self, *, force: bool = False) -> None:
        with self._lock:
            try:
                mtime = self.defaults_path.stat().st_mtime_ns
            except OSError as error:
                raise EditorialError(
                    "기본값 manifest를 확인할 수 없습니다.", status=503
                ) from error
            if not force and mtime == self._defaults_mtime:
                return
            next_defaults = self._load_defaults()
            previous_defaults = self._defaults
            self._defaults = next_defaults
            self._defaults_mtime = mtime
            if self.read_only:
                return

            next_state = copy.deepcopy(self._state)
            events = []
            for page in PAGE_KINDS:
                before = self._state["pages"][page]
                default = next_defaults["pages"][page]
                if before["dataRevision"] == default["dataRevision"]:
                    continue
                after = {
                    "kind": default["kind"],
                    "dataRevision": default["dataRevision"],
                    "version": before["version"] + 1,
                    "draft": {
                        "mode": "default",
                        "customContent": None,
                        "reviewed": False,
                        "updatedAt": iso_time(self._now()),
                        "updatedBy": "system",
                    },
                    "published": None,
                }
                next_state["pages"][page] = after
                events.append(
                    self._make_event(
                        page,
                        before,
                        after,
                        "data_reset",
                        Editor(name="system", ip=""),
                        before_defaults=previous_defaults,
                        after_defaults=next_defaults,
                    )
                )
            if events:
                self._persist(next_state, events)

    def public_page(self, page: str) -> dict[str, object]:
        with self._lock:
            self.refresh_defaults_if_changed()
            state = self._page_state(page)
            return {"page": page, "published": copy.deepcopy(state["published"])}

    def editor_page(self, page: str, *, refresh: bool = True) -> dict[str, object]:
        with self._lock:
            if refresh:
                self.refresh_defaults_if_changed()
            return self._editor_view(page, self._page_state(page))

    def _commit_page(
        self,
        page: str,
        before: dict[str, object],
        after: dict[str, object],
        action: str,
        editor: Editor,
        *,
        restored_from: int | None = None,
    ) -> dict[str, object]:
        next_state = copy.deepcopy(self._state)
        next_state["pages"][page] = after
        event = self._make_event(
            page,
            before,
            after,
            action,
            editor,
            restored_from=restored_from,
        )
        self._persist(next_state, [event])
        return self._editor_view(page, after)

    def save_draft(
        self,
        page: str,
        expected_version: object,
        mode: object,
        content: object,
        editor: Editor,
    ) -> dict[str, object]:
        with self._lock:
            self.refresh_defaults_if_changed()
            self._ensure_writeable()
            before = self._check_version(page, expected_version)
            if mode not in {"default", "custom"}:
                raise EditorialError("작업본 모드를 확인해 주세요.")
            normalized = (
                None
                if mode == "default"
                else validate_content(PAGE_KINDS[page], content)
            )
            after = copy.deepcopy(before)
            after["version"] += 1
            after["draft"] = {
                "mode": mode,
                "customContent": normalized,
                "reviewed": False,
                "updatedAt": iso_time(self._now()),
                "updatedBy": editor.name,
            }
            return self._commit_page(page, before, after, "save", editor)

    def set_reviewed(
        self,
        page: str,
        expected_version: object,
        reviewed: object,
        editor: Editor,
    ) -> dict[str, object]:
        with self._lock:
            self.refresh_defaults_if_changed()
            self._ensure_writeable()
            before = self._check_version(page, expected_version)
            if not isinstance(reviewed, bool):
                raise EditorialError("검토 상태를 확인해 주세요.")
            if before["draft"]["reviewed"] == reviewed:
                return self._editor_view(page, before)
            after = copy.deepcopy(before)
            after["version"] += 1
            after["draft"]["reviewed"] = reviewed
            after["draft"]["updatedAt"] = iso_time(self._now())
            after["draft"]["updatedBy"] = editor.name
            action = "mark_reviewed" if reviewed else "mark_unreviewed"
            return self._commit_page(page, before, after, action, editor)

    def publish(
        self, page: str, expected_version: object, editor: Editor
    ) -> dict[str, object]:
        with self._lock:
            self.refresh_defaults_if_changed()
            self._ensure_writeable()
            before = self._check_version(page, expected_version)
            if not before["draft"]["reviewed"]:
                raise EditorialError(
                    "검토 완료된 작업본만 공개할 수 있습니다.", code="not_reviewed"
                )
            content = validate_content(
                PAGE_KINDS[page], self._resolve_draft(page, before), publishing=True
            )
            after = copy.deepcopy(before)
            after["version"] += 1
            after["published"] = {
                "sourceVersion": before["version"],
                "content": content,
                "publishedAt": iso_time(self._now()),
                "publishedBy": editor.name,
            }
            return self._commit_page(page, before, after, "publish", editor)

    def unpublish(
        self, page: str, expected_version: object, editor: Editor
    ) -> dict[str, object]:
        with self._lock:
            self.refresh_defaults_if_changed()
            self._ensure_writeable()
            before = self._check_version(page, expected_version)
            if before["published"] is None:
                return self._editor_view(page, before)
            after = copy.deepcopy(before)
            after["version"] += 1
            after["published"] = None
            return self._commit_page(page, before, after, "unpublish", editor)

    def history(self, page: str) -> list[dict[str, object]]:
        with self._lock:
            self._page_state(page)
            return [
                {
                    "eventId": event["eventId"],
                    "page": event["page"],
                    "version": event["version"],
                    "parentVersion": event["parentVersion"],
                    "action": event["action"],
                    "editor": {"name": event["editor"]["name"]},
                    "timestamp": event["timestamp"],
                    "restoredFromVersion": event.get("restoredFromVersion"),
                }
                for event in reversed(self._events)
                if event.get("page") == page
            ]

    def history_version(self, page: str, version: object) -> dict[str, object]:
        with self._lock:
            self._page_state(page)
            if not isinstance(version, int):
                raise EditorialError("버전을 확인해 주세요.")
            for raw_event in reversed(self._events):
                if raw_event.get("page") == page and raw_event.get("version") == version:
                    event = copy.deepcopy(raw_event)
                    event["editor"] = {"name": event["editor"]["name"]}
                    return event
            raise EditorialError("이력 버전을 찾을 수 없습니다.", status=404)

    def restore(
        self,
        page: str,
        expected_version: object,
        source_version: object,
        editor: Editor,
    ) -> dict[str, object]:
        with self._lock:
            self.refresh_defaults_if_changed()
            self._ensure_writeable()
            before = self._check_version(page, expected_version)
            target = self.history_version(page, source_version)
            target_content = target["after"]["draftContent"]
            normalized = validate_content(PAGE_KINDS[page], target_content)
            after = copy.deepcopy(before)
            after["version"] += 1
            after["draft"] = {
                "mode": "custom",
                "customContent": normalized,
                "reviewed": False,
                "updatedAt": iso_time(self._now()),
                "updatedBy": editor.name,
            }
            return self._commit_page(
                page,
                before,
                after,
                "restore",
                editor,
                restored_from=source_version,
            )


class PasswordAuth:
    N = 2**14
    R = 8
    P = 1
    DKLEN = 32

    def __init__(self, path: Path) -> None:
        self.path = Path(path)

    @property
    def configured(self) -> bool:
        return self.path.is_file()

    def _hash(self, password: str, salt: bytes) -> bytes:
        return hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=self.N,
            r=self.R,
            p=self.P,
            dklen=self.DKLEN,
        )

    def _write(self, password: str) -> None:
        salt = secrets.token_bytes(16)
        digest = self._hash(password, salt)
        _atomic_write_json(
            self.path,
            {
                "schemaVersion": 1,
                "algorithm": "scrypt",
                "n": self.N,
                "r": self.R,
                "p": self.P,
                "dklen": self.DKLEN,
                "salt": salt.hex(),
                "hash": digest.hex(),
            },
        )

    def setup(self, password: object) -> None:
        if self.configured:
            raise EditorialError("공용 비밀번호가 이미 설정되어 있습니다.", status=409)
        self._write(validate_password(password))

    def change(self, password: object) -> None:
        if not self.configured:
            raise EditorialError("공용 비밀번호가 설정되지 않았습니다.", status=409)
        self._write(validate_password(password))

    def verify(self, password: object) -> bool:
        if not self.configured or not isinstance(password, str):
            return False
        try:
            data = _read_json(self.path)
            salt = bytes.fromhex(data["salt"])
            expected = bytes.fromhex(data["hash"])
            actual = hashlib.scrypt(
                password.encode("utf-8"),
                salt=salt,
                n=int(data["n"]),
                r=int(data["r"]),
                p=int(data["p"]),
                dklen=int(data["dklen"]),
            )
        except (OSError, json.JSONDecodeError, KeyError, TypeError, ValueError):
            return False
        return hmac.compare_digest(actual, expected)


class SessionManager:
    IDLE_TIMEOUT = timedelta(hours=8)

    def __init__(self, *, now: Callable[[], datetime] = utc_now) -> None:
        self._now = now
        self._sessions: dict[str, dict[str, object]] = {}
        self._lock = threading.Lock()

    def create(self, name: str) -> tuple[str, dict[str, object]]:
        with self._lock:
            token = secrets.token_urlsafe(32)
            session = {
                "name": validate_editor_name(name),
                "csrfToken": secrets.token_urlsafe(32),
                "lastSeen": self._now(),
            }
            self._sessions[token] = session
            return token, copy.deepcopy(session)

    def get(self, token: str | None) -> dict[str, object] | None:
        if not token:
            return None
        with self._lock:
            session = self._sessions.get(token)
            if session is None:
                return None
            now = self._now()
            if now - session["lastSeen"] > self.IDLE_TIMEOUT:
                self._sessions.pop(token, None)
                return None
            session["lastSeen"] = now
            return copy.deepcopy(session)

    def destroy(self, token: str | None) -> None:
        if not token:
            return
        with self._lock:
            self._sessions.pop(token, None)

    def clear(self) -> None:
        with self._lock:
            self._sessions.clear()


class LoginLimiter:
    def __init__(
        self,
        *,
        now: Callable[[], datetime] = utc_now,
        maximum_failures: int = 5,
        window: timedelta = timedelta(minutes=10),
    ) -> None:
        self._now = now
        self.maximum_failures = maximum_failures
        self.window = window
        self._failures: dict[str, list[datetime]] = {}
        self._lock = threading.Lock()

    def _recent(self, ip: str) -> list[datetime]:
        cutoff = self._now() - self.window
        recent = [value for value in self._failures.get(ip, []) if value > cutoff]
        if recent:
            self._failures[ip] = recent
        else:
            self._failures.pop(ip, None)
        return recent

    def is_blocked(self, ip: str) -> bool:
        with self._lock:
            return len(self._recent(ip)) >= self.maximum_failures

    def record_failure(self, ip: str) -> None:
        with self._lock:
            recent = self._recent(ip)
            recent.append(self._now())
            self._failures[ip] = recent

    def clear(self, ip: str) -> None:
        with self._lock:
            self._failures.pop(ip, None)


SESSION_COOKIE = "mi_editor_session"
MAX_BODY_SIZE = 64 * 1024


def is_loopback_address(value: str) -> bool:
    try:
        return ipaddress.ip_address(value).is_loopback
    except ValueError:
        return value.casefold() == "localhost"


def _allowed_host(value: str | None) -> bool:
    if not value:
        return False
    parsed = urlsplit(f"//{value}")
    hostname = parsed.hostname
    if not hostname or parsed.username or parsed.password or parsed.path:
        return False
    try:
        address = ipaddress.ip_address(hostname)
        return address.is_loopback or address.is_private
    except ValueError:
        allowed_names = {
            "localhost",
            socket.gethostname().casefold(),
            socket.getfqdn().casefold(),
        }
        return hostname.casefold() in allowed_names


@dataclass(frozen=True)
class _EditorialApi:
    store: EditorialStore
    auth: PasswordAuth
    sessions: SessionManager
    limiter: LoginLimiter


class EditorialRequestHandler(SimpleHTTPRequestHandler):
    server_version = "MIEditorialHTTP/1.0"

    def __init__(
        self,
        *args: object,
        api: _EditorialApi,
        directory: str,
        **kwargs: object,
    ) -> None:
        self.api = api
        super().__init__(*args, directory=directory, **kwargs)

    def _send_json(
        self,
        status: int,
        value: object,
        *,
        headers: dict[str, str] | None = None,
    ) -> None:
        payload = json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode(
            "utf-8"
        )
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        for name, content in (headers or {}).items():
            self.send_header(name, content)
        self.end_headers()
        self.wfile.write(payload)

    def _send_error(self, error: EditorialError) -> None:
        body: dict[str, object] = {"error": str(error), "code": error.code}
        if isinstance(error, ConflictError):
            body["latest"] = error.latest
        self._send_json(error.status, body)

    def _read_json_body(self) -> dict[str, object]:
        if self.headers.get("Transfer-Encoding"):
            raise EditorialError(
                "청크 요청은 지원하지 않습니다.", code="invalid_body", status=400
            )
        raw_length = self.headers.get("Content-Length")
        try:
            length = int(raw_length or "0")
        except ValueError as error:
            raise EditorialError("요청 크기를 확인해 주세요.", code="invalid_body") from error
        if length > MAX_BODY_SIZE:
            raise EditorialError(
                "요청 본문은 64 KiB 이하여야 합니다.",
                code="body_too_large",
                status=413,
            )
        if length < 0:
            raise EditorialError("요청 크기를 확인해 주세요.", code="invalid_body")
        content_type = self.headers.get_content_type()
        if length and content_type != "application/json":
            raise EditorialError(
                "Content-Type은 application/json이어야 합니다.",
                code="invalid_content_type",
                status=415,
            )
        try:
            value = json.loads(self.rfile.read(length).decode("utf-8")) if length else {}
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise EditorialError("JSON 본문을 확인해 주세요.", code="invalid_json") from error
        if not isinstance(value, dict):
            raise EditorialError("JSON 객체가 필요합니다.", code="invalid_json")
        return value

    def _origin_allowed(self) -> bool:
        host = self.headers.get("Host")
        origin = self.headers.get("Origin")
        if not _allowed_host(host) or not origin:
            return False
        parsed = urlsplit(origin)
        return (
            parsed.scheme == "http"
            and parsed.netloc.casefold() == host.casefold()
            and parsed.path in {"", "/"}
            and not parsed.query
            and not parsed.fragment
            and parsed.username is None
            and parsed.password is None
        )

    def _require_origin(self) -> None:
        if not self._origin_allowed():
            raise EditorialError(
                "동일 출처 요청만 허용합니다.", code="origin_failed", status=403
            )

    def _session_token(self) -> str | None:
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except Exception:
            return None
        morsel = cookie.get(SESSION_COOKIE)
        return None if morsel is None else morsel.value

    def _require_session(self) -> tuple[str, dict[str, object]]:
        token = self._session_token()
        session = self.api.sessions.get(token)
        if token is None or session is None:
            raise EditorialError(
                "편집 모드 로그인이 필요합니다.",
                code="authentication_required",
                status=401,
            )
        return token, session

    def _require_mutation(self) -> tuple[str, dict[str, object]]:
        self._require_origin()
        token, session = self._require_session()
        supplied = self.headers.get("X-CSRF-Token", "")
        if not supplied or not hmac.compare_digest(supplied, str(session["csrfToken"])):
            raise EditorialError(
                "CSRF 토큰을 확인해 주세요.", code="csrf_failed", status=403
            )
        return token, session

    def _editor(self, session: dict[str, object]) -> Editor:
        return Editor(name=str(session["name"]), ip=str(self.client_address[0]))

    def _session_response(self) -> dict[str, object]:
        session = self.api.sessions.get(self._session_token())
        loopback = is_loopback_address(str(self.client_address[0]))
        return {
            "authenticated": session is not None,
            "editorName": None if session is None else session["name"],
            "csrfToken": None if session is None else session["csrfToken"],
            "setupRequired": not self.api.auth.configured,
            "setupAllowed": loopback,
            "canChangePassword": session is not None and loopback,
        }

    def _dispatch_get(self, path: str) -> None:
        if path == "/api/editor/session":
            self._send_json(200, self._session_response())
            return

        public_match = re.fullmatch(r"/api/editorial/pages/([^/]+)", path)
        if public_match:
            page = unquote(public_match.group(1))
            self._send_json(200, self.api.store.public_page(page))
            return

        detail_match = re.fullmatch(
            r"/api/editor/pages/([^/]+)/history/(\d+)", path
        )
        if detail_match:
            self._require_session()
            page = unquote(detail_match.group(1))
            version = int(detail_match.group(2))
            self._send_json(200, self.api.store.history_version(page, version))
            return

        history_match = re.fullmatch(r"/api/editor/pages/([^/]+)/history", path)
        if history_match:
            self._require_session()
            page = unquote(history_match.group(1))
            self._send_json(
                200, {"page": page, "versions": self.api.store.history(page)}
            )
            return

        editor_match = re.fullmatch(r"/api/editor/pages/([^/]+)", path)
        if editor_match:
            self._require_session()
            page = unquote(editor_match.group(1))
            self._send_json(200, self.api.store.editor_page(page))
            return

        raise EditorialError("API 경로를 찾을 수 없습니다.", status=404)

    def _setup(self) -> None:
        self._require_origin()
        if not is_loopback_address(str(self.client_address[0])):
            raise EditorialError(
                "최초 설정은 서버 PC의 localhost에서만 가능합니다.",
                code="loopback_required",
                status=403,
            )
        body = self._read_json_body()
        self.api.auth.setup(body.get("password"))
        self._send_json(201, {"setupRequired": False})

    def _login(self) -> None:
        self._require_origin()
        body = self._read_json_body()
        if not self.api.auth.configured:
            raise EditorialError(
                "서버 PC에서 공용 비밀번호를 먼저 설정해 주세요.",
                code="setup_required",
                status=409,
            )
        ip = str(self.client_address[0])
        if self.api.limiter.is_blocked(ip):
            raise EditorialError(
                "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
                code="login_rate_limited",
                status=429,
            )
        name = validate_editor_name(body.get("name"))
        if not self.api.auth.verify(body.get("password")):
            self.api.limiter.record_failure(ip)
            if self.api.limiter.is_blocked(ip):
                raise EditorialError(
                    "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
                    code="login_rate_limited",
                    status=429,
                )
            raise EditorialError(
                "이름 또는 비밀번호를 확인해 주세요.",
                code="login_failed",
                status=401,
            )
        self.api.limiter.clear(ip)
        token, session = self.api.sessions.create(name)
        self._send_json(
            200,
            {
                "authenticated": True,
                "editorName": session["name"],
                "csrfToken": session["csrfToken"],
                "setupRequired": False,
                "setupAllowed": is_loopback_address(ip),
                "canChangePassword": is_loopback_address(ip),
            },
            headers={
                "Set-Cookie": (
                    f"{SESSION_COOKIE}={token}; HttpOnly; SameSite=Strict; Path=/"
                )
            },
        )

    def _logout(self) -> None:
        token, _ = self._require_mutation()
        self.api.sessions.destroy(token)
        self._send_json(
            200,
            {"authenticated": False},
            headers={
                "Set-Cookie": (
                    f"{SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"
                )
            },
        )

    def _change_password(self) -> None:
        self._require_mutation()
        if not is_loopback_address(str(self.client_address[0])):
            raise EditorialError(
                "비밀번호 변경은 서버 PC의 localhost에서만 가능합니다.",
                code="loopback_required",
                status=403,
            )
        body = self._read_json_body()
        self.api.auth.change(body.get("password"))
        self.api.sessions.clear()
        self._send_json(
            200,
            {"authenticated": False},
            headers={
                "Set-Cookie": (
                    f"{SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"
                )
            },
        )

    def _dispatch_editor_mutation(self, path: str) -> None:
        _, session = self._require_mutation()
        editor = self._editor(session)
        body = self._read_json_body()

        draft_match = re.fullmatch(r"/api/editor/pages/([^/]+)/draft", path)
        if draft_match and self.command == "PUT":
            page = unquote(draft_match.group(1))
            result = self.api.store.save_draft(
                page,
                body.get("expectedVersion"),
                body.get("mode"),
                body.get("content"),
                editor,
            )
            self._send_json(200, result)
            return

        review_match = re.fullmatch(r"/api/editor/pages/([^/]+)/review", path)
        if review_match and self.command == "POST":
            page = unquote(review_match.group(1))
            result = self.api.store.set_reviewed(
                page, body.get("expectedVersion"), body.get("reviewed"), editor
            )
            self._send_json(200, result)
            return

        publish_match = re.fullmatch(r"/api/editor/pages/([^/]+)/publish", path)
        if publish_match and self.command == "POST":
            page = unquote(publish_match.group(1))
            result = self.api.store.publish(page, body.get("expectedVersion"), editor)
            self._send_json(200, result)
            return

        unpublish_match = re.fullmatch(
            r"/api/editor/pages/([^/]+)/unpublish", path
        )
        if unpublish_match and self.command == "POST":
            page = unquote(unpublish_match.group(1))
            result = self.api.store.unpublish(
                page, body.get("expectedVersion"), editor
            )
            self._send_json(200, result)
            return

        restore_match = re.fullmatch(r"/api/editor/pages/([^/]+)/restore", path)
        if restore_match and self.command == "POST":
            page = unquote(restore_match.group(1))
            result = self.api.store.restore(
                page,
                body.get("expectedVersion"),
                body.get("version"),
                editor,
            )
            self._send_json(200, result)
            return

        raise EditorialError("API 경로를 찾을 수 없습니다.", status=404)

    def _dispatch_mutation(self, path: str) -> None:
        if path == "/api/editor/setup" and self.command == "POST":
            self._setup()
            return
        if path == "/api/editor/login" and self.command == "POST":
            self._login()
            return
        if path == "/api/editor/logout" and self.command == "POST":
            self._logout()
            return
        if path == "/api/editor/password" and self.command == "PUT":
            self._change_password()
            return
        self._dispatch_editor_mutation(path)

    def _handle_api(self, method: str) -> bool:
        path = urlsplit(self.path).path
        if not path.startswith("/api/"):
            return False
        try:
            if method == "GET":
                self._dispatch_get(path)
            elif method in {"POST", "PUT"}:
                self._dispatch_mutation(path)
            else:
                raise EditorialError(
                    "허용되지 않은 API 메서드입니다.",
                    code="method_not_allowed",
                    status=405,
                )
        except EditorialError as error:
            self._send_error(error)
        except Exception:
            self.log_error("Unhandled editorial API error:\n%s", traceback.format_exc())
            self._send_error(
                EditorialError(
                    "편집 API 처리 중 오류가 발생했습니다.",
                    code="server_error",
                    status=500,
                )
            )
        return True

    def do_GET(self) -> None:
        if not self._handle_api("GET"):
            super().do_GET()

    def do_POST(self) -> None:
        if not self._handle_api("POST"):
            self.send_error(405)

    def do_PUT(self) -> None:
        if not self._handle_api("PUT"):
            self.send_error(405)

    def do_OPTIONS(self) -> None:
        if not self._handle_api("OPTIONS"):
            self.send_error(405)


def create_editorial_handler(
    site_root: Path,
    store: EditorialStore,
    auth: PasswordAuth,
    sessions: SessionManager,
    limiter: LoginLimiter | None = None,
) -> type[EditorialRequestHandler]:
    api = _EditorialApi(
        store=store,
        auth=auth,
        sessions=sessions,
        limiter=limiter or LoginLimiter(),
    )
    return functools.partial(
        EditorialRequestHandler,
        api=api,
        directory=str(Path(site_root).resolve()),
    )
