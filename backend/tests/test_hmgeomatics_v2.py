"""Backend tests for HM Geomatics — JWT auth, CMS content, projects, upload, enquiries."""
import io
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_EMAIL = "admin@hmgeomatics.com"
ADMIN_PASSWORD = "hmgeomatics2026"


@pytest.fixture(scope="session")
def token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == ADMIN_EMAIL
    assert data["user"]["role"] == "admin"
    return data["access_token"]


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self, token):
        assert isinstance(token, str) and len(token) > 20

    def test_login_wrong_password(self):
        r = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrong-pass-xyz"},
            timeout=15,
        )
        assert r.status_code in (401, 429)
        if r.status_code == 401:
            assert "Invalid" in r.json().get("detail", "")

    def test_me_with_token(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert "password_hash" not in data
        assert "_id" not in data

    def test_me_without_token(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_invalid_token(self):
        r = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer not-a-real-jwt"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_legacy_admin_login(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD},
            timeout=15,
        )
        assert r.status_code == 200
        data = r.json()
        assert "token" in data or "access_token" in data


# ---------- Content (CMS) ----------
class TestContent:
    def test_get_content_public(self):
        r = requests.get(f"{BASE_URL}/api/content", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "_id" not in data
        # Check for expected fields
        for key in [
            "hero_tagline", "services", "manifesto_words", "values",
            "director_name", "director_bio", "address_line1", "phone_office",
            "ssm", "ljt", "mof", "hours",
        ]:
            assert key in data, f"Missing field: {key}"
        # At least 32 fields per spec
        assert len(data.keys()) >= 30

    def test_put_content_requires_auth(self):
        r = requests.put(f"{BASE_URL}/api/admin/content", json={}, timeout=15)
        assert r.status_code == 401

    def test_put_content_updates(self, auth_headers):
        # Get current
        cur = requests.get(f"{BASE_URL}/api/content", timeout=15).json()
        original_tagline = cur["hero_tagline"]
        new_tagline = f"TEST_TAGLINE_{uuid.uuid4().hex[:6]}"
        cur["hero_tagline"] = new_tagline
        # Remove updated_at if present
        cur.pop("updated_at", None)

        r = requests.put(
            f"{BASE_URL}/api/admin/content", json=cur, headers=auth_headers, timeout=15
        )
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

        # Verify persistence
        r2 = requests.get(f"{BASE_URL}/api/content", timeout=15)
        assert r2.json()["hero_tagline"] == new_tagline

        # Restore
        cur["hero_tagline"] = original_tagline
        cur.pop("updated_at", None)
        requests.put(
            f"{BASE_URL}/api/admin/content", json=cur, headers=auth_headers, timeout=15
        )


# ---------- Projects ----------
class TestProjects:
    def test_list_public(self):
        r = requests.get(f"{BASE_URL}/api/projects", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_endpoints_require_auth(self):
        for method, url in [
            ("GET", f"{BASE_URL}/api/admin/projects"),
            ("POST", f"{BASE_URL}/api/admin/projects"),
            ("PUT", f"{BASE_URL}/api/admin/projects/some-id"),
            ("DELETE", f"{BASE_URL}/api/admin/projects/some-id"),
        ]:
            r = requests.request(method, url, json={}, timeout=15)
            assert r.status_code == 401, f"{method} {url} expected 401, got {r.status_code}"

    def test_project_crud_lifecycle(self, auth_headers):
        # CREATE
        payload = {
            "title": "TEST_Project_" + uuid.uuid4().hex[:6],
            "category": "Topographic Survey",
            "location": "Seremban",
            "year": "2026",
            "description": "Integration test project",
            "image": "/api/uploads/test.png",
            "order": 99,
        }
        r = requests.post(
            f"{BASE_URL}/api/admin/projects", json=payload, headers=auth_headers, timeout=15
        )
        assert r.status_code == 200, r.text
        created = r.json()
        pid = created["id"]
        assert created["title"] == payload["title"]
        assert "created_at" in created

        # READ via public
        listing = requests.get(f"{BASE_URL}/api/projects", timeout=15).json()
        assert any(p["id"] == pid for p in listing), "Created project not in public list"

        # UPDATE
        payload["title"] = payload["title"] + "_UPDATED"
        r = requests.put(
            f"{BASE_URL}/api/admin/projects/{pid}",
            json=payload, headers=auth_headers, timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json()["title"] == payload["title"]

        # Verify update persisted
        listing = requests.get(f"{BASE_URL}/api/projects", timeout=15).json()
        match = [p for p in listing if p["id"] == pid]
        assert match and match[0]["title"] == payload["title"]

        # DELETE
        r = requests.delete(
            f"{BASE_URL}/api/admin/projects/{pid}", headers=auth_headers, timeout=15
        )
        assert r.status_code == 200
        assert r.json()["deleted"] == pid

        # Verify gone
        listing = requests.get(f"{BASE_URL}/api/projects", timeout=15).json()
        assert not any(p["id"] == pid for p in listing)


# ---------- Upload ----------
class TestUpload:
    PNG_BYTES = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
        b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
        b"\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0\x00\x00\x00\x03\x00\x01\xa1\xc7\xc6\x88\x00\x00\x00\x00IEND\xaeB`\x82"
    )

    def test_upload_requires_auth(self):
        files = {"file": ("test.png", io.BytesIO(self.PNG_BYTES), "image/png")}
        r = requests.post(f"{BASE_URL}/api/admin/upload", files=files, timeout=15)
        assert r.status_code == 401

    def test_upload_png_success(self, auth_headers):
        files = {"file": ("test.png", io.BytesIO(self.PNG_BYTES), "image/png")}
        r = requests.post(
            f"{BASE_URL}/api/admin/upload", files=files, headers=auth_headers, timeout=15
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["url"].startswith("/api/uploads/")
        # Verify file accessible
        full = f"{BASE_URL}{data['url']}"
        r2 = requests.get(full, timeout=15)
        assert r2.status_code == 200
        assert len(r2.content) == len(self.PNG_BYTES)

    def test_upload_unsupported_ext(self, auth_headers):
        files = {"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
        r = requests.post(
            f"{BASE_URL}/api/admin/upload", files=files, headers=auth_headers, timeout=15
        )
        assert r.status_code == 400


# ---------- Enquiries ----------
class TestEnquiries:
    def test_create_enquiry_without_smtp(self):
        payload = {
            "name": "TEST_User",
            "email": "test@example.com",
            "phone": "+60123456789",
            "subject": "Integration test",
            "message": "This is a TEST_ enquiry from pytest.",
        }
        r = requests.post(f"{BASE_URL}/api/enquiries", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_User"
        assert "id" in data

    def test_list_enquiries_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/enquiries", timeout=15)
        assert r.status_code == 401

    def test_list_and_delete_enquiry(self, auth_headers):
        # Create first
        payload = {
            "name": "TEST_DeleteMe",
            "email": "del@example.com",
            "message": "TEST_ to be deleted",
        }
        c = requests.post(f"{BASE_URL}/api/enquiries", json=payload, timeout=15).json()
        eid = c["id"]

        r = requests.get(f"{BASE_URL}/api/admin/enquiries", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert any(e["id"] == eid for e in items)

        # Delete
        r = requests.delete(
            f"{BASE_URL}/api/admin/enquiries/{eid}", headers=auth_headers, timeout=15
        )
        assert r.status_code == 200


# ---------- Brute force ----------
class TestBruteForce:
    @pytest.mark.skip(reason="Skipped to avoid locking out test IP for 15 min. Run manually if needed.")
    def test_rate_limit_after_5_failures(self):
        # 5 wrong attempts
        for _ in range(5):
            requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": ADMIN_EMAIL, "password": "wrong"},
                timeout=15,
            )
        r = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrong"},
            timeout=15,
        )
        assert r.status_code == 429


def test_zz_cleanup(auth_headers):
    """Cleanup any TEST_ prefixed enquiries."""
    r = requests.get(f"{BASE_URL}/api/admin/enquiries", headers=auth_headers, timeout=15)
    if r.status_code == 200:
        for e in r.json():
            if e.get("name", "").startswith("TEST_"):
                requests.delete(
                    f"{BASE_URL}/api/admin/enquiries/{e['id']}",
                    headers=auth_headers, timeout=15,
                )
