import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * HM Geomatics — 3D medallion (GLB model).
 * Loads /hmgeo3d.glb, auto-fits the camera, plays any embedded animation,
 * and adds a gentle continuous rotation.
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
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 1000);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // ---------- Lighting (luxury / warm gold key) ----------
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const keyLight = new THREE.DirectionalLight(0xffd88a, 2.4);
    keyLight.position.set(5, 6, 7);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8090cc, 0.7);
    fillLight.position.set(-6, -3, 4);
    scene.add(fillLight);

    const goldRim = new THREE.PointLight(0xc9932a, 3.0, 28);
    goldRim.position.set(0, -4, 6);
    scene.add(goldRim);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
    backLight.position.set(0, 0, -8);
    scene.add(backLight);

    // ---------- Container group for animation ----------
    const group = new THREE.Group();
    scene.add(group);

    // ---------- Load GLB ----------
    let mixer = null;
    let disposed = false;
    const loader = new GLTFLoader();
    loader.load(
      "/hmgeo3d.glb",
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;

        // Centre + scale-to-fit
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const centre = box.getCenter(new THREE.Vector3());
        model.position.sub(centre); // centre at origin

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetSize = 4.2; // fits comfortably in 38° FOV at z=10
        const scale = targetSize / maxDim;
        model.scale.setScalar(scale);

        group.add(model);

        // Play any embedded clips
        if (gltf.animations && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        }
      },
      undefined,
      (err) => {
        console.error("GLB load error:", err);
      },
    );

    // ---------- Animate ----------
    const clock = new THREE.Clock();
    let t = 0;
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      t += dt;
      if (mixer) mixer.update(dt);

      // gentle continuous rotation + light bob
      group.rotation.y = t * 0.35;
      group.position.y = Math.sin(t * 0.6) * 0.12;

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
      disposed = true;
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            Object.values(m).forEach((v) => {
              if (v && v.isTexture) v.dispose();
            });
            m.dispose?.();
          });
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hero-canvas hero-3d"
      data-testid="hero-3d-canvas"
      aria-hidden="true"
    />
  );
}
