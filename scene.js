// ============================================================
//  SCENE.JS — Persistent 3D PCB background (Three.js)
//  Fixed full-page canvas. A camera flies through a long PCB
//  tunnel as the user scrolls the ENTIRE page, not just the hero.
//  Tube traces (real thickness), raised vias, light pulses.
// ============================================================
(function(){
  "use strict";

  const canvas = document.getElementById("scene-canvas");
  if (!canvas) return;

  if (typeof THREE === "undefined") {
    canvas.style.display = "none";
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = window.innerWidth;
  let height = window.innerHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, width/height, 0.1, 200);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  function getAccentColor(){
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    return theme === "light" ? 0x1f9d55 : 0x4ade80;
  }
  function getTraceColor(){
    return 0xc89b3c; // copper/gold trace color — consistent across themes, reads as "real PCB"
  }
  function getBoardColor(){
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    return theme === "light" ? 0xd8e3da : 0x0c1f14; // classic PCB green-black
  }
  function getViaColor(){
    return 0xc7ccc8; // silver via, consistent across themes
  }

  let accentColor = getAccentColor();

  /* ============================================================
     1. PROCEDURAL PCB SEGMENTS ALONG A "TUNNEL"
     The board is built as a sequence of panels stacked along Z.
     Each panel is its own Manhattan-routed mini circuit. The
     camera flies forward through Z as the page scrolls, so the
     PCB feels endless and is present through the whole page.
  ============================================================ */
  const GRID_W = 11;
  const GRID_H = 8;
  const CELL = 1.0;
  const PANEL_COUNT = 7;       // roughly one per page section
  const PANEL_DEPTH = 14;      // z-distance between panel centers

  function gridToLocal(gx, gy){
    const ox = -(GRID_W * CELL) / 2;
    const oy = -(GRID_H * CELL) / 2;
    return new THREE.Vector2(ox + gx*CELL, oy + gy*CELL);
  }

  const DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  function randInt(n){ return Math.floor(Math.random()*n); }
  function shuffle(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(i+1);
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function buildPanelTraces(){
    const occupied = new Set();
    const key = (x,y) => x+","+y;
    function buildTrace(startX, startY, maxSteps){
      const path = [[startX, startY]];
      occupied.add(key(startX,startY));
      let x = startX, y = startY, lastDir = null, steps = 0;
      while (steps < maxSteps) {
        let candidates = DIRS.slice();
        if (lastDir && Math.random() < 0.6) candidates = [lastDir].concat(DIRS.filter(d => d !== lastDir));
        let placed = false;
        for (const d of shuffle(candidates)) {
          const nx = x + d[0], ny = y + d[1];
          if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
          if (occupied.has(key(nx,ny))) continue;
          path.push([nx, ny]);
          occupied.add(key(nx,ny));
          x = nx; y = ny; lastDir = d; placed = true; steps++;
          break;
        }
        if (!placed) break;
      }
      return path;
    }
    const traces = [];
    const TRACE_TRIES = 16;
    for (let i = 0; i < TRACE_TRIES; i++) {
      const sx = randInt(GRID_W), sy = randInt(GRID_H);
      if (occupied.has(key(sx,sy))) continue;
      const len = 3 + randInt(7);
      const path = buildTrace(sx, sy, len);
      if (path.length > 2) traces.push(path);
    }
    return traces;
  }

  /* ----- Shared materials ----- */
  const traceMat = new THREE.MeshBasicMaterial({ color: getTraceColor(), transparent:true, opacity:0.95 });
  const traceMatThin = new THREE.MeshBasicMaterial({ color: getTraceColor(), transparent:true, opacity:0.7 });
  const viaMat = new THREE.MeshBasicMaterial({ color: getViaColor(), transparent:true, opacity:0.95 });
  const boardMat = new THREE.MeshBasicMaterial({ color: getBoardColor(), transparent:true, opacity:0.55, side: THREE.DoubleSide });
  const chipBodyMat = new THREE.MeshBasicMaterial({ color: 0x05070a, transparent:true, opacity:0.85 });
  const chipEdgeMat = new THREE.MeshBasicMaterial({ color: accentColor, transparent:true, opacity:0.6 });

  const tubeGeoCache = {};
  function getTubeGeo(radius){
    const k = radius.toFixed(3);
    if (!tubeGeoCache[k]) tubeGeoCache[k] = new THREE.CylinderGeometry(radius, radius, 1, 6);
    return tubeGeoCache[k];
  }
  const viaGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.16, 8);
  const boardPanelGeo = new THREE.PlaneGeometry(GRID_W*CELL*1.15, GRID_H*CELL*1.15);

  function placeSegmentBetween(parent, geoBase, p1, p2, mat){
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    if (len < 0.001) return;
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const mesh = new THREE.Mesh(geoBase, mat);
    mesh.scale.set(1, len, 1);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
    parent.add(mesh);
  }

  const panelsGroup = new THREE.Group();
  const allPulseSets = [];

  for (let pi = 0; pi < PANEL_COUNT; pi++) {
    const panel = new THREE.Group();
    const z = -pi * PANEL_DEPTH;
    panel.position.z = z;

    const board = new THREE.Mesh(boardPanelGeo, boardMat);
    board.position.z = -0.08;
    panel.add(board);

    const traces = buildPanelTraces();

    traces.forEach((path, ti) => {
      const radius = (ti % 3 === 0) ? 0.045 : 0.026;
      const mat = (ti % 3 === 0) ? traceMat : traceMatThin;
      const geo = getTubeGeo(radius);
      for (let i = 0; i < path.length - 1; i++) {
        const a2 = gridToLocal(path[i][0], path[i][1]);
        const b2 = gridToLocal(path[i+1][0], path[i+1][1]);
        const a = new THREE.Vector3(a2.x, a2.y, 0);
        const b = new THREE.Vector3(b2.x, b2.y, 0);
        placeSegmentBetween(panel, geo, a, b, mat);
      }
      path.forEach(([gx,gy], i) => {
        if (i === 0 || i === path.length-1 || i % 2 === 0) {
          const v = gridToLocal(gx, gy);
          const via = new THREE.Mesh(viaGeo, viaMat);
          via.position.set(v.x, v.y, 0.05);
          via.rotation.x = Math.PI/2;
          panel.add(via);
        }
      });
    });

    const chipGroup = new THREE.Group();
    const chipPicks = shuffle(traces).slice(0, 4);
    chipPicks.forEach(path => {
      const [gx,gy] = path[path.length-1];
      const v = gridToLocal(gx, gy);
      const w = 0.5 + Math.random()*0.4;
      const h = 0.32 + Math.random()*0.26;
      const geo = new THREE.BoxGeometry(w, h, 0.1);
      const body = new THREE.Mesh(geo, chipBodyMat);
      body.position.set(v.x, v.y, 0.1);
      const edges = new THREE.EdgesGeometry(geo);
      const wire = new THREE.LineSegments(edges, chipEdgeMat);
      body.add(wire);
      chipGroup.add(body);
    });
    panel.add(chipGroup);

    const pulses = [];
    const pulseGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const pulseCount = 5;
    for (let k = 0; k < pulseCount && traces.length; k++) {
      const trace = traces[randInt(traces.length)];
      const mesh = new THREE.Mesh(pulseGeo, new THREE.MeshBasicMaterial({ color: accentColor, transparent:true, opacity:1 }));
      panel.add(mesh);
      pulses.push({ mesh, trace, segIndex:0, t:Math.random(), speed:0.45 + Math.random()*0.5 });
    }
    allPulseSets.push(pulses);

    panelsGroup.add(panel);
  }

  scene.add(panelsGroup);

  function updatePulse(p, dt){
    const path = p.trace;
    if (!path || path.length < 2) return;
    p.t += dt * p.speed;
    while (p.t >= 1) {
      p.t -= 1;
      p.segIndex++;
      if (p.segIndex >= path.length - 1) p.segIndex = 0;
    }
    const a2 = gridToLocal(path[p.segIndex][0], path[p.segIndex][1]);
    const nextIdx = Math.min(p.segIndex+1, path.length-1);
    const b2 = gridToLocal(path[nextIdx][0], path[nextIdx][1]);
    p.mesh.position.set(
      a2.x + (b2.x - a2.x) * p.t,
      a2.y + (b2.y - a2.y) * p.t,
      0.08
    );
  }

  /* ============================================================
     2. CAMERA FLIGHT — driven by total page scroll
  ============================================================ */
  const totalDepth = PANEL_DEPTH * (PANEL_COUNT - 1);

  function getDocScrollProgress(){
    const doc = document.documentElement;
    const max = (doc.scrollHeight - window.innerHeight) || 1;
    return Math.min(1, Math.max(0, window.scrollY / max));
  }

  let mouseX = 0, mouseY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / width) * 2 - 1;
    mouseY = (e.clientY / height) * 2 - 1;
  }, { passive:true });

  let scrollProgress = 0;
  function updateScroll(){ scrollProgress = getDocScrollProgress(); }
  window.addEventListener("scroll", updateScroll, { passive:true });
  updateScroll();

  function onResize(){
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener("resize", onResize);

  window.addEventListener("themechange", () => {
    accentColor = getAccentColor();
    viaMat.color.setHex(getViaColor());
    boardMat.color.setHex(getBoardColor());
    chipEdgeMat.color.setHex(accentColor);
    allPulseSets.forEach(set => set.forEach(p => p.mesh.material.color.setHex(accentColor)));
  });

  let tabVisible = true;
  document.addEventListener("visibilitychange", () => { tabVisible = !document.hidden; });

  const clock = new THREE.Clock();
  let lastTime = 0;
  const lookTarget = new THREE.Vector3();

  function animate(){
    requestAnimationFrame(animate);
    if (!tabVisible) return;

    const elapsed = clock.getElapsedTime();
    const dt = Math.min(0.05, elapsed - lastTime);
    lastTime = elapsed;

    if (!reduceMotion) {
      allPulseSets.forEach(set => set.forEach(p => updatePulse(p, dt)));
    }

    const flightZ = scrollProgress * totalDepth;
    const targetCamX = 2.4 + mouseX * 0.6;
    const targetCamY = -0.2 + mouseY * 0.4;

    camera.position.x += (targetCamX - camera.position.x) * 0.05;
    camera.position.y += (targetCamY - camera.position.y) * 0.05;
    camera.position.z += (-flightZ - camera.position.z) * 0.08;

    lookTarget.set(camera.position.x - 1.4, camera.position.y * 0.3, camera.position.z - 10);
    camera.lookAt(lookTarget);

    // hide panels far from the camera to keep rendering cheap
    panelsGroup.children.forEach((panel) => {
      const dz = Math.abs(panel.position.z - camera.position.z);
      panel.visible = dz < PANEL_DEPTH * 2.2;
    });

    renderer.render(scene, camera);
  }

  requestAnimationFrame(() => { canvas.classList.add("ready"); });
  animate();
})();
