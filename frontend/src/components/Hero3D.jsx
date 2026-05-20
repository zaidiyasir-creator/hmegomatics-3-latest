import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * HM Geomatics rotating 3D medallion.
 * Uses the official HM logo PNG (/hm-logo.png) as the medallion face texture.
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

    // medallion body (thinner cylinder for subtle thickness)
    const discGeom = new THREE.CylinderGeometry(2.04, 2.04, 0.08, 128);
    const disc = new THREE.Mesh(
      discGeom,
      new THREE.MeshPhongMaterial({ color: 0x080808, shininess: 30 }),
    );
    disc.rotation.x = Math.PI / 2;
    group.add(disc);

    // front face plane — loads /hm-logo.png as texture
    const loader = new THREE.TextureLoader();
    const logoTex = loader.load("/hm-logo.png", (t) => {
      t.anisotropy = 16;
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
    });
    logoTex.anisotropy = 16;

    const faceGeom = new THREE.CircleGeometry(2.04, 128);
    const face = new THREE.Mesh(
      faceGeom,
      new THREE.MeshBasicMaterial({
        map: logoTex,
        color: 0xffffff,
        toneMapped: false,
      }),
    );
    face.position.z = 0.041;
    group.add(face);

    // back face — solid dark
    const backFaceGeom = new THREE.CircleGeometry(2.04, 128);
    const backFace = new THREE.Mesh(
      backFaceGeom,
      new THREE.MeshPhongMaterial({
        color: 0x0a0a0a,
        shininess: 20,
        side: THREE.BackSide,
      }),
    );
    backFace.position.z = -0.091;
    group.add(backFace);

    // gold outer rim — sits just outside the medallion face
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(2.08, 0.035, 16, 128),
      new THREE.MeshPhongMaterial({
        color: 0xc9932a,
        shininess: 320,
        specular: 0xffe090,
      }),
    );
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

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

    // ---------- Animate ----------
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
      pGeom.dispose();
      logoTex.dispose();
      disc.material.dispose();
      face.material.dispose();
      backFace.material.dispose();
      rim.material.dispose();
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
