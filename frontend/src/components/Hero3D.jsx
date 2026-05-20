import { useEffect, useRef } from "react";

/**
 * HM Geomatics — hero medallion video.
 * Autoplays muted + loops. Provides both WebM (VP9) and MP4 (H.264) sources
 * for maximum browser compatibility.
 */
export default function Hero3D() {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // `muted` must be set as a property for autoplay on some browsers
    v.muted = true;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    document.addEventListener("visibilitychange", tryPlay);
    return () => document.removeEventListener("visibilitychange", tryPlay);
  }, []);

  return (
    <video
      ref={videoRef}
      className="hero-canvas"
      data-testid="hero-3d-canvas"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
    >
      <source src="/hmgeo-medallion.webm" type="video/webm" />
      <source src="/hmgeo-medallion.mp4" type="video/mp4" />
    </video>
  );
}
