/* ============================================================
   SCENE.JS — Three.js hero 3D scene
   Icosahedron that reacts to:
     • scroll  → slow rotation + slight scale-down as page scrolls
     • mouse   → gentle tilt toward cursor (parallax feel)
   Aesthetic: soft wireframe edges with glowing vertex points,
   muted teal palette — matches the "soft" design system.
   ============================================================ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js';

/* ── helpers ── */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ── init ── */
const mount  = document.getElementById('heroScene');
if (!mount) throw new Error('heroScene mount not found');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
mount.appendChild(renderer.domElement);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0, 5.2);

/* ── palette (synced with CSS) ── */
function palette() {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    edge:   dark ? 0x8fc9bb : 0x3e6259,
    vertex: dark ? 0xc8e8e0 : 0x2a4d45,
    glow:   dark ? 0x5aada0 : 0x4d8577,
    edgeAlpha:   dark ? 0.28 : 0.22,
    vertexAlpha: dark ? 0.75 : 0.65,
  };
}

/* ── geometry ── */
const radius  = 1.55;
const geo     = new THREE.IcosahedronGeometry(radius, 1);

// Wireframe — subtle lines
const edgeGeo = new THREE.EdgesGeometry(geo);
let pal = palette();

const wireMat = new THREE.LineBasicMaterial({
  color:       pal.edge,
  transparent: true,
  opacity:     pal.edgeAlpha,
  blending:    THREE.AdditiveBlending,
  depthWrite:  false,
});
const wire = new THREE.LineSegments(edgeGeo, wireMat);
scene.add(wire);

// Vertex dots — glowing points
const posAttr = geo.attributes.position;
const uniqueVerts = [];
const seen = new Set();
for (let i = 0; i < posAttr.count; i++) {
  const x = +posAttr.getX(i).toFixed(4);
  const y = +posAttr.getY(i).toFixed(4);
  const z = +posAttr.getZ(i).toFixed(4);
  const key = `${x},${y},${z}`;
  if (!seen.has(key)) { seen.add(key); uniqueVerts.push(x, y, z); }
}
const dotGeo  = new THREE.BufferGeometry();
dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(uniqueVerts, 3));
const dotMat  = new THREE.PointsMaterial({
  color:       pal.vertex,
  size:        0.055,
  transparent: true,
  opacity:     pal.vertexAlpha,
  sizeAttenutaionByDistance: true,
  blending:    THREE.AdditiveBlending,
  depthWrite:  false,
});
const dots = new THREE.Points(dotGeo, dotMat);
scene.add(dots);

// Subtle inner glow sphere
const glowGeo = new THREE.SphereGeometry(radius * 0.72, 32, 24);
const glowMat = new THREE.MeshBasicMaterial({
  color:       pal.glow,
  transparent: true,
  opacity:     0.04,
  wireframe:   false,
  blending:    THREE.AdditiveBlending,
  depthWrite:  false,
});
const glow = new THREE.Mesh(glowGeo, glowMat);
scene.add(glow);

/* ── resize ── */
function resize() {
  const w = mount.clientWidth;
  const h = mount.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();
const ro = new ResizeObserver(resize);
ro.observe(mount);

/* ── state ── */
const mouse   = { x: 0, y: 0 };   // normalised -1..1
let   scrollT = 0;                 // 0..1 scroll progress through hero
let   tiltX   = 0, tiltY = 0;     // smoothed rotation targets
let   autoRot = 0;                 // slow auto-rotation angle

/* ── mouse tracking ── */
const hero = document.getElementById('hero');
function onMove(e) {
  const r = mount.getBoundingClientRect();
  mouse.x = clamp((e.clientX - r.left) / r.width  * 2 - 1, -1, 1);
  mouse.y = clamp((e.clientY - r.top)  / r.height * 2 - 1, -1, 1);
}
window.addEventListener('mousemove', onMove, { passive: true });
// touch tilt
window.addEventListener('touchmove', e => {
  const t = e.touches[0];
  const r = mount.getBoundingClientRect();
  mouse.x = clamp((t.clientX - r.left) / r.width  * 2 - 1, -1, 1);
  mouse.y = clamp((t.clientY - r.top)  / r.height * 2 - 1, -1, 1);
}, { passive: true });

/* ── scroll tracking ── */
function updateScroll() {
  const heroH = mount.parentElement.clientHeight || window.innerHeight;
  scrollT = clamp(window.scrollY / heroH, 0, 1);
}
window.addEventListener('scroll', updateScroll, { passive: true });
updateScroll();

/* ── theme change ── */
window.addEventListener('themechange', () => {
  pal = palette();
  wireMat.color.set(pal.edge);
  wireMat.opacity = pal.edgeAlpha;
  dotMat.color.set(pal.vertex);
  dotMat.opacity = pal.vertexAlpha;
  glowMat.color.set(pal.glow);
});

/* ── render loop ── */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  autoRot += dt * 0.18;                             // slow idle spin

  // Parallax tilt from mouse (gentle)
  const targetTiltY =  mouse.x * 0.45;
  const targetTiltX = -mouse.y * 0.32;
  tiltX = lerp(tiltX, targetTiltX, 1 - Math.pow(0.04, dt));
  tiltY = lerp(tiltY, targetTiltY, 1 - Math.pow(0.04, dt));

  // Compose rotation: auto-spin + tilt
  wire.rotation.y = autoRot + tiltY;
  wire.rotation.x = tiltX;
  dots.rotation.copy(wire.rotation);
  glow.rotation.copy(wire.rotation);

  // Scale + opacity fade as user scrolls past hero
  const sc = lerp(1, 0.72, scrollT);
  wire.scale.setScalar(sc);
  dots.scale.setScalar(sc);
  glow.scale.setScalar(sc);
  wireMat.opacity = lerp(pal.edgeAlpha,   0.0, scrollT * 1.4);
  dotMat.opacity  = lerp(pal.vertexAlpha, 0.0, scrollT * 1.4);
  glowMat.opacity = lerp(0.04,            0.0, scrollT * 1.4);

  // Camera drift — very subtle breathe
  const t = clock.getElapsedTime();
  camera.position.y = Math.sin(t * 0.2) * 0.04;
  camera.position.x = Math.cos(t * 0.14) * 0.025;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

animate();
