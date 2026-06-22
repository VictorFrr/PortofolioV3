// ============================================================
//  SCENE.JS — Interactive 3D PCB circuit board (Three.js)
//  Orthogonal/45° traces, solder pads, chip components,
//  light pulses traveling the circuit. Reacts to scroll + mouse.
// ============================================================
(function(){
  "use strict";

  const canvas = document.getElementById("scene-canvas");
  if (!canvas) return;

  if (typeof THREE === "undefined") {
    // Three.js failed to load (CDN blocked/offline) — hide the canvas and bail out silently.
    canvas.style.display = "none";
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = window.innerWidth;
  let height = window.innerHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, width/height, 0.1, 100);
  camera.position.set(0, 0, 19);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  function getAccentColor(){
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    return theme === "light" ? 0x1f9d55 : 0x4ade80;
  }
  function getTraceColor(){
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    return theme === "light" ? 0x9fcdb0 : 0x1f4a30;
  }
  function getPadColor(){
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    return theme === "light" ? 0x3a6f4d : 0x2a6b42;
  }

  let accentColor = getAccentColor();

  /* ============================================================
     1. PROCEDURAL PCB GRID GENERATION
     Build a Manhattan-style routing graph: a grid of candidate
     points, then carve "traces" as walks that move horizontally,
     vertically, or diagonally (45°) like real PCB traces.
  ============================================================ */
  const GRID_W = 14;
  const GRID_H = 10;
  const CELL = 1.05;
  const originX = -(GRID_W * CELL) / 2;
  const originY = -(GRID_H * CELL) / 2;

  function gridToWorld(gx, gy, z){
    return new THREE.Vector3(originX + gx*CELL, originY + gy*CELL, z||0);
  }

  // occupancy grid to avoid overlapping traces too much
  const occupied = new Set();
  function key(x,y){ return x+","+y; }

  const DIRS = [
    [1,0],[-1,0],[0,1],[0,-1],   // orthogonal
    [1,1],[1,-1],[-1,1],[-1,-1]  // 45°
  ];

  function randInt(n){ return Math.floor(Math.random()*n); }

  function buildTrace(startX, startY, maxSteps){
    const path = [[startX, startY]];
    occupied.add(key(startX,startY));
    let x = startX, y = startY;
    let lastDir = null;
    let steps = 0;
    while (steps < maxSteps) {
      // bias toward continuing straight, occasionally turn (realistic routing)
      let candidates = DIRS.slice();
      if (lastDir && Math.random() < 0.55) {
        candidates = [lastDir].concat(DIRS.filter(d => d !== lastDir));
      }
      let placed = false;
      for (const d of shuffle(candidates)) {
        const nx = x + d[0], ny = y + d[1];
        if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
        if (occupied.has(key(nx,ny))) continue;
        path.push([nx, ny]);
        occupied.add(key(nx,ny));
        x = nx; y = ny; lastDir = d;
        placed = true;
        steps++;
        break;
      }
      if (!placed) break;
    }
    return path;
  }

  function shuffle(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(i+1);
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  const TRACE_COUNT = 22;
  const traces = []; // each: array of grid points

  for (let i = 0; i < TRACE_COUNT; i++) {
    const sx = randInt(GRID_W), sy = randInt(GRID_H);
    if (occupied.has(key(sx,sy))) continue;
    const len = 4 + randInt(9);
    const path = buildTrace(sx, sy, len);
    if (path.length > 2) traces.push(path);
  }

  /* ============================================================
     2. BUILD GEOMETRY: traces as lines, pads as small discs,
        a few "chip" components as flat boxes at trace endpoints.
  ============================================================ */
  const boardGroup = new THREE.Group();

  // Slight random depth per trace for a layered PCB feel
  const traceZ = traces.map(() => (Math.random() - 0.5) * 1.6);

  // --- Trace lines ---
  const traceLineVerts = [];
  traces.forEach((path, ti) => {
    const z = traceZ[ti];
    for (let i = 0; i < path.length - 1; i++) {
      const a = gridToWorld(path[i][0], path[i][1], z);
      const b = gridToWorld(path[i+1][0], path[i+1][1], z);
      traceLineVerts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  });
  const traceGeo = new THREE.BufferGeometry();
  traceGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(traceLineVerts), 3));
  const traceMat = new THREE.LineBasicMaterial({ color: getTraceColor(), transparent:true, opacity:0.85 });
  const traceLines = new THREE.LineSegments(traceGeo, traceMat);
  boardGroup.add(traceLines);

  // --- Solder pads at every vertex ---
  const padGeo = new THREE.CircleGeometry(0.05, 10);
  const padMat = new THREE.MeshBasicMaterial({ color: getPadColor(), transparent:true, opacity:0.9 });
  const padMesh = new THREE.InstancedMesh(padGeo, padMat, traces.reduce((s,p)=>s+p.length,0));
  let padIdx = 0;
  const dummy = new THREE.Object3D();
  traces.forEach((path, ti) => {
    const z = traceZ[ti];
    path.forEach(([gx,gy]) => {
      const p = gridToWorld(gx, gy, z + 0.01);
      dummy.position.copy(p);
      dummy.lookAt(p.x, p.y, p.z + 1);
      dummy.updateMatrix();
      padMesh.setMatrixAt(padIdx++, dummy.matrix);
    });
  });
  boardGroup.add(padMesh);

  // --- Chip components at some trace endpoints (rectangles with pins look) ---
  const chipGroup = new THREE.Group();
  const chipCount = 7;
  const usedEndpoints = shuffle(traces).slice(0, chipCount);
  usedEndpoints.forEach((path, idx) => {
    const ti = traces.indexOf(path);
    const z = traceZ[ti];
    const [gx, gy] = path[path.length - 1];
    const pos = gridToWorld(gx, gy, z);
    const w = 0.34 + Math.random()*0.3;
    const h = 0.22 + Math.random()*0.22;
    const geo = new THREE.BoxGeometry(w, h, 0.06);
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent:true, opacity:0.55 });
    const chip = new THREE.Mesh(geo, mat);
    chip.position.copy(pos);
    const edges = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({ color: getAccentColor(), transparent:true, opacity:0.5 });
    const wire = new THREE.LineSegments(edges, edgeMat);
    chip.add(wire);
    chipGroup.add(chip);
  });
  boardGroup.add(chipGroup);

  scene.add(boardGroup);

  /* ============================================================
     3. LIGHT PULSES traveling along traces
  ============================================================ */
  const PULSE_COUNT = 16;
  const pulseGeo = new THREE.SphereGeometry(0.055, 8, 8);
  const pulseMat = new THREE.MeshBasicMaterial({ color: accentColor, transparent:true, opacity:1 });
  const pulses = [];

  function makePulse(){
    const trace = traces[randInt(traces.length)];
    const ti = traces.indexOf(trace);
    const z = traceZ[ti];
    const mesh = new THREE.Mesh(pulseGeo, pulseMat.clone());
    boardGroup.add(mesh);
    return {
      mesh,
      trace,
      z,
      segIndex: 0,
      t: Math.random(),
      speed: 0.5 + Math.random()*0.6,
    };
  }
  for (let i = 0; i < PULSE_COUNT; i++) pulses.push(makePulse());

  function updatePulse(p, dt){
    const path = p.trace;
    if (path.length < 2) return;
    p.t += dt * p.speed;
    while (p.t >= 1) {
      p.t -= 1;
      p.segIndex++;
      if (p.segIndex >= path.length - 1) {
        // reached end: respawn on a new (possibly different) trace
        p.trace = traces[randInt(traces.length)];
        p.z = traceZ[traces.indexOf(p.trace)];
        p.segIndex = 0;
      }
    }
    const a = gridToWorld(p.trace[p.segIndex][0], p.trace[p.segIndex][1], p.z);
    const b = gridToWorld(p.trace[p.segIndex+1] ? p.trace[p.segIndex+1][0] : p.trace[p.segIndex][0],
                           p.trace[p.segIndex+1] ? p.trace[p.segIndex+1][1] : p.trace[p.segIndex][1], p.z);
    p.mesh.position.lerpVectors(a, b, p.t);
  }

  /* ============================================================
     4. Container group: position, scale, scroll/mouse transforms
  ============================================================ */
  const group = new THREE.Group();
  group.add(boardGroup);
  group.position.x = 2.8;
  group.rotation.x = -0.25;
  group.rotation.y = 0.35;
  scene.add(group);

  // Subtle point light for the chip wire glow feel (purely additive, cheap)
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  /* ----- Mouse parallax ----- */
  let mouseX = 0, mouseY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / width) * 2 - 1;
    mouseY = (e.clientY / height) * 2 - 1;
  }, { passive:true });
  let targetRotX = -0.25, targetRotY = 0.35;

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
    traceMat.color.setHex(getTraceColor());
    padMat.color.setHex(getPadColor());
    pulses.forEach(p => p.mesh.material.color.setHex(accentColor));
    chipGroup.children.forEach(chip => {
      const wire = chip.children[0];
      if (wire) wire.material.color.setHex(accentColor);
    });
  });

  /* ----- Visibility gating (pause when hero off-screen) ----- */
  let visible = true;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { visible = e.isIntersecting; });
  }, { threshold: 0 });
  const heroEl = document.getElementById("hero");
  if (heroEl) io.observe(heroEl);

  /* ----- Click interaction: gentle "ping" ripple on the board ----- */
  let clickPulseScale = 0;
  window.addEventListener("pointerdown", (e) => {
    if (e.clientX > width * 0.35) clickPulseScale = 1; // only react when clicking near the board side
  }, { passive:true });

  /* ----- Animation loop ----- */
  const clock = new THREE.Clock();
  let lastTime = 0;

  function animate(){
    requestAnimationFrame(animate);
    if (!visible) return;

    const elapsed = clock.getElapsedTime();
    const dt = Math.min(0.05, elapsed - lastTime);
    lastTime = elapsed;

    if (!reduceMotion) {
      pulses.forEach(p => updatePulse(p, dt));
    }

    // mouse parallax — smooth lerp toward target, layered on base tilt
    targetRotX += ((-0.25 + mouseY * 0.16) - targetRotX) * 0.045;
    targetRotY += ((0.35 + mouseX * 0.22) - targetRotY) * 0.045;

    const scrollRotY = scrollProgress * Math.PI * 0.3;
    const scrollZ = scrollProgress * 5.2;
    const scrollFade = 1 - scrollProgress * 0.92;

    group.rotation.x = targetRotX + scrollProgress * 0.18;
    group.rotation.y = targetRotY + scrollRotY;
    group.position.z = -scrollZ;
    group.position.y = scrollProgress * -0.6;

    traceMat.opacity = Math.max(0, 0.85 * scrollFade);
    padMat.opacity = Math.max(0, 0.9 * scrollFade);
    pulses.forEach(p => { p.mesh.material.opacity = Math.max(0, scrollFade); });
    chipGroup.children.forEach(chip => {
      const wire = chip.children[0];
      if (wire) wire.material.opacity = Math.max(0, 0.5 * scrollFade);
      chip.material.opacity = Math.max(0, 0.55 * scrollFade);
    });

    // subtle breathing scale on click-ping
    if (clickPulseScale > 0) {
      clickPulseScale -= dt * 1.6;
      const s = 1 + Math.max(0, clickPulseScale) * 0.015;
      boardGroup.scale.setScalar(s);
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(() => {
    canvas.classList.add("ready");
  });

  animate();
})();
