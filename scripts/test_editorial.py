from __future__ import annotations

import json
import hashlib
import http.client
import tempfile
import threading
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from http.server import ThreadingHTTPServer

from scripts.editorial import (
    ConflictError,
    EditorialError,
    EditorialStore,
    Editor,
    LoginLimiter,
    PasswordAuth,
    SessionManager,
    create_editorial_handler,
    is_loopback_address,
    validate_editor_name,
)
from scripts.serve_dashboard import create_dashboard_server


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

    def test_structurally_invalid_published_content_recovers_from_history(self) -> None:
        page = self.store.editor_page("sigma")
        page = self.store.set_reviewed(
            "sigma", page["version"], True, self.editor
        )
        published = self.store.publish("sigma", page["version"], self.editor)
        state = json.loads(
            (self.runtime / "content.json").read_text(encoding="utf-8")
        )
        state["pages"]["sigma"]["published"]["content"] = "not-a-list"
        (self.runtime / "content.json").write_text(
            json.dumps(state), encoding="utf-8"
        )
        if (self.runtime / "content.json.bak").exists():
            (self.runtime / "content.json.bak").unlink()

        recovered = EditorialStore(self.defaults_path, self.runtime)

        self.assertEqual(
            recovered.public_page("sigma")["published"]["content"],
            published["published"]["content"],
        )


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


class EditorialHttpTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.site = self.root / "site"
        self.site.mkdir()
        (self.site / "index.html").write_text(
            "<!doctype html><title>MI Intelligence Portal</title>",
            encoding="utf-8",
        )
        defaults_path = self.root / "editorial-defaults.json"
        write_defaults(defaults_path)
        runtime = self.root / "runtime" / "editorial"
        self.store = EditorialStore(defaults_path, runtime)
        self.auth = PasswordAuth(runtime / "auth.json")
        self.sessions = SessionManager()
        handler = create_editorial_handler(
            self.site, self.store, self.auth, self.sessions, LoginLimiter()
        )
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.host = f"127.0.0.1:{self.server.server_port}"
        self.cookie: str | None = None
        self.csrf: str | None = None

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temp.cleanup()

    def request(
        self,
        method: str,
        path: str,
        payload: object | None = None,
        *,
        authenticated: bool = False,
        csrf: bool = False,
        origin: str | None = "same",
        raw_body: bytes | None = None,
    ) -> tuple[int, dict[str, str], object]:
        connection = http.client.HTTPConnection(
            "127.0.0.1", self.server.server_port, timeout=5
        )
        headers = {"Host": self.host}
        if method in {"POST", "PUT", "DELETE"} and origin is not None:
            headers["Origin"] = (
                f"http://{self.host}" if origin == "same" else origin
            )
        if authenticated and self.cookie:
            headers["Cookie"] = self.cookie
        if csrf and self.csrf:
            headers["X-CSRF-Token"] = self.csrf
        if raw_body is not None:
            body = raw_body
            headers["Content-Type"] = "application/json"
        elif payload is not None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"
        else:
            body = None
        connection.request(method, path, body=body, headers=headers)
        response = connection.getresponse()
        response_body = response.read()
        response_headers = {key.lower(): value for key, value in response.getheaders()}
        connection.close()
        if not response_body:
            parsed = None
        elif response_headers.get("content-type", "").startswith("application/json"):
            parsed = json.loads(response_body.decode("utf-8"))
        else:
            parsed = response_body.decode("utf-8")
        return response.status, response_headers, parsed

    def setup_and_login(self) -> None:
        status, _, _ = self.request(
            "POST", "/api/editor/setup", {"password": "secure local password"}
        )
        self.assertEqual(status, 201)
        status, headers, body = self.request(
            "POST",
            "/api/editor/login",
            {"name": "김지은", "password": "secure local password"},
        )
        self.assertEqual(status, 200)
        cookie = headers["set-cookie"]
        self.assertIn("HttpOnly", cookie)
        self.assertIn("SameSite=Strict", cookie)
        self.assertNotIn("Secure", cookie)
        self.cookie = cookie.split(";", 1)[0]
        self.csrf = body["csrfToken"]

    def test_session_reports_loopback_setup_state(self) -> None:
        status, _, body = self.request("GET", "/api/editor/session")

        self.assertEqual(status, 200)
        self.assertEqual(
            body,
            {
                "authenticated": False,
                "editorName": None,
                "csrfToken": None,
                "setupRequired": True,
                "setupAllowed": True,
                "canChangePassword": False,
            },
        )
        self.assertTrue(is_loopback_address("::1"))
        self.assertFalse(is_loopback_address("192.168.0.50"))

    def test_public_api_never_returns_draft_or_history(self) -> None:
        status, headers, body = self.request(
            "GET", "/api/editorial/pages/sigma"
        )

        self.assertEqual(status, 200)
        self.assertEqual(set(body), {"page", "published"})
        self.assertIsNone(body["published"])
        self.assertEqual(headers["cache-control"], "no-store")
        self.assertNotIn("access-control-allow-origin", headers)

    def test_login_cookie_and_authenticated_page(self) -> None:
        self.setup_and_login()

        status, _, body = self.request(
            "GET", "/api/editor/pages/sigma", authenticated=True
        )

        self.assertEqual(status, 200)
        self.assertEqual(body["draftContent"], ["sigma default v1"])
        self.assertNotIn("ip", json.dumps(body))

    def test_state_change_requires_same_origin_and_csrf(self) -> None:
        self.setup_and_login()
        page = self.store.editor_page("sigma")
        payload = {
            "expectedVersion": page["version"],
            "mode": "custom",
            "content": ["새 작업본"],
        }

        status, _, body = self.request(
            "PUT", "/api/editor/pages/sigma/draft", payload, authenticated=True
        )
        self.assertEqual((status, body["code"]), (403, "csrf_failed"))

        status, _, body = self.request(
            "PUT",
            "/api/editor/pages/sigma/draft",
            payload,
            authenticated=True,
            csrf=True,
            origin="http://evil.example",
        )
        self.assertEqual((status, body["code"]), (403, "origin_failed"))

        status, _, body = self.request(
            "PUT",
            "/api/editor/pages/sigma/draft",
            payload,
            authenticated=True,
            csrf=True,
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["draftContent"], ["새 작업본"])

    def test_version_conflict_returns_latest_without_overwrite(self) -> None:
        self.setup_and_login()
        initial = self.store.editor_page("sigma")
        first_payload = {
            "expectedVersion": initial["version"],
            "mode": "custom",
            "content": ["첫 저장"],
        }
        status, _, _ = self.request(
            "PUT",
            "/api/editor/pages/sigma/draft",
            first_payload,
            authenticated=True,
            csrf=True,
        )
        self.assertEqual(status, 200)

        status, _, body = self.request(
            "PUT",
            "/api/editor/pages/sigma/draft",
            {**first_payload, "content": ["뒤늦은 저장"]},
            authenticated=True,
            csrf=True,
        )

        self.assertEqual(status, 409)
        self.assertEqual(body["latest"]["draftContent"], ["첫 저장"])

    def test_history_requires_authentication_and_never_returns_ip(self) -> None:
        self.setup_and_login()
        status, _, body = self.request(
            "GET", "/api/editor/pages/sigma/history"
        )
        self.assertEqual((status, body["code"]), (401, "authentication_required"))

        status, _, body = self.request(
            "GET", "/api/editor/pages/sigma/history", authenticated=True
        )
        self.assertEqual(status, 200)
        self.assertNotIn("ip", json.dumps(body))

    def test_review_publish_edit_restore_and_unpublish_routes(self) -> None:
        self.setup_and_login()
        initial = self.store.editor_page("sigma")
        status, _, reviewed = self.request(
            "POST",
            "/api/editor/pages/sigma/review",
            {"expectedVersion": initial["version"], "reviewed": True},
            authenticated=True,
            csrf=True,
        )
        self.assertEqual(status, 200)
        status, _, published_page = self.request(
            "POST",
            "/api/editor/pages/sigma/publish",
            {"expectedVersion": reviewed["version"]},
            authenticated=True,
            csrf=True,
        )
        self.assertEqual(status, 200)
        status, _, public_before = self.request(
            "GET", "/api/editorial/pages/sigma"
        )
        self.assertEqual(public_before["published"]["content"], ["sigma default v1"])

        status, _, changed = self.request(
            "PUT",
            "/api/editor/pages/sigma/draft",
            {
                "expectedVersion": published_page["version"],
                "mode": "custom",
                "content": ["새 비공개 작업본"],
            },
            authenticated=True,
            csrf=True,
        )
        self.assertEqual(status, 200)
        _, _, public_after = self.request("GET", "/api/editorial/pages/sigma")
        self.assertEqual(public_after, public_before)

        status, _, history = self.request(
            "GET", "/api/editor/pages/sigma/history", authenticated=True
        )
        self.assertEqual(status, 200)
        source_version = history["versions"][-1]["version"]
        status, _, detail = self.request(
            "GET",
            f"/api/editor/pages/sigma/history/{source_version}",
            authenticated=True,
        )
        self.assertEqual(status, 200)
        self.assertEqual(detail["after"]["draftContent"], ["sigma default v1"])

        status, _, restored = self.request(
            "POST",
            "/api/editor/pages/sigma/restore",
            {"expectedVersion": changed["version"], "version": source_version},
            authenticated=True,
            csrf=True,
        )
        self.assertEqual(status, 200)
        self.assertEqual(restored["draft"]["mode"], "custom")
        status, _, unpublished = self.request(
            "POST",
            "/api/editor/pages/sigma/unpublish",
            {"expectedVersion": restored["version"]},
            authenticated=True,
            csrf=True,
        )
        self.assertEqual(status, 200)
        self.assertIsNone(unpublished["published"])

    def test_password_change_is_loopback_only_and_logs_out_all_sessions(self) -> None:
        self.setup_and_login()
        status, headers, body = self.request(
            "PUT",
            "/api/editor/password",
            {"password": "new secure local password"},
            authenticated=True,
            csrf=True,
        )
        self.assertEqual(status, 200)
        self.assertFalse(body["authenticated"])
        self.assertIn("Max-Age=0", headers["set-cookie"])

        status, _, body = self.request(
            "GET", "/api/editor/pages/sigma", authenticated=True
        )
        self.assertEqual((status, body["code"]), (401, "authentication_required"))
        status, _, _ = self.request(
            "POST",
            "/api/editor/login",
            {"name": "김지은", "password": "new secure local password"},
        )
        self.assertEqual(status, 200)

    def test_fifth_bad_login_is_rate_limited(self) -> None:
        self.request(
            "POST", "/api/editor/setup", {"password": "secure local password"}
        )
        statuses = []
        for _ in range(5):
            status, _, _ = self.request(
                "POST",
                "/api/editor/login",
                {"name": "김지은", "password": "wrong password"},
            )
            statuses.append(status)

        self.assertEqual(statuses, [401, 401, 401, 401, 429])

    def test_body_limit_and_cors_preflight_are_rejected(self) -> None:
        status, headers, body = self.request(
            "POST", "/api/editor/login", raw_body=b" " * (64 * 1024 + 1)
        )
        self.assertEqual((status, body["code"]), (413, "body_too_large"))
        self.assertNotIn("access-control-allow-origin", headers)

        status, headers, _ = self.request("OPTIONS", "/api/editor/login")
        self.assertEqual(status, 405)
        self.assertNotIn("access-control-allow-origin", headers)

    def test_static_site_is_still_served(self) -> None:
        status, headers, body = self.request("GET", "/")

        self.assertEqual(status, 200)
        self.assertIn("text/html", headers["content-type"])
        self.assertIsInstance(body, str)

    def test_dashboard_server_factory_wires_static_site_and_api(self) -> None:
        package_root = self.root / "package"
        site = package_root / "site"
        site.mkdir(parents=True)
        (site / "index.html").write_text("<title>Portal</title>", encoding="utf-8")
        write_defaults(package_root / "editorial-defaults.json")
        server = create_dashboard_server(package_root, "127.0.0.1", 0)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            connection = http.client.HTTPConnection(
                "127.0.0.1", server.server_port, timeout=5
            )
            connection.request("GET", "/api/editor/session")
            response = connection.getresponse()
            body = json.loads(response.read().decode("utf-8"))
            connection.close()
            self.assertEqual(response.status, 200)
            self.assertTrue(body["setupRequired"])
            self.assertTrue((package_root / "runtime" / "editorial").is_dir())
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
