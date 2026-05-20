import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import HMLogo from "@/components/HMLogo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = "hmg_admin_token";

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const fetchAll = async (tok) => {
    setBusy(true);
    try {
      const r = await axios.get(`${API}/admin/enquiries`, {
        headers: { "x-admin-token": tok },
      });
      setEnquiries(r.data);
      setLoaded(true);
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        toast.error("Session expired · sign in again");
      } else {
        toast.error("Could not load enquiries");
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (token) fetchAll(token);
  }, [token]);

  const onLogin = async (e) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    try {
      const r = await axios.post(`${API}/admin/login`, { password });
      const t = r.data.token;
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      setPassword("");
      toast.success("Welcome back");
    } catch {
      toast.error("Invalid password");
    } finally {
      setBusy(false);
    }
  };

  const onLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setEnquiries([]);
    setLoaded(false);
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this enquiry?")) return;
    try {
      await axios.delete(`${API}/admin/enquiries/${id}`, {
        headers: { "x-admin-token": token },
      });
      setEnquiries((list) => list.filter((e) => e.id !== id));
      toast.success("Enquiry deleted");
    } catch {
      toast.error("Could not delete");
    }
  };

  // ---------- Login screen ----------
  if (!token) {
    return (
      <div className="admin-shell" data-testid="admin-login-page">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            justifyContent: "center",
          }}
        >
          <HMLogo size={38} />
          <span
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 300,
              fontSize: 22,
              color: "var(--text-hero)",
              letterSpacing: "0.05em",
            }}
          >
            HM Geomatics · Admin
          </span>
        </div>

        <form
          onSubmit={onLogin}
          className="admin-login"
          data-testid="admin-login-form"
        >
          <div
            className="eyebrow"
            style={{ marginBottom: 14, color: "var(--gold)" }}
          >
            Authenticate
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            data-testid="admin-password-input"
          />
          <button
            type="submit"
            className="btn-gold"
            disabled={busy}
            data-testid="admin-login-submit"
            style={{ width: "100%" }}
          >
            {busy ? "Verifying…" : "Sign In"}
          </button>
        </form>
      </div>
    );
  }

  // ---------- Dashboard ----------
  return (
    <div className="admin-shell" data-testid="admin-dashboard">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 40,
        }}
      >
        <div>
          <div className="eyebrow" style={{ color: "var(--gold)" }}>
            Console · Enquiries
          </div>
          <h1 style={{ marginTop: 10 }}>Enquiries</h1>
          <div className="sub">
            {enquiries.length} record{enquiries.length === 1 ? "" : "s"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="admin-delete"
            onClick={() => fetchAll(token)}
            data-testid="admin-refresh"
          >
            Refresh
          </button>
          <button
            className="admin-delete"
            onClick={onLogout}
            data-testid="admin-logout"
          >
            Sign Out
          </button>
        </div>
      </div>

      {busy && !loaded ? (
        <div className="admin-empty">Loading…</div>
      ) : enquiries.length === 0 ? (
        <div className="admin-empty">No enquiries yet</div>
      ) : (
        <table className="admin-table" data-testid="admin-enquiries-table">
          <thead>
            <tr>
              <th>Received</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Subject</th>
              <th>Message</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((e) => (
              <tr key={e.id} data-testid={`enquiry-row-${e.id}`}>
                <td style={{ whiteSpace: "nowrap" }}>{formatDate(e.created_at)}</td>
                <td>{e.name}</td>
                <td>
                  {e.email}
                  {e.phone && (
                    <>
                      <br />
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>
                        {e.phone}
                      </span>
                    </>
                  )}
                </td>
                <td>{e.subject || "—"}</td>
                <td style={{ maxWidth: 360 }}>{e.message}</td>
                <td>
                  <button
                    className="admin-delete"
                    onClick={() => onDelete(e.id)}
                    data-testid={`delete-${e.id}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
