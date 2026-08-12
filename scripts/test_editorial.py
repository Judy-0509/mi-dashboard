from __future__ import annotations

import json
import hashlib
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from scripts.editorial import (
    ConflictError,
    EditorialError,
    EditorialStore,
    Editor,
    LoginLimiter,
    PasswordAuth,
    SessionManager,
    validate_editor_name,
)


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


def default_content(page: str, kind: str, suffix: str = "v1") -> object:
    if kind == "bullets":
        return [f"{page} default {suffix}"]
    if kind == "titled":
        return [{"title": f"제목 {suffix}", "details": [f"세부 {suffix}"]}]
    return {region: [f"{region} {suffix}"] for region in REGIONS}


def write_defaults(path: Path, revisions: dict[str, str] | None = None) -> None:
    revisions = revisions or {}
    pages = {}
    for page, kind in PAGE_KINDS.items():
        revision = revisions.get(page, "v1")
        pages[page] = {
            "kind": kind,
            "dataRevision": f"sha256:{hashlib.sha256(revision.encode()).hexdigest()}",
            "content": default_content(page, kind, revision),
        }
    path.write_text(
        json.dumps({"schemaVersion": 1, "pages": pages}, ensure_ascii=False),
        encoding="utf-8",
    )


class EditorialStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.defaults_path = self.root / "editorial-defaults.json"
        self.runtime = self.root / "runtime" / "editorial"
        write_defaults(self.defaults_path)
        self.now_value = datetime(2026, 8, 13, tzinfo=timezone.utc)
        self.editor = Editor(name="김지은", ip="192.168.0.15")
        self.store = EditorialStore(
            self.defaults_path,
            self.runtime,
            now=lambda: self.now_value,
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_first_run_is_default_unreviewed_and_private(self) -> None:
        page = self.store.editor_page("sigma")

        self.assertEqual(page["version"], 1)
        self.assertEqual(page["draft"]["mode"], "default")
        self.assertFalse(page["draft"]["reviewed"])
        self.assertEqual(page["draftContent"], ["sigma default v1"])
        self.assertIsNone(self.store.public_page("sigma")["published"])

    def test_published_snapshot_survives_new_draft(self) -> None:
        page = self.store.editor_page("sigma")
        page = self.store.set_reviewed(
            "sigma", page["version"], True, self.editor
        )
        page = self.store.publish("sigma", page["version"], self.editor)
        published = self.store.public_page("sigma")["published"]

        changed = self.store.save_draft(
            "sigma",
            page["version"],
            "custom",
            ["새 작업본"],
            self.editor,
        )

        self.assertFalse(changed["draft"]["reviewed"])
        self.assertEqual(self.store.public_page("sigma")["published"], published)

    def test_publish_requires_review_and_unpublish_hides_snapshot(self) -> None:
        page = self.store.editor_page("sigma")
        with self.assertRaisesRegex(EditorialError, "검토"):
            self.store.publish("sigma", page["version"], self.editor)

        page = self.store.set_reviewed(
            "sigma", page["version"], True, self.editor
        )
        page = self.store.publish("sigma", page["version"], self.editor)
        self.assertIsNotNone(self.store.public_page("sigma")["published"])

        self.store.unpublish("sigma", page["version"], self.editor)
        self.assertIsNone(self.store.public_page("sigma")["published"])

    def test_expected_version_prevents_silent_overwrite(self) -> None:
        page = self.store.editor_page("sigma")
        self.store.save_draft(
            "sigma", page["version"], "custom", ["첫 저장"], self.editor
        )

        with self.assertRaises(ConflictError) as caught:
            self.store.save_draft(
                "sigma", page["version"], "custom", ["뒤늦은 저장"], self.editor
            )

        self.assertEqual(caught.exception.latest["draftContent"], ["첫 저장"])

    def test_restore_creates_new_custom_unreviewed_version(self) -> None:
        page = self.store.editor_page("sigma")
        first = self.store.save_draft(
            "sigma", page["version"], "custom", ["보존할 문장"], self.editor
        )
        second = self.store.save_draft(
            "sigma", first["version"], "custom", ["현재 문장"], self.editor
        )

        restored = self.store.restore(
            "sigma", second["version"], first["version"], self.editor
        )

        self.assertEqual(restored["version"], second["version"] + 1)
        self.assertEqual(restored["draft"]["mode"], "custom")
        self.assertFalse(restored["draft"]["reviewed"])
        self.assertEqual(restored["draftContent"], ["보존할 문장"])
        event = self.store.history_version("sigma", restored["version"])
        self.assertEqual(event["restoredFromVersion"], first["version"])

    def test_history_api_view_removes_ip(self) -> None:
        page = self.store.editor_page("sigma")
        saved = self.store.save_draft(
            "sigma", page["version"], "custom", ["감사 문장"], self.editor
        )

        listing = self.store.history("sigma")
        detail = self.store.history_version("sigma", saved["version"])

        self.assertEqual(listing[0]["editor"], {"name": "김지은"})
        self.assertNotIn("192.168.0.15", json.dumps(detail, ensure_ascii=False))
        raw_history = (self.runtime / "history.jsonl").read_text(encoding="utf-8")
        self.assertIn("192.168.0.15", raw_history)

    def test_only_changed_revision_resets_and_unpublishes_its_page(self) -> None:
        sigma = self.store.editor_page("sigma")
        sigma = self.store.set_reviewed(
            "sigma", sigma["version"], True, self.editor
        )
        self.store.publish("sigma", sigma["version"], self.editor)
        weekly_before = self.store.editor_page("weekly")
        write_defaults(self.defaults_path, {"sigma": "v2"})

        self.store.refresh_defaults_if_changed(force=True)

        sigma_after = self.store.editor_page("sigma")
        weekly_after = self.store.editor_page("weekly")
        self.assertEqual(sigma_after["draftContent"], ["sigma default v2"])
        self.assertEqual(sigma_after["draft"]["mode"], "default")
        self.assertFalse(sigma_after["draft"]["reviewed"])
        self.assertIsNone(sigma_after["published"])
        self.assertEqual(weekly_after, weekly_before)
        self.assertEqual(self.store.history("sigma")[0]["action"], "data_reset")

    def test_content_validation_covers_all_three_kinds(self) -> None:
        sigma = self.store.editor_page("sigma")
        with self.assertRaises(EditorialError):
            self.store.save_draft(
                "sigma", sigma["version"], "custom", [""], self.editor
            )

        insight = self.store.editor_page("mi-insight")
        with self.assertRaises(EditorialError):
            self.store.save_draft(
                "mi-insight",
                insight["version"],
                "custom",
                [{"title": "제목", "details": []}],
                self.editor,
            )

        regional = self.store.editor_page("mi-weekly-sell-through")
        invalid_regions = {region: [] for region in REGIONS[:-1]}
        with self.assertRaises(EditorialError):
            self.store.save_draft(
                "mi-weekly-sell-through",
                regional["version"],
                "custom",
                invalid_regions,
                self.editor,
            )

    def test_partial_history_tail_is_quarantined_and_latest_state_recovers(self) -> None:
        page = self.store.editor_page("sigma")
        saved = self.store.save_draft(
            "sigma", page["version"], "custom", ["복구할 문장"], self.editor
        )
        with (self.runtime / "history.jsonl").open("ab") as history_file:
            history_file.write(b'{"broken"')
        (self.runtime / "content.json").write_text("broken", encoding="utf-8")

        recovered = EditorialStore(
            self.defaults_path,
            self.runtime,
            now=lambda: self.now_value,
        )

        self.assertEqual(recovered.editor_page("sigma")["version"], saved["version"])
        self.assertEqual(recovered.editor_page("sigma")["draftContent"], ["복구할 문장"])
        self.assertTrue(list(self.runtime.glob("history.jsonl.corrupt-*")))


class PasswordAndSessionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.now_value = datetime(2026, 8, 13, tzinfo=timezone.utc)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_password_file_never_contains_plaintext(self) -> None:
        auth = PasswordAuth(self.root / "auth.json")
        password = "correct horse battery staple"
        auth.setup(password)

        self.assertTrue(auth.verify(password))
        self.assertFalse(auth.verify("incorrect password"))
        self.assertNotIn(
            password, (self.root / "auth.json").read_text(encoding="utf-8")
        )
        with self.assertRaises(EditorialError):
            auth.setup("another secure password")

    def test_editor_name_is_trimmed_and_bounded(self) -> None:
        self.assertEqual(validate_editor_name("  김지은  "), "김지은")
        for invalid in ("", " " * 3, "x" * 41):
            with self.subTest(invalid=invalid):
                with self.assertRaises(EditorialError):
                    validate_editor_name(invalid)

    def test_session_expires_after_eight_idle_hours_and_restart(self) -> None:
        sessions = SessionManager(now=lambda: self.now_value)
        token, session = sessions.create("김지은")
        self.assertEqual(sessions.get(token)["name"], "김지은")
        self.assertEqual(len(session["csrfToken"]), 43)

        self.now_value += timedelta(hours=8, seconds=1)
        self.assertIsNone(sessions.get(token))
        restarted = SessionManager(now=lambda: self.now_value)
        self.assertIsNone(restarted.get(token))

    def test_login_limiter_blocks_fifth_failure_for_ten_minutes(self) -> None:
        limiter = LoginLimiter(now=lambda: self.now_value)
        ip = "192.168.0.20"
        for _ in range(4):
            self.assertFalse(limiter.is_blocked(ip))
            limiter.record_failure(ip)

        limiter.record_failure(ip)
        self.assertTrue(limiter.is_blocked(ip))
        self.now_value += timedelta(minutes=10, seconds=1)
        self.assertFalse(limiter.is_blocked(ip))


if __name__ == "__main__":
    unittest.main()
