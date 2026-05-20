import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * HM Geomatics rotating 3D medallion.
 * Self-contained — mounts a Three.js scene inside the ref'd canvas.
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

    // --------- Canvas texture (HM medallion face) ---------
    const ts = 1024,
      cx = 512,
      cy = 512;
    const tc = document.createElement("canvas");
    tc.width = ts;
    tc.height = ts;
    const ctx = tc.getContext("2d");

    // dark disc base
    ctx.fillStyle = "#0D0D0D";
    ctx.beginPath();
    ctx.arc(cx, cy, 500, 0, Math.PI * 2);
    ctx.fill();

    // silver outer ring
    ctx.strokeStyle = "#A0A0A0";
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.arc(cx, cy, 448, 0, Math.PI * 2);
    ctx.stroke();

    // inner accent ring (subtle gold)
    ctx.strokeStyle = "rgba(180,160,100,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 408, 0, Math.PI * 2);
    ctx.stroke();

    // gold diagonal swoosh
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.38);
    ctx.strokeStyle = "#C9932A";
    ctx.lineWidth = 52;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.ellipse(0, 0, 368, 290, 0, 0.25, Math.PI + 0.25);
    ctx.stroke();
    ctx.restore();

    // H — gold (right-aligned, slightly left of centre)
    ctx.font = 'bold 230px Georgia, "Cormorant Garamond", serif';
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.fillStyle = "#C9932A";
    ctx.fillText("H", cx - 8, cy + 18);

    // M — silver (left-aligned)
    ctx.fillStyle = "#B0B0B0";
    ctx.textAlign = "left";
    ctx.fillText("M", cx + 8, cy + 18);

    // subtle gold edge glow
    ctx.strokeStyle = "rgba(201,147,42,0.10)";
    ctx.lineWidth = 70;
    ctx.beginPath();
    ctx.arc(cx, cy, 480, 0, Math.PI * 2);
    ctx.stroke();

    const logoTex = new THREE.CanvasTexture(tc);
    logoTex.anisotropy = 16;

    // --------- Scene ---------
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

    // medallion disc body — dark cylinder for thickness
    const discGeom = new THREE.CylinderGeometry(2.05, 2.05, 0.18, 128);
    const disc = new THREE.Mesh(
      discGeom,
      new THREE.MeshPhongMaterial({ color: 0x1a1208, shininess: 80 }),
    );
    disc.rotation.x = Math.PI / 2;
    group.add(disc);

    // front face plane with HM logo (proper UV orientation)
    const faceGeom = new THREE.CircleGeometry(2.04, 128);
    const face = new THREE.Mesh(
      faceGeom,
      new THREE.MeshPhongMaterial({ map: logoTex, shininess: 60 }),
    );
    face.position.z = 0.091;
    group.add(face);

    // back face — solid dark
    const backFace = new THREE.Mesh(
      new THREE.CircleGeometry(2.04, 128),
      new THREE.MeshPhongMaterial({ color: 0x0a0a0a, shininess: 20, side: THREE.BackSide }),
    );
    backFace.position.z = -0.091;
    group.add(backFace);

    // gold rim
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(2.05, 0.055, 16, 128),
      new THREE.MeshPhongMaterial({
        color: 0xc9932a,
        shininess: 320,
        specular: 0xffe090,
      }),
    );
    rim.rotation.x = -Math.PI / 2;
    group.add(rim);

    // inner accent ring
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.72, 0.022, 12, 100),
      new THREE.MeshPhongMaterial({
        color: 0xc9932a,
        shininess: 200,
        transparent: true,
        opacity: 0.6,
      }),
    );
    ring2.rotation.x = -Math.PI / 2;
    group.add(ring2);

    // star field
    const pPos = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 22;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 4;
    }
    const pGeom = new THREE.BufferGeometry();
    pGeom.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const stars = new THREE.Points(
      pGeom,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.025,
        transparent: true,
        opacity: 0.22,
      }),
    );
    scene.add(stars);

    // --------- Lighting ---------
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

    // --------- Animate ---------
    let t = 0;
    let rotZ = 0;
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      t += 0.01;
      rotZ += 0.0025;
      group.rotation.z = rotZ;
      group.rotation.y = Math.sin(t * 0.28) * 0.28;
      group.position.y = 0.3 + Math.sin(t * 0.55) * 0.11;
      stars.rotation.z = t * 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // --------- Resize ---------
    const onResize = () => {
      W = parent.clientWidth;
      H = parent.clientHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // --------- Cleanup ---------
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
      discGeom.dispose();
      faceGeom.dispose();
      backFace.geometry.dispose();
      rim.geometry.dispose();
      ring2.geometry.dispose();
      pGeom.dispose();
      logoTex.dispose();
      disc.material.dispose();
      face.material.dispose();
      backFace.material.dispose();
      rim.material.dispose();
      ring2.material.dispose();
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
