import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import Nav from "@/components/Nav";
import HeroVideo from "@/components/HeroVideo";
import ChatFab from "@/components/ChatFab";
import {
  ArrowUpRight,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;

/* Fallback content used if /api/content fails — keeps the site readable. */
const FALLBACK = {
  hero_eyebrow_left: "EST · 2024",
  hero_eyebrow_left_sub: "SEREMBAN · 2.7297° N",
  hero_eyebrow_right: "LJT 617",
  hero_eyebrow_right_sub: "101.9381° E",
  hero_tagline: "WORLD DYNAMIC GEOMATIC LEADER · SEREMBAN, MALAYSIA",
  quote_text:
    "Hard work and persistence have brought us here. Our strength has always been a focus on our people, our teams, and our clients.",
  quote_attribution_role: "Managing Director",
  quote_attribution_name: "LSr Muhammad Hazwan bin Dato' LSr Mohd Mazlan",
  quote_attribution_credential: "Licensed Land Surveyor",
  services: [
    { n: "01", key: "boundary", t: "Land Boundary Survey", d: "Accurate determination of legal land boundaries.", photo: "", alt: "" },
  ],
  manifesto_eyebrow: "Our Promise · MMXXVI",
  manifesto_words: ["Precision.", "Innovation.", "Excellence."],
  manifesto_tagline: "Three principles guiding every line, every level, every legal boundary we deliver.",
  about_intro:
    "At HM Geomatics Sdn. Bhd., we deliver efficient, accurate, and integrated land surveying services.",
  values: [
    ["R", "Respect"],
    ["A", "Accountability"],
    ["S", "Sustainability"],
    ["E", "Excellence"],
    ["C", "Cooperative"],
    ["C", "Customer-Centricity"],
  ],
  director_name: "LSr Muhammad Hazwan bin Dato' LSr Mohd Mazlan",
  director_role: "Managing Director · Licensed Land Surveyor",
  director_bio: "With over a decade of experience in land surveying and geomatics, LSr Hazwan leads HM Geomatics with a commitment to precision, innovation, and client excellence.",
  director_photo: "/director-hazwan.jpg",
  director_quals: [
    "Licensed Land Surveyor · Act 458",
    "FIG/IHO/ICA Category A",
    "CUUDS-LS 2024",
    "B.Eng Geomatic (Hons) · UTM 2014",
    "MAALS Member 2020",
  ],
  address_line1: "No. 20, Betaria Business Centre",
  address_line2: "Jalan Durian Emas 3, Off Jalan Dato' Siamang Gagap",
  address_line3: "70100 Seremban, Negeri Sembilan, Malaysia",
  phone_office: "+606 761 0867",
  phone_director: "+6013 315 8958",
  email: "hazwan@hmgeomatics.com",
  whatsapp_number: "60133158958",
  ssm: "Suruhanjaya Syarikat Malaysia (SSM)",
  ljt: "Lembaga Jurukur Tanah (LJT)",
  mof: "Kementerian Kewangan (MoF)",
  cert_validity: "Kastam Diraja Malaysia (Custom)",
  practice_cert: "Certificate in Underground Utility Detection and Survey",
  hours: "Monday — Friday · 08:30 – 17:30 MYT · Field visits arranged by appointment",
};

const resolveImg = (src) => {
  if (!src) return src;
  return src.startsWith("/api/uploads") ? `${BACKEND}${src}` : src;
};

/* ---- IntersectionObserver hook for .reveal and .reveal-up ---- */
function useReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal, .reveal-up");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ---- Enquiry form ---- */
function EnquiryForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in name, email, and message");
      return;
    }
    setBusy(true);
    try {
      await axios.post(`${API}/enquiries`, form);
      toast.success("Enquiry sent · we will respond within 2 working days");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      const msg = err?.response?.data?.detail?.[0]?.msg || err?.response?.data?.detail || "Could not send. Please try again.";
      toast.error(typeof msg === "string" ? msg : "Could not send. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="enquiry-form" onSubmit={onSubmit} data-testid="enquiry-form">
      <div className="row">
        <div className="field">
          <label htmlFor="enq-name">Name</label>
          <input id="enq-name" data-testid="enquiry-name" value={form.name} onChange={onChange("name")} autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="enq-email">Email</label>
          <input id="enq-email" type="email" data-testid="enquiry-email" value={form.email} onChange={onChange("email")} autoComplete="email" />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="enq-phone">Phone</label>
          <input id="enq-phone" data-testid="enquiry-phone" value={form.phone} onChange={onChange("phone")} autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="enq-subject">Subject</label>
          <input id="enq-subject" data-testid="enquiry-subject" value={form.subject} onChange={onChange("subject")} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="enq-msg">Message</label>
        <textarea id="enq-msg" rows={4} data-testid="enquiry-message" value={form.message} onChange={onChange("message")} />
      </div>
      <button type="submit" className="btn-gold" disabled={busy} data-testid="enquiry-submit">
        {busy ? "Sending…" : "Send Enquiry"}
      </button>
    </form>
  );
}

export default function Home() {
  const topRef = useRef(null);
  const [c, setC] = useState(FALLBACK);
  const [projects, setProjects] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [contentRes, projectsRes] = await Promise.all([
          axios.get(`${API}/content`),
          axios.get(`${API}/projects`),
        ]);
        // Merge so any missing fields fall back gracefully
        setC({ ...FALLBACK, ...contentRes.data });
        setProjects(projectsRes.data || []);
      } catch (err) {
        console.warn("Could not load content from API, using fallback", err);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Re-run reveal observer when content is ready (so new DOM gets observed)
  useReveal([ready, projects.length]);

  const whatsappHref = `https://wa.me/${c.whatsapp_number}?text=Hello%20HM%20Geomatics%2C%20I%20would%20like%20to%20enquire%20about%20your%20surveying%20services.`;

  return (
    <div ref={topRef} id="top" data-testid="home-page">
      <Nav />

      {/* ============ HERO ============ */}
      <header className="hero" data-testid="hero">
        <HeroVideo />

        <div className="hero-meta-top">
          <div className="item">
            <span className="eyebrow">{c.hero_eyebrow_left}</span>
            <span className="eyebrow-muted">{c.hero_eyebrow_left_sub}</span>
          </div>
          <div className="item right">
            <span className="eyebrow">{c.hero_eyebrow_right}</span>
            <span className="eyebrow-muted">{c.hero_eyebrow_right_sub}</span>
          </div>
        </div>

        <div className="hero-overlay">
          <h1 className="hero-title" data-testid="hero-title">
            <span className="gold">HM</span>GEOMATICS
          </h1>
          <div className="eyebrow-muted">{c.hero_tagline}</div>
        </div>
      </header>

      {/* ============ QUOTE BAND ============ */}
      <section className="quote-band reveal" data-testid="quote-band">
        <div className="inner">
          <blockquote>{c.quote_text}</blockquote>
          <div className="quote-attr">
            <span className="label">{c.quote_attribution_role}</span>
            {c.quote_attribution_name}
            <br />
            {c.quote_attribution_credential}
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section id="services" className="services-v2" data-testid="services-section">
        <div className="services-v2-head reveal">
          <div>
            <div className="eyebrow" style={{ color: "var(--gold)" }}>
              Our Expertise · {c.services?.length || 14} Disciplines
            </div>
            <h2 className="section-heading large" style={{ marginTop: 18 }}>
              Precision at <span className="italic">every scale</span>.
            </h2>
            <span className="gold-bar" />
          </div>
          <p>
            From single lots to nationwide infrastructure — a fully licensed
            practice covering every discipline of modern land, marine and
            aerial surveying.
          </p>
        </div>

        <div className="services-v2-grid">
          {(c.services || []).map((s) => {
            const slug = s.slug || (s.t || "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");
            const photo = s.photo && s.photo.startsWith("/api/uploads")
              ? `${BACKEND}${s.photo}`
              : s.photo;
            return (
              <article
                key={s.n + s.t}
                className="svc-card reveal"
                data-testid={`service-${s.n}`}
                data-service-slug={slug}
              >
                <Link
                  to={`/services/${slug}`}
                  className="svc-card-inner"
                  aria-label={`${s.t} — Learn more`}
                >
                  <div className="svc-card-image">
                    {photo && (
                      <img
                        src={photo}
                        alt={s.alt || s.t}
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                  <div className="svc-card-cta">
                    <h3 className="sr-only">{s.t}</h3>
                    <span className="svc-learn-btn">
                      Learn More <ArrowUpRight size={14} strokeWidth={1.8} />
                    </span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        {/* JSON-LD schema.org Service list */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: (c.services || []).map((s, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "Service",
                  name: s.t,
                  description: s.d,
                  image: s.photo,
                  provider: {
                    "@type": "ProfessionalService",
                    name: "HM Geomatics Sdn. Bhd.",
                  },
                },
              })),
            }),
          }}
        />
      </section>

      {/* ============ SELECTED WORK ============ */}
      {projects.length > 0 && (
        <section id="work" className="selected-work" data-testid="selected-work-section">
          <div className="sw-head reveal">
            <div>
              <div className="eyebrow" style={{ color: "var(--gold)" }}>Selected Work</div>
              <h2 className="section-heading large" style={{ marginTop: 18, color: "var(--text-dark)" }}>
                A handful of <span className="italic">projects</span>.
              </h2>
              <span className="gold-bar" />
            </div>
            <p>
              From boundary demarcation in Seremban to topographic missions across Negeri Sembilan — a glimpse of recent commissions delivered with the precision our clients trust.
            </p>
          </div>

          <div className="sw-grid">
            {projects.map((p) => (
              <article key={p.id} className="sw-card reveal" data-testid={`project-card-${p.id}`}>
                <div className="sw-image">
                  {p.image && <img src={resolveImg(p.image)} alt={p.title} loading="lazy" />}
                </div>
                <div className="sw-body">
                  {(p.category || p.location || p.year) && (
                    <div className="sw-meta">
                      {p.category && <span>{p.category}</span>}
                      {p.location && <span>{p.location}</span>}
                      {p.year && <span>{p.year}</span>}
                    </div>
                  )}
                  <h3 className="sw-title">{p.title}</h3>
                  {p.description && <p className="sw-desc">{p.description}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ============ MANIFESTO (dark interlude) ============ */}
      <section className="manifesto" data-testid="manifesto-section">
        <div className="manifesto-inner">
          <div className="manifesto-eyebrow">{c.manifesto_eyebrow}</div>
          <h2 className="manifesto-words reveal-up" data-testid="manifesto-words">
            {c.manifesto_words.map((w, i) => (
              <span
                key={i}
                className={`word ${i === c.manifesto_words.length - 1 ? "excellence" : "ivory"}`}
              >
                {w}
              </span>
            ))}
          </h2>
          <div className="manifesto-rule" />
          <p className="manifesto-tagline">{c.manifesto_tagline}</p>
        </div>
      </section>

      {/* ============ ABOUT SPLIT ============ */}
      <section id="about" className="about-split" data-testid="about-section">
        <div className="about-cream reveal">
          <div className="eyebrow">Who We Are</div>
          <h2>
            Accuracy, communication, <span style={{ color: "var(--gold)", fontStyle: "italic" }}>open mind</span>.
          </h2>
          <span className="gold-bar" />
          <p>{c.about_intro}</p>
          <div className="about-stats">
            <div><div className="num">2024</div><div className="label">Established</div></div>
            <div><div className="num">15+</div><div className="label">Yrs Avg. Experience</div></div>
            <div><div className="num">Act 458</div><div className="label">Licensed</div></div>
          </div>
        </div>

        <div className="about-dark reveal">
          <div className="eyebrow">Our Values</div>
          <h2>
            Guided by <span style={{ color: "var(--gold)", fontStyle: "italic" }}>principle</span>.
          </h2>
          <span className="gold-bar" />
          <div className="values-list">
            {c.values.map(([letter, name], i) => (
              <div key={i} className="values-row" data-testid={`value-${name.toLowerCase()}`}>
                <span className="values-letter">{letter}</span>
                <span className="values-name">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DIRECTOR ============ */}
      <section id="director" className="director" data-testid="director-section">
        <div className="reveal" style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="eyebrow">Leadership · 01 of 01</div>
          <h2 className="section-heading large" style={{ marginTop: 18 }}>
            Meet the <span className="italic">director</span>.
          </h2>
          <span className="gold-bar" />
        </div>

        <div className="director-grid reveal" style={{ marginTop: 30 }}>
          <div className="director-portrait" aria-hidden>
            <img src={resolveImg(c.director_photo)} alt={c.director_name} data-testid="director-photo" />
          </div>
          <div>
            <h3>{c.director_name}</h3>
            <div className="role">{c.director_role}</div>
            <p>{c.director_bio}</p>
            <div className="qual-tags">
              {c.director_quals.map((q) => (
                <span key={q} className="qual-tag">{q}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CONTACT ============ */}
      <section id="contact" className="contact" data-testid="contact-section">
        <div className="reveal" style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="eyebrow">Get In Touch</div>
          <h2 className="section-heading large" style={{ marginTop: 18 }}>
            Let&apos;s work <span className="italic">together</span>.
          </h2>
          <span className="gold-bar" />
        </div>

        <div className="contact-grid">
          <div className="reveal">
            <div className="contact-block" data-testid="contact-address">
              <span className="contact-label">Address</span>
              {c.address_line1}<br />
              {c.address_line2}<br />
              {c.address_line3}
            </div>
            <div className="contact-block">
              <span className="contact-label">Telephone</span>
              {c.phone_office} (Office)<br />
              {c.phone_director} (LSr Hazwan)<br /><br />
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500, letterSpacing: "0.02em" }}
                data-testid="inline-whatsapp-link"
              >
                WhatsApp →
              </a>
            </div>
            <div className="contact-block">
              <span className="contact-label">Email</span>
              <a
                href={`mailto:${c.email}`}
                style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500, letterSpacing: "0.02em" }}
                data-testid="contact-email-link"
              >
                {c.email}
              </a>
            </div>
            <EnquiryForm />
          </div>

          <div className="reveal">
            <div className="contact-block">
              <span className="contact-label">Company Registration</span>
              {c.ssm}<br />
              {c.ljt}<br />
              {c.mof}<br />
              {c.cert_validity}
            </div>
            <div className="contact-block">
              <span className="contact-label">Certification</span>
              Licensed under Akta Juruukur Tanah Berlesen 1958<br />
              Registered with Lembaga Jurukur Tanah<br />
              FIG/IHO/ICA Category A Level<br />
              {c.practice_cert}
            </div>
            <div className="contact-block">
              <span className="contact-label">Hours</span>
              {c.hours}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="footer" data-testid="footer">
        <span>© 2026 HM Geomatics Sdn. Bhd. · All rights reserved</span>
        <span style={{ display: "inline-flex", gap: 18, alignItems: "center" }}>
          <a href="/sitemap" style={{ color: "inherit", textDecoration: "none" }} data-testid="footer-sitemap">
            Sitemap
          </a>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{c.ssm}</span>
        </span>
      </footer>

      {/* ============ FLOATING CHAT FAB ============ */}
      <ChatFab whatsappNumber={c.whatsapp_number} />
    </div>
  );
}
