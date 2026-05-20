import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import Nav from "@/components/Nav";
import Hero3D from "@/components/Hero3D";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SERVICES = [
  {
    n: "01",
    icon: "/icons/land-boundary-survey.svg",
    t: "Land Boundary Survey",
    d: "Accurate demarcation and legal documentation for residential, commercial, and industrial properties.",
  },
  {
    n: "02",
    icon: "/icons/topographic-mapping.svg",
    t: "Topographic Mapping",
    d: "High-precision terrain mapping and contour generation for development planning and engineering design.",
  },
  {
    n: "03",
    icon: "/icons/geomatic-survey-works.svg",
    t: "Geomatic Survey Works",
    d: "Advanced geospatial data integrating GIS, CAD, and cutting-edge measurement technologies.",
  },
  {
    n: "04",
    icon: "/icons/engineering-drawing.svg",
    t: "Engineering Drawing",
    d: "Detailed technical drawings for private developments and public infrastructure projects.",
  },
  {
    n: "05",
    icon: "/icons/construction-monitoring.svg",
    t: "Construction Monitoring",
    d: "Ongoing site supervision and progress monitoring for large-scale subdivision developments.",
  },
  {
    n: "06",
    icon: "/icons/hydrographic-survey.svg",
    t: "Hydrographic Survey",
    d: "FIG/IHO/ICA Category A certified hydrographic surveys for maritime and coastal applications.",
  },
];

const VALUES = [
  ["R", "Respect"],
  ["A", "Accountability"],
  ["S", "Sustainability"],
  ["E", "Excellence"],
  ["C", "Cooperative"],
  ["C", "Customer-Centricity"],
];

const QUALS = [
  "Licensed Land Surveyor · Act 458",
  "FIG/IHO/ICA Category A",
  "CUUDS-LS 2024",
  "B.Eng Geomatic (Hons) · UTM 2014",
  "MAALS Member 2020",
];

/* ---- IntersectionObserver hook for .reveal and .reveal-up ---- */
function useReveal() {
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
  }, []);
}

/* ---- Enquiry form ---- */
function EnquiryForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
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
      const msg =
        err?.response?.data?.detail?.[0]?.msg ||
        err?.response?.data?.detail ||
        "Could not send. Please try again.";
      toast.error(typeof msg === "string" ? msg : "Could not send. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="enquiry-form"
      onSubmit={onSubmit}
      data-testid="enquiry-form"
    >
      <div className="row">
        <div className="field">
          <label htmlFor="enq-name">Name</label>
          <input
            id="enq-name"
            data-testid="enquiry-name"
            value={form.name}
            onChange={onChange("name")}
            autoComplete="name"
          />
        </div>
        <div className="field">
          <label htmlFor="enq-email">Email</label>
          <input
            id="enq-email"
            type="email"
            data-testid="enquiry-email"
            value={form.email}
            onChange={onChange("email")}
            autoComplete="email"
          />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="enq-phone">Phone</label>
          <input
            id="enq-phone"
            data-testid="enquiry-phone"
            value={form.phone}
            onChange={onChange("phone")}
            autoComplete="tel"
          />
        </div>
        <div className="field">
          <label htmlFor="enq-subject">Subject</label>
          <input
            id="enq-subject"
            data-testid="enquiry-subject"
            value={form.subject}
            onChange={onChange("subject")}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="enq-msg">Message</label>
        <textarea
          id="enq-msg"
          rows={4}
          data-testid="enquiry-message"
          value={form.message}
          onChange={onChange("message")}
        />
      </div>
      <button
        type="submit"
        className="btn-gold"
        disabled={busy}
        data-testid="enquiry-submit"
      >
        {busy ? "Sending…" : "Send Enquiry"}
      </button>
    </form>
  );
}

export default function Home() {
  useReveal();
  const topRef = useRef(null);

  return (
    <div ref={topRef} id="top" data-testid="home-page">
      <Nav />

      {/* ============ HERO ============ */}
      <header className="hero" data-testid="hero">
        <Hero3D />

        <div className="hero-meta-top">
          <div className="item">
            <span className="eyebrow">EST · 2024</span>
            <span className="eyebrow-muted">SEREMBAN · 2.7297° N</span>
          </div>
          <div className="item right">
            <span className="eyebrow">LJT 617</span>
            <span className="eyebrow-muted">101.9381° E</span>
          </div>
        </div>

        <div className="hero-overlay">
          <div className="eyebrow" data-testid="hero-eyebrow">
            LAND SURVEYOR · LICENSED UNDER ACT 458 (REVISED 2024)
          </div>
          <h1 className="hero-title" data-testid="hero-title">
            <span className="gold">HM</span>GEOMATICS
          </h1>
          <div className="hero-divider" />
          <div className="eyebrow-muted">
            WORLD DYNAMIC GEOMATIC LEADER · SEREMBAN, MALAYSIA
          </div>
        </div>

        <div className="scroll-cue" aria-hidden>
          <span className="line" />
          <span className="label">Discover</span>
        </div>
      </header>

      {/* ============ QUOTE BAND ============ */}
      <section className="quote-band reveal" data-testid="quote-band">
        <div className="inner">
          <blockquote>
            Hard work and persistence have brought us here. Our strength has
            always been a focus on our people, our teams, and our clients.
          </blockquote>
          <div className="quote-attr">
            <span className="label">Managing Director</span>
            LSr Muhammad Hazwan
            <br />
            bin Dato&apos; LSr Mohd Mazlan
            <br />
            Licensed Land Surveyor
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section id="services" className="services" data-testid="services-section">
        <div className="services-head reveal">
          <div>
            <div className="eyebrow">Our Expertise · 01 — 06</div>
            <h2 className="section-heading large" style={{ marginTop: 18 }}>
              Precision at <span className="italic">every scale</span>.
            </h2>
            <span className="gold-bar" />
          </div>
          <p>
            Six disciplines, one licensed practice. From single lots to
            multi-level apartments, from private developments to public
            infrastructure.
          </p>
        </div>

        <div className="services-grid">
          {SERVICES.map((s) => (
            <article
              key={s.n}
              className="service-cell reveal"
              data-testid={`service-${s.n}`}
            >
              <div className="service-head">
                <span className="num">{s.n}</span>
                <span
                  className="service-icon"
                  style={{
                    WebkitMaskImage: `url(${s.icon})`,
                    maskImage: `url(${s.icon})`,
                  }}
                  aria-hidden="true"
                />
              </div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </article>
          ))}
        </div>
        <div className="services-foot" />
      </section>

      {/* ============ MANIFESTO (dark interlude) ============ */}
      <section className="manifesto" data-testid="manifesto-section">
        <div className="manifesto-inner">
          <div className="manifesto-eyebrow">Our Promise · MMXXVI</div>
          <h2
            className="manifesto-words reveal-up"
            data-testid="manifesto-words"
          >
            <span className="word ivory">Precision.</span>
            <span className="word ivory">Innovation.</span>
            <span className="word excellence">Excellence.</span>
          </h2>
          <div className="manifesto-rule" />
          <p className="manifesto-tagline">
            Three principles guiding every line, every level, every legal
            boundary we deliver.
          </p>
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
          <p>
            At HM Geomatics Sdn. Bhd., we deliver efficient, accurate, and
            integrated land surveying services. We combine knowledge, hands-on
            experience, and the latest technologies — from single lots to
            multi-level apartments, from private developments to major public
            infrastructure.
          </p>
          <div className="about-stats">
            <div>
              <div className="num">2024</div>
              <div className="label">Established</div>
            </div>
            <div>
              <div className="num">15+</div>
              <div className="label">Yrs Avg. Experience</div>
            </div>
            <div>
              <div className="num">Act 458</div>
              <div className="label">Licensed</div>
            </div>
          </div>
        </div>

        <div className="about-dark reveal">
          <div className="eyebrow">Our Values</div>
          <h2>
            Guided by <span style={{ color: "var(--gold)", fontStyle: "italic" }}>principle</span>.
          </h2>
          <span className="gold-bar" />
          <div className="values-list">
            {VALUES.map(([letter, name], i) => (
              <div
                key={i}
                className="values-row"
                data-testid={`value-${name.toLowerCase()}`}
              >
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
            <img
              src="/director-hazwan.jpg"
              alt="LSr Muhammad Hazwan bin Dato' LSr Mohd Mazlan"
              data-testid="director-photo"
            />
          </div>
          <div>
            <h3>LSr Muhammad Hazwan bin Dato&apos; LSr Mohd Mazlan</h3>
            <div className="role">
              Managing Director · Licensed Land Surveyor
            </div>
            <p>
              With over a decade of experience in land surveying and geomatics,
              LSr Hazwan leads HM Geomatics with a commitment to precision,
              innovation, and client excellence. Previously serving at Jurukur
              Teras Sdn. Bhd. from 2010–2024, he brings unmatched field
              expertise and professional credentials to every project.
            </p>
            <div className="qual-tags">
              {QUALS.map((q) => (
                <span key={q} className="qual-tag">
                  {q}
                </span>
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
              No. 20, Betaria Business Centre
              <br />
              Jalan Durian Emas 3, Off Jalan Dato&apos; Siamang Gagap
              <br />
              70100 Seremban, Negeri Sembilan, Malaysia
            </div>
            <div className="contact-block">
              <span className="contact-label">Telephone</span>
              +606 761 0867 (Office)
              <br />
              +6013 315 8958 (LSr Hazwan)
            </div>
            <div className="contact-block" data-testid="contact-whatsapp">
              <span className="contact-label">WhatsApp</span>
              <a
                href="https://wa.me/60133158958?text=Hello%20HM%20Geomatics%2C%20I%20would%20like%20to%20enquire%20about%20your%20surveying%20services."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold btn-whatsapp"
                data-testid="whatsapp-btn"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.892 6.994c-.003 5.45-4.437 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                <span>Chat on WhatsApp</span>
              </a>
            </div>
            <EnquiryForm />
          </div>

          <div className="reveal">
            <div className="contact-block">
              <span className="contact-label">Company Registration</span>
              SSM: 202401037321 (1583168-K)
              <br />
              LJT Reg. No: LJT 617
              <br />
              MOF Cert: J10961822104057517
              <br />
              Valid: 10/01/2025 – 09/01/2028
            </div>
            <div className="contact-block">
              <span className="contact-label">Certification</span>
              Licensed under Akta Juruukur Tanah Berlesen 1958
              <br />
              Registered with Lembaga Jurukur Tanah Malaysia
              <br />
              Practice Name Cert No: 01170
            </div>
            <div className="contact-block">
              <span className="contact-label">Hours</span>
              Monday — Friday · 09:00 – 18:00 MYT
              <br />
              Field visits arranged by appointment
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="footer" data-testid="footer">
        <span>© 2026 HM Geomatics Sdn. Bhd. · All rights reserved</span>
        <span>SSM 202401037321 (1583168-K)</span>
      </footer>
    </div>
  );
}
