import { useEffect, useState } from "react";
import HMLogo from "./HMLogo";
import { Menu, X, Download } from "lucide-react";

const LINKS = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "director", label: "Leadership" },
  { id: "contact", label: "Contact" },
];

const PROFILE_PDF = "/hm-geomatics-2026-profile.pdf";

export default function Nav() {
  const [sticky, setSticky] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className={`nav ${sticky ? "is-sticky" : ""}`}
      data-testid="site-nav"
    >
      <a
        href="#top"
        className="nav-brand"
        data-testid="nav-brand"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <HMLogo size={34} className="nav-logo" />
        <span className="nav-brand-text">
          <span className="nav-brand-name">HM GEOMATICS SDN. BHD.</span>
          <span className="nav-brand-sub">PROFESSIONAL SURVEYOR</span>
        </span>
      </a>

      <div className={`nav-links ${open ? "open" : ""}`} data-testid="nav-links">
        {LINKS.map((l) => (
          <button
            key={l.id}
            className="nav-link"
            data-testid={`nav-link-${l.id}`}
            onClick={() => go(l.id)}
          >
            {l.label}
          </button>
        ))}

        <a
          href={PROFILE_PDF}
          download="HM-Geomatics-2026-Business-Profile.pdf"
          className="nav-link nav-link--cta"
          data-testid="nav-download-profile"
          onClick={() => setOpen(false)}
        >
          <Download size={14} strokeWidth={1.5} />
          <span>Co. Profile</span>
        </a>
      </div>

      <button
        className="nav-toggle"
        aria-label="Toggle navigation"
        data-testid="nav-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
    </nav>
  );
}
