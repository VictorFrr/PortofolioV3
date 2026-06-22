// ============================================================
//  SCENE.JS — Interactive 3D node network (Three.js)
//  Reacts to scroll (depth/rotation) and mouse (parallax)
// ============================================================
(function(){
  "use strict";

  if (typeof THREE === "undefined") return;

  const canvas = document.getElementById("scene-canvas");
  if (!canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = window.innerWidth;
  let height = window.innerHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, width/height, 0.1, 100);
  camera.position.set(0, 0, 16);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  /* ----- Build node network ----- */
  const NODE_COUNT = 90;
  const RADIUS = 8.5;
  const nodes = [];

  function getAccentColor(){
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    return theme === "light" ? 0x1f9d55 : 0x4ade80;
  }
  function getLineColor(){
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    return theme === "light" ? 0x1f9d55 : 0x4ade80;
  }

  let accentColor = getAccentColor();

  // Node positions: distributed in an ellipsoid-ish volume, off-center to the right
  for (let i = 0; i < NODE_COUNT; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = RADIUS * (0.45 + Math.random() * 0.55);
    const x = r * Math.sin(phi) * Math.cos(theta) * 1.25;
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.95;
    const z = r * Math.cos(phi) * 0.85;
    nodes.push({
      pos: new THREE.Vector3(x, y, z),
      basePos: new THREE.Vector3(x, y, z),
      phase: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.25,
    });
  }

  // Points geometry
  const pointsGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(NODE_COUNT * 3);
  nodes.forEach((n, i) => { positions[i*3]=n.pos.x; positions[i*3+1]=n.pos.y; positions[i*3+2]=n.pos.z; });
  pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const pointsMat = new THREE.PointsMaterial({
    color: accentColor,
    size: 0.085,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
  });
  const pointCloud = new THREE.Points(pointsGeo, pointsMat);
  scene.add(pointCloud);

  // Connections: connect nodes within a distance threshold, capped
  const MAX_DIST = 3.1;
  const lineVerts = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    let connections = 0;
    for (let j = i + 1; j < NODE_COUNT; j++) {
      if (connections >= 3) break;
      const d = nodes[i].basePos.distanceTo(nodes[j].basePos);
      if (d < MAX_DIST) {
        lineVerts.push(nodes[i].pos.x, nodes[i].pos.y, nodes[i].pos.z);
        lineVerts.push(nodes[j].pos.x, nodes[j].pos.y, nodes[j].pos.z);
        connections++;
      }
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(lineVerts), 3));
  const lineMat = new THREE.LineBasicMaterial({ color: getLineColor(), transparent:true, opacity:0.14 });
  const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineMesh);

  // A few larger "hub" nodes with subtle glow rings
  const hubGroup = new THREE.Group();
  const hubIndices = [];
  for (let k = 0; k < 6; k++) hubIndices.push(Math.floor(Math.random()*NODE_COUNT));
  hubIndices.forEach(idx => {
    const ringGeo = new THREE.RingGeometry(0.16, 0.19, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: accentColor, transparent:true, opacity:0.55, side:THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(nodes[idx].basePos);
    ring.lookAt(camera.position);
    hubGroup.add(ring);
  });
  scene.add(hubGroup);

  /* ----- Container group for whole-scene transforms ----- */
  const group = new THREE.Group();
  group.add(pointCloud, lineMesh, hubGroup);
  group.position.x = 2.6; // bias to the right side, away from text
  scene.add(group);

  /* ----- Mouse parallax ----- */
  let mouseX = 0, mouseY = 0;
  let targetRotX = 0, targetRotY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / width) * 2 - 1;
    mouseY = (e.clientY / height) * 2 - 1;
  }, { passive:true });

  /* ----- Scroll-driven depth & rotation ----- */
  let scrollProgress = 0;
  function updateScroll(){
    const heroHeight = window.innerHeight;
    scrollProgress = Math.min(1, Math.max(0, window.scrollY / heroHeight));
  }
  window.addEventListener("scroll", updateScroll, { passive:true });
  updateScroll();

  /* ----- Resize ----- */
  function onResize(){
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener("resize", onResize);

  /* ----- Theme reactivity ----- */
  window.addEventListener("themechange", () => {
    accentColor = getAccentColor();
    pointsMat.color.setHex(accentColor);
    lineMat.color.setHex(getLineColor());
    hubGroup.children.forEach(r => r.material.color.setHex(accentColor));
  });

  /* ----- Animation loop ----- */
  const clock = new THREE.Clock();
  let visible = true;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { visible = e.isIntersecting; });
  }, { threshold: 0 });
  const heroEl = document.getElementById("hero");
  if (heroEl) io.observe(heroEl);

  function animate(){
    requestAnimationFrame(animate);
    if (!visible) return;

    const t = clock.getElapsedTime();

    // gentle ambient float per-node
    if (!reduceMotion) {
      const posAttr = pointsGeo.attributes.position;
      const linePosAttr = lineGeo.attributes.position;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const fx = Math.sin(t * n.speed + n.phase) * 0.18;
        const fy = Math.cos(t * n.speed * 0.8 + n.phase) * 0.18;
        const fz = Math.sin(t * n.speed * 0.6 + n.phase * 1.3) * 0.18;
        n.pos.set(n.basePos.x + fx, n.basePos.y + fy, n.basePos.z + fz);
        posAttr.array[i*3] = n.pos.x;
        posAttr.array[i*3+1] = n.pos.y;
        posAttr.array[i*3+2] = n.pos.z;
      }
      posAttr.needsUpdate = true;

      // rebuild line endpoints to follow nodes (cheap approximation: skip full rebuild, just nudge whole mesh)
      linePosAttr.needsUpdate = false;
    }

    // mouse parallax — smooth lerp toward target
    targetRotX += (mouseY * 0.18 - targetRotX) * 0.04;
    targetRotY += (mouseX * 0.22 - targetRotY) * 0.04;

    // scroll-driven base rotation + depth push
    const scrollRotY = scrollProgress * Math.PI * 0.35;
    const scrollZ = scrollProgress * 4.5;
    const scrollFade = 1 - scrollProgress * 0.9;

    group.rotation.x = targetRotX + scrollProgress * 0.15;
    group.rotation.y = targetRotY + scrollRotY + t * 0.025;
    group.position.z = -scrollZ;

    pointsMat.opacity = Math.max(0, 0.9 * scrollFade);
    lineMat.opacity = Math.max(0, 0.14 * scrollFade);
    hubGroup.children.forEach(r => { r.material.opacity = Math.max(0, 0.55 * scrollFade); r.lookAt(camera.position); });

    renderer.render(scene, camera);
  }

  // fade in once ready
  requestAnimationFrame(() => {
    canvas.classList.add("ready");
  });

  animate();
})();
