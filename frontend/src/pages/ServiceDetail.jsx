import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import Nav from "@/components/Nav";
import { ArrowLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;

const resolveImg = (src) => {
  if (!src) return src;
  return src.startsWith("/api/uploads") ? `${BACKEND}${src}` : src;
};

/* Enquiry form (compact variant for service pages) */
function ServiceEnquiryForm({ serviceName, whatsappNumber }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
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
      await axios.post(`${API}/enquiries`, {
        ...form,
        subject: serviceName,
      });
      toast.success("Enquiry sent · we will respond within 2 working days");
      setForm({ name: "", email: "", phone: "", message: "" });
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
    <form className="svc-detail-form" onSubmit={onSubmit} data-testid="service-enquiry-form">
      <div className="row">
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={onChange("name")} autoComplete="name" data-testid="svc-form-name" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={onChange("email")} autoComplete="email" data-testid="svc-form-email" />
        </div>
      </div>
      <div className="field">
        <label>Phone (optional)</label>
        <input value={form.phone} onChange={onChange("phone")} autoComplete="tel" />
      </div>
      <div className="field">
        <label>Message</label>
        <textarea
          rows={4}
          value={form.message}
          onChange={onChange("message")}
          placeholder={`Tell us about your ${serviceName} requirements…`}
          data-testid="svc-form-message"
        />
      </div>
      <div className="cta-row">
        <button type="submit" className="btn-gold" disabled={busy} data-testid="svc-form-submit">
          {busy ? "Sending…" : "Send Enquiry"}
        </button>
        <a
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello HM Geomatics, I'd like to discuss ${serviceName}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
        >
          WhatsApp →
        </a>
      </div>
    </form>
  );
}

export default function ServiceDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [content, setContent] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setService(null);
    setContent(null);
    setNotFound(false);
    (async () => {
      try {
        const [svcRes, contentRes] = await Promise.all([
          axios.get(`${API}/services/${slug}`),
          axios.get(`${API}/content`),
        ]);
        setService(svcRes.data);
        setContent(contentRes.data);
      } catch (err) {
        if (err?.response?.status === 404) setNotFound(true);
        else toast.error("Could not load service");
      }
    })();
    window.scrollTo(0, 0);
  }, [slug]);

  if (notFound) {
    return (
      <div className="svc-detail">
        <Nav />
        <div className="svc-detail-notfound">
          <h1>Service not found</h1>
          <Link to="/#services" className="btn-gold" data-testid="back-to-services">
            Back to all services
          </Link>
        </div>
      </div>
    );
  }

  if (!service || !content) {
    return (
      <div className="svc-detail">
        <Nav />
        <div className="svc-detail-loading">Loading…</div>
      </div>
    );
  }

  const relatedServices = (content.services || []).filter((s) => s.slug !== slug).slice(0, 3);

  return (
    <div className="svc-detail" data-testid={`service-detail-${slug}`}>
      <Nav />

      {/* JSON-LD Service schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.t,
            description: service.long_description || service.d,
            image: service.photo,
            provider: {
              "@type": "ProfessionalService",
              name: "HM Geomatics Sdn. Bhd.",
              telephone: content.phone_office,
              email: content.email,
              address: {
                "@type": "PostalAddress",
                streetAddress: content.address_line1,
                addressLocality: "Seremban",
                addressRegion: "Negeri Sembilan",
                addressCountry: "MY",
              },
            },
            areaServed: { "@type": "Country", name: "Malaysia" },
          }),
        }}
      />

      {/* Hero */}
      <header className="svc-detail-hero">
        <div className="svc-detail-hero-image">
          <img
            src={resolveImg(service.photo)}
            alt={service.alt || service.t}
            loading="eager"
            decoding="async"
          />
          <div className="svc-detail-hero-gradient" />
        </div>
        <div className="svc-detail-hero-content">
          <button
            className="svc-detail-back"
            onClick={() => navigate("/#services")}
            data-testid="detail-back"
          >
            <ArrowLeft size={14} strokeWidth={1.6} />
            All Services
          </button>
          <div className="eyebrow" style={{ color: "var(--gold)" }}>
            Discipline · {service.n}
          </div>
          <h1 className="svc-detail-title">{service.t}</h1>
          <span className="gold-bar" />
          <p className="svc-detail-lede">{service.d}</p>
        </div>
      </header>

      {/* Overview */}
      <section className="svc-detail-section svc-detail-overview">
        <div className="svc-detail-inner">
          <div className="eyebrow">Overview</div>
          <h2 className="section-heading large" style={{ marginTop: 12 }}>
            The practice behind the <span className="italic">deliverable</span>.
          </h2>
          <span className="gold-bar" />
          <p className="svc-detail-long">
            {service.long_description || service.d}
          </p>
        </div>
      </section>

      {/* Equipment + Deliverables + Standards grid */}
      {(service.equipment?.length || service.deliverables?.length || service.standards?.length) && (
        <section className="svc-detail-section svc-detail-columns">
          <div className="svc-detail-inner">
            <div className="svc-detail-cols">
              {service.equipment?.length > 0 && (
                <div className="svc-col">
                  <div className="eyebrow">Equipment</div>
                  <h3>Instruments &amp; platforms</h3>
                  <span className="gold-bar" />
                  <ul>
                    {service.equipment.map((item, i) => (
                      <li key={i}><CheckCircle2 size={14} strokeWidth={1.6} /> {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {service.deliverables?.length > 0 && (
                <div className="svc-col">
                  <div className="eyebrow">Deliverables</div>
                  <h3>What you receive</h3>
                  <span className="gold-bar" />
                  <ul>
                    {service.deliverables.map((item, i) => (
                      <li key={i}><CheckCircle2 size={14} strokeWidth={1.6} /> {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {service.standards?.length > 0 && (
                <div className="svc-col">
                  <div className="eyebrow">Standards</div>
                  <h3>Certified against</h3>
                  <span className="gold-bar" />
                  <ul>
                    {service.standards.map((item, i) => (
                      <li key={i}><CheckCircle2 size={14} strokeWidth={1.6} /> {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA + Enquiry form */}
      <section className="svc-detail-section svc-detail-cta">
        <div className="svc-detail-inner svc-detail-cta-inner">
          <div className="svc-detail-cta-copy">
            <div className="eyebrow" style={{ color: "var(--gold)" }}>Discuss this service</div>
            <h2 className="section-heading large" style={{ marginTop: 12, color: "#fff" }}>
              Ready to <span className="italic">commission</span>?
            </h2>
            <span className="gold-bar" />
            <p>
              Send a short brief and our director will respond within two working days.
              For urgent matters, WhatsApp is the fastest route.
            </p>
            <div className="svc-detail-contact">
              <span>Direct email · <a href={`mailto:${content.email}`}>{content.email}</a></span>
              <span>Office · {content.phone_office}</span>
              <span>Director · {content.phone_director}</span>
            </div>
          </div>
          <ServiceEnquiryForm serviceName={service.t} whatsappNumber={content.whatsapp_number} />
        </div>
      </section>

      {/* Related services */}
      {relatedServices.length > 0 && (
        <section className="svc-detail-section svc-detail-related">
          <div className="svc-detail-inner">
            <div className="eyebrow">Other Disciplines</div>
            <h2 className="section-heading large" style={{ marginTop: 12 }}>
              Explore more <span className="italic">services</span>.
            </h2>
            <span className="gold-bar" />
            <div className="svc-detail-related-grid">
              {relatedServices.map((s) => (
                <Link
                  key={s.slug}
                  to={`/services/${s.slug}`}
                  className="svc-detail-related-card"
                  data-testid={`related-${s.slug}`}
                >
                  <div className="svc-detail-related-image">
                    <img src={resolveImg(s.photo)} alt={s.alt || s.t} loading="lazy" />
                  </div>
                  <div className="svc-detail-related-body">
                    <h4>{s.t}</h4>
                    <span className="learn">
                      Explore <ArrowUpRight size={12} strokeWidth={1.8} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer" data-testid="footer">
        <span>© 2026 HM Geomatics Sdn. Bhd. · All rights reserved</span>
        <span style={{ display: "inline-flex", gap: 18, alignItems: "center" }}>
          <Link to="/sitemap" style={{ color: "inherit", textDecoration: "none" }}>Sitemap</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{content.ssm}</span>
        </span>
      </footer>
    </div>
  );
}
