import { useEffect, useRef } from "react";

/**
 * HM Geomatics — hero emergence video (looping, autoplay muted).
 */
export default function HeroVideo() {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    document.addEventListener("visibilitychange", tryPlay);
    return () => document.removeEventListener("visibilitychange", tryPlay);
  }, []);

  return (
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
  );
}
