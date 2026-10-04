'use strict';
// THINKING IT — Chapter 1: Arrival.
// "It" is drawn to whatever you pay attention to. Looking makes it real.

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const pick = a => a[(Math.random() * a.length) | 0];
const smooth = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };

// ---------- Three.js setup ----------
const C = 2, WALL_H = 3.2, EYE = 1.65;
const renderer = new THREE.WebGLRenderer({ canvas: $('game'), antialias: true, powerPreference: 'high-performance' });
renderer.setClearColor(0x000000);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const MAX_ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 3, 22);
const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 80);
camera.rotation.order = 'YXZ';
scene.add(camera);
const flash = new THREE.SpotLight(0xfff0d8, 2.2, 18, 0.42, 0.6, 1.4);
flash.castShadow = true; flash.shadow.mapSize.set(1024, 1024); flash.shadow.camera.near = 0.1; flash.shadow.bias = -0.0015;
flash.position.set(0.15, -0.12, 0);
camera.add(flash); camera.add(flash.target);
flash.target.position.set(0, -0.1, -4);
const hemi = new THREE.HemisphereLight(0x6a7480, 0x101014, 0.06);
scene.add(hemi);

const hud = $('hud'), hctx = hud.getContext('2d');
// Soft glow around lamps and bright things (falls back to a plain render if the add-on scripts didn't load)
let composer = null;
if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.6, 0.8));
}
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  if (composer) { composer.setPixelRatio && composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight); }
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  hud.width = innerWidth; hud.height = innerHeight;
}
addEventListener('resize', resize);
resize();

// ---------- Textures ----------
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = MAX_ANISO;   // smooth, not pixelated
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function noiseFill(g, w, h, base, amt) {
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
    const n = (Math.random() - 0.5) * amt;
    g.fillStyle = `rgb(${base[0] + n | 0},${base[1] + n | 0},${base[2] + n | 0})`; g.fillRect(x, y, 2, 2);
  }
}
const stains = (g, w, h, n) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(40,32,20,${0.08 + Math.random() * 0.15})`;
    g.fillRect(Math.random() * w, Math.random() * h * 0.4, 2 + Math.random() * 4, 20 + Math.random() * 60);
  }
};
const TX = {
  // institutional pale green paint over a darker band, water stains running down
  wall: canvasTex(64, 96, (g, w, h) => {
    noiseFill(g, w, h, [150, 162, 146], 14);
    g.fillStyle = '#4e5a4c'; g.fillRect(0, 62, w, 34);
    g.fillStyle = '#2e342c'; g.fillRect(0, 60, w, 2);
    stains(g, w, h, 6);
    g.fillStyle = 'rgba(0,0,0,0.15)'; for (let y = 0; y < 60; y += 12) g.fillRect(0, y, w, 1);
  }),
  // something scratched into the paint: a crude bear, over and over, and a word
  trace: canvasTex(64, 96, (g, w, h) => {
    noiseFill(g, w, h, [150, 162, 146], 14);
    g.fillStyle = '#4e5a4c'; g.fillRect(0, 62, w, 34);
    stains(g, w, h, 4);
    g.strokeStyle = 'rgba(240,240,232,0.85)'; g.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const ox = 6 + i * 18, oy = 14 + (i % 2) * 18;
      g.beginPath(); g.ellipse(ox + 8, oy + 10, 7, 5, 0, 0, 7); g.stroke();             // body
      g.beginPath(); g.arc(ox + 14, oy + 3, 3, 0, 7); g.stroke();                        // head
      for (const lx of [3, 7, 10, 13]) { g.beginPath(); g.moveTo(ox + lx, oy + 14); g.lineTo(ox + lx, oy + 19); g.stroke(); }
    }
    g.fillStyle = 'rgba(240,240,232,0.8)'; g.font = '8px monospace'; g.fillText("DON'T", 18, 56);
  }),
  floor: canvasTex(64, 64, (g, w, h) => {
    noiseFill(g, w, h, [92, 90, 84], 12);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(32, 0, 1, h); g.fillRect(0, 32, w, 1);
    for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(30,24,16,0.25)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 4 + Math.random() * 8, 3 + Math.random() * 5, 0, 0, 7); g.fill(); }
  }, true),
  ceil: canvasTex(64, 64, (g, w, h) => {
    noiseFill(g, w, h, [120, 120, 114], 10);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h);
    g.fillStyle = 'rgba(60,46,24,0.3)'; g.beginPath(); g.ellipse(40, 24, 14, 9, 0, 0, 7); g.fill();
  }, true),
  door: canvasTex(64, 96, (g, w, h) => {
    noiseFill(g, w, h, [70, 74, 78], 14);
    g.fillStyle = '#3a3e42'; g.fillRect(8, 8, 48, 88);
    g.fillStyle = '#5a5e62'; g.fillRect(12, 12, 40, 30);
    g.fillStyle = '#a02020'; g.fillRect(20, 50, 24, 6);
    g.fillStyle = '#ccc'; g.font = '6px monospace'; g.fillText('NO POWER', 18, 66);
  }),
  exit: canvasTex(64, 96, (g, w, h) => {
    noiseFill(g, w, h, [70, 74, 78], 14);
    g.fillStyle = '#2e3236'; g.fillRect(8, 16, 48, 80);
    g.fillStyle = '#1e7a3a'; g.fillRect(10, 4, 44, 10);
    g.fillStyle = '#dfe'; g.font = 'bold 7px monospace'; g.fillText('STAIRS  B', 14, 12);
    g.fillStyle = '#999'; g.fillRect(46, 56, 4, 6);
  }),
  paper: canvasTex(32, 40, (g, w, h) => {
    g.fillStyle = '#ddd6c4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#5a554c'; for (let y = 6; y < h - 4; y += 4) g.fillRect(4, y, 20 + Math.random() * 6, 1);
  }),
  drawing: canvasTex(32, 40, (g, w, h) => {
    g.fillStyle = '#e8e2d0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3a6ad0'; g.fillRect(0, 28, w, 12);                       // water
    g.fillStyle = '#f8f8f8'; g.strokeStyle = '#222';
    g.beginPath(); g.ellipse(16, 20, 9, 6, 0, 0, 7); g.fill(); g.stroke();   // white bear standing over it
    g.beginPath(); g.arc(23, 13, 4, 0, 7); g.fill(); g.stroke();
  }),
};

// ---------- Map ----------
// # wall, T wall with something scratched into it, . floor, P collapsed floor (a hole),
// G a doorway that "isn't there" until you look at it, D powered door, X the stairwell out, k furniture
let W = 30, H = 21, chapter = 1;
let grid;
function buildGrid() {
  W = 30; H = 21; heat = new Float32Array(W * H);
  grid = [];
  for (let y = 0; y < H; y++) grid.push(new Array(W).fill('#'));
  const carve = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = '.'; };
  carve(1, 1, 8, 7);      // lobby
  carve(9, 3, 20, 5);     // main corridor
  carve(21, 1, 28, 8);    // offices
  carve(21, 11, 28, 15);  // generator room
  carve(11, 11, 18, 15);  // security office
  carve(2, 17, 27, 19);   // observation hall
  for (let y = 3; y <= 5; y++) for (let x = 13; x <= 15; x++) grid[y][x] = 'P';
  grid[9][25] = 'G'; grid[10][25] = 'G';
  grid[13][19] = 'D'; grid[13][20] = 'D';
  grid[16][14] = '.';
  for (const [x, y] of [[6, 18], [10, 17], [12, 19], [17, 18], [21, 17], [24, 19]]) grid[y][x] = '#';
  grid[18][1] = 'X';
  for (const [x, y] of [[4, 0], [17, 2], [29, 4], [10, 13], [20, 16]]) grid[y][x] = 'T';
}
const cx = x => x * C + C / 2;
const cell = (wx, wz) => { const x = Math.floor(wx / C), y = Math.floor(wz / C); return x < 0 || y < 0 || x >= W || y >= H ? '#' : grid[y][x]; };
const solid = (wx, wz) => '#TGDXPkK'.includes(cell(wx, wz));
const opaque = (wx, wz) => '#TDXkK'.includes(cell(wx, wz));
function zoneAt(wx, wz) {
  const x = Math.floor(wx / C), y = Math.floor(wz / C);
  if (chapter === 2) return y <= 2 ? 'entry' : y <= 4 ? 'turn' : 'living';
  if (chapter === 3) return x <= 8 ? 'office' : y <= 10 ? 'stacks' : x <= 15 ? 'vault' : 'hall';   // 'hall' = the dark stacks
  if (y >= 17) return 'hall';
  if (x >= 11 && x <= 18 && y >= 11 && y <= 15) return 'security';
  if (x >= 21 && y >= 11) return 'generator';
  if (x >= 21) return 'offices';
  if (x >= 9) return 'corridor';
  return 'lobby';
}

// ---------- World ----------
const mat = (c, extra) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, extra || {}));
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const placeholder = new THREE.MeshBasicMaterial();   // swapped for the ghost material by addFocusable
let world, gazeTargets = [], focusables = [], interactables = [], roomLights = [], doorD = null;
const tag = (obj, t, data) => { obj.userData.tag = t; obj.userData.data = data; return obj; };

function buildWorld() { if (chapter === 3) buildArchive(); else if (chapter === 2) buildApartment(); else buildInstitute(); }
function buildInstitute() {
  scene.fog = new THREE.FogExp2(0x020303, 0.07); hemi.intensity = 0.06; instDust = null;
  if (world) scene.remove(world);
  world = new THREE.Group(); scene.add(world);
  gazeTargets = []; focusables = []; interactables = []; roomLights = [];
  buildGrid();

  // walls, one instanced mesh per kind
  const geo = new THREE.BoxGeometry(C, WALL_H, C), m4 = new THREE.Matrix4();
  if (!TX1) makeTX1();
  const kinds = { '#': [std(0xffffff, 0.85, { map: TX1.wall }), 'wall'], T: [std(0xffffff, 0.85, { map: TX1.trace }), 'trace'],
                  D: [std(0xffffff, 0.45, { map: TX1.door, metalness: 0.4 }), 'wall'], X: [std(0xffffff, 0.45, { map: TX1.exit, metalness: 0.4 }), 'exit'] };
  for (const k in kinds) {
    const cells = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === k) cells.push([x, y]);
    const im = new THREE.InstancedMesh(geo, kinds[k][0], cells.length);
    cells.forEach(([x, y], i) => { m4.makeTranslation(cx(x), WALL_H / 2, cx(y)); im.setMatrixAt(i, m4); });
    im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = true;
    world.add(tag(im, kinds[k][1])); gazeTargets.push(im);
    if (k === 'D') doorD = im;
  }
  const ft = TX1.floor.clone(); ft.needsUpdate = true; ft.repeat.set(W / 2, H / 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * C, H * C), std(0xffffff, 0.45, { map: ft }));   // old linoleum, a little shiny
  floor.rotation.x = -Math.PI / 2; floor.position.set(W * C / 2, 0, H * C / 2); floor.receiveShadow = true;
  world.add(tag(floor, 'floor')); gazeTargets.push(floor);
  const ct = TX1.ceil.clone(); ct.needsUpdate = true; ct.repeat.set(W, H);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W * C, H * C), std(0xffffff, 0.95, { map: ct }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(W * C / 2, WALL_H, H * C / 2); ceil.receiveShadow = true;
  world.add(tag(ceil, 'floor')); gazeTargets.push(ceil);

  // The collapsed floor: a black hole, and planks that only half exist
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(3 * C, 3 * C), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  hole.rotation.x = -Math.PI / 2; hole.position.set(cx(14), 0.01, cx(4)); world.add(hole);
  for (let i = 0; i < 8; i++) {
    const r = box(0.3 + Math.random() * 0.4, 0.15, 0.3 + Math.random() * 0.4, mat(0x6a665e));
    r.position.set(cx(12) + 0.8 + Math.random() * 0.4, 0.07, cx(3) + Math.random() * 5); r.rotation.y = Math.random() * 3; world.add(r);
  }
  // planks spanning the hole, east to west
  const bridge = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const plank = box(6.3, 0.08, 0.5, placeholder);
    plank.position.set(cx(14), 0.04, 3 * C + 0.4 + i * 0.65); plank.rotation.y = (Math.random() - 0.5) * 0.04;
    bridge.add(plank);
  }
  addFocusable('bridge', bridge, [[13, 3], [14, 3], [15, 3], [13, 4], [14, 4], [15, 4], [13, 5], [14, 5], [15, 5]], new THREE.Vector3(cx(14), 0.3, cx(4)), 6, 2.2);

  // A doorway that isn't there
  const ghostDoor = new THREE.Group();
  const frame = [[-0.85, 1.3, 0, 0.15, 2.6, 2 * C], [0.85, 1.3, 0, 0.15, 2.6, 2 * C], [0, 2.65, 0, 1.85, 0.15, 2 * C]];
  for (const [x, y, z, w, h, d] of frame) { const b = box(w, h, d, placeholder); b.position.set(x, y, z); ghostDoor.add(b); }
  ghostDoor.position.set(cx(25), 0, cx(9) + C / 2);
  addFocusable('door', ghostDoor, [[25, 9], [25, 10]], new THREE.Vector3(cx(25), 1.4, cx(9) + C / 2), 1, 2.6);

  // Furniture, documents, the lever, the recorder
  const desk = (x, y, rot = 0) => {
    const g = new THREE.Group();
    const top = box(1.5, 0.08, 0.8, mat(0x5a4a38)); top.position.y = 0.76; g.add(top);
    for (const [a, b] of [[-0.65, -0.32], [0.65, -0.32], [-0.65, 0.32], [0.65, 0.32]]) { const l = box(0.06, 0.76, 0.06, mat(0x333333)); l.position.set(a, 0.38, b); g.add(l); }
    g.position.set(cx(x), 0, cx(y)); g.rotation.y = rot; world.add(tag(shadowy(g), 'prop')); gazeTargets.push(g);
    grid[y][x] = 'k';
    return g;
  };
  const doc = (x, y, id, tex, onDesk = true) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.42), new THREE.MeshBasicMaterial({ map: tex, color: 0xb8b2a4 }));
    p.rotation.x = -Math.PI / 2; p.rotation.z = Math.random() - 0.5;
    p.position.set(cx(x) + (onDesk ? 0 : 0.6), onDesk ? 0.81 : 0.02, cx(y));
    world.add(tag(p, 'doc', id)); gazeTargets.push(p);
    interactables.push({ kind: 'doc', id, mesh: p, pos: p.position });
  };
  desk(4, 2); doc(4, 2, 'brochure', TX.paper);
  desk(10, 5); doc(10, 5, 'teoNote', TX.paper);
  desk(23, 2); doc(23, 2, 'session41', TX.paper);
  desk(27, 6, 0.4); doc(27, 6, 'memo', TX.paper);
  desk(16, 12); doc(16, 12, 'drawing', TX.drawing);
  desk(22, 5, -0.3);
  desk(13, 11);
  // the breaker lever
  const lever = new THREE.Group();
  const panel = box(0.9, 1.3, 0.3, mat(0x4a5048)); panel.position.y = 1.2; lever.add(panel);
  const handle = box(0.08, 0.5, 0.08, mat(0xa02020)); handle.position.set(0, 1.35, 0.2); handle.rotation.x = 0.6; lever.add(handle);
  lever.position.set(cx(28) + 0.6, 0, cx(13)); lever.rotation.y = -Math.PI / 2;
  world.add(tag(lever, 'lever')); gazeTargets.push(lever);
  interactables.push({ kind: 'lever', mesh: lever, handle, pos: new THREE.Vector3(cx(28), 1.2, cx(13)) });
  // Teo's recorder, on the floor
  const rec = box(0.18, 0.06, 0.28, mat(0x222222)); rec.position.set(cx(12), 0.03, cx(14)); rec.rotation.y = 0.5;
  const led = box(0.03, 0.02, 0.03, new THREE.MeshBasicMaterial({ color: 0xff2020 })); led.position.set(0.05, 0.04, 0.08); rec.add(led);
  world.add(tag(rec, 'recorder')); gazeTargets.push(rec);
  interactables.push({ kind: 'recorder', mesh: rec, led, pos: rec.position });
  // the stairwell door
  interactables.push({ kind: 'exit', pos: new THREE.Vector3(cx(1) + 0.6, 1.2, cx(18)) });

  decorateInstitute();

  // ---- Lights ----
  // Fluorescent tubes: dead until the power comes back, then they stutter to life one by one.
  const tubeGeo = new THREE.BoxGeometry(1.3, 0.045, 0.12);
  const fluoro = (x, y, intensity, dist, shadow) => {
    const housing = box(1.5, 0.08, 0.4, std(0x4a4c48, 0.6, { metalness: 0.4 }));
    housing.position.set(cx(x), WALL_H - 0.04, cx(y)); world.add(housing);
    const tubes = [];
    for (const dz of [-0.09, 0.09]) {
      const tm = new THREE.MeshStandardMaterial({ color: 0x7a7c7a, emissive: 0xeaf2ff, emissiveIntensity: 0, roughness: 0.3 });
      const tube = new THREE.Mesh(tubeGeo, tm); tube.position.set(cx(x), WALL_H - 0.1, cx(y) + dz); world.add(tube); tubes.push(tm);
    }
    const l = new THREE.PointLight(0xdfe8f2, 0, dist, 2);
    l.position.set(cx(x), WALL_H - 0.4, cx(y));
    if (shadow) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.camera.near = 0.1; l.shadow.camera.far = dist; l.shadow.bias = -0.003; }
    world.add(l);
    // a faint shaft of light falling from the fixture
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.7, WALL_H - 0.14, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xcfdcff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(cx(x), (WALL_H - 0.14) / 2, cx(y)); world.add(beam);
    roomLights.push({ kind: 'fluoro', l, tubes, beam, base: intensity, startAt: 0.3 + Math.random() * 2.4, flicker: Math.random() < 0.35, pos: l.position });
  };
  fluoro(5, 4, 1.7, 13, true);
  fluoro(11, 4, 1.3, 10, false);
  fluoro(18, 4, 1.3, 10, false);
  fluoro(24, 3, 1.6, 12, false);
  fluoro(25, 13, 1.7, 12, true);
  fluoro(15, 13, 1.5, 11, false);
  // Red emergency lamps on the walls, on battery, pulsing slowly
  const emergency = (x, z, rotY) => {
    const g = new THREE.Group();
    g.add(box(0.32, 0.2, 0.1, std(0x2a2a2a, 0.5)));
    const lm = new THREE.MeshStandardMaterial({ color: 0x551010, emissive: 0xff2010, emissiveIntensity: 1 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lm);
    dome.rotation.x = Math.PI / 2; dome.position.z = 0.05; g.add(dome);
    g.position.set(x, 2.55, z); g.rotation.y = rotY; world.add(g);
    const l = new THREE.PointLight(0xff2a14, 0.7, 8, 2);
    l.position.set(x + Math.sin(rotY) * 0.45, 2.35, z + Math.cos(rotY) * 0.45); world.add(l);
    roomLights.push({ kind: 'emergency', l, mat: lm, phase: Math.random() * 6 });
  };
  emergency(C + 0.06, cx(6), Math.PI / 2);              // lobby, west wall
  emergency(29 * C - 0.06, cx(13), -Math.PI / 2);       // generator room, east wall
  emergency(cx(26), C + 0.06, 0);                       // offices, north wall
  emergency(cx(9) + 0.5, 17 * C + 0.06, 0);             // just inside the hall, the last light before the dark
  // A green EXIT sign over the stairwell door: the only light in the observation hall
  const exitTex = canvasTex(128, 48, (g2, w, h) => {
    g2.fillStyle = '#0a3a18'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#7dffa6'; g2.font = 'bold 30px sans-serif'; g2.textAlign = 'center'; g2.fillText('EXIT', w / 2, 36);
    g2.fillStyle = '#7dffa6'; g2.beginPath(); g2.moveTo(10, 24); g2.lineTo(24, 14); g2.lineTo(24, 34); g2.fill();
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.28), new THREE.MeshBasicMaterial({ map: exitTex }));
  sign.position.set(2 * C + 0.04, 2.75, cx(18)); sign.rotation.y = Math.PI / 2; world.add(sign);
  const exitGlow = new THREE.PointLight(0x40ff80, 0.6, 7, 2); exitGlow.position.set(2 * C + 0.5, 2.6, cx(18)); world.add(exitGlow);
  // Security monitors that flicker on with the power
  for (let i = 0; i < 3; i++) {
    const mon = new THREE.Group();
    mon.add(box(0.5, 0.4, 0.4, std(0x2a2c2a, 0.6)));
    const sm = new THREE.MeshStandardMaterial({ color: 0x0a120e, emissive: 0x6affc0, emissiveIntensity: 0, roughness: 0.2 });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), sm); scr.position.z = 0.205; mon.add(scr);
    mon.position.set(cx(13) - 0.5 + i * 0.5, 1.0 + (i === 1 ? 0.0 : 0), cx(11) + 0.05); mon.rotation.y = (i - 1) * -0.25;
    world.add(shadowy(mon));
    roomLights.push({ kind: 'screen', mat: sm, startAt: 1.5 + i * 0.4 });
  }
  hemi.intensity = 0.05;

  world.add(itModel);
}

// ---- High-detail textures for the institute (Chapter 1) ----
// Institutional two-tone paint: pale green above, dark green below, peeling and water-stained.
function drawInstituteWall(g, w, h) {
  g.fillStyle = '#a2b29c'; g.fillRect(0, 0, w, h);
  grain(g, w, h, 9);
  const wy = 250;
  g.fillStyle = '#4c5c49'; g.fillRect(0, wy, w, h - wy);
  g.fillStyle = '#2c362a'; g.fillRect(0, wy - 7, w, 7);
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, wy - 7, w, 1);
  for (let i = 0; i < 4; i++) {   // peeling paint, bare plaster underneath
    const px = Math.random() * w, py = 20 + Math.random() * 200, rw = 8 + Math.random() * 22, rh = 6 + Math.random() * 16;
    g.fillStyle = '#cfc9b4'; g.beginPath(); g.ellipse(px, py, rw, rh, Math.random() * 3, 0, 7); g.fill();
    g.strokeStyle = 'rgba(60,70,55,0.5)'; g.lineWidth = 1.5; g.stroke();
  }
  for (let i = 0; i < 5; i++) {   // water streaks running down
    const sx = Math.random() * w, sg = g.createLinearGradient(sx, 0, sx, h * (0.4 + Math.random() * 0.5));
    sg.addColorStop(0, 'rgba(70,58,30,0.35)'); sg.addColorStop(1, 'rgba(70,58,30,0)');
    g.fillStyle = sg; g.fillRect(sx, 0, 3 + Math.random() * 7, h);
  }
  const grime = g.createLinearGradient(0, h * 0.75, 0, h); grime.addColorStop(0, 'rgba(0,0,0,0)'); grime.addColorStop(1, 'rgba(20,16,8,0.45)');
  g.fillStyle = grime; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(40,40,30,0.35)'; g.lineWidth = 1;   // hairline cracks
  for (let i = 0; i < 2; i++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * 100; g.moveTo(x, y); for (let k = 0; k < 10; k++) { x += (Math.random() - 0.5) * 18; y += 10; g.lineTo(x, y); } g.stroke(); }
}
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
// built on first use (the texture helpers they rely on are defined further down)
let TX1 = null;
function makeTX1() { TX1 = {
  wall: hiTex(256, 410, drawInstituteWall),
  // something scratched into the paint, over and over: a crude bear, and a word
  trace: hiTex(256, 410, (g, w, h) => {
    drawInstituteWall(g, w, h);
    g.strokeStyle = 'rgba(245,245,236,0.85)'; g.lineWidth = 2.2; g.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const ox = 20 + (i % 3) * 75 + Math.random() * 10, oy = 40 + Math.floor(i / 3) * 80 + Math.random() * 10;
      g.beginPath(); g.ellipse(ox + 22, oy + 26, 20, 13, 0, 0, 7); g.stroke();
      g.beginPath(); g.arc(ox + 40, oy + 9, 8, 0, 7); g.stroke();
      for (const lx of [8, 18, 28, 36]) { g.beginPath(); g.moveTo(ox + lx, oy + 36); g.lineTo(ox + lx + (Math.random() - 0.5) * 3, oy + 50); g.stroke(); }
    }
    g.font = 'bold 34px serif'; g.fillStyle = 'rgba(245,245,236,0.8)'; g.fillText('DON\'T', 60, 228);
    g.font = '16px serif'; g.fillText('dont dont dont dont', 40, 300);
  }),
  floor: hiTex(512, 512, (g, w, h) => {
    const ts = 128;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      g.fillStyle = (x + y) % 2 ? '#8e8a7c' : '#bdb6a4'; g.fillRect(x * ts, y * ts, ts, ts);
      for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(${(x + y) % 2 ? '255,250,230' : '60,55,40'},0.05)`; g.beginPath(); g.ellipse(x * ts + Math.random() * ts, y * ts + Math.random() * ts, 4 + Math.random() * 14, 2 + Math.random() * 6, Math.random() * 3, 0, 7); g.fill(); }
    }
    g.fillStyle = 'rgba(20,18,12,0.5)'; for (let i = 0; i <= 4; i++) { g.fillRect(i * ts - 1, 0, 2, h); g.fillRect(0, i * ts - 1, w, 2); }
    g.strokeStyle = 'rgba(20,18,12,0.25)'; g.lineWidth = 2;   // scuffs
    for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 40, Math.random() * 6, Math.random() * 6 + 0.6); g.stroke(); }
    for (let i = 0; i < 5; i++) { const rg = g.createRadialGradient(0, 0, 0, 0, 0, 40); g.save(); g.translate(Math.random() * w, Math.random() * h); rg.addColorStop(0, 'rgba(50,38,20,0.35)'); rg.addColorStop(1, 'rgba(50,38,20,0)'); g.fillStyle = rg; g.fillRect(-40, -40, 80, 80); g.restore(); }
    grain(g, w, h, 12);
  }, 1, 1),
  ceil: hiTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c8c5b8'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(60,58,50,0.35)'; for (let i = 0; i < 900; i++) g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);   // acoustic holes
    g.fillStyle = '#8a877c'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); g.fillRect(0, h / 2 - 1, w, 3); g.fillRect(w / 2 - 1, 0, 3, h);
    const st = g.createRadialGradient(170, 70, 5, 170, 70, 50); st.addColorStop(0, 'rgba(110,80,30,0.45)'); st.addColorStop(0.8, 'rgba(110,80,30,0.25)'); st.addColorStop(1, 'rgba(110,80,30,0)');
    g.fillStyle = st; g.fillRect(110, 10, 120, 120);
    grain(g, w, h, 8);
  }, 1, 1),
  door: hiTex(256, 410, (g, w, h) => {
    g.fillStyle = '#5d6266'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; g.fillRect(0, y, w, 1); }
    g.fillStyle = '#3e4246'; g.fillRect(28, 20, 200, 390);
    g.fillStyle = '#6a6f74'; g.fillRect(40, 40, 176, 150); g.fillRect(40, 220, 176, 170);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(40, 188, 176, 3); g.fillRect(40, 388, 176, 3);
    g.fillStyle = '#1a1c1e'; g.fillRect(190, 205, 26, 40); g.fillStyle = '#d02020'; g.fillRect(196, 210, 6, 4);   // keypad, red light
    g.fillStyle = '#e8c020'; g.fillRect(60, 60, 136, 26); g.fillStyle = '#1a1a1a'; g.font = 'bold 15px sans-serif'; g.fillText('RESTRICTED', 78, 79);
    grain(g, w, h, 8);
  }),
  exit: hiTex(256, 410, (g, w, h) => {
    g.fillStyle = '#4a5450'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; g.fillRect(0, y, w, 1); }
    g.fillStyle = '#2e3633'; g.fillRect(28, 60, 200, 350);
    g.fillStyle = '#d8d8d0'; g.fillRect(70, 110, 116, 40); g.fillStyle = '#1a1a1a'; g.font = 'bold 18px sans-serif'; g.fillText('STAIRS  B', 82, 137);
    g.fillStyle = '#9a9a92'; g.fillRect(40, 240, 176, 10);                       // push bar
    grain(g, w, h, 8);
  }),
  poster: hiTex(128, 176, (g, w, h) => {
    g.fillStyle = '#d8d2bc'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a4a6a'; g.fillRect(8, 8, w - 16, 70);
    g.fillStyle = '#f0ece0'; g.beginPath(); g.ellipse(64, 46, 24, 16, 0, 0, 7); g.fill(); g.beginPath(); g.arc(84, 34, 9, 0, 7); g.fill();   // the white bear
    g.fillStyle = '#2a2a2a'; g.font = 'bold 15px serif'; g.textAlign = 'center'; g.fillText('A QUIET MIND', 64, 102);
    g.font = '10px serif'; g.fillText('is a healthy mind.', 64, 120); g.fillText('Halvard Institute', 64, 158);
    grain(g, w, h, 16);
  }),
  whiteboard: hiTex(256, 160, (g, w, h) => {
    g.fillStyle = '#e8ebe8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2a4aa0'; g.lineWidth = 2; g.font = '14px sans-serif'; g.fillStyle = '#2a4aa0';
    g.fillText('PWB — suppression schedule', 12, 22);
    g.strokeRect(20, 40, 60, 30); g.strokeRect(150, 40, 70, 30); g.beginPath(); g.moveTo(80, 55); g.lineTo(150, 55); g.stroke();
    g.fillText('subj.', 30, 60); g.fillText('???', 170, 60);
    g.fillStyle = '#b02020'; g.fillText('DO NOT NAME IT', 60, 110);
    g.strokeStyle = 'rgba(80,80,80,0.15)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(Math.random() * w, Math.random() * h); g.lineTo(Math.random() * w, Math.random() * h); g.stroke(); }
  }),
}; }

// Fill the institute with the things a place like this leaves behind
function decorateInstitute(shelfWoodCol) {
  const metal = std(0x7a7e80, 0.45, { metalness: 0.6 }), darkMetal = std(0x3a3c3e, 0.5, { metalness: 0.5 });
  const plastic = std(0x5a6a70, 0.7), cream = std(0xd8d2bc, 0.6), rubber = std(0x1a1a1a, 0.9);
  const add = (o, solidCell) => { world.add(tag(shadowy(o), 'prop')); gazeTargets.push(o); if (solidCell) grid[solidCell[1]][solidCell[0]] = 'k'; return o; };
  // dark rubber skirting along every wall that faces a room
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (grid[y][x] !== '.' && grid[y][x] !== 'k') continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = grid[y + dy] && grid[y + dy][x + dx];
      if (!n || !'#TDX'.includes(n)) continue;
      const along = dx !== 0, sk = box(along ? 0.03 : C, 0.12, along ? C : 0.03, rubber);
      sk.position.set(cx(x) + dx * (C / 2 - 0.015), 0.06, cx(y) + dy * (C / 2 - 0.015)); sk.receiveShadow = true; world.add(sk);
    }
  }
  // pipes and ducts along the corridor ceiling
  for (const [z, r, col] of [[3 * C + 0.35, 0.06, 0x6a5a4a], [3 * C + 0.6, 0.04, 0x7a7e80], [6 * C - 0.4, 0.14, 0x8a8e90]]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 12 * C, 12), std(col, 0.5, { metalness: 0.5 }));
    pipe.rotation.z = Math.PI / 2; pipe.position.set(9 * C + 6 * C, WALL_H - 0.2 - r, z); world.add(shadowy(pipe));
    for (let i = 0; i < 6; i++) { const clamp1 = box(0.04, 0.2, r * 2 + 0.06, darkMetal); clamp1.position.set(9 * C + 1 + i * 4, WALL_H - 0.1, z); world.add(clamp1); }
  }
  const vent = (x, z) => { const v = box(0.6, 0.03, 0.6, darkMetal); v.position.set(x, WALL_H - 0.015, z); world.add(v);
    for (let i = 0; i < 6; i++) { const s = box(0.5, 0.02, 0.03, rubber); s.position.set(x, WALL_H - 0.035, z - 0.22 + i * 0.09); world.add(s); } };
  vent(cx(3), cx(2)); vent(cx(24), cx(7)); vent(cx(16), cx(14)); vent(cx(7), cx(18)); vent(cx(20), cx(18));
  // scattered papers on the floor everywhere
  const paperMat = std(0xe0d8c4, 0.95, { side: THREE.DoubleSide });
  for (let i = 0; i < 70; i++) {
    let x, y; do { x = 1 + Math.floor(Math.random() * (W - 2)); y = 1 + Math.floor(Math.random() * (H - 2)); } while (grid[y][x] !== '.');
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29), paperMat);
    p.rotation.x = -Math.PI / 2; p.rotation.z = Math.random() * 6; p.position.set(cx(x) + (Math.random() - 0.5) * 1.6, 0.004 + Math.random() * 0.003, cx(y) + (Math.random() - 0.5) * 1.6);
    p.receiveShadow = true; world.add(p);
  }
  // posters of the institute's motto
  const poster = (x, z, rotY) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.82), std(0xffffff, 0.9, { map: TX1.poster })); p.position.set(x, 1.75, z); p.rotation.y = rotY; world.add(p); };
  poster(cx(6), C + 0.02, 0); poster(cx(12), 3 * C + 0.02, 0); poster(cx(22), C + 0.02, 0); poster(cx(16), 11 * C + 0.02, 0);

  // ---- Lobby: reception, waiting chairs, a wheelchair, a notice board ----
  const waitingChair = (x, z, rot) => {
    const g = new THREE.Group();
    const seat = box(0.48, 0.06, 0.46, plastic); seat.position.y = 0.44; g.add(seat);
    const back = box(0.48, 0.42, 0.05, plastic); back.position.set(0, 0.72, -0.21); back.rotation.x = -0.1; g.add(back);
    for (const sx of [-0.2, 0.2]) { const l = box(0.03, 0.44, 0.4, metal); l.position.set(sx, 0.22, 0); g.add(l); }
    g.position.set(x, 0, z); g.rotation.y = rot; return g;
  };
  for (let i = 0; i < 5; i++) add(waitingChair(cx(2) + i * 0.55 - 0.3, cx(7) + 0.5, Math.PI), i % 2 ? null : [2 + (i >> 1), 7]);
  add(waitingChair(cx(6) + 0.4, cx(6), Math.PI + 1.9));                    // knocked sideways
  const wheel = new THREE.Group();
  for (const sx of [-0.3, 0.3]) { const wh = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 24), metal); wh.position.set(sx, 0.32, 0); wh.rotation.y = Math.PI / 2; wheel.add(wh); }
  const wseat = box(0.5, 0.05, 0.45, std(0x2a2a2e, 0.8)); wseat.position.y = 0.5; wheel.add(wseat);
  const wback = box(0.5, 0.45, 0.04, std(0x2a2a2e, 0.8)); wback.position.set(0, 0.78, -0.22); wheel.add(wback);
  wheel.position.set(cx(7), 0, cx(1) + 0.3); wheel.rotation.y = 0.7; add(wheel);
  const board = new THREE.Group();
  board.add(box(1.2, 0.8, 0.03, std(0x8a6a44, 1)));
  for (let i = 0; i < 6; i++) { const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), cream); pp.position.set(-0.4 + (i % 3) * 0.4, 0.15 - Math.floor(i / 3) * 0.32, 0.02); pp.rotation.z = (Math.random() - 0.5) * 0.3; board.add(pp); }
  board.position.set(C + 0.03, 1.6, cx(3)); board.rotation.y = Math.PI / 2; world.add(board);
  const plant = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.42, 16), std(0x6a5a4a, 0.8)); pot.position.y = 0.21; plant.add(pot);
  for (let i = 0; i < 7; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.7, 4), std(0x4a3a2a, 0.9)); st.position.set((Math.random() - 0.5) * 0.15, 0.7, (Math.random() - 0.5) * 0.15); st.rotation.set((Math.random() - 0.5) * 0.9, 0, (Math.random() - 0.5) * 0.9); plant.add(st); }
  plant.position.set(cx(8) - 0.5, 0, cx(1) - 0.4); add(plant);

  // ---- Corridor: an abandoned gurney and a warning sign ----
  const gurney = new THREE.Group();
  const mattress = box(0.7, 0.12, 1.9, std(0xb8c0c0, 0.8)); mattress.position.y = 0.88; gurney.add(mattress);
  const sheet = box(0.74, 0.03, 1.2, std(0xe8e8e0, 1)); sheet.position.set(0, 0.96, 0.3); sheet.rotation.x = 0.04; gurney.add(sheet);
  for (const sx of [-0.3, 0.3]) for (const sz of [-0.85, 0.85]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), metal); l.position.set(sx, 0.42, sz); gurney.add(l);
    const wh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), rubber); wh.position.set(sx, 0.05, sz); gurney.add(wh); }
  gurney.position.set(cx(18), 0, cx(5) + 0.45); gurney.rotation.y = Math.PI / 2 + 0.15; add(gurney);
  const caution = new THREE.Group();
  const signTex = hiTex(64, 96, (g2, w, h) => { g2.fillStyle = '#e8c020'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#111'; g2.font = 'bold 12px sans-serif'; g2.textAlign = 'center'; g2.fillText('CAUTION', w / 2, 30); g2.font = '9px sans-serif'; g2.fillText('FLOOR', w / 2, 52); g2.fillText('UNSAFE', w / 2, 64); });
  for (const s of [-1, 1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.6), std(0xffffff, 0.6, { map: signTex, side: THREE.DoubleSide })); pl.position.set(0, 0.3, s * 0.1); pl.rotation.x = s * 0.17; caution.add(pl); }
  caution.position.set(cx(12) - 0.2, 0, cx(3) + 0.3); caution.rotation.y = 0.4; add(caution);

  // ---- Offices: filing cabinets, office chairs, old computers, a whiteboard ----
  const cabinet = (x, z, rot, open) => {
    const g = new THREE.Group();
    g.add(at(box(0.5, 1.3, 0.6, std(0x8a8e84, 0.5, { metalness: 0.4 })), 0, 0.65, 0));
    for (let i = 0; i < 4; i++) {
      const dr = box(0.44, 0.28, 0.03, std(0x9a9e94, 0.45, { metalness: 0.4 })); dr.position.set(0, 0.17 + i * 0.31, 0.3 + (open === i ? 0.3 : 0)); g.add(dr);
      const hd = box(0.12, 0.02, 0.03, metal); hd.position.set(0, 0.2 + i * 0.31, 0.33 + (open === i ? 0.3 : 0)); g.add(hd);
    }
    g.position.set(x, 0, z); g.rotation.y = rot; return g;
  };
  add(cabinet(cx(28) + 0.5, cx(1) - 0.3, -Math.PI / 2, 2), [28, 1]);
  add(cabinet(cx(28) + 0.5, cx(2) - 0.6, -Math.PI / 2, -1), [28, 2]);
  add(cabinet(cx(21) - 0.5, cx(8) + 0.4, Math.PI / 2, 1));
  const officeChair = (x, z, rot, tipped) => {
    const g = new THREE.Group();
    const seat = box(0.48, 0.08, 0.46, std(0x2a2a30, 0.8)); seat.position.y = 0.48; g.add(seat);
    const back = box(0.46, 0.5, 0.06, std(0x2a2a30, 0.8)); back.position.set(0, 0.8, -0.22); g.add(back);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), metal); post.position.y = 0.26; g.add(post);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, leg = box(0.03, 0.03, 0.3, metal); leg.position.set(Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15); leg.rotation.y = a; g.add(leg); }
    g.position.set(x, tipped ? 0.25 : 0, z); g.rotation.set(tipped ? Math.PI / 2 : 0, rot, 0); return g;
  };
  add(officeChair(cx(23), cx(2) + 0.85, Math.PI + 0.3)); add(officeChair(cx(22) + 0.4, cx(5) + 0.9, 2.6, true)); add(officeChair(cx(27) - 0.2, cx(6) + 0.9, Math.PI - 0.2));
  add(officeChair(cx(13), cx(11) + 0.85, Math.PI + 0.4));
  const crt = (x, z, rot) => {
    const g = new THREE.Group();
    g.add(at(box(0.42, 0.36, 0.4, std(0xc8c2ae, 0.6)), 0, 0.18, 0));
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.25), std(0x101414, 0.1, { metalness: 0.3 })); sc.position.set(0, 0.19, 0.201); g.add(sc);
    const kb = box(0.42, 0.03, 0.14, std(0xc8c2ae, 0.6)); kb.position.set(0, -0.0, 0.33); g.add(kb);
    g.position.set(x, 0.8, z); g.rotation.y = rot; return g;
  };
  world.add(shadowy(crt(cx(23) + 0.35, cx(2) - 0.15, 0.2))); world.add(shadowy(crt(cx(22), cx(5) - 0.15, -0.3)));
  const wb = new THREE.Group();
  wb.add(box(1.8, 1.1, 0.04, std(0x8a8e90, 0.4, { metalness: 0.5 })));
  const wbs = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.0), std(0xffffff, 0.3, { map: TX1.whiteboard })); wbs.position.z = 0.025; wb.add(wbs);
  wb.position.set(cx(25), 1.6, C + 0.04); world.add(wb);
  // stacks of files on the office floor
  for (let i = 0; i < 4; i++) { const st = new THREE.Group(); for (let k = 0; k < 6; k++) { const f = box(0.32, 0.04, 0.24, std(pick([0xc8a050, 0xd8d0bc, 0x8a6a3a]), 0.9)); f.position.y = 0.02 + k * 0.042; f.rotation.y = (Math.random() - 0.5) * 0.4; st.add(f); }
    st.position.set(cx(21 + i * 2) + (Math.random() - 0.5), 0, cx(7) + (Math.random() - 0.5)); world.add(shadowy(st)); }

  // ---- Generator room: the generator itself, gauges, barrels, hazard stripes ----
  const gen = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3.0, 24), std(0x4a5a4a, 0.5, { metalness: 0.5 })); body.rotation.z = Math.PI / 2; body.position.y = 0.95; gen.add(body);
  const base = box(3.4, 0.2, 1.8, darkMetal); base.position.y = 0.1; gen.add(base);
  for (let i = 0; i < 5; i++) { const fin = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.04, 6, 24), darkMetal); fin.rotation.y = Math.PI / 2; fin.position.set(-1.2 + i * 0.6, 0.95, 0); gen.add(fin); }
  for (let i = 0; i < 3; i++) {
    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 20), std(0xe8e4d8, 0.4)); gauge.rotation.x = Math.PI / 2; gauge.position.set(-0.6 + i * 0.6, 1.4, 0.82); gen.add(gauge);
    const needle = box(0.01, 0.08, 0.01, std(0xb01010, 0.4)); needle.position.set(-0.6 + i * 0.6, 1.42, 0.85); needle.rotation.z = -0.6 + i * 0.5; gen.add(needle);
  }
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 12), metal); exhaust.position.set(1.0, 2.4, -0.3); gen.add(exhaust);
  gen.position.set(cx(22) + 1, 0, cx(11) + 0.2); add(gen, [22, 11]); grid[11][23] = 'k';
  const stripeTex = hiTex(128, 32, (g2, w, h) => { for (let x = -h; x < w; x += 24) { g2.fillStyle = '#e8c020'; g2.beginPath(); g2.moveTo(x, h); g2.lineTo(x + 12, h); g2.lineTo(x + 12 + h, 0); g2.lineTo(x + h, 0); g2.fill(); g2.fillStyle = '#1a1a1a'; } }, 6, 1);
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.2), std(0xffffff, 0.7, { map: stripeTex })); stripe.rotation.x = -Math.PI / 2; stripe.position.set(cx(22) + 1, 0.006, cx(12) + 0.3); world.add(stripe);
  for (const [x, z] of [[cx(27) + 0.4, cx(15) + 0.3], [cx(26) + 0.5, cx(15) + 0.5], [cx(21) - 0.3, cx(15) + 0.4]]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 18), std(pick([0x2a4a6a, 0x6a2a1a, 0x3a4a2a]), 0.5, { metalness: 0.4 })); barrel.position.set(x, 0.45, z); world.add(shadowy(barrel));
  }
  for (let i = 0; i < 2; i++) { const fb = box(0.5, 0.7, 0.18, std(0x6a6e64, 0.5, { metalness: 0.4 })); fb.position.set(cx(28) + 0.85, 1.4, cx(11) + i * 0.7); world.add(shadowy(fb)); }

  // ---- Security office: a row of lockers, a key rack ----
  for (let i = 0; i < 4; i++) {
    const lk = new THREE.Group();
    lk.add(at(box(0.45, 1.9, 0.5, std(0x4a5a6a, 0.5, { metalness: 0.4 })), 0, 0.95, 0));
    for (let v = 0; v < 4; v++) { const sl = box(0.3, 0.02, 0.01, rubber); sl.position.set(0, 1.6 + v * 0.05, 0.255); lk.add(sl); }
    lk.position.set(cx(11) - 0.7, 0, cx(15) - 0.6 - i * 0.48); lk.rotation.y = Math.PI / 2; world.add(shadowy(lk));
  }
  const keys1 = box(0.5, 0.3, 0.04, std(0x6a4a2a, 0.8)); keys1.position.set(cx(18) + 0.95, 1.6, cx(12)); keys1.rotation.y = -Math.PI / 2; world.add(keys1);

  // ---- Observation hall: rows of chairs facing a dark one-way window ----
  const obsGlass = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.4), std(0x0a0e12, 0.05, { metalness: 0.9 }));
  obsGlass.position.set(cx(20), 1.7, 17 * C + 0.03); world.add(obsGlass);
  const obsFrame = box(10.2, 0.08, 0.06, darkMetal); obsFrame.position.set(cx(20), 2.44, 17 * C + 0.03); world.add(obsFrame);
  const obsFrame2 = obsFrame.clone(); obsFrame2.position.y = 0.96; world.add(obsFrame2);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
    const x = cx(17) + i * 1.0, z = cx(19) - r * 1.1 + 0.4;
    if (Math.random() < 0.15) continue;
    world.add(shadowy(waitingChair(x, z, Math.PI + (Math.random() - 0.5) * 0.3)));
  }
  // dust hanging in the air
  const N = 350, dpos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    let x, y; do { x = 1 + Math.floor(Math.random() * (W - 2)); y = 1 + Math.floor(Math.random() * (H - 2)); } while (grid[y][x] === '#');
    dpos[i * 3] = cx(x) + (Math.random() - 0.5) * C; dpos[i * 3 + 1] = 0.3 + Math.random() * 2.7; dpos[i * 3 + 2] = cx(y) + (Math.random() - 0.5) * C;
  }
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  instDust = new THREE.Points(dgeo, new THREE.PointsMaterial({ map: TX2.dust, size: 0.03, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xdfe6ee }));
  instDust.userData.base = dpos.slice();
  world.add(instDust);
}
let instDust = null;

// Chapter 1 lights: emergency lamps pulse on battery; when the power comes back the tubes strobe to life,
// then hum. Some never quite settle.
function updateInstituteLights() {
  if (instDust) {   // dust hanging in the air
    const p = instDust.geometry.attributes.position, b = instDust.userData.base;
    for (let i = 0; i < p.count; i++) { p.array[i * 3] = b[i * 3] + Math.sin(time * 0.12 + i) * 0.25; p.array[i * 3 + 1] = b[i * 3 + 1] + Math.sin(time * 0.2 + i * 1.7) * 0.18; }
    p.needsUpdate = true;
  }
  let nearest = null, nd = 1e9;
  for (const L of roomLights) {
    if (L.kind === 'emergency') {
      const k = 0.55 + Math.sin(time * 1.8 + L.phase) * 0.35;
      L.l.intensity = k * 0.8; L.mat.emissiveIntensity = 0.3 + k * 1.2;
    } else if (L.kind === 'screen') {
      L.mat.emissiveIntensity = S.power && S.powerT > L.startAt ? 0.55 + Math.random() * 0.2 : 0;
    } else if (L.kind === 'fluoro') {
      let level = 0;
      if (S.power) {
        const t = S.powerT - L.startAt;
        if (t > 0 && t < 1.3) level = Math.random() < 0.4 ? 1 : 0.08;              // stuttering to life
        else if (t >= 1.3) level = L.flicker && Math.random() < 0.025 ? 0.1 : 1;   // the odd one never settles
        if (level !== L.last && level === 1 && t < 1.3 && Math.random() < 0.6) AU.flicker();
        L.last = level;
      }
      L.l.intensity = L.base * level;
      for (const m of L.tubes) m.emissiveIntensity = level * 1.8;
      L.beam.material.opacity = level * 0.04;
      if (level > 0.5) { const d = Math.hypot(L.pos.x - P.x, L.pos.z - P.z); if (d < nd) { nd = d; nearest = L; } }
    }
  }
  // the hum of the nearest working tube
  if (AU.buzz) {
    if (nearest) AU.setPos(AU.buzz.p, nearest.pos.x, nearest.pos.y, nearest.pos.z);
    AU.buzz.g.gain.value = nearest ? 0.035 : 0;
  }
}

// Things you can stare into existence
const ghostMat = () => new THREE.MeshBasicMaterial({ color: 0xdfe8f0, transparent: true, opacity: 0.12, depthWrite: false });
function addFocusable(kind, group, cells, center, solidFlag, time) {
  group.traverse(o => {
    if (!o.isMesh) return;
    o.material = ghostMat();
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
    o.add(edges); o.userData.edges = edges;
  });
  world.add(tag(group, 'focus', kind)); gazeTargets.push(group);
  focusables.push({ kind, group, cells, center, progress: 0, done: false, time });
}
function materialize(f) {
  f.done = true;
  for (const [x, y] of f.cells) grid[y][x] = '.';
  const real = f.kind === 'bridge' ? mat(0x6a5238) : mat(0x6a6e64);
  f.group.traverse(o => { if (o.isMesh) { o.material = real; if (o.userData.edges) o.userData.edges.visible = false; } });
  AU.materialize();
  dread = clamp(dread + 0.06, 0, 1);
}

// ---------- "It" ----------
// A tall, too-thin figure. Black. Slightly smeared, like a thought you can't hold still.
function buildItModel() {
  const g = new THREE.Group();
  const parts = (m) => {
    const p = new THREE.Group();
    const add = (geo, x, y, z, rx = 0, rz = 0) => { const s = new THREE.Mesh(geo, m); s.position.set(x, y, z); s.rotation.set(rx, 0, rz); p.add(s); };
    add(new THREE.CylinderGeometry(0.13, 0.22, 1.25, 8), 0, 1.75, 0);           // torso
    add(new THREE.CylinderGeometry(0.06, 0.08, 1.15, 6), -0.1, 0.6, 0);         // legs
    add(new THREE.CylinderGeometry(0.06, 0.08, 1.15, 6), 0.1, 0.6, 0);
    add(new THREE.CylinderGeometry(0.035, 0.05, 1.6, 6), -0.28, 1.45, 0.05, 0.05, 0.08);   // arms: far too long
    add(new THREE.CylinderGeometry(0.035, 0.05, 1.6, 6), 0.28, 1.45, 0.05, 0.05, -0.08);
    add(new THREE.CylinderGeometry(0.04, 0.05, 0.35, 6), 0.03, 2.5, 0);          // neck
    add(new THREE.SphereGeometry(0.16, 10, 8), 0.09, 2.72, 0.02, 0, -0.45);      // head, tilted
    return p;
  };
  const core = parts(new THREE.MeshBasicMaterial({ color: 0x000000 }));
  g.add(core);
  // faint pale rim so it reads against darkness
  const rim = parts(new THREE.MeshBasicMaterial({ color: 0x9aa4ae, transparent: true, opacity: 0.1, side: THREE.BackSide, depthWrite: false }));
  rim.scale.setScalar(1.06); rim.position.y = -0.08; g.add(rim);
  // smear copies
  const smears = [0, 1].map(() => { const s = parts(new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })); g.add(s); return s; });
  g.userData = { smears, rim };
  g.visible = false;
  return g;
}
const itModel = buildItModel();
const IT = { state: 'gone', x: 0, z: 0, seenT: 0, wasSeen: false, cool: 4, stepT: 0, wanderX: 0, wanderZ: 0, fade: 0 };

// ---------- Audio (synthesized, spatial, with reverb) ----------
// Everything is generated in code. Most sounds go through a reverb so the building feels big and hollow.
const AU = {
  ctx: null, volume: 0.8,
  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return;
    const c = this.ctx = new A();
    this.master = c.createGain(); this.master.gain.value = this.volume;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(c.destination);
    this.noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // reverb: a generated impulse response (2.8 seconds of decaying noise)
    const len = c.sampleRate * 2.8, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const b = ir.getChannelData(ch); for (let i = 0; i < len; i++) b[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    this.verb = c.createConvolver(); this.verb.buffer = ir;
    this.wet = c.createGain(); this.wet.gain.value = 0.55;
    this.wet.connect(this.verb); this.verb.connect(this.master);
    // building drone: two detuned low tones and moving air
    this.droneF = c.createBiquadFilter(); this.droneF.type = 'lowpass'; this.droneF.frequency.value = 120;
    this.droneG = c.createGain(); this.droneG.gain.value = 0;
    this.droneF.connect(this.droneG); this.droneG.connect(this.master);
    for (const f of [41, 41.7, 61.5]) { const o = c.createOscillator(); o.frequency.value = f; o.type = 'sine'; o.connect(this.droneF); o.start(); }
    const air = this.loopNoise(), airF = c.createBiquadFilter(); airF.type = 'bandpass'; airF.frequency.value = 500;
    air.connect(airF); airF.connect(this.droneF);
    // whispers that swell with dread: noise through two "vowel" filters
    const wh = this.loopNoise(); this.whF = c.createBiquadFilter(); this.whF.type = 'bandpass'; this.whF.frequency.value = 2200; this.whF.Q.value = 6;
    const wh2 = c.createBiquadFilter(); wh2.type = 'bandpass'; wh2.frequency.value = 800; wh2.Q.value = 8;
    this.whG = c.createGain(); this.whG.gain.value = 0;
    wh.connect(this.whF); wh.connect(wh2); this.whF.connect(this.whG); wh2.connect(this.whG); this.whG.connect(this.master); this.whG.connect(this.wet);
    // focus tone
    this.focO = c.createOscillator(); this.focO.type = 'sine'; this.focO.frequency.value = 220;
    this.focG = c.createGain(); this.focG.gain.value = 0;
    this.focO.connect(this.focG); this.focG.connect(this.master); this.focG.connect(this.wet); this.focO.start();
    // spatial loops
    this.breath = this.spatialLoop(350, 3);
    this.phone = this.spatialTone();
    this.radio = this.spatialLoop(1400, 0.6);
    // fluorescent hum: a 120 Hz buzz
    const bo = c.createOscillator(), bf = c.createBiquadFilter(), bg = c.createGain(), bp = this.panner();
    bo.type = 'sawtooth'; bo.frequency.value = 120; bf.type = 'bandpass'; bf.frequency.value = 240; bf.Q.value = 2; bg.gain.value = 0;
    bo.connect(bf); bf.connect(bg); bg.connect(bp); bp.connect(this.master); bo.start();
    this.buzz = { g: bg, p: bp };
    // title music bus
    this.musicG = c.createGain(); this.musicG.gain.value = 0; this.musicG.connect(this.master); this.musicG.connect(this.wet);
  },
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; },
  loopNoise() { const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; s.loopStart = Math.random(); s.start(0, Math.random()); return s; },
  panner() {
    const p = this.ctx.createPanner();
    p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 1.5; p.rolloffFactor = 1.3; p.maxDistance = 60;
    return p;
  },
  spatialLoop(freq, q) {
    const src = this.loopNoise(), f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.value = 0;
    const p = this.panner();
    src.connect(f); f.connect(g); g.connect(p); p.connect(this.master); p.connect(this.wet);
    return { g, p };
  },
  spatialTone() {
    const o1 = this.ctx.createOscillator(), o2 = this.ctx.createOscillator();
    o1.type = o2.type = 'square'; o1.frequency.value = 440; o2.frequency.value = 480;
    const g = this.ctx.createGain(); g.gain.value = 0;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    const p = this.panner();
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(p); p.connect(this.master); p.connect(this.wet); o1.start(); o2.start();
    return { g, p };
  },
  setPos(node, x, y, z) {
    if (node.positionX) { node.positionX.value = x; node.positionY.value = y; node.positionZ.value = z; } else node.setPosition(x, y, z);
  },
  listener(x, y, z, fx, fz) {
    if (!this.ctx) return;
    const L = this.ctx.listener;
    if (L.positionX) {
      L.positionX.value = x; L.positionY.value = y; L.positionZ.value = z;
      L.forwardX.value = fx; L.forwardY.value = 0; L.forwardZ.value = fz; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    } else { L.setPosition(x, y, z); L.setOrientation(fx, 0, fz, 0, 1, 0); }
  },
  // route a finished sound: dry to the speakers (or a 3D position), plus some reverb
  out(node, at, wet = 0.3) {
    let dst = node;
    if (at) { const p = this.panner(); this.setPos(p, at.x, at.y, at.z); node.connect(p); dst = p; }
    dst.connect(this.master);
    if (wet > 0) { const w = this.ctx.createGain(); w.gain.value = wet; dst.connect(w); w.connect(this.wet); }
  },
  env(gain, dur, attack = 0.005) {
    const g = this.ctx.createGain(), t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
    return g;
  },
  noise(dur, freq, gain, type = 'bandpass', at, wet = 0.3, q = 1, attack) {
    if (!this.ctx) return;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.env(gain, dur, attack);
    s.connect(f); f.connect(g); this.out(g, at, wet);
    s.start(0, Math.random()); s.stop(this.ctx.currentTime + dur + 0.1);
  },
  tone(f0, f1, dur, gain, type = 'sine', at, wet = 0.3, attack) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), t = this.ctx.currentTime;
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    const g = this.env(gain, dur, attack); o.connect(g); this.out(g, at, wet); o.start(); o.stop(t + dur + 0.1);
  },

  // ---- footsteps: wood in the apartment, concrete in the institute ----
  step(eyesClosed) {
    if (chapter === 2) { this.tone(95 + Math.random() * 20, 60, 0.09, 0.35, 'sine', null, 0.15); this.noise(0.06, 900 + Math.random() * 300, 0.12, 'bandpass', null, 0.2, 1.5); }
    else { this.noise(0.05, 1800 + Math.random() * 600, 0.14, 'bandpass', null, 0.35, 1.2); this.tone(70, 45, 0.06, 0.2, 'sine', null, 0.1); }
  },
  bump() { this.noise(0.22, 140, 0.7, 'lowpass', null, 0.4); this.tone(80, 45, 0.18, 0.35, 'sine', null, 0.3); },
  heart(v) {
    const beat = k => { this.tone(58, 34, 0.16, 0.6 * v * k, 'sine', null, 0.05); this.noise(0.08, 90, 0.3 * v * k, 'lowpass', null, 0.05); };
    beat(1); setTimeout(() => beat(0.75), 170);
  },
  // a breathy vowel-shaped whisper
  whisper(at, gain = 0.4) {
    if (!this.ctx) return;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const v = pick([[700, 1200], [400, 2000], [300, 900], [600, 1700]]);
    const g = this.env(gain, 0.5 + Math.random() * 0.4, 0.12);
    for (const fq of v) { const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fq; f.Q.value = 9; s.connect(f); f.connect(g); }
    this.out(g, at, 0.6);
    s.start(0, Math.random()); s.stop(this.ctx.currentTime + 1.2);
  },
  thought(at) { this.whisper(at, 0.55); this.noise(0.6, 3000, 0.08, 'highpass', at, 0.5, 1, 0.1); },
  // shimmering bell partials when something becomes real
  materialize() {
    [523, 784, 1046, 1568, 2093].forEach((f, i) => setTimeout(() => this.tone(f * (1 + (Math.random() - 0.5) * 0.004), f, 2.2, 0.1 / (1 + i * 0.4), 'sine', null, 0.7), i * 60));
    this.noise(1.2, 2500, 0.12, 'bandpass', null, 0.6, 0.7, 0.6);
  },
  // a dissonant string cluster with a swell
  sting() {
    for (const f of [311, 330, 466, 494]) this.tone(f, f * 0.98, 1.8, 0.07, 'sawtooth', null, 0.7, 0.03);
    this.noise(0.4, 600, 0.35, 'lowpass', null, 0.6);
    this.tone(55, 40, 1.2, 0.4, 'sine', null, 0.4);
  },
  caught() {
    if (!this.ctx) return;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 4;
    const t = this.ctx.currentTime; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(500, t + 1.4);
    const g = this.env(1.1, 1.6, 0.01); s.connect(f); f.connect(g); this.out(g, null, 0.6); s.start(); s.stop(t + 1.8);
    for (const fr of [180, 191, 270]) this.tone(fr, fr * 0.5, 1.6, 0.18, 'sawtooth', null, 0.5);
    this.tone(60, 28, 2, 0.8, 'sine', null, 0.3);
  },
  lever() { this.noise(0.3, 900, 0.7, 'bandpass', null, 0.4); this.tone(130, 60, 0.4, 0.4, 'square', null, 0.3); },
  powerUp() {
    this.tone(40, 120, 2.5, 0.45, 'sawtooth', null, 0.4, 0.3);
    setTimeout(() => this.noise(0.2, 2000, 0.3, 'bandpass', null, 0.5), 600);
    setTimeout(() => this.noise(0.2, 2000, 0.3, 'bandpass', null, 0.5), 1100);
  },
  click() { this.noise(0.03, 3000, 0.22, 'bandpass', null, 0.2); },
  flicker() { this.noise(0.06, 5000, 0.12, 'highpass', null, 0.2); },
  // the old house settling: a creaking board somewhere
  creak(at, gain = 0.25) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = 70 + Math.random() * 60;
    lfo.frequency.value = 9 + Math.random() * 14; lg.gain.value = 20 + Math.random() * 30; lfo.connect(lg); lg.connect(o.frequency);
    f.type = 'bandpass'; f.frequency.value = 600 + Math.random() * 700; f.Q.value = 10;
    const dur = 0.4 + Math.random() * 0.7, g = this.env(gain, dur, 0.08);
    o.connect(f); f.connect(g); this.out(g, at, 0.6);
    const t = this.ctx.currentTime; o.start(); lfo.start(); o.stop(t + dur + 0.2); lfo.stop(t + dur + 0.2);
  },
  doorCreak() { this.creak(null, 0.5); setTimeout(() => this.creak(null, 0.35), 300); this.noise(0.6, 300, 0.4, 'lowpass', null, 0.5, 1, 0.05); },
  tick(at, tock) { this.noise(0.018, tock ? 1700 : 2600, 0.5, 'bandpass', at, 0.25, 6); this.tone(tock ? 900 : 1300, tock ? 880 : 1280, 0.03, 0.05, 'sine', at, 0.2); },
  drip(at) { this.tone(1400 + Math.random() * 900, 500, 0.12, 0.15, 'sine', at, 0.6, 0.002); },
  // distant sounds that make a place feel occupied
  ambient(px, pz) {
    const at = { x: px + (Math.random() - 0.5) * 16, y: 1 + Math.random() * 2, z: pz + (Math.random() - 0.5) * 16 };
    const r = Math.random();
    if (r < 0.45) this.creak(at, 0.18);
    else if (r < 0.65) { this.noise(0.5, 120, 0.3, 'lowpass', at, 0.8); }               // distant thud
    else if (r < 0.8) { for (let i = 0; i < 3; i++) setTimeout(() => this.noise(0.05, 700, 0.18, 'bandpass', at, 0.7, 4), i * 160); }   // knocking in the pipes
    else this.whisper(at, 0.12);
  },
  // menu sounds
  hover() { this.tone(1200, 1150, 0.06, 0.04, 'sine', null, 0.4); },
  select() { this.tone(330, 320, 0.9, 0.12, 'triangle', null, 0.7); this.tone(495, 490, 0.9, 0.06, 'sine', null, 0.7); },

  // ---- title music: slow, sparse piano-like notes over a low pad ----
  musicOn: false, musicT: 0,
  startMusic() { if (!this.ctx) return; this.musicOn = true; this.musicG.gain.setTargetAtTime(0.5, this.ctx.currentTime, 1.5); this.droneG.gain.setTargetAtTime(0.1, this.ctx.currentTime, 2); },
  stopMusic() { if (!this.ctx) return; this.musicOn = false; this.musicG.gain.setTargetAtTime(0, this.ctx.currentTime, 0.8); this.droneG.gain.setTargetAtTime(0.18, this.ctx.currentTime, 2); },
  piano(freq, gain) {
    const t = this.ctx.currentTime;
    for (const [mult, amp] of [[1, 1], [2, 0.35], [3, 0.12]]) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = mult === 1 ? 'triangle' : 'sine'; o.frequency.value = freq * mult * (1 + (Math.random() - 0.5) * 0.002);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain * amp, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
      o.connect(g); g.connect(this.musicG); o.start(); o.stop(t + 3.6);
    }
  },
  updateMusic(dt) {
    if (!this.musicOn || !this.ctx) return;
    this.musicT -= dt;
    if (this.musicT > 0) return;
    // A minor, mostly falling, with long gaps. Occasionally a wrong note.
    const scale = [220, 246.9, 261.6, 293.7, 329.6, 349.2, 392, 440, 523.3];
    const n = pick(scale), wrong = Math.random() < 0.08;
    this.piano(wrong ? n * 1.06 : n, 0.22);
    if (Math.random() < 0.4) setTimeout(() => this.piano(n / 2, 0.14), 140);
    this.musicT = 1.4 + Math.random() * 2.2;
  },
};

// ======================================================================
// ---------- Chapter 2: The Waiting Room ----------
// Participant 07's practice room. The same small apartment, over and over. Each time through,
// one thing has changed. Find it and stare at it until you're sure, and the door lets you go on.
// ======================================================================
// ---- High-detail textures for the apartment ----
function hiTex(w, h, draw, rx = 1, ry = 1) {
  const t = canvasTex(w, h, draw, true);
  t.repeat.set(rx, ry); t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  return t;
}
const grain = (g, w, h, amt, alpha = 0.06) => {
  const d = g.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) { const n = (Math.random() - 0.5) * amt; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; }
  g.putImageData(d, 0, 0);
};
const TX2 = {
  // faded damask wallpaper, darker toward the floor, with water stains
  wallpaper: hiTex(256, 410, (g, w, h) => {
    g.fillStyle = '#8a7656'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(255,240,210,0.05)'; g.fillRect(x, 0, 14, h); }
    g.fillStyle = 'rgba(70,50,30,0.32)';
    for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) {
      const ox = x + ((y / 64) % 2) * 32 + 16, oy = y + 32;
      g.beginPath(); g.moveTo(ox, oy - 20); g.bezierCurveTo(ox + 16, oy - 10, ox + 16, oy + 10, ox, oy + 20);
      g.bezierCurveTo(ox - 16, oy + 10, ox - 16, oy - 10, ox, oy - 20); g.fill();
      g.beginPath(); g.arc(ox, oy, 4, 0, 7); g.fillStyle = 'rgba(200,170,120,0.25)'; g.fill(); g.fillStyle = 'rgba(70,50,30,0.32)';
    }
    const fade = g.createLinearGradient(0, 0, 0, h); fade.addColorStop(0, 'rgba(0,0,0,0.05)'); fade.addColorStop(1, 'rgba(20,10,0,0.35)');
    g.fillStyle = fade; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) {
      const sx = Math.random() * w, sg = g.createLinearGradient(sx, 0, sx, h * 0.7);
      sg.addColorStop(0, 'rgba(60,40,15,0.3)'); sg.addColorStop(1, 'rgba(60,40,15,0)');
      g.fillStyle = sg; g.fillRect(sx - 6, 0, 10 + Math.random() * 14, h * 0.7);
    }
    grain(g, w, h, 14);
  }, 1, 1),
  // long wooden planks with grain
  wood: hiTex(512, 512, (g, w, h) => {
    const rows = 8, ph = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -Math.random() * 200;
      while (x < w) {
        const len = 180 + Math.random() * 220, base = 70 + Math.random() * 30;
        g.fillStyle = `rgb(${base + 30},${base * 0.62 | 0},${base * 0.38 | 0})`; g.fillRect(x, r * ph, len, ph);
        for (let k = 0; k < 7; k++) {
          g.strokeStyle = `rgba(40,20,8,${0.12 + Math.random() * 0.12})`; g.lineWidth = 1 + Math.random() * 1.5;
          g.beginPath(); const yy = r * ph + 6 + Math.random() * (ph - 12);
          for (let xx = x; xx < x + len; xx += 8) g.lineTo(xx, yy + Math.sin(xx * 0.03 + k) * 2.5);
          g.stroke();
        }
        g.fillStyle = 'rgba(20,10,4,0.6)'; g.fillRect(x, r * ph, 2, ph);
        x += len;
      }
      g.fillStyle = 'rgba(15,8,3,0.7)'; g.fillRect(0, r * ph, w, 2);
    }
    grain(g, w, h, 10);
  }, 2, 2),
  plaster: hiTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c9c0ae'; g.fillRect(0, 0, w, h); grain(g, w, h, 16);
    g.strokeStyle = 'rgba(80,70,55,0.25)'; g.lineWidth = 1;
    g.beginPath(); let x = 40, y = 0; g.moveTo(x, y); while (y < h) { x += (Math.random() - 0.5) * 20; y += 12; g.lineTo(x, y); } g.stroke();
  }, 2, 2),
  doorSlab: hiTex(256, 512, (g, w, h) => {
    g.fillStyle = '#5c3a22'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(30,15,5,${0.08 + Math.random() * 0.1})`; g.beginPath(); const xx = Math.random() * w; g.moveTo(xx, 0); g.lineTo(xx + (Math.random() - 0.5) * 20, h); g.stroke(); }
    const panel = (x, y, pw, ph) => {
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y, pw, ph);
      g.fillStyle = 'rgba(255,220,180,0.08)'; g.fillRect(x + 6, y + 6, pw - 12, ph - 12);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 3; g.strokeRect(x + 6, y + 6, pw - 12, ph - 12);
    };
    panel(30, 30, 196, 190); panel(30, 260, 196, 220);
    grain(g, w, h, 10);
  }),
  curtain: hiTex(128, 256, (g, w, h) => {
    for (let x = 0; x < w; x++) { const k = 0.6 + Math.sin(x / w * Math.PI * 6) * 0.25; g.fillStyle = `rgb(${110 * k | 0},${28 * k | 0},${30 * k | 0})`; g.fillRect(x, 0, 1, h); }
    grain(g, w, h, 8);
  }),
  rug: hiTex(256, 384, (g, w, h) => {
    g.fillStyle = '#6a1c1c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c8a050'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
    g.strokeStyle = '#1e2a4a'; g.lineWidth = 10; g.strokeRect(30, 30, w - 60, h - 60);
    for (let y = 70; y < h - 60; y += 50) for (let x = 70; x < w - 60; x += 50) {
      g.fillStyle = (x + y) % 100 ? '#c8a050' : '#1e2a4a';
      g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 14, y); g.lineTo(x, y + 14); g.lineTo(x - 14, y); g.fill();
    }
    grain(g, w, h, 18);
  }),
  // a lake at dusk, painted
  painting: hiTex(512, 384, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.55); sky.addColorStop(0, '#2a3a5a'); sky.addColorStop(0.6, '#c8805a'); sky.addColorStop(1, '#e8b880');
    g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.55);
    g.fillStyle = '#2a3428'; g.beginPath(); g.moveTo(0, h * 0.55);
    for (let x = 0; x <= w; x += 32) g.lineTo(x, h * 0.55 - 30 - Math.sin(x * 0.012) * 40 - Math.random() * 10); g.lineTo(w, h * 0.55); g.fill();
    const lake = g.createLinearGradient(0, h * 0.55, 0, h); lake.addColorStop(0, '#a0705a'); lake.addColorStop(0.3, '#3a5068'); lake.addColorStop(1, '#14202c');
    g.fillStyle = lake; g.fillRect(0, h * 0.55, w, h * 0.45);
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,220,180,0.12)'; g.fillRect(Math.random() * w, h * 0.57 + Math.random() * h * 0.3, 20 + Math.random() * 40, 2); }
    g.fillStyle = '#3a2618'; g.fillRect(w * 0.55, h * 0.72, w * 0.45, 10);
    for (let x = w * 0.57; x < w; x += 26) g.fillRect(x, h * 0.72, 5, 50);
    g.strokeStyle = '#1e2a18'; g.lineWidth = 2;
    for (let i = 0; i < 30; i++) { const x = Math.random() * w * 0.4; g.beginPath(); g.moveTo(x, h); g.lineTo(x + (Math.random() - 0.5) * 10, h - 30 - Math.random() * 50); g.stroke(); }
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${Math.random() * 255 | 0},${Math.random() * 200 | 0},${Math.random() * 150 | 0},0.04)`; g.fillRect(Math.random() * w, Math.random() * h, 3, 2); }
  }),
  photo: hiTex(256, 200, (g, w, h) => drawPhotoHQ(g, w, h, false)),
  photoIt: hiTex(256, 200, (g, w, h) => drawPhotoHQ(g, w, h, true)),
  clockFace: hiTex(256, 256, (g, w, h) => {
    const r = w / 2;
    const face = g.createRadialGradient(r, r, 10, r, r, r); face.addColorStop(0, '#f2ead6'); face.addColorStop(1, '#cbbf9e');
    g.fillStyle = face; g.beginPath(); g.arc(r, r, r, 0, 7); g.fill();
    g.fillStyle = '#2a2018'; g.font = 'bold 26px "Cormorant Garamond", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    ROMAN.forEach((n, i) => { const a = i / 12 * Math.PI * 2; g.fillText(n, r + Math.sin(a) * 96, r - Math.cos(a) * 96); });
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, l = i % 5 ? 6 : 12; g.fillRect(r + Math.sin(a) * (122 - l) - 1, r - Math.cos(a) * (122 - l) - 1, 2, 2); }
    g.font = 'italic 14px "Cormorant Garamond", serif'; g.fillText('Halvard', r, r + 48);
    grain(g, w, h, 8);
  }),
  paper: hiTex(160, 200, (g, w, h) => {
    g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(80,90,140,0.35)'; for (let y = 24; y < h; y += 12) { g.beginPath(); g.moveTo(10, y); g.lineTo(w - 10, y); g.stroke(); }
    g.fillStyle = 'rgba(40,30,25,0.75)';
    for (let y = 22; y < h - 20; y += 12) { let x = 14; while (x < w - 20) { const ww = 6 + Math.random() * 18; g.fillRect(x, y - 4, ww, 2); x += ww + 4; } }
    grain(g, w, h, 10);
  }),
  dust: (() => {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d'), rg = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    rg.addColorStop(0, 'rgba(255,240,210,1)'); rg.addColorStop(1, 'rgba(255,240,210,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  })(),
};
// An old sepia photograph: a girl and a little boy on a dock. Later, someone tall is standing in the water behind them.
function drawPhotoHQ(g, w, h, withIt) {
  g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h);
  const ix = 12, iy = 12, iw = w - 24, ih = h - 44;
  const sky = g.createLinearGradient(0, iy, 0, iy + ih * 0.5); sky.addColorStop(0, '#d8c8a4'); sky.addColorStop(1, '#c4b088');
  g.fillStyle = sky; g.fillRect(ix, iy, iw, ih * 0.5);
  const lake = g.createLinearGradient(0, iy + ih * 0.5, 0, iy + ih); lake.addColorStop(0, '#8a7a5a'); lake.addColorStop(1, '#4a3e2c');
  g.fillStyle = lake; g.fillRect(ix, iy + ih * 0.5, iw, ih * 0.5);
  g.fillStyle = '#5a4a32'; g.fillRect(ix, iy + ih * 0.5 - 10, iw, 10);
  g.fillStyle = '#4a3a24'; g.fillRect(ix + 40, iy + ih * 0.66, iw - 40, 8);                  // dock
  const kid = (x, ht, col) => { g.fillStyle = col; g.fillRect(x, iy + ih * 0.66 - ht, ht * 0.32, ht); g.beginPath(); g.arc(x + ht * 0.16, iy + ih * 0.66 - ht - 7, 7 * ht / 50, 0, 7); g.fill(); };
  kid(110, 52, '#3a2c20'); kid(150, 32, '#3a2c20');
  if (withIt) {
    g.fillStyle = '#0a0806';
    const fx = iw - 30, base = iy + ih * 0.78;
    g.fillRect(fx, base - 110, 8, 110); g.beginPath(); g.ellipse(fx + 5, base - 118, 7, 9, 0.4, 0, 7); g.fill();
    g.fillRect(fx - 5, base - 98, 2, 60); g.fillRect(fx + 11, base - 98, 2, 60);
  }
  const vg = g.createRadialGradient(w / 2, h / 2 - 14, 30, w / 2, h / 2 - 14, w * 0.6); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,25,10,0.5)');
  g.fillStyle = vg; g.fillRect(ix, iy, iw, ih);
  g.fillStyle = '#5a4a3a'; g.font = 'italic 14px "Cormorant Garamond", serif'; g.fillText('summer \'98', 18, h - 14);
  grain(g, w, h, 22);
}

const LOOP_CHANGE = [null, null, 'clock', 'painting', 'photo', 'bathroom', 'radio', 'it'];
const LAST_LOOP = 7;
let apt = {};
const std = (c, r = 0.8, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: 0 }, extra || {}));
const shadowy = (o, cast = true) => { o.traverse(m => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = true; } }); return o; };

// The clock's hands are real objects now
function setClock(h, m, sec) {
  if (!apt.hands) return;
  apt.hands.h.rotation.z = -((h % 12) + m / 60) / 12 * Math.PI * 2;
  apt.hands.m.rotation.z = -m / 60 * Math.PI * 2;
  apt.hands.s.visible = sec !== null;
  if (sec !== null) apt.hands.s.rotation.z = -sec / 60 * Math.PI * 2;
}
function drawClock(h, m, sec) { setClock(h, m, sec); }

function buildApartment() {
  if (world) scene.remove(world);
  world = new THREE.Group(); scene.add(world);
  gazeTargets = []; focusables = []; interactables = []; roomLights = [];
  W = 12; H = 10; heat = new Float32Array(W * H);
  grid = [];
  for (let y = 0; y < H; y++) grid.push(new Array(W).fill('#'));
  const carve = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = '.'; };
  carve(1, 1, 10, 2);    // entry hallway
  carve(9, 3, 10, 4);    // the turn
  carve(1, 5, 10, 8);    // living room
  grid[1][0] = 'A'; grid[7][0] = 'B'; grid[3][5] = 'R';

  // Walls: wallpapered boxes (doors are separate objects in front of them)
  const geo = new THREE.BoxGeometry(C, WALL_H, C), m4 = new THREE.Matrix4();
  const wallTex = TX2.wallpaper.clone(); wallTex.needsUpdate = true; wallTex.repeat.set(1, 1);
  const kinds = { wall: [std(0xffffff, 0.9, { map: wallTex }), c => '#AB'.includes(c)], R: [new THREE.MeshBasicMaterial({ color: 0x000000 }), c => c === 'R'] };
  for (const k in kinds) {
    const cells = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (kinds[k][1](grid[y][x])) cells.push([x, y]);
    const im = new THREE.InstancedMesh(geo, kinds[k][0], cells.length);
    cells.forEach(([x, y], i) => { m4.makeTranslation(cx(x), WALL_H / 2, cx(y)); im.setMatrixAt(i, m4); });
    im.instanceMatrix.needsUpdate = true; im.receiveShadow = true; im.castShadow = true;   // walls block lamp light
    world.add(tag(im, 'wall')); gazeTargets.push(im);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * C, H * C), std(0xffffff, 0.55, { map: (() => { const t = TX2.wood.clone(); t.needsUpdate = true; t.repeat.set(W / 2, H / 2); return t; })() }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(W * C / 2, 0, H * C / 2); floor.receiveShadow = true;
  world.add(tag(floor, 'floor')); gazeTargets.push(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W * C, H * C), std(0xffffff, 1, { map: (() => { const t = TX2.plaster.clone(); t.needsUpdate = true; t.repeat.set(W / 2, H / 2); return t; })() }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(W * C / 2, WALL_H, H * C / 2); ceil.receiveShadow = true;
  world.add(tag(ceil, 'floor')); gazeTargets.push(ceil);

  // Skirting boards and crown moulding along every wall that faces into a room
  const trim = std(0xe8dcc4, 0.6), dark = std(0x3a2414, 0.5);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (grid[y][x] !== '.') continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = grid[y + dy] && grid[y + dy][x + dx];
      if (!n || n === '.' || n === 'R') continue;
      const ex = cx(x) + dx * (C / 2 - 0.02), ez = cx(y) + dy * (C / 2 - 0.02), along = dx !== 0;
      const base = box(along ? 0.04 : C, 0.16, along ? C : 0.04, trim); base.position.set(ex, 0.08, ez); base.receiveShadow = true; world.add(base);
      const crown = box(along ? 0.08 : C, 0.12, along ? C : 0.08, trim); crown.position.set(ex - dx * 0.02, WALL_H - 0.06, ez - dy * 0.02); world.add(crown);
    }
  }

  // Doors: panelled slabs with frames, in front of the west wall
  const doorObj = (zCell, tagName) => {
    const g = new THREE.Group();
    const slab = box(0.06, 2.3, 1.05, std(0xffffff, 0.55, { map: TX2.doorSlab })); slab.position.set(0, 1.15, 0); g.add(slab);
    const frameSide = (z) => { const f = box(0.08, 2.45, 0.1, trim); f.position.set(0.01, 1.22, z); g.add(f); };
    frameSide(-0.58); frameSide(0.58);
    const top = box(0.08, 0.1, 1.26, trim); top.position.set(0.01, 2.42, 0); g.add(top);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), std(0xc8a060, 0.3, { metalness: 0.8 })); knob.position.set(0.07, 1.05, 0.38); g.add(knob);
    g.position.set(C + 0.03, 0, cx(zCell));
    world.add(tag(shadowy(g, false), tagName)); gazeTargets.push(g);
    return g;
  };
  doorObj(1, 'doorA'); doorObj(7, 'doorB');
  interactables.push({ kind: 'doorA', pos: new THREE.Vector3(cx(0) + 0.8, 1.2, cx(1)) });
  interactables.push({ kind: 'doorB', pos: new THREE.Vector3(cx(0) + 0.8, 1.2, cx(7)) });

  // ---- Lights: warm lamps, a cold window. Two of them cast real shadows. ----
  const lamp = (x, y, z, color, intensity, dist, shadow) => {
    const l = new THREE.PointLight(color, intensity, dist, 2);
    l.position.set(x, y, z);
    if (shadow) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.camera.near = 0.1; l.shadow.camera.far = dist; l.shadow.bias = -0.003; }
    world.add(l); roomLights.push({ l, base: intensity });
    return l;
  };
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, side: THREE.DoubleSide });
  const pendant = (x, z) => {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.7, 6), dark); cord.position.set(x, WALL_H - 0.35, z); world.add(cord);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.28, 20, 1, true), std(0x3a2a1c, 0.6, { side: THREE.DoubleSide })); shade.position.set(x, WALL_H - 0.82, z); world.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), glowMat); bulb.position.set(x, WALL_H - 0.9, z); world.add(bulb);
  };
  pendant(cx(3), cx(1) + 1); lamp(cx(3), WALL_H - 1.0, cx(1) + 1, 0xffb070, 2.2, 10, true);
  pendant(cx(8), cx(1) + 1); lamp(cx(8), WALL_H - 1.0, cx(1) + 1, 0xffb070, 1.2, 8, false);
  // the floor lamp by the sofa
  const fl = new THREE.Group();
  const fpole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 8), std(0x2a2018, 0.4, { metalness: 0.6 })); fpole.position.y = 0.8; fl.add(fpole);
  const fbase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.04, 16), std(0x2a2018, 0.4, { metalness: 0.6 })); fbase.position.y = 0.02; fl.add(fbase);
  const fshade = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.36, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xf0d8b0, emissive: 0xffb060, emissiveIntensity: 0.9, side: THREE.DoubleSide, roughness: 1 }));
  fshade.position.y = 1.68; fl.add(fshade);
  fl.position.set(cx(2) + 0.4, 0, cx(5) - 0.3); world.add(tag(shadowy(fl), 'prop')); gazeTargets.push(fl);
  lamp(cx(2) + 0.4, 1.6, cx(5) - 0.3, 0xffa860, 2.4, 11, true);
  // a dim sconce at the turn
  const sconce = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffc890 }));
  sconce.position.set(cx(10) + C / 2 - 0.03, 2.1, cx(3) + 1); sconce.rotation.z = Math.PI / 2; world.add(sconce);
  lamp(cx(10) + 0.6, 2.0, cx(3) + 1, 0xffb070, 0.8, 6, false);
  // moonlight through the window
  const moon = new THREE.SpotLight(0x8fa4d0, 1.6, 14, 0.6, 0.8, 1.5);
  moon.position.set(cx(6) + 1, 2.4, 9 * C - 0.2); moon.target.position.set(cx(5), 0, cx(6));
  moon.castShadow = true; moon.shadow.mapSize.set(512, 512); moon.shadow.bias = -0.002;
  world.add(moon); world.add(moon.target);
  hemi.intensity = 0.08;

  // ---- Window and curtains on the living room's south wall ----
  const win = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.5), new THREE.MeshBasicMaterial({ color: 0x5a6e98 }));
  glass.rotation.y = Math.PI; win.add(glass);
  for (const [w2, h2, x2, y2] of [[1.45, 0.08, 0, 0.75], [1.45, 0.08, 0, -0.75], [0.08, 1.58, 0.7, 0], [0.08, 1.58, -0.7, 0], [0.05, 1.5, 0, 0], [1.3, 0.05, 0, 0]]) {
    const b = box(w2, h2, 0.08, trim); b.position.set(x2, y2, -0.02); win.add(b);
  }
  win.position.set(cx(6) + 1, 1.75, 9 * C - 0.03); world.add(win);
  for (const sx of [-0.95, 0.95]) {
    const cur = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 2.4, 8, 1), std(0xffffff, 0.95, { map: TX2.curtain, side: THREE.DoubleSide }));
    const pos = cur.geometry.attributes.position; for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 18) * 0.05);
    cur.geometry.computeVertexNormals();
    cur.rotation.y = Math.PI; cur.position.set(cx(6) + 1 + sx, 1.55, 9 * C - 0.1); world.add(shadowy(cur));
  }
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.6, 8), std(0x3a2a1a, 0.4, { metalness: 0.5 })); rail.rotation.z = Math.PI / 2; rail.position.set(cx(6) + 1, 2.78, 9 * C - 0.1); world.add(rail);

  // ---- Furniture ----
  const solidAt = (x, y) => { grid[y][x] = 'k'; };
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.8), std(0xffffff, 1, { map: TX2.rug }));
  rug.rotation.x = -Math.PI / 2; rug.rotation.z = Math.PI / 2; rug.position.set(cx(5), 0.006, cx(6) + 1); rug.receiveShadow = true; world.add(rug);
  // sofa with cushions
  const sofa = new THREE.Group(), velvet = std(0x5a2428, 0.95);
  const seat = box(3.4, 0.42, 0.95, velvet); seat.position.y = 0.32; sofa.add(seat);
  const back = box(3.4, 0.75, 0.25, velvet); back.position.set(0, 0.8, -0.38); sofa.add(back);
  for (const sx of [-1.75, 1.75]) { const arm = box(0.2, 0.6, 0.95, velvet); arm.position.set(sx, 0.5, 0); sofa.add(arm); }
  for (const sx of [-1.05, 0, 1.05]) { const c = box(1.0, 0.16, 0.8, std(0x6a2c30, 0.95)); c.position.set(sx, 0.6, 0.05); c.rotation.x = -0.03; sofa.add(c); }
  for (const sx of [-1.4, 1.4]) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.12, 8), dark); lg.position.set(sx, 0.06, 0.35); sofa.add(lg); }
  sofa.position.set(cx(3) + C / 2, 0, cx(5) - 0.32); world.add(tag(shadowy(sofa), 'prop')); gazeTargets.push(sofa); solidAt(3, 5); solidAt(4, 5);
  // armchair
  const chair = new THREE.Group();
  const cs1 = box(1.0, 0.42, 0.9, std(0x3a4a3a, 0.95)); cs1.position.y = 0.3; chair.add(cs1);
  const cb = box(1.0, 0.8, 0.2, std(0x3a4a3a, 0.95)); cb.position.set(0, 0.8, -0.38); chair.add(cb);
  for (const sx of [-0.5, 0.5]) { const a = box(0.16, 0.55, 0.9, std(0x3a4a3a, 0.95)); a.position.set(sx, 0.48, 0); chair.add(a); }
  chair.position.set(cx(7), 0, cx(8)); chair.rotation.y = Math.PI + 0.5; world.add(tag(shadowy(chair), 'prop')); gazeTargets.push(chair); solidAt(7, 8);
  // bookshelf in the corner
  const shelf = new THREE.Group(), shelfWood = std(0x4a2e1a, 0.7);
  const sb = box(1.4, 2.2, 0.4, shelfWood); sb.position.y = 1.1; shelf.add(sb);
  const bookCols = [0x6a1f1f, 0x1f3a5a, 0x2a4a2a, 0x7a6a3a, 0x3a2a4a, 0x8a7a6a];
  for (let r = 0; r < 4; r++) {
    const plank = box(1.36, 0.03, 0.36, shelfWood); plank.position.set(0, 0.25 + r * 0.5, 0.03); shelf.add(plank);
    let x = -0.62;
    while (x < 0.6) { const bw = 0.04 + Math.random() * 0.05, bh = 0.3 + Math.random() * 0.12;
      const b = box(bw, bh, 0.26, std(pick(bookCols), 0.8)); b.position.set(x + bw / 2, 0.27 + r * 0.5 + bh / 2, 0.08); b.rotation.z = Math.random() < 0.1 ? 0.2 : 0; shelf.add(b); x += bw + 0.005; }
  }
  shelf.position.set(cx(10), 0, cx(8) + 0.75); shelf.rotation.y = Math.PI; world.add(tag(shadowy(shelf), 'prop')); gazeTargets.push(shelf); solidAt(10, 8);
  // side table with a plant
  const side = new THREE.Group();
  const stTop = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 20), shelfWood); stTop.position.y = 0.62; side.add(stTop);
  const stLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.6, 10), shelfWood); stLeg.position.y = 0.3; side.add(stLeg);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.22, 14), std(0x8a4a2a, 0.9)); pot.position.y = 0.75; side.add(pot);
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), std(0x2a4a24, 0.8)); leaf.scale.set(0.5, 1.6, 0.25);
    const a = i / 9 * Math.PI * 2; leaf.position.set(Math.cos(a) * 0.1, 0.98 + Math.random() * 0.1, Math.sin(a) * 0.1); leaf.rotation.set(Math.sin(a) * 0.6, a, Math.cos(a) * 0.6); side.add(leaf);
  }
  side.position.set(cx(8), 0, cx(5)); world.add(tag(shadowy(side), 'prop')); gazeTargets.push(side); solidAt(8, 5);
  // table with the photo frame and the day's diary page
  const table = new THREE.Group();
  const top = box(1.4, 0.06, 0.9, shelfWood); top.position.y = 0.72; table.add(top);
  for (const [a, b] of [[-0.6, -0.38], [0.6, -0.38], [-0.6, 0.38], [0.6, 0.38]]) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.7, 8), shelfWood); lg.position.set(a, 0.35, b); table.add(lg); }
  table.position.set(cx(5), 0, cx(7)); world.add(tag(shadowy(table), 'prop')); gazeTargets.push(table); solidAt(5, 7);
  // coat rack by the door
  const rack = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.9, 10), shelfWood); pole.position.y = 0.95; rack.add(pole);
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 1.0, 12, 1, true), std(0x2a2a34, 0.95, { side: THREE.DoubleSide })); coat.position.set(0.1, 1.25, 0); rack.add(coat);
  rack.position.set(cx(1) - 0.4, 0, cx(5) - 0.4); world.add(tag(shadowy(rack), 'prop')); gazeTargets.push(rack);

  // ---- More furniture: the apartment should feel lived in ----
  const decor = (obj, solidCell) => { world.add(tag(shadowy(obj), 'prop')); gazeTargets.push(obj); if (solidCell) solidAt(solidCell[0], solidCell[1]); return obj; };
  const brass = std(0xb08a3a, 0.35, { metalness: 0.7 });
  // hallway console table, a dark mirror above it, a bowl of keys and some unopened letters
  const console1 = new THREE.Group();
  const ctop = box(1.5, 0.05, 0.42, shelfWood); ctop.position.y = 0.85; console1.add(ctop);
  for (const sx of [-0.68, 0.68]) for (const sz of [-0.16, 0.16]) { const lg = box(0.05, 0.85, 0.05, shelfWood); lg.position.set(sx, 0.42, sz); console1.add(lg); }
  const shelfLow = box(1.4, 0.03, 0.36, shelfWood); shelfLow.position.y = 0.25; console1.add(shelfLow);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(0x2a4a5a, 0.3)); bowl.position.set(-0.4, 0.99, 0); bowl.rotation.x = Math.PI; console1.add(bowl);
  for (let i = 0; i < 3; i++) { const key = box(0.06, 0.01, 0.02, brass); key.position.set(-0.4 + (Math.random() - 0.5) * 0.1, 0.92, (Math.random() - 0.5) * 0.08); key.rotation.y = Math.random() * 3; console1.add(key); }
  for (let i = 0; i < 4; i++) { const env = box(0.24, 0.006, 0.12, std(0xe8e0d0, 0.9)); env.position.set(0.3 + (Math.random() - 0.5) * 0.08, 0.88 + i * 0.007, (Math.random() - 0.5) * 0.06); env.rotation.y = (Math.random() - 0.5) * 0.4; console1.add(env); }
  console1.position.set(cx(7), 0, C + 0.25); decor(console1, [7, 1]);
  const mirror = new THREE.Group();
  const mglass = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.05), std(0x1c242a, 0.08, { metalness: 0.95 })); mirror.add(mglass);
  for (const [w2, h2, x2, y2] of [[0.92, 0.06, 0, 0.55], [0.92, 0.06, 0, -0.55], [0.06, 1.16, 0.46, 0], [0.06, 1.16, -0.46, 0]]) { const b = box(w2, h2, 0.04, brass); b.position.set(x2, y2, 0.01); mirror.add(b); }
  mirror.position.set(cx(7), 1.75, C + 0.03); world.add(mirror);
  // shoe rack by the front door, and an umbrella stand
  const shoes = new THREE.Group();
  const srack = box(1.0, 0.04, 0.32, shelfWood); srack.position.y = 0.2; shoes.add(srack);
  const srack2 = box(1.0, 0.04, 0.32, shelfWood); srack2.position.y = 0.45; shoes.add(srack2);
  for (const sx of [-0.48, 0.48]) { const sd = box(0.03, 0.5, 0.32, shelfWood); sd.position.set(sx, 0.25, 0); shoes.add(sd); }
  for (let i = 0; i < 4; i++) { const shoe = box(0.11, 0.08, 0.26, std(pick([0x1a1a1a, 0x5a3a22, 0x8a2a2a]), 0.5)); shoe.position.set(-0.32 + i * 0.21, 0.26 + (i % 2) * 0.25, 0); shoes.add(shoe); }
  shoes.position.set(cx(2), 0, 3 * C - 0.2); decor(shoes, [2, 2]);
  const ustand = new THREE.Group();
  const ucyl = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.55, 14, 1, true), std(0x2a3a2a, 0.5, { side: THREE.DoubleSide })); ucyl.position.y = 0.28; ustand.add(ucyl);
  for (let i = 0; i < 2; i++) { const um = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.05, 0.9, 6), std(0x1a1a2a, 0.6)); um.position.set((i - 0.5) * 0.06, 0.55, 0); um.rotation.z = (i - 0.5) * 0.15; ustand.add(um); }
  ustand.position.set(C + 0.35, 0, C + 0.35); world.add(shadowy(ustand));
  // an old rotary phone on the hallway wall
  const phoneW = new THREE.Group();
  const pbase = box(0.2, 0.28, 0.08, std(0x1a1a1a, 0.3)); phoneW.add(pbase);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.015, 16), std(0xd8d0c0, 0.4)); dial.rotation.x = Math.PI / 2; dial.position.set(0, -0.03, 0.05); phoneW.add(dial);
  const handset = box(0.05, 0.3, 0.06, std(0x1a1a1a, 0.3)); handset.position.set(-0.13, 0.02, 0.05); phoneW.add(handset);
  phoneW.position.set(cx(1) + 0.6, 1.45, C + 0.05); world.add(shadowy(phoneW));
  // framed pictures (not the painting that changes; just the family's things)
  const framed = (x, y, z, w2, h2, hue, rotY = 0) => {
    const fg = new THREE.Group();
    const tex = hiTex(96, 96, g => {
      const gr = g.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, `hsl(${hue},18%,62%)`); gr.addColorStop(1, `hsl(${hue + 20},14%,36%)`);
      g.fillStyle = gr; g.fillRect(0, 0, 96, 96);
      g.fillStyle = `hsla(${hue + 180},10%,20%,0.5)`; g.beginPath(); g.ellipse(48, 58, 22 + Math.random() * 10, 30, 0, 0, 7); g.fill();
      grain(g, 96, 96, 20);
    });
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w2 - 0.08, h2 - 0.08), std(0xffffff, 0.8, { map: tex })); pic.position.z = 0.012; fg.add(pic);
    const fr = box(w2, h2, 0.02, std(0x1a120c, 0.5)); fg.add(fr);
    fg.position.set(x, y, z); fg.rotation.y = rotY; world.add(fg);
  };
  framed(cx(2) + 0.3, 1.85, C + 0.03, 0.45, 0.55, 30);
  framed(cx(9), 1.7, C + 0.03, 0.35, 0.45, 200);
  framed(cx(3) + 0.4, 1.95, 4 * C + C + 0.03, 0.55, 0.42, 90);
  framed(cx(3) + 1.6, 1.95, 4 * C + C + 0.03, 0.3, 0.42, 340);
  // moving boxes at the end of the hallway, never unpacked
  const boxes = new THREE.Group();
  for (let i = 0; i < 3; i++) { const b = box(0.65, 0.48, 0.55, std(0xa07a4a, 0.9)); b.position.set((i % 2) * 0.12, 0.24 + i * 0.48, (i % 2) * 0.1); b.rotation.y = i * 0.25; boxes.add(b); }
  boxes.position.set(cx(10) + 0.35, 0, C + 0.5); decor(boxes, [10, 1]);
  // an upright piano against the east wall, with its stool
  const piano = new THREE.Group(), pianoWood = std(0x1e120a, 0.35);
  const pb = box(0.62, 1.25, 1.5, pianoWood); pb.position.set(0, 0.62, 0); piano.add(pb);
  const keybed = box(0.3, 0.06, 1.42, pianoWood); keybed.position.set(-0.42, 0.74, 0); piano.add(keybed);
  const ivory = box(0.16, 0.025, 1.36, std(0xece6d6, 0.4)); ivory.position.set(-0.46, 0.78, 0); piano.add(ivory);
  for (let i = 0; i < 24; i++) { if ([1, 4, 8, 11, 15, 18, 22].includes(i % 24)) continue; const bk = box(0.09, 0.03, 0.025, std(0x0a0a0a, 0.3)); bk.position.set(-0.41, 0.8, -0.66 + i * 0.057); piano.add(bk); }
  const music = box(0.02, 0.28, 0.4, std(0xe8e0cc, 0.9)); music.position.set(-0.32, 1.02, 0.1); music.rotation.z = 0.2; piano.add(music);
  piano.position.set(cx(10) + 0.6, 0, cx(6)); decor(piano, [10, 6]);
  const stool = new THREE.Group();
  const stTop2 = box(0.4, 0.06, 0.6, std(0x1e120a, 0.4)); stTop2.position.y = 0.48; stool.add(stTop2);
  for (const sx of [-0.15, 0.15]) for (const sz of [-0.25, 0.25]) { const lg = box(0.04, 0.46, 0.04, std(0x1e120a, 0.4)); lg.position.set(sx, 0.23, sz); stool.add(lg); }
  stool.position.set(cx(10) - 0.35, 0, cx(6)); world.add(shadowy(stool));
  // an old CRT television on a low stand, facing the armchair
  const tv = new THREE.Group();
  const tvStand = box(1.0, 0.5, 0.5, shelfWood); tvStand.position.y = 0.25; tv.add(tvStand);
  const tvBox = box(0.7, 0.55, 0.55, std(0x2a2620, 0.5)); tvBox.position.set(0, 0.78, 0.02); tv.add(tvBox);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.4), std(0x10141a, 0.08, { metalness: 0.4 })); screen.position.set(-0.04, 0.8, -0.28); screen.rotation.y = Math.PI; tv.add(screen);
  for (const s of [-1, 1]) { const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 4), brass); ant.position.set(s * 0.12, 1.25, 0.05); ant.rotation.z = s * 0.45; tv.add(ant); }
  tv.position.set(cx(4), 0, 9 * C - 0.4); decor(tv, [4, 8]);
  // dining chairs at the table, a footstool by the armchair
  const chairAt = (x, z, rot) => {
    const ch = new THREE.Group();
    const seat2 = box(0.45, 0.05, 0.45, shelfWood); seat2.position.y = 0.46; ch.add(seat2);
    const back2 = box(0.45, 0.5, 0.04, shelfWood); back2.position.set(0, 0.74, -0.21); ch.add(back2);
    for (const sx of [-0.19, 0.19]) for (const sz of [-0.19, 0.19]) { const lg = box(0.035, 0.46, 0.035, shelfWood); lg.position.set(sx, 0.23, sz); ch.add(lg); }
    ch.position.set(x, 0, z); ch.rotation.y = rot; world.add(shadowy(ch));
  };
  chairAt(cx(5) - 0.15, cx(7) - 0.75, 0.15); chairAt(cx(5) + 0.2, cx(7) + 0.78, Math.PI - 0.3);
  const footstool = box(0.55, 0.32, 0.45, std(0x3a4a3a, 0.95)); footstool.position.set(cx(7) - 0.9, 0.16, cx(8) - 0.9); world.add(shadowy(footstool));
  // a little wall shelf with vases
  const wshelf = new THREE.Group();
  const wplank = box(0.22, 0.04, 1.2, shelfWood); wshelf.add(wplank);
  [[0x5a7a8a, 0.07, 0.22], [0xc8b090, 0.05, 0.3], [0x8a3a2a, 0.08, 0.18]].forEach(([col, r, ht], i) => {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r, ht, 14), std(col, 0.3)); v.position.set(0, ht / 2 + 0.02, -0.4 + i * 0.4); wshelf.add(v);
  });
  wshelf.position.set(C + 0.12, 1.55, cx(5) + 0.4); world.add(shadowy(wshelf));
  // a radiator under the window
  const rad = new THREE.Group();
  for (let i = 0; i < 10; i++) { const fin = box(0.06, 0.6, 0.1, std(0xd8d0c0, 0.5)); fin.position.set(-0.55 + i * 0.12, 0.42, 0); rad.add(fin); }
  rad.position.set(cx(6) + 1, 0, 9 * C - 0.1); world.add(shadowy(rad));
  // a blanket over the sofa arm, a stack of old magazines, an unlit chandelier
  const blanket = box(0.5, 0.06, 0.95, std(0x8a7a5a, 1)); blanket.position.set(cx(3) + C / 2 - 1.75, 0.82, cx(5) - 0.25); blanket.rotation.z = 0.5; world.add(shadowy(blanket));
  for (let i = 0; i < 6; i++) { const mg = box(0.3, 0.012, 0.4, std(pick([0xc84a3a, 0xe8e0d0, 0x3a6a8a, 0xd8c070]), 0.6)); mg.position.set(cx(6) - 0.3, 0.006 + i * 0.013, cx(5) + 0.2); mg.rotation.y = (Math.random() - 0.5) * 0.5; world.add(mg); }
  const chand = new THREE.Group();
  const chRod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), brass); chRod.position.y = -0.25; chand.add(chRod);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, arm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.35, 5), brass); arm.position.set(Math.cos(a) * 0.17, -0.5, Math.sin(a) * 0.17); arm.rotation.z = Math.PI / 2; arm.rotation.y = -a; chand.add(arm);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.05, 8), std(0xe8e0cc, 0.4)); cup.position.set(Math.cos(a) * 0.34, -0.47, Math.sin(a) * 0.34); chand.add(cup); }
  chand.position.set(cx(5) + 1, WALL_H, cx(6) + 1); world.add(chand);

  // ---- The things that might change ----
  // photo frame on the table
  const photo = new THREE.Group();
  const pf = box(0.34, 0.28, 0.03, std(0x2a1a10, 0.5)); photo.add(pf);
  apt.photoPic = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.235), std(0xffffff, 0.6, { map: TX2.photo }));
  apt.photoPic.position.z = 0.017; photo.add(apt.photoPic);
  const stand = box(0.03, 0.2, 0.15, std(0x2a1a10, 0.5)); stand.position.set(0, -0.06, -0.08); stand.rotation.x = 0.4; photo.add(stand);
  photo.position.set(cx(5) + 0.3, 0.89, cx(7) - 0.2); photo.rotation.set(-0.12, Math.PI + 0.5, 0);
  addSuspect('photo', shadowy(photo));
  // wall clock: wooden case, face, glass, real hands
  const clock = new THREE.Group();
  const caseM = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.08, 40), std(0x4a2a14, 0.45)); caseM.rotation.x = Math.PI / 2; clock.add(caseM);
  const faceM = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), std(0xffffff, 0.7, { map: TX2.clockFace })); faceM.position.z = 0.045; clock.add(faceM);
  const handMat = std(0x1a1410, 0.4, { metalness: 0.5 });
  const hand = (len, wd, z, col) => { const piv = new THREE.Group(); const hm = box(wd, len, 0.008, col || handMat); hm.position.y = len / 2 - 0.04; piv.add(hm); piv.position.z = z; clock.add(piv); return piv; };
  apt.hands = { h: hand(0.24, 0.035, 0.055), m: hand(0.34, 0.022, 0.06), s: hand(0.37, 0.008, 0.065, std(0x9a1a1a, 0.4)) };
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 10), std(0xc8a060, 0.3, { metalness: 0.8 })); pin.rotation.x = Math.PI / 2; pin.position.z = 0.07; clock.add(pin);
  const glassC = new THREE.Mesh(new THREE.CircleGeometry(0.43, 40), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.3 }));
  glassC.position.z = 0.08; clock.add(glassC);
  clock.position.set(cx(6), 2.15, 4 * C + C + 0.02);
  addSuspect('clock', clock);
  apt.clockPos = clock.position.clone();
  // a painted lake in a gilt frame, in the hallway
  const painting = new THREE.Group();
  const gold = std(0xb08a3a, 0.35, { metalness: 0.7 });
  for (const [w2, h2, x2, y2] of [[1.62, 0.1, 0, 0.6], [1.62, 0.1, 0, -0.6], [0.1, 1.3, 0.81, 0], [0.1, 1.3, -0.81, 0]]) { const b = box(w2, h2, 0.07, gold); b.position.set(x2, y2, 0); painting.add(b); }
  const canvasP = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 1.12), std(0xffffff, 0.85, { map: TX2.painting })); canvasP.position.z = 0.01; painting.add(canvasP);
  painting.position.set(cx(5), 1.8, C + 0.05);
  addSuspect('painting', shadowy(painting, false));
  apt.painting = painting;
  // bathroom door: hinged, panelled. Closed... at first.
  const bath = new THREE.Group();
  const hinge = new THREE.Group(); hinge.position.set(cx(5) - 0.6, 0, 3 * C - 0.03);
  const panel = box(1.2, 2.3, 0.05, std(0xffffff, 0.55, { map: TX2.doorSlab })); panel.position.set(0.6, 1.15, 0); hinge.add(panel);
  const bknob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), std(0xc8a060, 0.3, { metalness: 0.8 })); bknob.position.set(1.05, 1.05, -0.05); hinge.add(bknob);
  bath.add(hinge);
  for (const zx of [-0.68, 0.68]) { const f = box(0.1, 2.45, 0.08, trim); f.position.set(cx(5) + zx, 1.22, 3 * C - 0.02); bath.add(f); }
  const btop = box(1.46, 0.1, 0.08, trim); btop.position.set(cx(5), 2.42, 3 * C - 0.02); bath.add(btop);
  const doorway = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.3), new THREE.MeshBasicMaterial({ visible: false }));
  doorway.position.set(cx(5), 1.15, 3 * C - 0.05); doorway.rotation.y = Math.PI; bath.add(doorway);
  addSuspect('bathroom', shadowy(bath));
  apt.bathHinge = hinge; apt.bathPos = new THREE.Vector3(cx(5), 1.2, 3 * C + 0.5);
  // vintage radio on a cabinet in the corner
  const cab = new THREE.Group();
  const cbody = box(1.0, 0.8, 0.55, shelfWood); cbody.position.y = 0.4; cab.add(cbody);
  for (const sx of [-0.24, 0.24]) { const dr = box(0.44, 0.6, 0.02, std(0x5a3a22, 0.6)); dr.position.set(sx, 0.4, 0.285); cab.add(dr); }
  cab.position.set(cx(2), 0, cx(8) + 0.3); world.add(tag(shadowy(cab), 'prop')); gazeTargets.push(cab); solidAt(2, 8);
  const radio = new THREE.Group();
  const rb = box(0.52, 0.32, 0.24, std(0x6a4426, 0.45)); radio.add(rb);
  const rtop = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.52, 20, 1, false, 0, Math.PI), std(0x6a4426, 0.45)); rtop.rotation.z = Math.PI / 2; rtop.position.y = 0.16; radio.add(rtop);
  const grillM = box(0.24, 0.2, 0.01, std(0x2a2014, 1)); grillM.position.set(-0.1, 0, 0.125); radio.add(grillM);
  apt.radioLed = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.06), new THREE.MeshBasicMaterial({ color: 0x2a1600 }));
  apt.radioLed.position.set(0.14, 0.04, 0.122); radio.add(apt.radioLed);
  for (const kx of [0.09, 0.19]) { const kn = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12), std(0x1a1410, 0.4)); kn.rotation.x = Math.PI / 2; kn.position.set(kx, -0.08, 0.13); radio.add(kn); }
  radio.position.set(cx(2), 0.97, cx(8) + 0.2);
  addSuspect('radio', shadowy(radio));
  apt.radioPos = radio.position.clone();

  // diary page lives on the table
  apt.page = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.33), std(0xffffff, 0.9, { map: TX2.paper }));
  apt.page.rotation.x = -Math.PI / 2; apt.page.rotation.z = 0.2; apt.page.position.set(cx(5) - 0.3, 0.756, cx(7) + 0.1);
  world.add(tag(apt.page, 'doc', 'diary1')); gazeTargets.push(apt.page);
  apt.pageIt = { kind: 'doc', id: 'diary1', mesh: apt.page, pos: apt.page.position };
  interactables.push(apt.pageIt);

  // ---- Dust drifting through the lamplight ----
  const N = 260, dpos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const inLiving = Math.random() < 0.6;
    dpos[i * 3] = 2.2 + Math.random() * 19.5;
    dpos[i * 3 + 1] = 0.3 + Math.random() * 2.7;
    dpos[i * 3 + 2] = inLiving ? 10.2 + Math.random() * 7.6 : 2.2 + Math.random() * 3.6;
  }
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  apt.dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ map: TX2.dust, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe0b0 }));
  apt.dustBase = dpos.slice();
  world.add(apt.dust);

  scene.fog = new THREE.FogExp2(0x050403, 0.06);
  world.add(itModel);
}
// Things in the apartment that might have changed
function addSuspect(key, group) {
  world.add(tag(group, 'focus', key)); gazeTargets.push(group);
  focusables.push({ kind: 'suspect', key, group, progress: 0, done: false, time: 2.0 });
}

// Set the room up for the current loop. Changes pile up, so you have to spot the newest one.
function applyLoop() {
  const L = S.loop;
  S.change = LOOP_CHANGE[L];
  S.solved = !S.change;          // the first loop has nothing to find
  S.eyesT = 0;
  for (const f of focusables) { f.done = false; f.progress = 0; }
  apt.clockStopped = L >= 2;
  apt.painting.rotation.z = L >= 3 ? Math.PI : 0;
  apt.photoPic.material.map = L >= 4 ? TX2.photoIt : TX2.photo; apt.photoPic.material.needsUpdate = true;
  apt.bathHinge.rotation.y = L >= 5 ? -1.5 : L >= 3 ? -0.08 * (L - 2) : 0;   // creeping open, then wide
  apt.radioOn = L >= 6;
  apt.radioLed.material.color.set(apt.radioOn ? 0xff8a20 : 0x331a00);
  // a new diary page each time
  const id = 'diary' + L;
  if (DOCS[id]) { apt.page.visible = true; apt.page.userData.data = id; apt.pageIt.id = id; apt.pageIt.used = false; }
  else { apt.page.visible = false; apt.pageIt.used = true; }
  hideIt(5 + Math.random() * 6);
  if (L === LAST_LOOP) {
    // this time, the thing that changed is it
    dread = Math.max(dread, 0.3);
    showIt(cx(1) + 0.3, cx(8) - 0.2, 'final');
    setTimeout(() => { thought = { text: 'don\'t look at it', t: 2, x: 0, y: 0 }; }, 2500);
    setTimeout(() => { if (S.loop === LAST_LOOP && !S.solved) hint('You can\'t find this one by looking.', 6); }, 9000);
  }
}

function onSuspect(f) {
  if (S.solved) { f.progress = 0; hint('It looks the same as before.', 3); return; }
  if (f.key === S.change) {
    f.done = true; S.solved = true;
    AU.materialize();
    AU.noise(0.15, 1400, 0.5, 'bandpass', { x: cx(0) + 1, y: 1, z: cx(7) });   // the door unlocks
    hint(pick(['That\'s it. That\'s what changed.', 'Yes. That wasn\'t like that before.', 'There. You\'re sure now.']), 4);
    dread = clamp(dread + 0.05, 0, 1);
  } else {
    f.progress = 0; S.wrong++;
    dread = clamp(dread + 0.15, 0, 1);
    AU.sting(); IT.cool = Math.min(IT.cool, 1);
    hint(pick(['It\'s the same. It\'s always been the same.', 'No. That was always like that.', 'Are you sure that\'s how it was?']), 4);
  }
}

function tryDoorB() {
  if (S.transT > 0) return;
  if (!S.solved) { hint('It won\'t open. Something in here is different.', 3.5); dread = clamp(dread + 0.03, 0, 1); AU.bump(); return; }
  AU.doorCreak();
  S.transT = 1.6;
}

// Through the door... and you're back at the start of the hallway
function updateLoop(dt) {
  if (S.transT > 0) {
    const before = S.transT;
    S.transT -= dt;
    if (before > 0.8 && S.transT <= 0.8) {
      if (S.loop >= LAST_LOOP) { endChapter(); return; }
      S.loop++;
      P.x = cx(1); P.z = cx(1) + 1; P.yaw = -Math.PI / 2; P.pitch = 0;
      P.checkpoint = { x: P.x, z: P.z, yaw: P.yaw };
      applyLoop();
    }
  }
  // dust drifting in the lamplight
  if (apt.dust) {
    const p = apt.dust.geometry.attributes.position, b = apt.dustBase;
    for (let i = 0; i < p.count; i++) {
      p.array[i * 3] = b[i * 3] + Math.sin(time * 0.13 + i) * 0.25;
      p.array[i * 3 + 1] = b[i * 3 + 1] + Math.sin(time * 0.21 + i * 1.7) * 0.18;
      p.array[i * 3 + 2] = b[i * 3 + 2] + Math.cos(time * 0.11 + i * 0.7) * 0.25;
    }
    p.needsUpdate = true;
  }
  // the clock: ticking, or stopped at 3:33
  apt.tickT = (apt.tickT || 0) - dt;
  if (apt.tickT <= 0) {
    apt.tickT = 1;
    if (apt.clockStopped) drawClock(3, 33, null);
    else { const sec = (time | 0) % 60; drawClock(2, 14 + ((time / 60) | 0), sec); AU.tick(apt.clockPos, sec % 2 === 1); }
  }
  // the bathroom: water running, dripping
  if (S.loop >= 5 && Math.random() < dt * 1.2) AU.drip(apt.bathPos);
  if (S.loop >= 5 && Math.random() < dt * 0.15) AU.whisper(apt.bathPos, 0.25);   // the girl, crying
  if (S.loop >= 5 && !S.bathHint && Math.hypot(P.x - apt.bathPos.x, P.z - apt.bathPos.z) < 5) { S.bathHint = true; hint('Somewhere inside, a girl is crying.', 4); }
  // the radio
  if (AU.radio) {
    AU.setPos(AU.radio.p, apt.radioPos.x, apt.radioPos.y, apt.radioPos.z);
    AU.radio.g.gain.value = apt.radioOn ? 0.18 + Math.random() * 0.06 : 0;
  }
  if (apt.radioOn && !subtitles.length && Math.random() < dt * 0.08 && Math.hypot(P.x - apt.radioPos.x, P.z - apt.radioPos.z) < 9) {
    say([['RADIO', pick(['...you were supposed to be watching him...', '...the water was so cold, Mara...', '...don\'t look away...', '...she looked away...']), 4]]);
  }
  // final loop: close your eyes and let it go
  if (S.loop === LAST_LOOP && !S.solved) {
    if (!P.eyes) S.eyesT += dt; else S.eyesT = Math.max(0, S.eyesT - dt * 0.5);
    if (S.eyesT >= 4) {
      S.solved = true; hideIt(999);
      AU.noise(0.15, 1400, 0.5, 'bandpass', { x: cx(0) + 1, y: 1, z: cx(7) });
      thought = { text: 'let it go', t: 2.5, x: 0, y: 0 };
      setTimeout(() => hint('The door is unlocked.', 4), 1500);
    }
  }
}

// In the final loop, "It" is the change. Looking at it only makes it stronger, and it creeps closer while your eyes are open.
function finalLoopIt(dt) {
  const seen = inView(IT.x, IT.z, 0.86);
  if (seen) {
    dread = clamp(dread + 0.3 * dt, 0, 1);
    if (!IT.wasSeen) { IT.wasSeen = true; S.timesSeen++; AU.sting(); }
  } else IT.wasSeen = false;
  IT.stepT -= dt;
  if (P.eyes && !seen && IT.stepT <= 0) {
    IT.stepT = 2.2 - dread * 1.4;
    const vx = P.x - IT.x, vz = P.z - IT.z, vd = Math.hypot(vx, vz) || 1, j = Math.min(vd - 0.6, 0.9);
    const nx = IT.x + vx / vd * j, nz = IT.z + vz / vd * j;
    if (!solid(nx, nz)) { IT.x = nx; IT.z = nz; AU.noise(0.25, 220, 0.5, 'lowpass', { x: IT.x, y: 1, z: IT.z }); }
  }
  if (Math.hypot(IT.x - P.x, IT.z - P.z) < 1.25) { caught(); return; }
  itModel.visible = true;
  itModel.position.set(IT.x, 0, IT.z);
  itModel.rotation.y = Math.atan2(P.x - IT.x, P.z - IT.z);
  itModel.userData.smears.forEach(s => { s.position.set((Math.random() - 0.5) * 0.15, 0, (Math.random() - 0.5) * 0.15); });
  if (AU.breath) { AU.setPos(AU.breath.p, IT.x, 2.4, IT.z); AU.breath.g.gain.value = (0.3 + Math.sin(time * 1.7) * 0.15) * (P.eyes ? 1 : 2); }
}

// ======================================================================
// ---------- Chapter 3: The Archive ----------
// Every session was recorded. Three tapes explain Project White Bear; Teo left the last one himself.
// The restricted vault is behind a door you have to look into existence. The far stacks are dark,
// and something is searching them: you cross with your eyes closed, following a tape machine left running.
// ======================================================================
let TX3 = null;
function makeTX3() { TX3 = {
  // painted cinder block, beige over a brown band
  wall: hiTex(256, 410, (g, w, h) => {
    g.fillStyle = '#b8ab92'; g.fillRect(0, 0, w, h); grain(g, w, h, 10);
    g.fillStyle = 'rgba(60,50,35,0.35)';
    for (let y = 0; y < h; y += 34) { g.fillRect(0, y, w, 3); for (let x = ((y / 34) % 2) * 64; x < w; x += 128) g.fillRect(x, y, 3, 34); }
    g.fillStyle = '#5a4630'; g.fillRect(0, 300, w, h - 300); g.fillStyle = '#3a2c1e'; g.fillRect(0, 296, w, 5);
    for (let i = 0; i < 4; i++) { const sx = Math.random() * w, sg = g.createLinearGradient(sx, 0, sx, h * 0.8); sg.addColorStop(0, 'rgba(60,45,20,0.3)'); sg.addColorStop(1, 'rgba(60,45,20,0)'); g.fillStyle = sg; g.fillRect(sx, 0, 4 + Math.random() * 8, h); }
    const grime = g.createLinearGradient(0, h * 0.7, 0, h); grime.addColorStop(0, 'rgba(0,0,0,0)'); grime.addColorStop(1, 'rgba(15,10,5,0.5)'); g.fillStyle = grime; g.fillRect(0, 0, w, h);
  }),
  // sealed concrete, aisle lines, stains
  floor: hiTex(512, 512, (g, w, h) => {
    g.fillStyle = '#6e6a62'; g.fillRect(0, 0, w, h); grain(g, w, h, 18);
    for (let i = 0; i < 25; i++) { const rg = g.createRadialGradient(0, 0, 0, 0, 0, 60); g.save(); g.translate(Math.random() * w, Math.random() * h); rg.addColorStop(0, `rgba(${Math.random() < 0.5 ? '30,24,15' : '150,145,130'},0.18)`); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(-60, -60, 120, 120); g.restore(); }
    g.fillStyle = 'rgba(20,18,14,0.5)'; g.fillRect(0, 255, w, 2); g.fillRect(255, 0, 2, h);
    g.strokeStyle = 'rgba(25,22,18,0.4)'; g.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 14; k++) { x += (Math.random() - 0.5) * 30; y += (Math.random() - 0.3) * 20; g.lineTo(x, y); } g.stroke(); }
  }, 1, 1),
  ceil: hiTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5a5852'; g.fillRect(0, 0, w, h); grain(g, w, h, 16);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 120, w, 8);
  }, 1, 1),
  door: hiTex(256, 410, (g, w, h) => {
    g.fillStyle = '#5a6266'; g.fillRect(0, 0, w, h); grain(g, w, h, 10);
    g.fillStyle = '#3a4246'; g.fillRect(28, 40, 200, 370);
    g.fillStyle = '#d8d4c8'; g.fillRect(58, 90, 140, 54);
    g.fillStyle = '#1a1a1a'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('WING C', 128, 116); g.font = '13px sans-serif'; g.fillText('RESIDENTIAL', 128, 136);
    g.fillStyle = '#8a8e90'; g.fillRect(40, 250, 176, 10);
  }),
  sign: (text, sub) => hiTex(256, 96, (g, w, h) => {
    g.fillStyle = '#1e2a3a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8c4b4'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#e8e4d4'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText(text, w / 2, sub ? 50 : 62);
    if (sub) { g.font = '16px sans-serif'; g.fillText(sub, w / 2, 76); }
  }),
  catalog: hiTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6a4424'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
      const px = 8 + x * 41, py = 8 + y * 41;
      g.fillStyle = '#7a5230'; g.fillRect(px, py, 36, 36); g.fillStyle = '#e8dcc0'; g.fillRect(px + 9, py + 6, 18, 9);
      g.fillStyle = '#c8a050'; g.beginPath(); g.arc(px + 18, py + 25, 3, 0, 7); g.fill();
    }
    grain(g, w, h, 10);
  }),
  label: hiTex(128, 64, (g, w, h) => {
    g.fillStyle = '#e8e0c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2a'; g.font = 'bold 18px monospace'; g.fillText('PWB-' + (100 + (Math.random() * 899 | 0)), 8, 28);
    g.font = '12px monospace'; g.fillText('SESSION TAPES', 8, 48);
  }),
}; }

const ARCHIVE_TAPES = {
  tape1: { title: 'TAPE 1 — orientation, 1998', lines: [
    ['DR. LUND', 'Project White Bear. Session one. We do not teach them to forget.', 5],
    ['DR. LUND', 'We teach them to put it somewhere else.', 4.5],
    ['DR. LUND', 'The mind is a house. We are simply... closing doors.', 5],
    ['DR. LUND', 'What happens to the rooms behind the doors is not our concern.', 5.5]] },
  tape2: { title: 'TAPE 2 — Session 41, Subject 14', lines: [
    ['DR. LUND', 'Mara. Tell me what you see.', 4],
    ['MARA, AGE 14', 'There\'s someone in the corner. He\'s really tall.', 5],
    ['DR. LUND', 'Don\'t look at him. Look at me. What happened at the lake?', 5],
    ['MARA, AGE 14', '...What lake?', 3.5],
    ['DR. LUND', 'Good. Very good.', 3],
    ['DR. LUND', '...He\'s closer now, isn\'t he.', 4.5]] },
  tape3: { title: 'TAPE 3 — Teo, last week', lines: [
    ['TEO', 'Mara. It\'s me. I found the tapes. I found you.', 5],
    ['TEO', 'It\'s made of the lake. Of that afternoon. Everything you weren\'t allowed to feel, they put in one place... and it grew.', 7],
    ['TEO', 'I\'m going to the lake wing. Wing C. If it\'s yours, maybe it\'ll listen to me.', 6],
    ['TEO', 'And Mara... it wasn\'t your fault. I was six. I ran off the end of the dock. Not you.', 7]] },
};

function buildArchive() {
  if (!TX3) makeTX3();
  if (world) scene.remove(world);
  world = new THREE.Group(); scene.add(world);
  gazeTargets = []; focusables = []; interactables = []; roomLights = [];
  W = 28; H = 22; heat = new Float32Array(W * H);
  grid = [];
  for (let y = 0; y < H; y++) grid.push(new Array(W).fill('#'));
  const carve = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = '.'; };
  carve(1, 1, 7, 6);                    // records office
  grid[3][8] = '.'; grid[4][8] = '.';   // into the stacks
  carve(9, 1, 26, 9);                   // the stacks
  for (const x of [11, 14, 17, 20, 23]) for (let y = 2; y <= 8; y++) if (y !== 5) grid[y][x] = 'K';
  carve(9, 11, 15, 15);                 // restricted vault
  grid[10][12] = 'G';                   // ...behind a door that isn't there
  carve(17, 11, 26, 20);                // the dark stacks
  grid[10][24] = '.';
  for (let x = 17; x <= 24; x++) grid[14][x] = 'K';
  for (let x = 19; x <= 26; x++) grid[17][x] = 'K';
  grid[19][16] = 'X';                   // the door to Wing C

  // ---- walls, floor, ceiling ----
  const geo = new THREE.BoxGeometry(C, WALL_H, C), m4 = new THREE.Matrix4();
  const wt = TX3.wall;
  const kinds = { '#': [std(0xffffff, 0.9, { map: wt }), 'wall'], X: [std(0xffffff, 0.45, { map: TX3.door, metalness: 0.4 }), 'exit'] };
  for (const k in kinds) {
    const cells = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === k) cells.push([x, y]);
    const im = new THREE.InstancedMesh(geo, kinds[k][0], cells.length);
    cells.forEach(([x, y], i) => { m4.makeTranslation(cx(x), WALL_H / 2, cx(y)); im.setMatrixAt(i, m4); });
    im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = true;
    world.add(tag(im, kinds[k][1])); gazeTargets.push(im);
  }
  const ft = TX3.floor.clone(); ft.needsUpdate = true; ft.repeat.set(W / 2, H / 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * C, H * C), std(0xffffff, 0.35, { map: ft }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(W * C / 2, 0, H * C / 2); floor.receiveShadow = true;
  world.add(tag(floor, 'floor')); gazeTargets.push(floor);
  const ct = TX3.ceil.clone(); ct.needsUpdate = true; ct.repeat.set(W / 2, H / 2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W * C, H * C), std(0xffffff, 1, { map: ct }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(W * C / 2, WALL_H, H * C / 2); ceil.receiveShadow = true;
  world.add(tag(ceil, 'floor')); gazeTargets.push(ceil);

  // ---- the shelving: tall steel frames, crammed with file boxes (all instanced, so it stays fast) ----
  const shelfCells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === 'K') shelfCells.push([x, y]);
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const steel = std(0x6a6e70, 0.5, { metalness: 0.6 }), cardboard = std(0xffffff, 0.9);
  const uprights = new THREE.InstancedMesh(unit, steel, shelfCells.length * 4);
  const planks = new THREE.InstancedMesh(unit, steel, shelfCells.length * 5);
  const boxes = new THREE.InstancedMesh(unit, cardboard, shelfCells.length * 5 * 5);
  const q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), col = new THREE.Color();
  let ui = 0, pi = 0, bi = 0;
  const boxCols = [0xb89a6a, 0xa88a5a, 0xc8b08a, 0x8a7a5a, 0xd8d0b8, 0x9a7a4a];
  for (const [x, y] of shelfCells) {
    const ox = cx(x), oz = cx(y);
    for (const [dx, dz] of [[-0.95, -0.95], [0.95, -0.95], [-0.95, 0.95], [0.95, 0.95]]) {
      m4.compose(pos.set(ox + dx, 1.4, oz + dz), q, sc.set(0.05, 2.8, 0.05)); uprights.setMatrixAt(ui++, m4);
    }
    for (let s = 0; s < 5; s++) {
      const sy = 0.12 + s * 0.6;
      m4.compose(pos.set(ox, sy, oz), q, sc.set(1.95, 0.03, 1.95)); planks.setMatrixAt(pi++, m4);
      let off = -0.9;
      for (let b = 0; b < 5; b++) {
        if (Math.random() < 0.18) { off += 0.38; continue; }   // gaps you can see through
        const bw = 0.3 + Math.random() * 0.08, bh = 0.32 + Math.random() * 0.12;
        m4.compose(pos.set(ox + off + bw / 2, sy + 0.015 + bh / 2, oz + (Math.random() - 0.5) * 0.3), q, sc.set(bw, bh, 0.42 + Math.random() * 0.15));
        boxes.setMatrixAt(bi, m4); boxes.setColorAt(bi, col.setHex(pick(boxCols))); bi++;
        off += bw + 0.05;
      }
    }
  }
  boxes.count = bi;
  for (const im of [uprights, planks, boxes]) { im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; world.add(tag(im, 'wall')); gazeTargets.push(im); }
  if (boxes.instanceColor) boxes.instanceColor.needsUpdate = true;

  // ---- skirting ----
  const rubber = std(0x1a1a1a, 0.9);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (grid[y][x] !== '.') continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = grid[y + dy] && grid[y + dy][x + dx];
      if (n !== '#' && n !== 'X') continue;
      const along = dx !== 0, sk = box(along ? 0.03 : C, 0.12, along ? C : 0.03, rubber);
      sk.position.set(cx(x) + dx * (C / 2 - 0.015), 0.06, cx(y) + dy * (C / 2 - 0.015)); world.add(sk);
    }
  }

  // ---- furniture ----
  const wood = std(0x5a3a22, 0.6), darkWood = std(0x3a2414, 0.55), brass = std(0xb08a3a, 0.35, { metalness: 0.7 });
  const add = (o, solidCell) => { world.add(tag(shadowy(o), 'prop')); gazeTargets.push(o); if (solidCell) grid[solidCell[1]][solidCell[0]] = 'k'; return o; };
  const table = (x, z, wdt = 1.6, dep = 0.85, rot = 0) => {
    const g = new THREE.Group();
    const top = box(wdt, 0.06, dep, wood); top.position.y = 0.76; g.add(top);
    for (const sx of [-wdt / 2 + 0.06, wdt / 2 - 0.06]) for (const sz of [-dep / 2 + 0.06, dep / 2 - 0.06]) { const l = box(0.06, 0.76, 0.06, darkWood); l.position.set(sx, 0.38, sz); g.add(l); }
    g.position.set(x, 0, z); g.rotation.y = rot; return g;
  };
  // a green-shaded banker's lamp: the only warm light down here
  const bankersLamp = (x, y, z, shadow) => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.03, 16), brass); g.add(base);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8), brass); stem.position.y = 0.16; g.add(stem);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 0.12, 20, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1a6a3a, emissive: 0x1a6a3a, emissiveIntensity: 0.7, roughness: 0.2, side: THREE.DoubleSide }));
    shade.rotation.set(Math.PI / 2, 0, Math.PI / 2); shade.position.set(0, 0.34, 0); shade.scale.set(1, 1.6, 1); g.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe0a0 })); bulb.position.y = 0.31; g.add(bulb);
    g.position.set(x, y, z); world.add(shadowy(g, false));
    const l = new THREE.PointLight(0xffc880, 1.3, 7, 2); l.position.set(x, y + 0.25, z);
    if (shadow) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.camera.near = 0.05; l.shadow.camera.far = 7; l.shadow.bias = -0.003; }
    world.add(l); roomLights.push({ kind: 'steady', l, base: 1.3 });
  };
  // caged bulbs hanging over the stacks
  const cagedBulb = (x, z, intensity, flicker) => {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.6, 5), rubber); cord.position.set(x, WALL_H - 0.3, z); world.add(cord);
    const bm = new THREE.MeshStandardMaterial({ color: 0xffeecc, emissive: 0xffe0b0, emissiveIntensity: 2 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), bm); bulb.position.set(x, WALL_H - 0.66, z); world.add(bulb);
    for (let i = 0; i < 4; i++) { const wire = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.005, 4, 16), steel); wire.position.set(x, WALL_H - 0.66, z); wire.rotation.y = i * Math.PI / 4; world.add(wire); }
    const l = new THREE.PointLight(0xffe2c0, intensity, 10, 2); l.position.set(x, WALL_H - 0.75, z); world.add(l);
    roomLights.push({ kind: flicker ? 'flicker' : 'steady', l, base: intensity, bm });
  };
  // records office
  add(table(cx(3), cx(2) + 0.2, 1.8, 0.9), [3, 2]);
  bankersLamp(cx(3) - 0.5, 0.79, cx(2) + 0.1, true);
  const typewriter = new THREE.Group();
  typewriter.add(at(box(0.42, 0.12, 0.34, std(0x1a1a1a, 0.4)), 0, 0.06, 0));
  typewriter.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.46, 12), std(0x1a1a1a, 0.4)), 0, 0.16, -0.12)); typewriter.children[1].rotation.z = Math.PI / 2;
  typewriter.position.set(cx(3) + 0.35, 0.79, cx(2) + 0.15); world.add(shadowy(typewriter));
  const reel = new THREE.Group();   // a reel-to-reel tape deck
  reel.add(at(box(0.6, 0.45, 0.25, std(0x3a3a3a, 0.5)), 0, 0.22, 0));
  for (const sx of [-0.14, 0.14]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 24), std(0x9a9a9a, 0.3, { metalness: 0.7 })); r.rotation.x = Math.PI / 2; r.position.set(sx, 0.3, 0.135); reel.add(r); }
  reel.position.set(cx(6), 0, cx(1) - 0.45); add(reel);
  const catalog = new THREE.Group();
  catalog.add(at(box(1.0, 1.2, 0.5, std(0xffffff, 0.6, { map: TX3.catalog })), 0, 0.6, 0));
  catalog.position.set(cx(1) - 0.45, 0, cx(5)); catalog.rotation.y = Math.PI / 2; add(catalog, [1, 5]);
  for (let i = 0; i < 2; i++) { const fc = new THREE.Group(); fc.add(at(box(0.5, 1.3, 0.6, std(0x7a7e74, 0.5, { metalness: 0.4 })), 0, 0.65, 0)); for (let d = 0; d < 4; d++) fc.add(at(box(0.12, 0.02, 0.02, brass), 0, 0.2 + d * 0.31, 0.31)); fc.position.set(cx(7) + 0.55, 0, cx(5 + i * 0) + (i - 0.5) * 0.6); fc.rotation.y = -Math.PI / 2; world.add(shadowy(fc)); }
  const sign1 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.38), std(0xffffff, 0.6, { map: TX3.sign('ARCHIVE B', 'Records & Session Tapes') })); sign1.position.set(cx(4), 2.5, C + 0.03); world.add(sign1);
  // the stacks: row signs, a reading table, a book cart, a ladder
  ['1', '2', '3', '4', '5'].forEach((r, i) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), std(0xffffff, 0.6, { map: TX3.sign('ROW ' + r) })); s.position.set(cx([11, 14, 17, 20, 23][i]), 2.95, cx(1) + 0.98); world.add(s); });
  add(table(cx(15) + 1, cx(9), 1.6, 0.8), null);
  bankersLamp(cx(15) + 0.5, 0.79, cx(9) - 0.1, false);
  const cart = new THREE.Group();
  for (const yy of [0.25, 0.75]) cart.add(at(box(0.9, 0.04, 0.45, darkWood), 0, yy, 0));
  for (const sx of [-0.42, 0.42]) cart.add(at(box(0.04, 0.9, 0.45, darkWood), sx, 0.45, 0));
  for (let i = 0; i < 9; i++) { const b = box(0.06, 0.28, 0.32, std(pick([0x6a1f1f, 0x1f3a5a, 0x5a4a2a, 0x2a4a2a]), 0.8)); b.position.set(-0.36 + i * 0.09, 0.42, 0); cart.add(b); }
  cart.position.set(cx(25) + 0.3, 0, cx(2)); cart.rotation.y = 0.3; add(cart);
  const ladder = new THREE.Group();
  for (const sx of [-0.22, 0.22]) { const rail = box(0.05, 2.6, 0.05, darkWood); rail.position.set(sx, 1.3, 0); ladder.add(rail); }
  for (let i = 0; i < 8; i++) ladder.add(at(box(0.44, 0.03, 0.05, darkWood), 0, 0.3 + i * 0.3, 0));
  ladder.position.set(cx(16) + 0.2, 0, cx(3)); ladder.rotation.set(-0.25, Math.PI / 2, 0); world.add(shadowy(ladder));
  cagedBulb(cx(12) + 1, cx(3), 1.2, false); cagedBulb(cx(18) + 1, cx(3), 1.0, true); cagedBulb(cx(24) + 1, cx(4), 1.0, false);
  cagedBulb(cx(15) + 1, cx(7), 0.9, true); cagedBulb(cx(21) + 1, cx(7), 0.9, false);
  // papers spilling out on the floor of the stacks
  const paperMat = std(0xe0d8c4, 0.95, { side: THREE.DoubleSide });
  for (let i = 0; i < 50; i++) {
    let x, y; do { x = 1 + Math.floor(Math.random() * (W - 2)); y = 1 + Math.floor(Math.random() * (H - 2)); } while (grid[y][x] !== '.');
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29), paperMat);
    p.rotation.x = -Math.PI / 2; p.rotation.z = Math.random() * 6; p.position.set(cx(x) + (Math.random() - 0.5) * 1.6, 0.004 + Math.random() * 0.003, cx(y) + (Math.random() - 0.5) * 1.6); world.add(p);
  }
  // the vault: shelves of tape reels, a warning light
  for (let r = 0; r < 3; r++) {
    const rack = new THREE.Group();
    rack.add(at(box(1.6, 2.0, 0.4, steel), 0, 1.0, 0));
    for (let s = 0; s < 4; s++) for (let k = 0; k < 6; k++) { const tape = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.025, 18), std(pick([0x2a2a2a, 0x8a2a1a, 0x1a3a5a]), 0.4)); tape.rotation.z = Math.PI / 2; tape.position.set(-0.6 + k * 0.24, 0.3 + s * 0.45, 0.22); rack.add(tape); }
    rack.position.set(cx(9 + r * 3) + 0.4, 0, cx(15) + 0.75); rack.rotation.y = Math.PI; add(rack);
  }
  add(table(cx(12), cx(13), 1.4, 0.8), [12, 13]);
  const vsign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.4), std(0xffffff, 0.6, { map: TX3.sign('RESTRICTED', 'Authorised staff only') })); vsign.position.set(cx(12), 2.75, 10 * C + C - 0.03); vsign.rotation.y = Math.PI; world.add(vsign);
  const redl = new THREE.PointLight(0xff2a14, 0.9, 9, 2); redl.position.set(cx(12), 2.8, cx(13)); world.add(redl);
  const redMat = new THREE.MeshStandardMaterial({ color: 0x551010, emissive: 0xff2010, emissiveIntensity: 1 });
  const redDome = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), redMat); redDome.rotation.x = Math.PI; redDome.position.set(cx(12), WALL_H, cx(13)); world.add(redDome);
  roomLights.push({ kind: 'emergency', l: redl, mat: redMat, phase: 0 });
  // Teo's corner in the dark stacks: a sleeping bag, a backpack, a lantern turned right down, notes pinned to the shelf
  const camp = new THREE.Group();
  const bag = box(0.8, 0.12, 1.9, std(0x2a4a3a, 0.9)); bag.position.set(0, 0.06, 0); camp.add(bag);
  const pillow = box(0.5, 0.12, 0.3, std(0x6a6a5a, 0.9)); pillow.position.set(0, 0.14, -0.75); camp.add(pillow);
  const pack = box(0.4, 0.55, 0.25, std(0x6a3a1a, 0.8)); pack.position.set(0.7, 0.28, -0.5); pack.rotation.y = 0.4; camp.add(pack);
  for (let i = 0; i < 3; i++) { const can = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.11, 10), std(0x9a9a9a, 0.4, { metalness: 0.6 })); can.position.set(-0.6 + i * 0.12, 0.055, 0.6 + (i % 2) * 0.1); camp.add(can); }
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.22, 12), new THREE.MeshStandardMaterial({ color: 0x3a3020, emissive: 0xff9a40, emissiveIntensity: 0.8 }));
  lantern.position.set(0.6, 0.11, 0.4); camp.add(lantern);
  camp.position.set(cx(18), 0, cx(19)); world.add(shadowy(camp, false));
  const lanternLight = new THREE.PointLight(0xff9a40, 0.35, 4, 2); lanternLight.position.set(cx(18) + 0.6, 0.4, cx(19) + 0.4); world.add(lanternLight);
  for (let i = 0; i < 5; i++) { const note = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), std(0xe8e0c8, 0.9)); note.position.set(cx(18) - 0.6 + i * 0.3, 1.1 + (i % 2) * 0.3, cx(17) + 1.03); note.rotation.z = (Math.random() - 0.5) * 0.3; world.add(note); }
  const wsign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.34), std(0xffffff, 0.6, { map: TX3.sign('WING C', '— the lake wing —') })); wsign.position.set(17 * C + 0.04, 2.75, cx(19)); wsign.rotation.y = Math.PI / 2; world.add(wsign);

  // ---- the vault door: a painted-on outline until you look at it properly ----
  const ghostDoor = new THREE.Group();
  for (const [x, y, z, w2, h2, d2] of [[-0.85, 1.3, 0, 0.15, 2.6, C], [0.85, 1.3, 0, 0.15, 2.6, C], [0, 2.65, 0, 1.85, 0.15, C], [0, 1.3, 0.6, 1.5, 2.5, 0.12]]) {
    const b = box(w2, h2, d2, placeholder); b.position.set(x, y, z); ghostDoor.add(b);
  }
  ghostDoor.position.set(cx(12), 0, cx(10));
  addFocusable('door', ghostDoor, [[12, 10]], new THREE.Vector3(cx(12), 1.4, cx(10)), 1, 2.6);

  // ---- documents and tapes ----
  const docAt = (x, y, z, id) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.33), std(0xffffff, 0.9, { map: TX2.paper }));
    p.rotation.x = -Math.PI / 2; p.rotation.z = (Math.random() - 0.5) * 0.6; p.position.set(x, y, z);
    world.add(tag(p, 'doc', id)); gazeTargets.push(p);
    interactables.push({ kind: 'doc', id, mesh: p, pos: p.position });
  };
  docAt(cx(3) - 0.1, 0.8, cx(2) + 0.3, 'a_log');
  docAt(cx(1) + 0.25, 1.21, cx(5), 'a_card');
  docAt(cx(15) + 1.2, 0.8, cx(9), 'a_intake');
  docAt(cx(25) + 0.3, 0.78, cx(2), 'a_p07');
  docAt(cx(12) + 0.4, 0.8, cx(13) + 0.1, 'a_lund');
  docAt(cx(18) + 0.3, 0.14, cx(19) - 0.7, 'a_teo');
  const tapeAt = (x, y, z, id) => {
    const g = new THREE.Group();
    g.add(box(0.11, 0.018, 0.07, std(0x1a1a1a, 0.4)));
    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.04), std(0xffffff, 0.8, { map: TX3.label })); lbl.rotation.x = -Math.PI / 2; lbl.position.y = 0.011; g.add(lbl);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfff0d0 })); glint.position.set(0.04, 0.02, 0); g.add(glint);
    g.position.set(x, y, z); g.rotation.y = Math.random() * 3;
    world.add(tag(g, 'tape', id)); gazeTargets.push(g);
    interactables.push({ kind: 'tape', id, mesh: g, pos: g.position });
  };
  tapeAt(cx(25) + 0.1, 0.79, cx(2) + 0.1, 'tape1');
  tapeAt(cx(12) - 0.3, 0.8, cx(13) - 0.1, 'tape2');
  tapeAt(cx(18) - 0.15, 0.13, cx(19) + 0.2, 'tape3');
  interactables.push({ kind: 'exit', pos: new THREE.Vector3(cx(16) + 0.8, 1.2, cx(19)) });

  // ---- dust in the air, dim fog ----
  const N = 380, dpos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    let x, y; do { x = 1 + Math.floor(Math.random() * (W - 2)); y = 1 + Math.floor(Math.random() * (H - 2)); } while (grid[y][x] === '#');
    dpos[i * 3] = cx(x) + (Math.random() - 0.5) * C; dpos[i * 3 + 1] = 0.3 + Math.random() * 2.7; dpos[i * 3 + 2] = cx(y) + (Math.random() - 0.5) * C;
  }
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  instDust = new THREE.Points(dgeo, new THREE.PointsMaterial({ map: TX2.dust, size: 0.03, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe8c8 }));
  instDust.userData.base = dpos.slice();
  world.add(instDust);

  scene.fog = new THREE.FogExp2(0x030202, 0.065);
  hemi.intensity = 0.05;
  world.add(itModel);
}

// Archive lights: steady lamps, flickering bulbs, the vault's red light; the dark stacks stay dark.
function updateArchiveLights() {
  if (instDust) {
    const p = instDust.geometry.attributes.position, b = instDust.userData.base;
    for (let i = 0; i < p.count; i++) { p.array[i * 3] = b[i * 3] + Math.sin(time * 0.12 + i) * 0.25; p.array[i * 3 + 1] = b[i * 3 + 1] + Math.sin(time * 0.2 + i * 1.7) * 0.18; }
    p.needsUpdate = true;
  }
  for (const L of roomLights) {
    if (L.kind === 'flicker') {
      const on = Math.random() > 0.04;
      L.l.intensity = on ? L.base * (0.85 + Math.random() * 0.15) : 0; if (L.bm) L.bm.emissiveIntensity = on ? 2 : 0.1;
      if (!on && Math.random() < 0.3) AU.flicker();
    } else if (L.kind === 'emergency') {
      const k = 0.55 + Math.sin(time * 2 + L.phase) * 0.4; L.l.intensity = k; L.mat.emissiveIntensity = 0.3 + k * 1.2;
    }
  }
  // a tape machine left running in Teo's corner: something to follow in the dark
  if (AU.radio) {
    AU.setPos(AU.radio.p, cx(18), 0.4, cx(19));
    AU.radio.g.gain.value = S.hall ? 0.12 + Math.sin(time * 6) * 0.03 : 0;
    if (S.hall && Math.random() < 0.01 && Math.hypot(P.x - cx(18), P.z - cx(19)) < 14) AU.whisper({ x: cx(18), y: 0.5, z: cx(19) }, 0.18);
  }
}

function playTape(id) {
  const t = ARCHIVE_TAPES[id];
  S.tapes.add(id);
  AU.click(); setTimeout(() => AU.click(), 250);
  hint(t.title, 4);
  say(t.lines);
  S.tapeHissT = t.lines.reduce((a, l) => a + l[2], 0);
}

// ---------- State ----------
let state = 'title', time = 0, dread = 0;
const P = { x: 0, z: 0, yaw: 0, pitch: 0, eyes: true, reading: null, checkpoint: null };
let S;   // story flags
let subtitles = [], hints = [], thought = null, caughtT = 0, gaze = null, focusing = null;
let heat = new Float32Array(30 * 21);
let stepAcc = 0, heartT = 0, thoughtT = 20, bumpT = 0, walkPhase = 0, ambientT = 5;

function newGame(ch = 1) {
  chapter = ch;
  S = { power: false, recorder: false, eyesTaught: false, firstSight: false, hall: false, ended: false, read: new Set(),
        forbiddenRead: 0, timesSeen: 0, timesCaught: 0, pitHint: false, doorHint: false, zone: '', powerT: -1,
        loop: 1, solved: true, eyesT: 0, wrong: 0, transT: 0, tapes: new Set(), tapeHissT: 0 };
  dread = 0; subtitles = []; hints = []; thought = null; P.reading = null; P.eyes = true;
  Object.assign(IT, { state: 'gone', cool: 6, fade: 0 });
  buildWorld();
  heat.fill(0);
  if (chapter === 2) {
    P.x = cx(1); P.z = cx(1) + 1; P.yaw = -Math.PI / 2; P.pitch = 0;
    applyLoop();
    hint('Same room. Every time. Remember it.', 6);
  } else if (chapter === 3) {
    P.x = cx(2); P.z = cx(3) + 0.5; P.yaw = -Math.PI / 2; P.pitch = 0;
    hint('Archive B. Every session they ever recorded is down here.', 6);
  } else {
    P.x = cx(2); P.z = cx(4); P.yaw = -Math.PI / 2; P.pitch = 0;
    hint('WASD move  ·  mouse look  ·  E interact  ·  hold SPACE to close your eyes', 8);
  }
  P.checkpoint = { x: P.x, z: P.z, yaw: P.yaw };
}
function hint(text, t = 5) { hints.push({ text, t }); }
function say(lines) { subtitles = lines.map(l => ({ text: l[1], who: l[0], dur: l[2] || 5 })); subT = 0; }
let subT = 0;

// ---------- Documents ----------
// Anything that names or describes "It" is forbidden. Reading it makes it stronger.
const DOCS = {
  brochure: { title: 'Halvard Institute for Cognitive Research', forbidden: false,
    body: 'SUMMER VOLUNTEER PROGRAM — 1998<br><br>Paid participation for young people aged 13–17.<br>Room and board provided. Six weeks.<br><br>"Learn to quiet your mind."<br><br><i>Project White Bear is a study of healthy forgetting.</i>' },
  teoNote: { title: 'A note, in Teo\'s handwriting', forbidden: false,
    body: 'Generator room is through the east offices.<br><br>The corridor isn\'t there unless you LOOK at it. Properly look. Like you mean it.<br><br>I\'m not crazy.<br><br>— T' },
  session41: { title: 'Session Log 41', forbidden: true,
    body: 'Subject 14 (M.V., age 14) instructed to suppress target memory (the lake).<br><br>Suppression successful.<br><br>Residual effect: subject reports "someone standing in the corner of the room" whenever she stops trying. It is tall. It does not move while she looks at it.<br><br>We have instructed her not to look at it.' },
  memo: { title: 'Internal Memo — RE: the shape', forbidden: true,
    body: 'Effective immediately, staff will no longer refer to it by name.<br><br>Staff will not describe it in writing. Staff will not draw it.<br><br>Every description we write makes it heavier. It has started standing in the corridors when no subject is present.<br><br>— Dr. H. Lund' },
  a_log: { title: 'Archive B — access log', forbidden: false,
    body: 'Most recent entries:<br><br>T. Venn — 03:10 — Session tapes, Box 14<br>T. Venn — 04:55 — Restricted vault <i>(no key. found another way)</i><br>T. Venn — 05:40 — Wing C<br><br>No entries since.' },
  a_card: { title: 'Card catalogue', forbidden: false,
    body: 'WHITE BEAR, PROJECT — see: TAPES (restricted vault)<br>SUBJECT 14 — see: RESTRICTED<br>LAKE INCIDENT, 1998 — see: SUBJECT 14<br><br><i>The card for the next entry has been torn out. Only the first letter is left: "I".</i>' },
  a_intake: { title: 'Intake form — Subject 14', forbidden: true,
    body: 'Name: Mara Venn. Age: 14.<br><br>Reason for referral: persistent intrusive memory of the near-drowning of a sibling (T., age 6) at Halvard Lake, July 1998. Subject holds herself responsible: "I looked away."<br><br>Recommendation: full suppression protocol. The memory is to be moved, not treated.' },
  a_p07: { title: 'Subject file — Participant 07', forbidden: true,
    body: 'Status: RELEASED.<br><br>Note: her room was reassigned after release. The thing standing in it was not. It does not belong to her and never did.<br><br>Recommend the room stays locked until Subject 14 is... resolved.' },
  a_lund: { title: 'The Lund Papers, page 41', forbidden: true,
    body: 'We are not removing the memories. A memory cannot be destroyed, only moved.<br><br>We have been moving them all into the same place.<br><br>It has begun to have a shape.<br><br>It has begun to stand up.' },
  a_teo: { title: 'Teo\'s notes, pinned to the shelf', forbidden: false,
    body: 'Tapes 1-3 confirm it. It isn\'t a monster. It\'s a room full of what she couldn\'t hold.<br><br>The lake wing — Wing C — is where her memory is strongest. That\'s where it lives.<br><br>Going now. If it follows me there, good.<br><br>Mara, if you\'re reading this: the door is right behind you.' },
  diary1: { title: 'Participant 07 — diary, day 3', forbidden: false,
    body: 'They gave me a room to practise in. The same room every day.<br><br>Dr. Lund says the trick is to notice nothing. Nothing changes here. Nothing is allowed to change.<br><br>I counted the things in the room so I would know.' },
  diary2: { title: 'Participant 07 — diary, day 9', forbidden: false,
    body: 'The clock was wrong today.<br><br>I told Dr. Lund. He wrote something down and said: "Then don\'t look at it."<br><br>It\'s easier said than done, not looking at a thing.' },
  diary3: { title: 'Participant 07 — diary, day 14', forbidden: true,
    body: 'There is a tall man in the corner of the photo now. He isn\'t my father. I don\'t know whose family that is.<br><br>When I look at him, he is a little closer to the glass.' },
  diary4: { title: 'Participant 07 — diary, day 20', forbidden: true,
    body: 'Somebody is running a bath. I don\'t have a bath.<br><br>There is a girl crying in there. Older than me. She keeps saying she was supposed to be watching him. She keeps saying she only looked away for a second.' },
  diary5: { title: 'Participant 07 — diary, day 31', forbidden: true,
    body: 'It isn\'t mine.<br><br>It was never mine. It belongs to the girl from the lake. It only stands in my room because hers is full.<br><br>Her initials are on the bathroom door. M.V.' },
  diary6: { title: 'Participant 07 — diary, day 40', forbidden: true,
    body: 'I stopped looking at it. It is the only thing that works.<br><br>You can\'t notice it if you don\'t notice it.<br><br>Close your eyes. Count to four. Walk.' },
  drawing: { title: 'A crayon drawing', forbidden: true,
    body: 'A white bear, standing over blue water.<br>Something small is under the water.<br><br>Written on the back, in pencil:<br><i>"Found in Subject 14\'s room. She says she didn\'t draw it. She says she doesn\'t remember the lake."</i>' },
};
function openDoc(id) {
  const d = DOCS[id];
  P.reading = { id, t: 0, forbidden: d.forbidden };
  $('docTitle').textContent = d.title;
  $('docBody').innerHTML = d.body;
  $('doc').classList.remove('hidden');
  AU.noise(0.4, 1800, 0.2);
  if (!S.read.has(id)) {
    S.read.add(id);
    if (d.forbidden) { S.forbiddenRead++; dread = clamp(dread + 0.14, 0, 1); }
  }
}
function closeDoc() { P.reading = null; $('doc').classList.add('hidden'); }
// Forbidden documents start to corrupt as dread rises
function corruptDoc() {
  if (!P.reading || !P.reading.forbidden || Math.random() > 0.15) return;
  const raw = DOCS[P.reading.id].body, k = clamp((dread - 0.35) * 0.25, 0, 0.18);
  if (k <= 0) return;
  $('docBody').innerHTML = raw.replace(/[a-z]/gi, ch => (Math.random() < k ? pick(['█', '▓', 'it', '░']) : ch));
}

// ---------- Intrusive thoughts ----------
const THOUGHTS = {
  low: ['don\'t think about it', 'teo?', 'you\'ve been here before', 'it\'s just a building'],
  mid: ['look behind you', 'it\'s in the corner', 'you let him go under', 'the water was so cold', 'don\'t look for it'],
  high: ['LOOK BEHIND YOU', 'it knows your name', 'you looked away', 'he\'s still down there', 'you made it', 'stop thinking'],
};
function intrusiveThought() {
  const tier = dread < 0.3 ? 'low' : dread < 0.65 ? 'mid' : 'high';
  const text = pick(THOUGHTS[tier]);
  thought = { text, t: 1.3, x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.3 };
  AU.thought({ x: P.x + (Math.random() - 0.5) * 4, y: EYE, z: P.z + (Math.random() - 0.5) * 4 });
  // Sometimes it's telling the truth
  if (/look behind you/i.test(text) && dread > 0.45 && IT.state !== 'stalk' && IT.state !== 'final' && Math.random() < 0.55 && P.eyes) {
    const bx = P.x + Math.sin(P.yaw) * 2.6, bz = P.z + Math.cos(P.yaw) * 2.6;
    if (!solid(bx, bz)) showIt(bx, bz, 'lurk');
  }
}

// ---------- Gaze, attention and dread ----------
const ray = new THREE.Raycaster(); ray.far = 26;
const centre = new THREE.Vector2(0, 0);
function tagged(o) { while (o && !o.userData.tag) o = o.parent; return o; }
function placeCamera() {
  const bob = P.eyes ? Math.sin(walkPhase) * 0.035 : 0;
  camera.position.set(P.x, EYE + bob, P.z);
  camera.rotation.set(P.pitch, P.yaw, Math.sin(time * 0.7) * dread * 0.035);
}
function look() {
  placeCamera();
  scene.updateMatrixWorld();
  ray.setFromCamera(centre, camera);
  const targets = itModel.visible ? gazeTargets.concat([itModel]) : gazeTargets;
  const hit = ray.intersectObjects(targets, true)[0];
  if (!hit) return null;
  const t = tagged(hit.object);
  return { tag: t ? t.userData.tag : null, data: t ? t.userData.data : null, obj: t, dist: hit.distance, point: hit.point };
}
function los(ax, az, bx, bz) {
  const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.25);
  for (let i = 1; i < n; i++) { const t = i / n; if (opaque(ax + (bx - ax) * t, az + (bz - az) * t)) return false; }
  return true;
}
const fwd = () => ({ x: -Math.sin(P.yaw), z: -Math.cos(P.yaw) });
function inView(x, z, cosLimit = 0.8) {
  if (!P.eyes) return false;
  const f = fwd(), dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz);
  return d < 22 && (dx * f.x + dz * f.z) / d > cosLimit && los(P.x, P.z, x, z);
}

// Where you look, the attention map grows. "It" will come to the places you keep looking.
function recordAttention(dt) {
  if (!gaze || !P.eyes) return;
  const f = fwd();
  const px = gaze.point.x - f.x * 0.4, pz = gaze.point.z - f.z * 0.4;
  const x = Math.floor(px / C), y = Math.floor(pz / C);
  if (x < 0 || y < 0 || x >= W || y >= H || grid[y][x] !== '.') return;
  heat[y * W + x] += dt * (gaze.dist > 6 ? 1.5 : 0.6);
}

// ---------- It: appears where you've been looking ----------
function showIt(x, z, st) { Object.assign(IT, { x, z, state: st, seenT: 0, wasSeen: false, fade: 0 }); itModel.visible = true; }
function hideIt(cool) { IT.state = 'gone'; IT.cool = cool; itModel.visible = false; AU.breath && (AU.breath.g.gain.value = 0); }
function hotspot(minD, maxD, allowInView) {
  const cand = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (grid[y][x] !== '.') continue;
    const wx = cx(x), wz = cx(y), d = Math.hypot(wx - P.x, wz - P.z);
    if (d < minD || d > maxD || (!allowInView && inView(wx, wz, 0.5))) continue;
    if (zoneAt(wx, wz) === 'hall' && !S.hall) continue;
    cand.push({ x: wx, z: wz, h: heat[y * W + x] + Math.random() * 0.3 });
  }
  cand.sort((a, b) => b.h - a.h);
  return cand[0] || null;
}
function updateIt(dt) {
  if (chapter === 2 && IT.state === 'final') { finalLoopIt(dt); return; }
  IT.cool -= dt;
  const d = Math.hypot(IT.x - P.x, IT.z - P.z);
  const seen = IT.state !== 'gone' && inView(IT.x, IT.z, 0.86);

  if (IT.state === 'gone') {
    const want = S.hall ? 0.15 : 0.32;
    if (dread > want && IT.cool <= 0) {
      const spot = hotspot(4, 16, false);
      if (spot) showIt(spot.x, spot.z, dread > 0.7 ? 'stalk' : 'lurk');
      else IT.cool = 2;
    }
  } else if (!P.eyes && S.hall) {
    // eyes closed in the hall: it wanders, and you can only hear it
    IT.state = 'wander';
    if (Math.hypot(IT.wanderX - IT.x, IT.wanderZ - IT.z) < 0.5 || !IT.wanderX) {
      const s = hotspot(0, 30, true); if (s) { IT.wanderX = s.x + (Math.random() - 0.5); IT.wanderZ = s.z; }
    }
    const towardP = Math.random() < 0.35;
    const tx = towardP ? P.x : IT.wanderX, tz = towardP ? P.z : IT.wanderZ, vx = tx - IT.x, vz = tz - IT.z, vd = Math.hypot(vx, vz) || 1;
    const nx = IT.x + vx / vd * 0.75 * dt, nz = IT.z + vz / vd * 0.75 * dt;
    if (!solid(nx, IT.z)) IT.x = nx;
    if (!solid(IT.x, nz)) IT.z = nz;
  } else {
    if (seen) {
      IT.seenT += dt; dread = clamp(dread + 0.22 * dt, 0, 1);
      if (!IT.wasSeen) {
        IT.wasSeen = true; S.timesSeen++; AU.sting();
        if (!S.firstSight) { S.firstSight = true; setTimeout(() => { thought = { text: 'don\'t think about it', t: 1.6, x: 0, y: 0 }; }, 900); }
      }
    }
    if (IT.state === 'stalk' || (S.hall && dread > 0.55)) {
      IT.state = 'stalk';
      // It only moves when you aren't looking at it
      IT.stepT -= dt;
      if (!seen && IT.stepT <= 0) {
        IT.stepT = 0.9;
        const vx = P.x - IT.x, vz = P.z - IT.z, vd = Math.hypot(vx, vz) || 1, jump = Math.min(vd - 0.6, 1.6);
        let nx = IT.x + vx / vd * jump, nz = IT.z + vz / vd * jump;
        if (solid(nx, nz)) { const s = hotspot(1.2, Math.max(2, vd - 1), true); if (s) { nx = s.x; nz = s.z; } else { nx = IT.x; nz = IT.z; } }
        IT.x = nx; IT.z = nz;
        AU.noise(0.25, 220, 0.5, 'lowpass', { x: IT.x, y: 1, z: IT.z });
      }
      if (dread < 0.3 && !S.hall) hideIt(8);
    } else {
      // lurking: there when you look back... gone once you've looked away again
      if (IT.wasSeen && !seen && IT.seenT > 0.5) hideIt(6 + Math.random() * 8);
      else if (dread > 0.72) IT.state = 'stalk';
      else if (dread < 0.2) hideIt(5);
    }
  }
  if (IT.state !== 'gone' && d < 1.25) caught();

  // place and smear the model
  if (IT.state !== 'gone') {
    itModel.position.set(IT.x, 0, IT.z);
    itModel.rotation.y = Math.atan2(P.x - IT.x, P.z - IT.z);
    const u = itModel.userData;
    u.smears.forEach((s, i) => { s.position.set((Math.random() - 0.5) * 0.12 * (1 + dread), 0, (Math.random() - 0.5) * 0.12); s.visible = Math.random() < 0.7; });
    itModel.visible = Math.random() > 0.03 * (1 - dread);
    if (AU.breath) { AU.setPos(AU.breath.p, IT.x, 2.4, IT.z); AU.breath.g.gain.value = (0.25 + Math.sin(time * 1.7) * 0.15) * (S.hall ? 1.6 : 0.8) * (P.eyes ? 1 : 1.8); }
  }
}

function caught() {
  if (state !== 'play') return;
  state = 'caught'; caughtT = 0; S.timesCaught++;
  AU.caught();
  closeDoc();
  hideIt(5);
}
function respawn() {
  const cp = P.checkpoint;
  P.x = cp.x; P.z = cp.z; P.yaw = cp.yaw; P.pitch = 0; P.eyes = true;
  dread = S.hall ? 0.15 : 0.12; heat.fill(0); thought = null;
  hideIt(6);
  if (chapter === 2 && S.loop === LAST_LOOP && !S.solved) { dread = 0.3; S.eyesT = 0; showIt(cx(1) + 0.3, cx(8) - 0.2, 'final'); }
  state = 'play';
}

// ---------- Interaction ----------
let near = null;
function findInteractable() {
  near = null;
  if (!gaze || gaze.dist > 2.6 || !P.eyes) return;
  for (const it of interactables) {
    if (it.used) continue;
    const d = Math.hypot(it.pos.x - P.x, it.pos.z - P.z);
    if (d > 2.6) continue;
    const ok = (it.kind === 'doc' && gaze.tag === 'doc' && gaze.data === it.id) || (it.kind === 'lever' && gaze.tag === 'lever') ||
               (it.kind === 'recorder' && gaze.tag === 'recorder') || (it.kind === 'exit' && gaze.tag === 'exit') ||
               (it.kind === 'doorA' && gaze.tag === 'doorA') || (it.kind === 'doorB' && gaze.tag === 'doorB') ||
               (it.kind === 'tape' && gaze.tag === 'tape' && gaze.data === it.id);
    if (ok) { near = it; return; }
  }
}
function interact() {
  if (P.reading) { closeDoc(); return; }
  if (!near) return;
  const it = near;
  if (it.kind === 'doc') openDoc(it.id);
  else if (it.kind === 'lever' && !S.power) {
    it.used = true; it.handle.rotation.x = -0.6; AU.lever();
    S.power = true; S.powerT = 0; AU.powerUp();
    hint('Something hums awake deep in the building.', 4);
  } else if (it.kind === 'recorder' && !S.recorder) {
    it.used = true; it.led.material.color.set(0x20ff40); S.recorder = true;
    say([['TEO', 'Mara. If you found this, you didn\'t listen to me. Of course you didn\'t.', 5.5],
         ['TEO', 'I\'ve been through the data. It wasn\'t a study about forgetting. They taught kids to push things down...', 6],
         ['TEO', '...and everything they pushed down went somewhere. It all went to one place.', 5],
         ['TEO', 'It follows attention. Don\'t look for it. Don\'t read about it.', 5],
         ['TEO', 'If it gets bad, close your eyes. It can\'t feed on you if you aren\'t looking.', 6],
         ['TEO', 'I\'m going further in. Participant housing. ...I think I know whose it is, Mara.', 6]]);
  } else if (it.kind === 'tape') {
    it.used = true; it.mesh.visible = false; playTape(it.id);
  } else if (it.kind === 'exit') {
    if (chapter === 3 && S.tapes.size < 3) { hint('Not yet. The tapes. Teo left them for you to hear.', 4); AU.bump(); return; }
    endChapter();
  } else if (it.kind === 'doorB') {
    tryDoorB();
  } else if (it.kind === 'doorA') {
    hint('It won\'t open. It never opens from this side.', 3); AU.bump();
  }
}

// ---------- Input ----------
const keys = {};
addEventListener('keydown', e => {
  keys[e.code] = true;
  // F9: skip to the next chapter (temporary, for testing)
  if (e.code === 'F9' && (state === 'play' || state === 'paused') && CARDS_BY_CHAPTER[chapter + 1]) {
    e.preventDefault(); $('pause').classList.add('hidden'); closeDoc(); startIntro(chapter + 1); return;
  }
  if (state === 'title' && !inMenu) { enterMenu(); return; }   // "press any key"
  if (state === 'intro' && (e.code === 'Space' || e.code === 'Enter')) { endIntro(); return; }
  if (state === 'paused' && e.code === 'KeyP') { resume(); return; }
  if (state !== 'play') return;
  if (e.code === 'KeyE') interact();
  if (e.code === 'KeyP' || e.code === 'Escape') { if (P.reading) closeDoc(); else pause(); }
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('mousemove', e => {
  if (state !== 'play' || document.pointerLockElement !== $('game') || P.reading) return;
  P.yaw -= e.movementX * SENS;
  P.pitch = clamp(P.pitch - e.movementY * SENS, -1.2, 1.2);
});
$('game').addEventListener('mousedown', () => { if (state === 'play' && document.pointerLockElement !== $('game')) $('game').requestPointerLock(); });
$('doc').addEventListener('click', () => closeDoc());
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && state === 'play' && !P.reading) pause(); });

function pause() {
  state = 'paused';
  for (const k in keys) keys[k] = false;
  if (document.pointerLockElement) document.exitPointerLock();
  $('objective').textContent = objective();
  $('pause').classList.remove('hidden');
}
function resume() { $('pause').classList.add('hidden'); state = 'play'; $('game').requestPointerLock(); }
$('resumeBtn').addEventListener('click', resume);
function objective() {
  if (chapter === 3) {
    if (S.tapes.size < 3) return `Find the session tapes. (${S.tapes.size} / 3)`;
    return 'Follow Teo. The door to Wing C.';
  }
  if (chapter === 2) {
    if (S.loop === 1) return 'Walk through the room. Remember everything in it.';
    if (S.loop === LAST_LOOP) return S.solved ? 'Go through the door.' : 'Something new is in the room. Don\'t look for it.';
    return S.solved ? 'Go through the door.' : `Something has changed. Find it, and look at it until you're sure.`;
  }
  if (!focusables[0].done) return 'Find a way deeper into the institute.';
  if (!S.power) return 'Restore the power.';
  if (!S.recorder) return 'Find out what happened to Teo.';
  return 'Get through the observation hall. Find the stairs.';
}

// ---------- Intro ----------
const CARDS_BY_CHAPTER = {
  1: [
    ['In 1987, a psychologist asked people not to think about a white bear.', 4.5],
    ['They could think of nothing else.', 3.5],
    ['1998.<br>The Halvard Institute.<br>Project White Bear.', 4.5],
    ['<span class="voice">[ voice message — Teo ]</span><br><br><span class="voice">"Mara. It wasn\'t a study about forgetting.<br>They were growing something.<br><br>Don\'t come here.<br><br>And Mara... don\'t think about it."</span>', 9],
    ['Present day. 2:14 AM.', 3.5],
  ],
  2: [
    ['Chapter Two<br><i>The Waiting Room</i>', 4],
    ['Participant 07 was given a room to practise in.<br>The same room. Every day.', 5],
    ['Nothing was allowed to change.', 4],
  ],
  3: [
    ['Chapter Three<br><i>The Archive</i>', 4],
    ['Every session was recorded.<br>Every word. Every child.', 5],
    ['Somewhere down here is the reason they chose you.', 4.5],
  ],
};
let CARDS = CARDS_BY_CHAPTER[1], introChapter = 1;
let cardIdx = 0, cardTimer = null;
function startIntro(ch = 1) {
  AU.init(); AU.stopMusic(); inMenu = false;
  introChapter = ch; CARDS = CARDS_BY_CHAPTER[ch];
  state = 'intro';
  $('title').classList.add('hidden'); $('end').classList.add('hidden'); $('intro').classList.remove('hidden');
  cardIdx = 0; nextCard();
}
// remember how far you've got
const SAVE_KEY = 'thinking-it-progress';
const savedChapter = () => { try { return +(localStorage.getItem(SAVE_KEY) || 1); } catch (e) { return 1; } };
const saveChapter = ch => { try { if (ch > savedChapter()) localStorage.setItem(SAVE_KEY, ch); } catch (e) { /* no storage */ } };
$('ch2Btn').classList.remove('hidden');   // chapter skip (for now): always available
$('ch2Btn').addEventListener('click', () => startIntro(2));
$('ch3Btn').addEventListener('click', () => startIntro(3));
function nextCard() {
  const card = $('card');
  if (cardIdx >= CARDS.length) { endIntro(); return; }
  card.classList.remove('on');
  setTimeout(() => { card.innerHTML = CARDS[cardIdx][0]; card.classList.add('on'); }, 900);
  cardTimer = setTimeout(() => { cardIdx++; nextCard(); }, CARDS[cardIdx][1] * 1000 + 1800);
}
function endIntro() {
  if (state !== 'intro') return;
  clearTimeout(cardTimer);
  $('intro').classList.add('hidden');
  newGame(introChapter);
  state = 'play';
  $('game').requestPointerLock();
}
$('beginBtn').addEventListener('click', () => startIntro(1));
$('againBtn').addEventListener('click', () => startIntro(chapter));
$('nextBtn').addEventListener('click', () => startIntro(chapter + 1));

// ---------- Home screen ----------
// "Press any key", then the menu floats over a slow drift through the Waiting Room. Something is sometimes in the corner.
let SENS = 0.0021;
try {
  const st = JSON.parse(localStorage.getItem('thinking-it-settings') || '{}');
  if (st.vol !== undefined) AU.volume = st.vol;
  if (st.sens) SENS = 0.0021 * st.sens;
} catch (e) { /* no storage */ }
function saveSettings() { try { localStorage.setItem('thinking-it-settings', JSON.stringify({ vol: AU.volume, sens: SENS / 0.0021 })); } catch (e) { /* no storage */ } }
$('volSlider').value = AU.volume; $('sensSlider').value = SENS / 0.0021;
$('volSlider').addEventListener('input', e => { AU.setVolume(+e.target.value); saveSettings(); });
$('sensSlider').addEventListener('input', e => { SENS = 0.0021 * +e.target.value; saveSettings(); });
$('settingsBtn').addEventListener('click', () => { $('mainMenu').classList.add('hidden'); $('settings').classList.remove('hidden'); });
$('settingsBack').addEventListener('click', () => { $('settings').classList.add('hidden'); $('mainMenu').classList.remove('hidden'); });
for (const el of document.querySelectorAll('.mi')) {
  el.addEventListener('mouseenter', () => AU.hover());
  el.addEventListener('click', () => AU.select());
}

// camera keyframes: [x, z, lookX, lookZ] through the hallway, round the corner, into the living room
const TITLE_KEYS = [[3, 4, 20, 4], [12, 4.2, 12, 1.6], [18.5, 4.2, 21, 11], [20.5, 9, 10, 14], [16, 13, 3, 16], [12, 13.5, 12, 10]];
const TITLE_SEG = 11;
let titleT = 0, inMenu = false;
function setupTitleScene() {
  chapter = 2; S = null; dread = 0.16; P.eyes = true; P.reading = null;
  buildApartment();
  setClock(2, 14, 0);
  itModel.visible = false;
  titleT = 0;
}
function titleCamera(dt) {
  titleT += dt;
  const u = (titleT / TITLE_SEG) % 10, i = Math.floor(u), k = smooth(u - i);
  const a = i < 5 ? TITLE_KEYS[i] : TITLE_KEYS[10 - i], b = i < 5 ? TITLE_KEYS[i + 1] : TITLE_KEYS[9 - i];
  P.x = a[0] + (b[0] - a[0]) * k + Math.sin(titleT * 0.4) * 0.1;
  P.z = a[1] + (b[1] - a[1]) * k + Math.cos(titleT * 0.33) * 0.1;
  const lx = a[2] + (b[2] - a[2]) * k, lz = a[3] + (b[3] - a[3]) * k;
  P.yaw = Math.atan2(-(lx - P.x), -(lz - P.z));
  P.pitch = 0.02 + Math.sin(titleT * 0.25) * 0.04;
  walkPhase += dt * 1.4;
  // the glimpse: standing in the far corner, only while the camera is turned toward it, only some of the time
  const glimpse = Math.floor(titleT / (TITLE_SEG * 10)) % 2 === 0 && ((i === 3 && k > 0.7) || (i === 4 && k < 0.22) || (i === 5 && k > 0.75) || (i === 6 && k < 0.2));
  itModel.visible = glimpse && Math.random() > 0.04;
  if (glimpse) {
    itModel.position.set(cx(1) + 0.3, 0, cx(8) - 0.2);
    itModel.rotation.y = Math.atan2(P.x - itModel.position.x, P.z - itModel.position.z);
    itModel.userData.smears.forEach(s => s.position.set((Math.random() - 0.5) * 0.12, 0, (Math.random() - 0.5) * 0.12));
  }
  // the clock keeps ticking
  if ((titleT % 1) < dt) { setClock(2, 14 + ((titleT / 60) | 0), (titleT | 0) % 60); if (apt.clockPos) AU.tick(apt.clockPos, (titleT | 0) % 2 === 1); }
  if (apt.dust) {
    const p = apt.dust.geometry.attributes.position, bb = apt.dustBase;
    for (let j = 0; j < p.count; j++) { p.array[j * 3 + 1] = bb[j * 3 + 1] + Math.sin(titleT * 0.21 + j * 1.7) * 0.18; p.array[j * 3] = bb[j * 3] + Math.sin(titleT * 0.13 + j) * 0.25; }
    p.needsUpdate = true;
  }
  AU.updateMusic(dt);
}
// letters fade in one by one; the tagline types itself out, and sometimes says the wrong thing
function enterMenu() {
  if (inMenu) return;
  inMenu = true;
  AU.init(); AU.startMusic();
  $('splash').classList.add('gone');
  $('menu').classList.remove('hidden');
  const tt = $('titleText'); tt.innerHTML = '';
  'THINKING IT'.split('').forEach((ch, i) => { const sp = document.createElement('span'); sp.textContent = ch === ' ' ? ' ' : ch; sp.style.animationDelay = `${0.4 + i * 0.13}s`; tt.appendChild(sp); });
  const line = 'don\'t think about it.'; let n = 0;
  $('tagline').textContent = '';
  const type = () => { if (!inMenu) return; n++; $('tagline').textContent = line.slice(0, n); if (n < line.length) setTimeout(type, 70 + Math.random() * 60); };
  setTimeout(type, 2200);
}
setInterval(() => {   // now and then the title glitches, and the tagline loses a word
  if (!inMenu || state !== 'title') return;
  const tt = $('titleText'); tt.classList.add('glitch'); setTimeout(() => tt.classList.remove('glitch'), 90 + Math.random() * 120);
  if (Math.random() < 0.35 && $('tagline').textContent.length > 15) {
    $('tagline').textContent = 'think about it.'; setTimeout(() => { $('tagline').textContent = 'don\'t think about it.'; }, 260);
  }
}, 6500);
$('splash').addEventListener('click', enterMenu);
function showTitle() {
  for (const id of ['pause', 'end', 'doc', 'intro']) $(id).classList.add('hidden');
  closeDoc();
  if (document.pointerLockElement) document.exitPointerLock();
  for (const n of ['phone', 'radio', 'breath', 'buzz']) if (AU[n]) AU[n].g.gain.value = 0;
  if (AU.focG) AU.focG.gain.value = 0;
  state = 'title';
  setupTitleScene();
  $('title').classList.remove('hidden'); $('settings').classList.add('hidden'); $('mainMenu').classList.remove('hidden');
  inMenu = false; enterMenu();
}
$('menuBtn').addEventListener('click', showTitle);
$('endMenuBtn').addEventListener('click', showTitle);
setupTitleScene();

function endChapter() {
  state = 'end';
  if (document.pointerLockElement) document.exitPointerLock();
  if (AU.phone) AU.phone.g.gain.value = 0;
  if (AU.radio) AU.radio.g.gain.value = 0;
  if (AU.breath) AU.breath.g.gain.value = 0;
  if (AU.buzz) AU.buzz.g.gain.value = 0;
  hideIt(999);
  const forbiddenTotal = Object.keys(DOCS).filter(k => DOCS[k].forbidden && (chapter === 2 ? k.startsWith('diary') : !k.startsWith('diary') && !k.startsWith('a_'))).length;
  if (chapter === 1) {
    saveChapter(2);
    $('endTitle').textContent = 'END OF CHAPTER ONE'; $('endSub').textContent = 'Arrival';
    $('endNext').textContent = 'Chapter Two: The Waiting Room'; $('nextBtn').classList.remove('hidden'); $('endNote').classList.add('hidden');
    $('endStats').innerHTML = `forbidden documents read: ${S.forbiddenRead} / ${forbiddenTotal}<br>times you looked at it: ${S.timesSeen}<br>times it reached you: ${S.timesCaught}`;
  } else {
    saveChapter(3);
    $('endTitle').textContent = 'END OF CHAPTER TWO'; $('endSub').textContent = 'The Waiting Room';
    $('endNext').textContent = 'Chapter Three: The Archive'; $('nextBtn').classList.remove('hidden'); $('endNote').classList.add('hidden');
    $('endStats').innerHTML = `loops survived: ${LAST_LOOP}<br>wrong guesses: ${S.wrong}<br>diary pages read: ${S.forbiddenRead} forbidden<br>times you looked at it: ${S.timesSeen}<br>times it reached you: ${S.timesCaught}`;
  }
  if (chapter === 3) {
    $('endTitle').textContent = 'END OF CHAPTER THREE'; $('endSub').textContent = 'The Archive';
    $('endNext').textContent = 'Chapter Four: The Lake House'; $('nextBtn').classList.add('hidden'); $('endNote').classList.remove('hidden');
    $('endStats').innerHTML = `tapes recovered: ${S.tapes.size} / 3<br>forbidden files read: ${S.forbiddenRead} / 3<br>times you looked at it: ${S.timesSeen}<br>times it reached you: ${S.timesCaught}`;
  }
  $('end').classList.remove('hidden');
}

// ---------- Update ----------
function update(dt) {
  // Eyes: hold SPACE to close them
  const wantClosed = !!(keys.Space || keys.KeyQ) && !P.reading;
  if (wantClosed !== !P.eyes) { P.eyes = !wantClosed; AU.click(); }

  // Movement
  const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  if ((f || s) && !P.reading) {
    const sp = (P.eyes ? 2.5 : 1.2) * dt, fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    let vx = fx * f + rx * s, vz = fz * f + rz * s; const len = Math.hypot(vx, vz); vx = vx / len * sp; vz = vz / len * sp;
    const ox = P.x, oz = P.z, r = 0.32;
    if (!solid(P.x + vx + Math.sign(vx) * r, P.z - r) && !solid(P.x + vx + Math.sign(vx) * r, P.z + r)) P.x += vx;
    if (!solid(P.x - r, P.z + vz + Math.sign(vz) * r) && !solid(P.x + r, P.z + vz + Math.sign(vz) * r)) P.z += vz;
    const moved = Math.hypot(P.x - ox, P.z - oz);
    if (moved < sp * 0.3) { bumpT -= dt; if (bumpT <= 0) { AU.bump(); bumpT = 0.45; } }   // walked into something
    walkPhase += moved * 3.2; stepAcc += moved;
    if (stepAcc > 1.5) { stepAcc = 0; AU.step(); }
  }

  // Zones, checkpoints and story beats
  const zone = zoneAt(P.x, P.z);
  if (zone !== S.zone) {
    S.zone = zone;
    P.checkpoint = { x: P.x, z: P.z, yaw: P.yaw };
    if (zone === 'hall' && !S.hall) {
      S.hall = true;
      dread = clamp(dread + 0.12, 0, 1);
      hint('Your flashlight flickers... and dies.', 4);
      setTimeout(() => hint(chapter === 3 ? 'Something is moving between the shelves. Close your eyes. Follow the tape machine.'
                                          : 'Too dark. Too much. Close your eyes and follow the phone.', 6), 3500);
      IT.cool = 3;
    }
  }
  if (chapter === 1) {
    if (zone === 'corridor' && P.x > cx(10) && !S.pitHint) { S.pitHint = true; hint('The floor just... isn\'t there. But Teo\'s note said to look at it.', 6); }
    if (zone === 'offices' && !S.doorHint && !focusables[1].done) { S.doorHint = true; hint('There should be a door here. You\'re almost sure there was.', 5); }
    if (S.recorder && !S.eyesTaught && !subtitles.length) { S.eyesTaught = true; hint('Hold SPACE to close your eyes. It can\'t feed on you if you aren\'t looking.', 7); }
  } else if (chapter === 3) {
    if (zone === 'stacks' && !S.stackHint) { S.stackHint = true; hint('Rows and rows of them. Every child they ever recorded.', 5); }
    if (zone === 'stacks' && P.x > cx(10) && P.x < cx(14) && P.z > cx(8) && !S.vaultHint && !focusables[0].done) { S.vaultHint = true; hint('The vault door is only painted on. Or is it?', 5); }
    if (S.tapeHissT > 0) { S.tapeHissT -= dt; if (Math.random() < dt * 6) AU.noise(0.12, 4000, 0.03, 'highpass', null, 0.1); }   // tape hiss under the voices
  } else if (S.loop === 2 && !S.findHint) { S.findHint = true; hint('Something in here is different. Find it. Look at it until you\'re sure.', 7); }

  // What are you looking at?
  gaze = P.eyes && !P.reading ? look() : null;
  recordAttention(dt);
  findInteractable();

  // Focus: stare at something unfinished and it becomes real
  focusing = null;
  if (gaze && gaze.tag === 'focus' && gaze.dist < 12) {
    const fo = focusables.find(q => q.group === gaze.obj);
    if (fo && !fo.done) {
      focusing = fo;
      fo.progress += dt / fo.time;
      dread = clamp(dread + 0.025 * dt, 0, 1);
      if (fo.progress >= 1) { if (fo.kind === 'suspect') onSuspect(fo); else materialize(fo); }
    }
  }
  for (const fo of focusables) {
    if (fo !== focusing && !fo.done) fo.progress = Math.max(0, fo.progress - dt * 0.25);
    if (!fo.done && fo.kind !== 'suspect') {
      const flick = 0.08 + fo.progress * 0.55 + Math.sin(time * 9) * 0.03;
      fo.group.traverse(o => { if (o.isMesh) o.material.opacity = flick; if (o.isLineSegments) o.material.opacity = 0.25 + fo.progress * 0.6; });
      fo.group.position.y = (Math.random() - 0.5) * 0.02 * (1 - fo.progress);
    }
  }
  if (AU.focG) { AU.focG.gain.value = focusing ? 0.06 + focusing.progress * 0.08 : 0; AU.focO.frequency.value = 180 + (focusing ? focusing.progress * 260 : 0); }

  // Dread: looking into darkness, at the scratches, at it, reading about it... closing your eyes lets it drain away
  let dd = 0;
  if (!P.eyes) dd -= 0.12;
  else {
    if (gaze && gaze.tag === 'trace') dd += 0.06;
    if (gaze && gaze.dist > 9 && !S.power) dd += 0.012;
    if (S.hall && zone === 'hall') dd += 0.055;
    if (P.reading && P.reading.forbidden) dd += 0.03;
    if (dread > 0.12 && !S.hall) dd -= 0.008;
  }
  dread = clamp(dread + dd * dt, 0, 1);
  for (let i = 0; i < heat.length; i++) heat[i] *= 1 - dt * 0.02;
  corruptDoc();

  // Doors and power
  if (chapter === 1) updateInstituteLights();
  if (chapter === 3) updateArchiveLights();
  if (S.power && S.powerT >= 0) {
    S.powerT += dt;
    if (doorD && S.powerT < 3) {
      doorD.position.y = Math.min(WALL_H, S.powerT * 1.3);
      if (S.powerT > 1.5) { grid[13][19] = '.'; grid[13][20] = '.'; }
    }
    hemi.intensity = 0.1;
    if (S.powerT > 2 && !S.firstSight && IT.state === 'gone') { dread = Math.max(dread, 0.36); IT.cool = 0; }
  }
  flash.intensity = S.hall ? 0 : (dread > 0.6 && Math.random() < dread * 0.08 ? 0.2 : chapter === 2 ? 0.9 : 2.2);
  if (chapter === 2) { updateLoop(dt); if (state !== 'play') return; }

  // The phone ringing past the hall: something to follow with your eyes closed
  if (AU.phone && chapter === 1) {
    const ring = S.hall ? ((time % 3) < 1.2 && (time % 0.4) < 0.2 ? 0.05 : 0) : 0;
    AU.phone.g.gain.value = ring * (P.eyes ? 1 : 1.6);
    AU.setPos(AU.phone.p, cx(1) + 0.8, 1.2, cx(18));
  }

  updateIt(dt);
  if (state !== 'play') return;

  // Heartbeat and whispers rise with dread
  heartT -= dt;
  if (dread > 0.35 && heartT <= 0) { AU.heart(dread); heartT = 1.3 - dread * 0.75; }
  if (AU.whG) { AU.whG.gain.value = Math.max(0, dread - 0.3) * 0.25 * (P.eyes ? 1 : 1.5); AU.droneF.frequency.value = 110 + dread * 220; }
  // the building is never quite silent: creaks, knocks in the pipes, the odd whisper
  ambientT -= dt;
  if (ambientT <= 0) { ambientT = 6 + Math.random() * 12 - dread * 4; AU.ambient(P.x, P.z); }
  thoughtT -= dt;
  if (thoughtT <= 0) { thoughtT = 26 - dread * 18 + Math.random() * 8; if (dread > 0.1 || S.power) intrusiveThought(); }

  // Subtitles and hints
  if (subtitles.length) { subT += dt; if (subT > subtitles[0].dur) { subtitles.shift(); subT = 0; } }
  for (const h of hints) h.t -= dt;
  hints = hints.filter(h => h.t > 0);
  if (thought && (thought.t -= dt) <= 0) thought = null;
  if (chapter === 1 && S.hall && Math.hypot(P.x - cx(1), P.z - cx(18)) < 2.2 && !near && !S.exitHint) { S.exitHint = true; hint('The stairwell door. Open your eyes and press E.', 5); }
  if (chapter === 3 && S.hall && Math.hypot(P.x - cx(18), P.z - cx(19)) < 3 && !S.campHint) { S.campHint = true; hint('Teo was here. Open your eyes.', 5); }
}

// ---------- HUD ----------
const grainFrames = [];
for (let i = 0; i < 4; i++) {
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const g = c.getContext('2d'), d = g.createImageData(160, 160);
  for (let j = 0; j < d.data.length; j += 4) { const v = Math.random() * 255; d.data[j] = d.data[j + 1] = d.data[j + 2] = v; d.data[j + 3] = 255; }
  g.putImageData(d, 0, 0); grainFrames.push(c);
}
function drawHUD() {
  const Wd = hud.width, Ht = hud.height, g = hctx, s = Math.min(Wd, Ht) / 600;
  g.clearRect(0, 0, Wd, Ht);
  if (state === 'intro' || state === 'end') return;
  if (state === 'title') {   // just grain and a vignette over the drifting camera
    g.globalAlpha = 0.07; g.fillStyle = g.createPattern(grainFrames[(time * 24 | 0) % 4], 'repeat'); g.fillRect(0, 0, Wd, Ht); g.globalAlpha = 1;
    const tv = g.createRadialGradient(Wd * 0.6, Ht / 2, Math.min(Wd, Ht) * 0.3, Wd * 0.6, Ht / 2, Math.max(Wd, Ht) * 0.75);
    tv.addColorStop(0, 'rgba(0,0,0,0)'); tv.addColorStop(1, 'rgba(0,0,0,0.8)'); g.fillStyle = tv; g.fillRect(0, 0, Wd, Ht);
    return;
  }

  // double vision: the image smears when dread is high
  if (dread > 0.3 && P.eyes) {
    g.globalAlpha = (dread - 0.3) * 0.4; g.globalCompositeOperation = 'screen';
    const o = (4 + dread * 14) * s * (1 + Math.sin(time * 3) * 0.3);
    g.drawImage($('game'), o, 0, Wd, Ht); g.drawImage($('game'), -o * 0.6, o * 0.3, Wd, Ht);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  // grain
  g.globalAlpha = 0.05 + dread * 0.12;
  g.fillStyle = g.createPattern(grainFrames[(time * 24 | 0) % 4], 'repeat'); g.fillRect(0, 0, Wd, Ht);
  g.globalAlpha = 1;
  // vignette, tightening and pulsing with dread
  const pulse = dread > 0.35 ? Math.max(0, Math.sin(time * (3 + dread * 4))) * dread * 0.15 : 0;
  const vg = g.createRadialGradient(Wd / 2, Ht / 2, Math.min(Wd, Ht) * (0.45 - dread * 0.25), Wd / 2, Ht / 2, Math.max(Wd, Ht) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${0.75 + dread * 0.2 + pulse})`);
  g.fillStyle = vg; g.fillRect(0, 0, Wd, Ht);

  // eyes closed: the inside of your eyelids
  if (!P.eyes && state === 'play') {
    const eg = g.createRadialGradient(Wd / 2, Ht / 2, 0, Wd / 2, Ht / 2, Math.max(Wd, Ht) * 0.7);
    const beat = Math.max(0, Math.sin(time * (2 + dread * 3))) * 0.05;
    eg.addColorStop(0, `rgba(${24 + beat * 200},4,4,1)`); eg.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = eg; g.fillRect(0, 0, Wd, Ht);
  }

  if (state === 'play' && P.eyes && !P.reading) {
    // reticle, and a ring that fills while you focus
    g.fillStyle = 'rgba(220,215,205,0.5)'; g.beginPath(); g.arc(Wd / 2, Ht / 2, 1.6 * s, 0, 7); g.fill();
    if (focusing) {
      g.strokeStyle = 'rgba(230,235,245,0.75)'; g.lineWidth = 1.5 * s;
      g.beginPath(); g.arc(Wd / 2, Ht / 2, 14 * s, -Math.PI / 2, -Math.PI / 2 + focusing.progress * Math.PI * 2); g.stroke();
    }
    if (near) {
      g.font = `italic ${Math.round(20 * s)}px 'Cormorant Garamond', serif`; g.textAlign = 'center'; g.fillStyle = 'rgba(220,215,205,0.8)';
      const label = { doc: 'read', lever: 'pull the lever', recorder: 'play the recorder', exit: 'open the door', doorA: 'open the door', doorB: 'open the door', tape: 'play the tape' }[near.kind];
      g.fillText(`E  —  ${label}`, Wd / 2, Ht / 2 + 46 * s);
    }
  }

  // subtitles
  g.textAlign = 'center';
  if (subtitles.length) {
    const sub = subtitles[0];
    g.font = `${Math.round(22 * s)}px 'Cormorant Garamond', serif`;
    g.fillStyle = 'rgba(0,0,0,0.55)';
    const tw = g.measureText(sub.text).width; g.fillRect(Wd / 2 - tw / 2 - 12 * s, Ht - 96 * s, tw + 24 * s, 34 * s);
    g.fillStyle = '#d8d4cc'; g.fillText(sub.text, Wd / 2, Ht - 72 * s);
    g.font = `${Math.round(13 * s)}px 'IBM Plex Mono', monospace`; g.fillStyle = '#8a857c'; g.fillText(sub.who, Wd / 2, Ht - 104 * s);
  }
  // hints
  g.font = `italic ${Math.round(19 * s)}px 'Cormorant Garamond', serif`;
  hints.slice(-2).forEach((h, i) => { g.fillStyle = `rgba(200,196,188,${Math.min(1, h.t) * 0.85})`; g.fillText(h.text, Wd / 2, 60 * s + i * 28 * s); });

  // intrusive thoughts
  if (thought) {
    const a = Math.min(1, thought.t * 2) * (Math.random() < 0.1 ? 0.3 : 1);
    g.font = `${Math.round((34 + dread * 20) * s)}px 'Cormorant Garamond', serif`;
    g.fillStyle = `rgba(235,230,222,${a})`;
    const tx = Wd / 2 + thought.x * Wd + (Math.random() - 0.5) * 4 * dread, ty = Ht / 2 + thought.y * Ht + (Math.random() - 0.5) * 4 * dread;
    g.fillText(thought.text, tx, ty);
    g.fillStyle = `rgba(200,40,40,${a * 0.4})`; g.fillText(thought.text, tx + 2, ty);
  }

  // going through the door: darkness, then the same hallway
  if (chapter === 2 && S && S.transT > 0) {
    const a = S.transT > 0.8 ? 1 - (S.transT - 0.8) / 0.8 : S.transT / 0.8;
    g.fillStyle = `rgba(0,0,0,${clamp(a * 1.3, 0, 1)})`; g.fillRect(0, 0, Wd, Ht);
    if (S.transT < 0.8 && S.loop > 1) {
      g.font = `italic ${Math.round(16 * s)}px 'Cormorant Garamond', serif`; g.fillStyle = `rgba(160,155,148,${a})`; g.fillText(S.loop === LAST_LOOP ? '' : `${S.loop}`, Wd / 2, Ht / 2);
    }
  }

  // caught: it is right in front of you
  if (state === 'caught') {
    const k = caughtT;
    g.fillStyle = `rgba(0,0,0,${Math.min(1, k * 1.5)})`; g.fillRect(0, 0, Wd, Ht);
    if (k < 1.4) {
      g.save(); g.translate(Wd / 2 + (Math.random() - 0.5) * 30, Ht / 2 + (Math.random() - 0.5) * 30);
      const sc = (1 + k) * Ht / 500;
      g.fillStyle = '#000'; g.strokeStyle = `rgba(200,205,215,${0.5 - k * 0.3})`; g.lineWidth = 3;
      g.beginPath(); g.ellipse(14 * sc, -170 * sc, 70 * sc, 90 * sc, -0.4, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(0, 120 * sc, 120 * sc, 240 * sc, 0, 0, 7); g.fill(); g.stroke();
      g.restore();
      g.globalAlpha = 0.35; g.fillStyle = g.createPattern(grainFrames[(time * 40 | 0) % 4], 'repeat'); g.fillRect(0, 0, Wd, Ht); g.globalAlpha = 1;
    }
    if (k > 1.6) {
      g.font = `italic ${Math.round(34 * s)}px 'Cormorant Garamond', serif`; g.fillStyle = `rgba(220,215,205,${Math.min(1, (k - 1.6) * 1.2)})`;
      g.fillText('you thought about it', Wd / 2, Ht / 2);
    }
  }
}

// ---------- Main loop ----------
let last = performance.now();
function frame(now) {
  try { frameBody(now); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
function frameBody(now) {
  const dt = clamp((now - last) / 1000, 0, 0.05);
  last = now; time += dt;
  if (state === 'play') update(dt);
  else if (state === 'caught') { caughtT += dt; if (caughtT > 3.4) respawn(); }
  else if (state === 'title') titleCamera(dt);

  if (state !== 'intro') {
    placeCamera();
    camera.fov = 72 - dread * 7 + Math.sin(time * 1.3) * dread * 2.5; camera.updateProjectionMatrix();
    $('game').style.filter = `saturate(${1 - dread * 0.8}) contrast(${1 + dread * 0.35}) brightness(${1 - dread * 0.15})`;
    const f = fwd(); AU.listener(P.x, EYE, P.z, f.x, f.z);
    if (composer) composer.render(); else renderer.render(scene, camera);
  }
  drawHUD();
}
requestAnimationFrame(frame);
