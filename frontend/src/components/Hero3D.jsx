import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * HM Geomatics — cinematic 3D medallion.
 *
 * Intro timeline (≈4.2s):
 *   0.0 – 1.0s  Particles converge into a ring
 *   1.0 – 2.2s  Gold rim "draws on" as a glowing arc, then closes
 *   2.2 – 3.4s  Face fades in with a specular light sweep
 *   3.4 +       Settles into the slow idle rotation forever
 */
export default function Hero3D() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    let W = parent.clientWidth;
    let H = parent.clientHeight;

    // ---------- Scene ----------
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 0);

    const group = new THREE.Group();
    group.position.y = 0.3;
    scene.add(group);

    // -------- Medallion body (dark) --------
    const discGeom = new THREE.CylinderGeometry(2.04, 2.04, 0.08, 128);
    const discMat = new THREE.MeshPhongMaterial({
      color: 0x080808,
      shininess: 30,
      transparent: true,
      opacity: 0,
    });
    const disc = new THREE.Mesh(discGeom, discMat);
    disc.rotation.x = Math.PI / 2;
    group.add(disc);

    // -------- Front face (logo PNG) --------
    const loader = new THREE.TextureLoader();
    const logoTex = loader.load("/hm-logo.png", (t) => {
      t.anisotropy = 16;
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
    });
    logoTex.anisotropy = 16;

    const faceGeom = new THREE.CircleGeometry(2.04, 128);
    const faceMat = new THREE.MeshBasicMaterial({
      map: logoTex,
      color: 0xffffff,
      toneMapped: false,
      transparent: true,
      opacity: 0,
    });
    const face = new THREE.Mesh(faceGeom, faceMat);
    face.position.z = 0.041;
    group.add(face);

    // -------- Back face (dark) --------
    const backFaceGeom = new THREE.CircleGeometry(2.04, 128);
    const backFaceMat = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      shininess: 20,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
    });
    const backFace = new THREE.Mesh(backFaceGeom, backFaceMat);
    backFace.position.z = -0.041;
    group.add(backFace);

    // -------- Gold rim (animates open arc → closed ring) --------
    // Use TorusGeometry with adjustable arc — recreate each animation tick during intro.
    let rim = new THREE.Mesh(
      new THREE.TorusGeometry(2.08, 0.035, 16, 128, 0.0001),
      new THREE.MeshPhongMaterial({
        color: 0xc9932a,
        shininess: 320,
        specular: 0xffe090,
      }),
    );
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    const replaceRimArc = (arcRad) => {
      const newGeom = new THREE.TorusGeometry(
        2.08,
        0.035,
        16,
        128,
        Math.max(0.0001, arcRad),
      );
      rim.geometry.dispose();
      rim.geometry = newGeom;
    };

    // -------- Specular glint sweep (a tilted bright plane that crosses the face) --------
    const glintGeom = new THREE.PlaneGeometry(0.7, 4.6);
    // Vertical gradient so the strip fades at top/bottom
    const glintCanvas = document.createElement("canvas");
    glintCanvas.width = 64;
    glintCanvas.height = 256;
    {
      const g = glintCanvas.getContext("2d");
      const grad = g.createLinearGradient(0, 0, 64, 0);
      grad.addColorStop(0.0, "rgba(255,255,255,0)");
      grad.addColorStop(0.5, "rgba(255,245,200,0.85)");
      grad.addColorStop(1.0, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 256);
    }
    const glintTex = new THREE.CanvasTexture(glintCanvas);
    const glintMat = new THREE.MeshBasicMaterial({
      map: glintTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glint = new THREE.Mesh(glintGeom, glintMat);
    glint.rotation.z = -0.4; // diagonal sweep
    glint.position.z = 0.08;
    glint.position.x = -4;
    group.add(glint);

    // -------- Converging particles (intro phase A) --------
    const PARTICLES = 240;
    const partGeom = new THREE.BufferGeometry();
    const partPos = new Float32Array(PARTICLES * 3);
    const partStart = []; // remembered start radii / angles for animation
    for (let i = 0; i < PARTICLES; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 4; // start far out
      partStart.push({ a, r0: r, jitter: Math.random() });
      partPos[i * 3] = Math.cos(a) * r;
      partPos[i * 3 + 1] = Math.sin(a) * r;
      partPos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    }
    partGeom.setAttribute("position", new THREE.BufferAttribute(partPos, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0xc9932a,
      size: 0.04,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(partGeom, partMat);
    group.add(particles);

    // -------- Background star field (stays through idle) --------
    const sPos = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      sPos[i * 3] = (Math.random() - 0.5) * 22;
      sPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      sPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 4;
    }
    const sGeom = new THREE.BufferGeometry();
    sGeom.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    const stars = new THREE.Points(
      sGeom,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.025,
        transparent: true,
        opacity: 0.22,
      }),
    );
    scene.add(stars);

    // ---------- Lighting ----------
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    const keyLight = new THREE.PointLight(0xffd88a, 3.0, 25);
    keyLight.position.set(5, 6, 7);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x8090cc, 0.9, 20);
    fillLight.position.set(-6, -3, 4);
    scene.add(fillLight);

    const goldLight = new THREE.PointLight(0xc9932a, 1.8, 18);
    goldLight.position.set(0, -6, 4);
    scene.add(goldLight);

    const backLight = new THREE.PointLight(0xffffff, 0.5, 20);
    backLight.position.set(0, 0, -5);
    scene.add(backLight);

    // ---------- Timeline helpers ----------
    const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
    const easeInOutCubic = (x) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    // Initial group state (small + spinning fast)
    group.scale.setScalar(0.4);
    group.rotation.z = -Math.PI;

    const start = performance.now();

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const elapsed = (performance.now() - start) / 1000; // seconds

      // ============ Phase A: particles converge (0 – 1.0s) ============
      const aT = clamp01(elapsed / 1.0);
      const aE = easeInOutCubic(aT);
      const arr = partGeom.attributes.position.array;
      for (let i = 0; i < PARTICLES; i++) {
        const s = partStart[i];
        const r = s.r0 * (1 - aE); // shrink toward 0
        const swirl = aE * Math.PI * 2.5; // spiral inward
        arr[i * 3] = Math.cos(s.a + swirl) * r;
        arr[i * 3 + 1] = Math.sin(s.a + swirl) * r;
      }
      partGeom.attributes.position.needsUpdate = true;
      partMat.opacity = 0.9 * (1 - aT * 0.55); // fade slightly

      // ============ Phase B: medallion body + rim arc draw (0.7 – 2.2s) ============
      const bT = clamp01((elapsed - 0.7) / 1.5);
      const bE = easeOutCubic(bT);
      // body fades in
      discMat.opacity = bE;
      backFaceMat.opacity = bE;
      // rim arc draws from 0 → 2π
      replaceRimArc(bE * Math.PI * 2);

      // ============ Phase C: face fade-in + light sweep (2.0 – 3.4s) ============
      const cT = clamp01((elapsed - 2.0) / 1.4);
      const cE = easeOutCubic(cT);
      faceMat.opacity = cE;

      // glint sweep across the face (only during phase C)
      if (cT > 0 && cT < 1) {
        const sweep = cT; // 0 → 1
        glint.position.x = -3 + sweep * 6; // travel left → right across face
        // brightness peaks at midpoint
        glintMat.opacity = Math.sin(sweep * Math.PI) * 0.95;
      } else {
        glintMat.opacity = 0;
      }

      // ============ Phase D: idle settle (everything after) ============
      // Group scale from 0.4 → 1.0 across full intro
      const introT = clamp01(elapsed / 3.2);
      const introE = easeOutCubic(introT);
      group.scale.setScalar(0.4 + introE * 0.6);

      // Z-rotation: fast spin during intro, slow forever afterwards
      // During intro, ease the rotation in from large angle
      const introRot = (1 - introE) * -Math.PI * 1.5; // unwind from -3π/2
      const idleRot = elapsed * 0.25; // ~0.04 rev/s (luxury pace)
      group.rotation.z = introRot + idleRot;

      // After intro, gently wobble + float
      if (elapsed > 3.0) {
        const t2 = elapsed - 3.0;
        const blend = clamp01(t2 / 0.8); // ease wobble in
        group.rotation.y = Math.sin(t2 * 0.28) * 0.28 * blend;
        group.position.y = 0.3 + Math.sin(t2 * 0.55) * 0.11 * blend;
      } else {
        group.rotation.y = 0;
        group.position.y = 0.3;
      }

      // Hide particles after they've converged
      if (elapsed > 1.4 && particles.visible) {
        particles.visible = false;
      }

      stars.rotation.z = elapsed * 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // ---------- Resize ----------
    const onResize = () => {
      W = parent.clientWidth;
      H = parent.clientHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // ---------- Cleanup ----------
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
      discGeom.dispose();
      faceGeom.dispose();
      backFaceGeom.dispose();
      rim.geometry.dispose();
      glintGeom.dispose();
      partGeom.dispose();
      sGeom.dispose();
      logoTex.dispose();
      glintTex.dispose();
      discMat.dispose();
      faceMat.dispose();
      backFaceMat.dispose();
      rim.material.dispose();
      glintMat.dispose();
      partMat.dispose();
      stars.material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hero-canvas"
      data-testid="hero-3d-canvas"
    />
  );
}
