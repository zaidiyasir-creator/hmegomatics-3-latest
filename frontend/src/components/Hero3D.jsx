import { useEffect, useMemo, useRef } from "react";

/**
 * HM Geomatics — Logo Reveal hero.
 * CSS-driven cinematic reveal: brass edge → corner inscriptions →
 * halo + ground → logo entry with metal gleam → wordmark + tagline →
 * drifting brass motes + film grain.
 */
export default function Hero3D() {
  const stageRef = useRef(null);

  // Pre-generate mote properties so they don't change on re-renders
  const motes = useMemo(() => {
    const N = 22;
    return Array.from({ length: N }, () => ({
      left: Math.random() * 100,
      bottomOffset: -10 - Math.random() * 30,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 8,
      opacity: 0.3 + Math.random() * 0.5,
      big: Math.random() > 0.7,
    }));
  }, []);

  // Re-trigger animations whenever the hero scrolls back into view
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            stage.classList.remove("is-playing");
            // Force reflow to restart CSS animations
            void stage.offsetWidth;
            stage.classList.add("is-playing");
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={stageRef}
      className="reveal-stage is-playing"
      data-testid="hero-3d-canvas"
      aria-hidden="true"
    >
      <div className="reveal-brand-edge" />

      {/* Corner inscriptions */}
      <div className="reveal-corner tl">HM Geomatics · MMXXVI</div>
      <div className="reveal-corner tr">
        <span>2.7297° N</span>
        <span className="v">101.9381° E</span>
      </div>
      <div className="reveal-corner bl">Seremban · Malaysia</div>
      <div className="reveal-corner br">
        <span>Licensed · Act 458</span>
        <span className="v">LJT 617 · LJTM</span>
      </div>

      {/* Drifting motes */}
      <div className="reveal-motes">
        {motes.map((m, i) => (
          <span
            key={i}
            className={`reveal-mote ${m.big ? "big" : ""}`}
            style={{
              left: `${m.left}%`,
              bottom: `${m.bottomOffset}%`,
              animationDelay: `${m.delay}s`,
              animationDuration: `${m.duration}s`,
              opacity: m.opacity,
            }}
          />
        ))}
      </div>

      {/* Halo + ground glow */}
      <div className="reveal-halo" />
      <div className="reveal-ground" />

      {/* Logo with diagonal gleam */}
      <div className="reveal-logo-deck">
        <div className="reveal-logo-pane">
          <img
            className="reveal-logo-img"
            src="/hm-logo.png"
            alt="HM Geomatics"
          />
          <div
            className="reveal-gleam"
            style={{
              WebkitMaskImage: "url(/hm-logo.png)",
              maskImage: "url(/hm-logo.png)",
            }}
          />
        </div>
      </div>

      {/* Wordmark */}
      <div className="reveal-wordmark-block">
        <div className="reveal-mini-divider">
          <span className="dot" />
        </div>
        <h1 className="reveal-wordmark">HM Geomatics</h1>
      </div>

      {/* Replay */}
      <button
        type="button"
        className="reveal-replay"
        data-testid="reveal-replay"
        onClick={() => {
          const s = stageRef.current;
          if (!s) return;
          s.classList.remove("is-playing");
          void s.offsetWidth;
          s.classList.add("is-playing");
        }}
      >
        <span>Replay</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        >
          <path d="M4 7 A 8 8 0 1 1 4 17" />
          <polyline points="2 3 4 7 8 5" />
        </svg>
      </button>

      {/* Subtle film grain overlay */}
      <div className="reveal-grain" />
    </div>
  );
}
