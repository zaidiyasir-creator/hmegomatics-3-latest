import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import HMLogo from "@/components/HMLogo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = "hmg_admin_token";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
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

/* ========== Login screen ========== */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      onLogin(data.access_token, data.user);
      toast.success("Welcome back");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Invalid credentials");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-shell" data-testid="admin-login-page">
      <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
        <HMLogo size={38} />
        <span style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 22, color: "var(--text-hero)", letterSpacing: "0.05em" }}>
          HM Geomatics · Admin
        </span>
      </div>

      <form onSubmit={submit} className="admin-login" data-testid="admin-login-form">
        <div className="eyebrow" style={{ marginBottom: 14, color: "var(--gold)" }}>
          Authenticate
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoFocus
          autoComplete="email"
          data-testid="admin-email-input"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
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

/* ========== Enquiries tab ========== */
function EnquiriesTab({ token }) {
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);

  const fetchAll = async () => {
    setBusy(true);
    try {
      const r = await axios.get(`${API}/admin/enquiries`, { headers: authHeaders(token) });
      setList(r.data);
    } catch {
      toast.error("Could not load enquiries");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, []);

  const onDelete = async (id) => {
    if (!window.confirm("Delete this enquiry?")) return;
    try {
      await axios.delete(`${API}/admin/enquiries/${id}`, { headers: authHeaders(token) });
      setList((l) => l.filter((e) => e.id !== id));
      toast.success("Enquiry deleted");
    } catch {
      toast.error("Could not delete");
    }
  };

  return (
    <div data-testid="admin-tab-enquiries">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26 }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Enquiries</h1>
          <div className="sub">{list.length} record{list.length === 1 ? "" : "s"}</div>
        </div>
        <button className="admin-delete" onClick={fetchAll} data-testid="admin-refresh">
          Refresh
        </button>
      </div>

      {busy && list.length === 0 ? (
        <div className="admin-empty">Loading…</div>
      ) : list.length === 0 ? (
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
            {list.map((e) => (
              <tr key={e.id} data-testid={`enquiry-row-${e.id}`}>
                <td style={{ whiteSpace: "nowrap" }}>{formatDate(e.created_at)}</td>
                <td>{e.name}</td>
                <td>
                  {e.email}
                  {e.phone && <><br /><span style={{ color: "rgba(255,255,255,0.5)" }}>{e.phone}</span></>}
                </td>
                <td>{e.subject || "—"}</td>
                <td style={{ maxWidth: 360 }}>{e.message}</td>
                <td>
                  <button className="admin-delete" onClick={() => onDelete(e.id)} data-testid={`delete-${e.id}`}>
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

/* ========== CMS field helpers ========== */
function TextField({ label, value, onChange, full, type = "text", hint, testid }) {
  return (
    <div className={`cms-field ${full ? "full" : ""}`}>
      <label>{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
      />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

function TextArea({ label, value, onChange, full = true, rows = 3, hint, testid }) {
  return (
    <div className={`cms-field ${full ? "full" : ""}`}>
      <label>{label}</label>
      <textarea
        rows={rows}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
      />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

function UploadButton({ token, onUploaded, label = "Upload image", testid }) {
  const [busy, setBusy] = useState(false);
  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await axios.post(`${API}/admin/upload`, fd, {
        headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
      });
      onUploaded(r.data.url);
      toast.success("Uploaded");
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };
  return (
    <label className="cms-upload" data-testid={testid}>
      <input type="file" accept="image/*" onChange={onPick} disabled={busy} />
      {busy ? "Uploading…" : label}
    </label>
  );
}

/* ========== Content tab ========== */
function ContentTab({ token }) {
  const [content, setContent] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get(`${API}/content`);
        setContent(r.data);
      } catch {
        toast.error("Could not load content");
      }
    })();
  }, []);

  const upd = (k) => (v) => setContent((c) => ({ ...c, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/content`, content, { headers: authHeaders(token) });
      toast.success("Site content saved");
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (!content) return <div className="admin-empty">Loading…</div>;

  /* --- Service list editor --- */
  const updService = (idx, key, val) => {
    const next = [...content.services];
    next[idx] = { ...next[idx], [key]: val };
    upd("services")(next);
  };
  const addService = () => {
    upd("services")([
      ...content.services,
      {
        n: String(content.services.length + 1).padStart(2, "0"),
        key: "boundary",
        t: "New Service",
        d: "Description…",
        photo: "",
        alt: "",
      },
    ]);
  };
  const removeService = (idx) => upd("services")(content.services.filter((_, i) => i !== idx));

  /* --- Quals list editor --- */
  const updQual = (idx, val) => {
    const next = [...content.director_quals];
    next[idx] = val;
    upd("director_quals")(next);
  };
  const addQual = () => upd("director_quals")([...content.director_quals, ""]);
  const removeQual = (idx) => upd("director_quals")(content.director_quals.filter((_, i) => i !== idx));

  /* --- Manifesto words --- */
  const updWord = (idx, val) => {
    const next = [...content.manifesto_words];
    next[idx] = val;
    upd("manifesto_words")(next);
  };
  const addWord = () => upd("manifesto_words")([...content.manifesto_words, "New."]);
  const removeWord = (idx) => upd("manifesto_words")(content.manifesto_words.filter((_, i) => i !== idx));

  /* --- Values --- */
  const updValue = (idx, col, val) => {
    const next = content.values.map((v) => [...v]);
    next[idx][col] = val;
    upd("values")(next);
  };
  const addValue = () => upd("values")([...content.values, ["X", "New Value"]]);
  const removeValue = (idx) => upd("values")(content.values.filter((_, i) => i !== idx));

  return (
    <div data-testid="admin-tab-content">
      <h1 style={{ marginTop: 0 }}>Site Content</h1>
      <div className="sub">Live edits — saved to MongoDB</div>

      <div className="cms-form">
        {/* HERO */}
        <div className="cms-section">
          <h3>Hero</h3>
          <div className="sub">Top of the page · eyebrow ticks & tagline</div>
        </div>
        <TextField label="Eyebrow Left" value={content.hero_eyebrow_left} onChange={upd("hero_eyebrow_left")} testid="hero-eyebrow-left" />
        <TextField label="Eyebrow Right" value={content.hero_eyebrow_right} onChange={upd("hero_eyebrow_right")} testid="hero-eyebrow-right" />
        <TextField label="Eyebrow Left (sub)" value={content.hero_eyebrow_left_sub} onChange={upd("hero_eyebrow_left_sub")} />
        <TextField label="Eyebrow Right (sub)" value={content.hero_eyebrow_right_sub} onChange={upd("hero_eyebrow_right_sub")} />
        <TextArea label="Hero tagline" value={content.hero_tagline} onChange={upd("hero_tagline")} rows={2} testid="hero-tagline" />

        {/* QUOTE */}
        <div className="cms-section">
          <h3>Director Quote Band</h3>
          <div className="sub">Cream quote section below the hero</div>
        </div>
        <TextArea label="Quote" value={content.quote_text} onChange={upd("quote_text")} rows={3} testid="quote-text" />
        <TextField label="Attribution role" value={content.quote_attribution_role} onChange={upd("quote_attribution_role")} />
        <TextField label="Attribution name" value={content.quote_attribution_name} onChange={upd("quote_attribution_name")} />
        <TextField label="Attribution credential" value={content.quote_attribution_credential} onChange={upd("quote_attribution_credential")} full />

        {/* SERVICES */}
        <div className="cms-section">
          <h3>Services</h3>
          <div className="sub">
            Each card = number · title · description · Unsplash photo URL ·
            alt text · lucide icon key
            (<em>boundary, map, building, layers, ship, scan, radar, mountain,
            drone, construction, satellite, ruler, activity, database</em>)
          </div>
          {content.services.map((s, i) => (
            <div key={i} className="cms-service-item" data-testid={`cms-service-${i}`}>
              <div className="row">
                <input
                  className="svc-n"
                  value={s.n}
                  onChange={(e) => updService(i, "n", e.target.value)}
                  placeholder="01"
                />
                <input
                  className="svc-key"
                  value={s.key || ""}
                  onChange={(e) => updService(i, "key", e.target.value)}
                  placeholder="Icon key (e.g. boundary)"
                />
                <button className="admin-delete" onClick={() => removeService(i)}>Remove</button>
              </div>
              <input
                value={s.t}
                onChange={(e) => updService(i, "t", e.target.value)}
                placeholder="Title"
              />
              <textarea
                value={s.d}
                onChange={(e) => updService(i, "d", e.target.value)}
                placeholder="Description (2–3 lines)"
                rows={2}
              />
              <div className="row">
                <input
                  value={s.photo || ""}
                  onChange={(e) => updService(i, "photo", e.target.value)}
                  placeholder="Photo URL (Unsplash direct link)"
                />
                <UploadButton
                  token={token}
                  onUploaded={(url) => updService(i, "photo", url)}
                  label="Upload"
                />
              </div>
              <input
                value={s.alt || ""}
                onChange={(e) => updService(i, "alt", e.target.value)}
                placeholder="Alt text for accessibility & SEO"
              />
              {s.photo && (
                <img
                  src={s.photo.startsWith("/api/uploads") ? `${process.env.REACT_APP_BACKEND_URL}${s.photo}` : s.photo}
                  alt=""
                  className="svc-preview"
                />
              )}
            </div>
          ))}
          <button className="cms-add-row" onClick={addService} data-testid="cms-add-service">+ Add Service</button>
        </div>

        {/* MANIFESTO */}
        <div className="cms-section">
          <h3>Manifesto</h3>
          <div className="sub">Dark interlude — three principles</div>
        </div>
        <TextField label="Eyebrow" value={content.manifesto_eyebrow} onChange={upd("manifesto_eyebrow")} full />
        <div className="cms-field full">
          <label>Words</label>
          {content.manifesto_words.map((w, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <input style={{ flex: 1, background: "#0f0f10", border: "0.5px solid rgba(255,255,255,0.12)", color: "var(--text-hero)", padding: "10px 12px", fontFamily: "var(--sans)" }} value={w} onChange={(e) => updWord(i, e.target.value)} />
              <button className="admin-delete" onClick={() => removeWord(i)}>Remove</button>
            </div>
          ))}
          <button className="cms-add-row" onClick={addWord}>+ Add Word</button>
        </div>
        <TextArea label="Manifesto tagline" value={content.manifesto_tagline} onChange={upd("manifesto_tagline")} rows={2} />

        {/* ABOUT */}
        <div className="cms-section">
          <h3>About & Values</h3>
        </div>
        <TextArea label="About intro" value={content.about_intro} onChange={upd("about_intro")} rows={4} testid="about-intro" />
        <div className="cms-field full">
          <label>Values</label>
          {content.values.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <input style={{ width: 60, background: "#0f0f10", border: "0.5px solid rgba(255,255,255,0.12)", color: "var(--text-hero)", padding: "10px 12px", textAlign: "center" }} value={v[0]} onChange={(e) => updValue(i, 0, e.target.value)} maxLength={1} />
              <input style={{ flex: 1, background: "#0f0f10", border: "0.5px solid rgba(255,255,255,0.12)", color: "var(--text-hero)", padding: "10px 12px" }} value={v[1]} onChange={(e) => updValue(i, 1, e.target.value)} />
              <button className="admin-delete" onClick={() => removeValue(i)}>Remove</button>
            </div>
          ))}
          <button className="cms-add-row" onClick={addValue}>+ Add Value</button>
        </div>

        {/* DIRECTOR */}
        <div className="cms-section">
          <h3>Director / Leadership</h3>
        </div>
        <TextField label="Name" value={content.director_name} onChange={upd("director_name")} testid="director-name" />
        <TextField label="Role" value={content.director_role} onChange={upd("director_role")} />
        <TextArea label="Bio" value={content.director_bio} onChange={upd("director_bio")} rows={5} testid="director-bio" />
        <div className="cms-field full">
          <label>Photo</label>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <img src={content.director_photo?.startsWith("/api/uploads") ? `${process.env.REACT_APP_BACKEND_URL}${content.director_photo}` : content.director_photo} alt="" style={{ width: 100, height: 100, objectFit: "cover", border: "0.5px solid rgba(255,255,255,0.1)" }} />
            <input value={content.director_photo} onChange={(e) => upd("director_photo")(e.target.value)} style={{ flex: 1, background: "#0f0f10", border: "0.5px solid rgba(255,255,255,0.12)", color: "var(--text-hero)", padding: "10px 12px" }} />
            <UploadButton token={token} onUploaded={upd("director_photo")} testid="upload-director-photo" />
          </div>
        </div>
        <div className="cms-field full">
          <label>Qualifications</label>
          {content.director_quals.map((q, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <input style={{ flex: 1, background: "#0f0f10", border: "0.5px solid rgba(255,255,255,0.12)", color: "var(--text-hero)", padding: "10px 12px" }} value={q} onChange={(e) => updQual(i, e.target.value)} />
              <button className="admin-delete" onClick={() => removeQual(i)}>Remove</button>
            </div>
          ))}
          <button className="cms-add-row" onClick={addQual}>+ Add Qualification</button>
        </div>

        {/* CONTACT */}
        <div className="cms-section">
          <h3>Contact &amp; Company Info</h3>
        </div>
        <TextField label="Address Line 1" value={content.address_line1} onChange={upd("address_line1")} full />
        <TextField label="Address Line 2" value={content.address_line2} onChange={upd("address_line2")} full />
        <TextField label="Address Line 3" value={content.address_line3} onChange={upd("address_line3")} full />
        <TextField label="Phone (Office)" value={content.phone_office} onChange={upd("phone_office")} />
        <TextField label="Phone (Director)" value={content.phone_director} onChange={upd("phone_director")} />
        <TextField label="WhatsApp Number (digits only)" value={content.whatsapp_number} onChange={upd("whatsapp_number")} hint="e.g. 60133158958" />
        <TextField label="SSM" value={content.ssm} onChange={upd("ssm")} />
        <TextField label="LJT Reg." value={content.ljt} onChange={upd("ljt")} />
        <TextField label="MOF Cert." value={content.mof} onChange={upd("mof")} />
        <TextField label="Cert validity" value={content.cert_validity} onChange={upd("cert_validity")} />
        <TextField label="Practice Cert." value={content.practice_cert} onChange={upd("practice_cert")} full />
        <TextArea label="Hours" value={content.hours} onChange={upd("hours")} rows={2} />
      </div>

      <div className="cms-save-bar">
        <button className="btn-gold" onClick={save} disabled={saving} data-testid="cms-save-content">
          {saving ? "Saving…" : "Save All Changes"}
        </button>
        <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
          Changes go live immediately
        </span>
      </div>
    </div>
  );
}

/* ========== Projects tab ========== */
const EMPTY_PROJECT = { title: "", category: "", location: "", year: "", description: "", image: "", order: 0 };

function ProjectsTab({ token }) {
  const [list, setList] = useState([]);
  const [draft, setDraft] = useState(EMPTY_PROJECT);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchAll = async () => {
    try {
      const r = await axios.get(`${API}/admin/projects`, { headers: authHeaders(token) });
      setList(r.data);
    } catch {
      toast.error("Could not load projects");
    }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.title) {
      toast.error("Title is required");
      return;
    }
    setBusy(true);
    try {
      if (editingId) {
        await axios.put(`${API}/admin/projects/${editingId}`, draft, { headers: authHeaders(token) });
        toast.success("Project updated");
      } else {
        await axios.post(`${API}/admin/projects`, draft, { headers: authHeaders(token) });
        toast.success("Project added");
      }
      setDraft(EMPTY_PROJECT);
      setEditingId(null);
      fetchAll();
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const edit = (p) => {
    setEditingId(p.id);
    setDraft({
      title: p.title || "",
      category: p.category || "",
      location: p.location || "",
      year: p.year || "",
      description: p.description || "",
      image: p.image || "",
      order: p.order ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await axios.delete(`${API}/admin/projects/${id}`, { headers: authHeaders(token) });
      toast.success("Project deleted");
      fetchAll();
    } catch {
      toast.error("Could not delete");
    }
  };

  const cancel = () => {
    setEditingId(null);
    setDraft(EMPTY_PROJECT);
  };

  const previewImg = useMemo(() => {
    if (!draft.image) return null;
    return draft.image.startsWith("/api/uploads")
      ? `${process.env.REACT_APP_BACKEND_URL}${draft.image}`
      : draft.image;
  }, [draft.image]);

  return (
    <div data-testid="admin-tab-projects">
      <h1 style={{ marginTop: 0 }}>Projects · Selected Work</h1>
      <div className="sub">{list.length} project{list.length === 1 ? "" : "s"} live</div>

      <form onSubmit={submit} className="cms-form" style={{ marginBottom: 50 }}>
        <div className="cms-section" style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>
          <h3>{editingId ? "Edit Project" : "Add New Project"}</h3>
          <div className="sub">Featured under “Selected Work” on the public site</div>
        </div>
        <TextField label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} testid="project-title" />
        <TextField label="Category" value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} hint="e.g. Topographic Survey" />
        <TextField label="Location" value={draft.location} onChange={(v) => setDraft({ ...draft, location: v })} />
        <TextField label="Year" value={draft.year} onChange={(v) => setDraft({ ...draft, year: v })} />
        <TextArea label="Description" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} rows={3} />
        <div className="cms-field full">
          <label>Image</label>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {previewImg && (
              <img src={previewImg} alt="" style={{ width: 120, height: 90, objectFit: "cover", border: "0.5px solid rgba(255,255,255,0.1)" }} />
            )}
            <input
              value={draft.image}
              onChange={(e) => setDraft({ ...draft, image: e.target.value })}
              placeholder="/api/uploads/... or external URL"
              style={{ flex: 1, background: "#0f0f10", border: "0.5px solid rgba(255,255,255,0.12)", color: "var(--text-hero)", padding: "10px 12px" }}
            />
            <UploadButton token={token} onUploaded={(url) => setDraft({ ...draft, image: url })} testid="upload-project-image" />
          </div>
        </div>
        <TextField label="Order" value={draft.order} onChange={(v) => setDraft({ ...draft, order: parseInt(v, 10) || 0 })} type="number" hint="Lower = first" />

        <div className="cms-save-bar">
          <button type="submit" className="btn-gold" disabled={busy} data-testid="project-submit">
            {busy ? "Saving…" : editingId ? "Update Project" : "Add Project"}
          </button>
          {editingId && (
            <button type="button" className="admin-delete" onClick={cancel}>Cancel</button>
          )}
        </div>
      </form>

      <div>
        <div className="sub" style={{ marginBottom: 18 }}>All Projects</div>
        {list.length === 0 ? (
          <div className="admin-empty">No projects yet — add your first above</div>
        ) : (
          list.map((p) => {
            const img = p.image?.startsWith("/api/uploads")
              ? `${process.env.REACT_APP_BACKEND_URL}${p.image}`
              : p.image;
            return (
              <div key={p.id} className="cms-list-item project-item" data-testid={`project-row-${p.id}`}>
                {img ? <img src={img} alt="" className="thumb" /> : <div className="thumb" />}
                <div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 20, color: "var(--gold)", marginBottom: 6 }}>{p.title}</div>
                  <div style={{ fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                    {[p.category, p.location, p.year].filter(Boolean).join(" · ")}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{p.description}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button className="admin-delete" onClick={() => edit(p)} data-testid={`edit-${p.id}`}>Edit</button>
                  <button className="admin-delete" onClick={() => remove(p.id)} data-testid={`delete-project-${p.id}`}>Delete</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ========== Dashboard shell ========== */
export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("enquiries");

  // Verify token on mount; auto-logout if invalid
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await axios.get(`${API}/auth/me`, { headers: authHeaders(token) });
        setUser(r.data);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        toast.error("Session expired · sign in again");
      }
    })();
  }, [token]);

  const onLogin = (t, u) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
  };

  const onLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
  };

  if (!token) return <LoginScreen onLogin={onLogin} />;

  return (
    <div className="admin-shell" data-testid="admin-dashboard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <HMLogo size={28} />
          <span style={{ fontFamily: "var(--serif)", fontSize: 20, color: "var(--text-hero)", letterSpacing: "0.05em" }}>
            HM Geomatics · Console
          </span>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
            {user?.email}
          </span>
          <button className="admin-delete" onClick={onLogout} data-testid="admin-logout">
            Sign Out
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        {[
          ["enquiries", "Enquiries"],
          ["content", "Site Content"],
          ["projects", "Projects"],
        ].map(([k, label]) => (
          <button
            key={k}
            className={`admin-tab ${tab === k ? "is-active" : ""}`}
            onClick={() => setTab(k)}
            data-testid={`tab-${k}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "enquiries" && <EnquiriesTab token={token} />}
      {tab === "content" && <ContentTab token={token} />}
      {tab === "projects" && <ProjectsTab token={token} />}
    </div>
  );
}
