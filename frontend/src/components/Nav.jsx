import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // On mount / when landing on "/" with a hash, scroll to that section.
  useEffect(() => {
    if (location.pathname !== "/") return;
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    // Wait for the target section to be rendered (Home fetches content async).
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempts < 20) {
        attempts += 1;
        setTimeout(tryScroll, 100);
      }
    };
    tryScroll();
  }, [location.pathname, location.hash]);

  const go = (id) => {
    setOpen(false);
    if (location.pathname === "/") {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Off-home → navigate home first, then the effect above scrolls.
      navigate(`/#${id}`);
    }
  };

  const goHome = (e) => {
    e.preventDefault();
    setOpen(false);
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  return (
    <nav
      className={`nav ${sticky ? "is-sticky" : ""}`}
      data-testid="site-nav"
    >
      <a
        href="/"
        className="nav-brand"
        data-testid="nav-brand"
        onClick={goHome}
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
