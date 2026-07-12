"""Backend regression + new-feature tests for HM Geomatics iteration 3.

Covers:
- New `email` field on /api/content.
- 9 services with slug/long_description/equipment/deliverables/standards.
- New GET /api/services/{slug} endpoint (200 and 404).
- PUT /api/admin/content persists `email` change (with restore).
- Existing enquiry POST still succeeds (SMTP env still blank).
"""
import os
import uuid

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_EMAIL = "admin@hmgeomatics.com"
ADMIN_PASSWORD = "hmgeomatics2026"

EXPECTED_SLUGS = [
    "land-boundary-survey",
    "topographic-survey-mapping",
    "engineering-survey",
    "title-cadastral-survey",
    "hydrographic-survey",
    "lidar-survey",
    "underground-utility-detection-mapping",
    "mining-survey",
    "drone-survey-uav",
]


@pytest.fixture(scope="session")
def token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Content: email + 9 services ----------------
class TestContentEmailAndServices:
    def test_content_has_email(self):
        r = requests.get(f"{BASE_URL}/api/content", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "email" in data
        assert data["email"] == "hazwan@hmgeomatics.com"

    def test_content_has_9_services_with_new_fields(self):
        data = requests.get(f"{BASE_URL}/api/content", timeout=15).json()
        services = data.get("services", [])
        assert len(services) == 9, f"Expected 9 services, got {len(services)}"

        slugs_seen = []
        for s in services:
            # New required fields
            for k in ("slug", "long_description", "equipment", "deliverables", "standards"):
                assert k in s, f"Service '{s.get('t')}' missing field '{k}'"
            assert s["slug"], f"Service '{s.get('t')}' has empty slug"
            assert len(s["long_description"]) > 50, (
                f"Service '{s['slug']}' long_description too short"
            )
            assert isinstance(s["equipment"], list) and len(s["equipment"]) >= 1
            assert isinstance(s["deliverables"], list) and len(s["deliverables"]) >= 1
            assert isinstance(s["standards"], list) and len(s["standards"]) >= 1
            slugs_seen.append(s["slug"])

        # Check all expected slugs present
        assert sorted(slugs_seen) == sorted(EXPECTED_SLUGS), (
            f"Slugs mismatch. Got {sorted(slugs_seen)}"
        )


# ---------------- GET /api/services/{slug} ----------------
class TestServiceBySlug:
    @pytest.mark.parametrize("slug", EXPECTED_SLUGS)
    def test_get_each_service_slug(self, slug):
        r = requests.get(f"{BASE_URL}/api/services/{slug}", timeout=15)
        assert r.status_code == 200, f"Slug {slug} returned {r.status_code}: {r.text}"
        data = r.json()
        assert data["slug"] == slug
        assert data.get("t")  # title present
        assert len(data.get("long_description", "")) > 50
        assert isinstance(data.get("equipment"), list)
        assert isinstance(data.get("deliverables"), list)
        assert isinstance(data.get("standards"), list)
        assert "_id" not in data  # ObjectId excluded

    def test_get_unknown_slug_returns_404(self):
        r = requests.get(f"{BASE_URL}/api/services/does-not-exist", timeout=15)
        assert r.status_code == 404
        assert "not found" in r.json().get("detail", "").lower()

    def test_get_specific_slug_land_boundary(self):
        r = requests.get(f"{BASE_URL}/api/services/land-boundary-survey", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["slug"] == "land-boundary-survey"
        assert "Land Boundary Survey" in data["t"]
        # Sanity: check a known equipment string appears
        assert any("Leica" in e or "Trimble" in e for e in data["equipment"])


# ---------------- Admin content update: email persistence ----------------
class TestAdminContentEmail:
    def test_update_email_and_restore(self, auth_headers):
        # Fetch current
        cur = requests.get(f"{BASE_URL}/api/content", timeout=15).json()
        original_email = cur["email"]
        new_email = f"test_{uuid.uuid4().hex[:6]}@hmgeomatics.test"

        cur["email"] = new_email
        cur.pop("updated_at", None)
        r = requests.put(
            f"{BASE_URL}/api/admin/content",
            json=cur,
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

        # Verify
        r2 = requests.get(f"{BASE_URL}/api/content", timeout=15).json()
        assert r2["email"] == new_email

        # Restore
        r2["email"] = original_email
        r2.pop("updated_at", None)
        requests.put(
            f"{BASE_URL}/api/admin/content",
            json=r2,
            headers=auth_headers,
            timeout=15,
        )
        # Confirm restored
        assert requests.get(f"{BASE_URL}/api/content", timeout=15).json()["email"] == original_email


# ---------------- Regression: enquiries still work ----------------
class TestEnquiryRegression:
    def test_enquiry_post_still_succeeds(self):
        payload = {
            "name": "TEST_v3_User",
            "email": "test_v3@example.com",
            "subject": "Land Boundary Survey",
            "message": "TEST_v3 regression enquiry",
        }
        r = requests.post(f"{BASE_URL}/api/enquiries", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["subject"] == "Land Boundary Survey"
        assert data["name"] == "TEST_v3_User"


# ---------------- Cleanup ----------------
def test_zz_cleanup_v3(auth_headers):
    r = requests.get(f"{BASE_URL}/api/admin/enquiries", headers=auth_headers, timeout=15)
    if r.status_code == 200:
        for e in r.json():
            if e.get("name", "").startswith("TEST_v3"):
                requests.delete(
                    f"{BASE_URL}/api/admin/enquiries/{e['id']}",
                    headers=auth_headers,
                    timeout=15,
                )
