import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import Nav from "@/components/Nav";
import Hero3D from "@/components/Hero3D";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SERVICES = [
  {
    n: "01",
    t: "Land Boundary Survey",
    d: "Accurate demarcation and legal documentation for residential, commercial, and industrial properties.",
  },
  {
    n: "02",
    t: "Topographic Mapping",
    d: "High-precision terrain mapping and contour generation for development planning and engineering design.",
  },
  {
    n: "03",
    t: "Geomatic Survey Works",
    d: "Advanced geospatial data integrating GIS, CAD, and cutting-edge measurement technologies.",
  },
  {
    n: "04",
    t: "Engineering Drawing",
    d: "Detailed technical drawings for private developments and public infrastructure projects.",
  },
  {
    n: "05",
    t: "Construction Monitoring",
    d: "Ongoing site supervision and progress monitoring for large-scale subdivision developments.",
  },
  {
    n: "06",
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

/* ---- IntersectionObserver hook for .reveal ---- */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
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
              <div className="num">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </article>
          ))}
        </div>
        <div className="services-foot" />
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
          <div className="avatar" aria-hidden>
            MH
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
