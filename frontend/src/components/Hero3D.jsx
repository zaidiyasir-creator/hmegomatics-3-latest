/**
 * HM Geomatics — Logo Reveal hero.
 * Embeds /logo-reveal.html (the verbatim reveal artifact) as an iframe.
 */
export default function Hero3D() {
  return (
    <iframe
      src="/logo-reveal.html"
      title="HM Geomatics Logo Reveal"
      data-testid="hero-3d-canvas"
      className="hero-canvas hero-reveal-iframe"
      loading="eager"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
