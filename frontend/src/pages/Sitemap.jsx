import { Link } from "react-router-dom";
import HMLogo from "@/components/HMLogo";

const SECTIONS = [
  {
    title: "Main",
    items: [
      { label: "Home", href: "/", desc: "Landing page · hero, about, services, leadership, contact" },
    ],
  },
  {
    title: "Sections",
    items: [
      { label: "About", href: "/#about", desc: "Who we are · values · principles" },
      { label: "Services", href: "/#services", desc: "Six surveying disciplines" },
      { label: "Leadership", href: "/#director", desc: "Director profile · qualifications" },
      { label: "Contact", href: "/#contact", desc: "Address · telephone · enquiry form" },
    ],
  },
  {
    title: "Services",
    items: [
      { label: "Land Boundary Survey", href: "/#services" },
      { label: "Topographic Mapping", href: "/#services" },
      { label: "Geomatic Survey Works", href: "/#services" },
      { label: "Engineering Drawing", href: "/#services" },
      { label: "Construction Monitoring", href: "/#services" },
      { label: "Hydrographic Survey · FIG/IHO/ICA Cat A", href: "/#services" },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        label: "2026 Business Profile (PDF · 43 MB)",
        href: "/hm-geomatics-2026-profile.pdf",
        external: true,
        download: "HM-Geomatics-2026-Business-Profile.pdf",
      },
      {
        label: "XML Sitemap (for search engines)",
        href: "/sitemap.xml",
        external: true,
      },
      {
        label: "robots.txt",
        href: "/robots.txt",
        external: true,
      },
    ],
  },
  {
    title: "Direct",
    items: [
      {
        label: "WhatsApp · Chat to the Team",
        href: "https://wa.me/60133158958",
        external: true,
      },
      {
        label: "Office · +606 761 0867",
        href: "tel:+60067610867",
        external: true,
      },
    ],
  },
];

export default function Sitemap() {
  return (
    <div className="sitemap-page" data-testid="sitemap-page">
      <div className="sitemap-shell">
        <header className="sitemap-head">
          <Link to="/" className="sitemap-brand" data-testid="sitemap-brand">
            <HMLogo size={42} />
            <div className="sitemap-brand-text">
              <span className="sitemap-brand-name">HM GEOMATICS SDN. BHD.</span>
              <span className="sitemap-brand-sub">Site Map</span>
            </div>
          </Link>
          <Link to="/" className="sitemap-back" data-testid="sitemap-back">
            ← Return to Home
          </Link>
        </header>

        <div className="sitemap-meta">
          <span className="sitemap-eyebrow">Index · MMXXVI</span>
          <h1 className="sitemap-title">
            Every <span className="italic gold">page, section &amp; resource</span>
            <br /> on hmgeomatics.com.my
          </h1>
          <p className="sitemap-lead">
            A complete listing of the site, organised so you can reach any
            content in a single click. Built for both visitors and search
            engines.
          </p>
        </div>

        <div className="sitemap-grid">
          {SECTIONS.map((g) => (
            <section className="sitemap-group" key={g.title}>
              <h2 className="sitemap-group-title">
                <span>{g.title}</span>
                <span className="sitemap-group-rule" />
              </h2>
              <ul className="sitemap-list">
                {g.items.map((it) => (
                  <li key={it.label} className="sitemap-item">
                    {it.external ? (
                      <a
                        href={it.href}
                        target={it.download ? "_self" : "_blank"}
                        rel="noopener noreferrer"
                        download={it.download}
                        className="sitemap-link"
                      >
                        <span className="label">{it.label}</span>
                        {it.desc && <span className="desc">{it.desc}</span>}
                      </a>
                    ) : (
                      <Link to={it.href} className="sitemap-link">
                        <span className="label">{it.label}</span>
                        {it.desc && <span className="desc">{it.desc}</span>}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="sitemap-foot">
          <span>© 2026 HM Geomatics Sdn. Bhd. · All rights reserved</span>
          <span>SSM 202401037321 (1583168-K)</span>
        </footer>
      </div>
    </div>
  );
}
