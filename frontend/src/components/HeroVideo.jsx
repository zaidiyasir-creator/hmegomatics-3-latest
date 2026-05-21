import { useEffect, useRef, useState } from "react";

/**
 * HM Geomatics — hero emergence video (looping, autoplay).
 * Starts muted (browsers block autoplay-with-sound). A tasteful sound
 * toggle in the hero corner lets visitors enable audio.
 */
export default function HeroVideo() {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    document.addEventListener("visibilitychange", tryPlay);
    return () => document.removeEventListener("visibilitychange", tryPlay);
  }, []);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    const nextMuted = !muted;
    v.muted = nextMuted;
    if (!nextMuted) {
      v.volume = 0.6;
      // ensure it is actually playing once user opts into sound
      v.play().catch(() => {});
    }
    setMuted(nextMuted);
  };

  return (
    <>
      <video
        ref={videoRef}
        className="hero-canvas hero-video"
        data-testid="hero-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/hmgeo-emergence.webm" type="video/webm" />
        <source src="/hmgeo-emergence.mp4" type="video/mp4" />
      </video>

      <button
        type="button"
        className={`hero-sound ${muted ? "is-muted" : "is-on"}`}
        onClick={toggleSound}
        data-testid="hero-sound-toggle"
        aria-label={muted ? "Enable sound" : "Mute sound"}
        title={muted ? "Enable sound" : "Mute sound"}
      >
        <span className="hero-sound-icon" aria-hidden="true">
          {muted ? (
            // muted icon — speaker with cross
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor" stroke="none" />
              <line x1="22" y1="9" x2="16" y2="15" />
              <line x1="16" y1="9" x2="22" y2="15" />
            </svg>
          ) : (
            // sound on icon — speaker with waves
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor" stroke="none" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </span>
        <span className="hero-sound-label">
          {muted ? "Sound Off" : "Sound On"}
        </span>
      </button>
    </>
  );
}
