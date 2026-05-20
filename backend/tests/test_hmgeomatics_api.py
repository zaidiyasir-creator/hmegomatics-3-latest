"""Backend API tests for HM Geomatics enquiry + admin endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback: read frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "hmgeomatics2026"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


# -------- Health --------
def test_health():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("service") == "HM Geomatics"
    assert data.get("status") == "ok"


# -------- Create enquiry --------
def test_create_enquiry_minimal():
    payload = {
        "name": "TEST_User",
        "email": "test_user@example.com",
        "message": "Test minimal enquiry body",
    }
    r = requests.post(f"{API}/enquiries", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "id" in data and isinstance(data["id"], str)
    assert data["name"] == "TEST_User"
    assert data["email"] == "test_user@example.com"
    assert data["message"] == "Test minimal enquiry body"
    assert data["phone"] is None
    assert data["subject"] is None
    assert "created_at" in data
    # No _id leak
    assert "_id" not in data


def test_create_enquiry_full():
    payload = {
        "name": "TEST_Full",
        "email": "full@example.com",
        "phone": "+60123456789",
        "subject": "Topographic Mapping",
        "message": "Need a topographic survey for our development site.",
    }
    r = requests.post(f"{API}/enquiries", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["phone"] == "+60123456789"
    assert data["subject"] == "Topographic Mapping"


def test_create_enquiry_invalid_email():
    payload = {"name": "TEST_Bad", "email": "not-an-email", "message": "Hi"}
    r = requests.post(f"{API}/enquiries", json=payload, timeout=15)
    assert r.status_code == 422


def test_create_enquiry_missing_fields():
    # missing message
    r = requests.post(f"{API}/enquiries", json={"name": "TEST_x", "email": "a@b.com"}, timeout=15)
    assert r.status_code == 422
    # missing name
    r = requests.post(f"{API}/enquiries", json={"email": "a@b.com", "message": "hi"}, timeout=15)
    assert r.status_code == 422
    # missing email
    r = requests.post(f"{API}/enquiries", json={"name": "x", "message": "hi"}, timeout=15)
    assert r.status_code == 422


# -------- Admin login --------
def test_admin_login_success():
    r = requests.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert data.get("token") == ADMIN_PASSWORD


def test_admin_login_wrong():
    r = requests.post(f"{API}/admin/login", json={"password": "wrong"}, timeout=15)
    assert r.status_code == 401


# -------- Admin enquiries list --------
def test_admin_list_no_token():
    r = requests.get(f"{API}/admin/enquiries", timeout=15)
    assert r.status_code == 401


def test_admin_list_with_token_sorted_no_id(admin_token):
    r = requests.get(
        f"{API}/admin/enquiries",
        headers={"x-admin-token": admin_token},
        timeout=15,
    )
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # No _id leak
    for d in data:
        assert "_id" not in d
        assert "id" in d
        assert "created_at" in d
    # Sorted desc by created_at
    if len(data) >= 2:
        timestamps = [d["created_at"] for d in data]
        assert timestamps == sorted(timestamps, reverse=True), "Not sorted desc"


# -------- Delete --------
def test_delete_enquiry_flow(admin_token):
    # Create one
    payload = {"name": "TEST_Del", "email": "del@example.com", "message": "to delete"}
    r = requests.post(f"{API}/enquiries", json=payload, timeout=15)
    assert r.status_code == 200
    eid = r.json()["id"]

    # Delete with wrong token
    r = requests.delete(
        f"{API}/admin/enquiries/{eid}",
        headers={"x-admin-token": "bad"},
        timeout=15,
    )
    assert r.status_code == 401

    # Delete success
    r = requests.delete(
        f"{API}/admin/enquiries/{eid}",
        headers={"x-admin-token": admin_token},
        timeout=15,
    )
    assert r.status_code == 200
    assert r.json().get("deleted") == eid

    # Verify gone
    r = requests.get(
        f"{API}/admin/enquiries",
        headers={"x-admin-token": admin_token},
        timeout=15,
    )
    ids = [d["id"] for d in r.json()]
    assert eid not in ids


def test_delete_nonexistent(admin_token):
    r = requests.delete(
        f"{API}/admin/enquiries/nonexistent-xyz-id",
        headers={"x-admin-token": admin_token},
        timeout=15,
    )
    assert r.status_code == 404


# -------- Cleanup --------
def test_zz_cleanup_test_data(admin_token):
    r = requests.get(
        f"{API}/admin/enquiries",
        headers={"x-admin-token": admin_token},
        timeout=15,
    )
    if r.status_code == 200:
        for d in r.json():
            if str(d.get("name", "")).startswith("TEST_"):
                requests.delete(
                    f"{API}/admin/enquiries/{d['id']}",
                    headers={"x-admin-token": admin_token},
                    timeout=15,
                )
