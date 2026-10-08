// Greywater Hollow — a small grounded RPG.
// Survive the vale: eat, rest, fight what hunts you, and help the village.
'use strict';
(() => {

// ===================== constants =====================
const T = 32, W = 160, H = 160, SEED = 20251;
const GMPS = 2; // game minutes per real second (one day = 12 real minutes)
const SAVE_KEY = 'greywater-hollow-save-v1';

const GRASS = 0, FFLOOR = 1, TREE = 2, WATER = 3, ROAD = 4, FLOOR = 5, WALL = 6, SAND = 7,
      ROCK = 8, DOOR = 9, BUSH = 10, BRIDGE = 11, WELL = 12, FIELD = 13, DEEP = 14;
const SOLID = new Uint8Array(16);
[TREE, WATER, WALL, ROCK, WELL, DEEP].forEach(t => SOLID[t] = 1);

const VX = 80, VY = 80, VILLAGE_R = 15;     // village centre (tiles) and safe radius
const MILL = { x: 128, y: 30 };              // bandit camp

const TILE_HSL = {
  [GRASS]: [92, 30, 29], [FFLOOR]: [100, 26, 19], [TREE]: [100, 26, 19], [WATER]: [204, 42, 33],
  [DEEP]: [210, 48, 22], [ROAD]: [34, 24, 37], [FLOOR]: [28, 34, 29], [WALL]: [30, 8, 36],
  [SAND]: [43, 38, 54], [ROCK]: [92, 30, 29], [DOOR]: [26, 42, 22], [BUSH]: [92, 30, 29],
  [BRIDGE]: [28, 38, 31], [WELL]: [34, 24, 37], [FIELD]: [36, 38, 27],
};
const MINI_COL = {
  [GRASS]: '#3e5a2a', [FFLOOR]: '#2c4220', [TREE]: '#1f3418', [WATER]: '#2e5876', [DEEP]: '#1c3854',
  [ROAD]: '#8a7552', [FLOOR]: '#6b4e33', [WALL]: '#5a5652', [SAND]: '#b6a26c', [ROCK]: '#6c6a66',
  [DOOR]: '#6b4e33', [BUSH]: '#3e5a2a', [BRIDGE]: '#7a5a35', [WELL]: '#5a5652', [FIELD]: '#7d6c3a',
};

// ===================== items & creatures =====================
const ITEMS = {
  berries:      { name: 'Wild berries', kind: 'food', food: 8, heal: 1, value: 1, desc: 'A handful of brambleberries. Barely a snack.' },
  raw_meat:     { name: 'Raw meat', kind: 'food', food: 5, heal: -4, value: 3, desc: 'Edible raw, but it turns the stomach. Cook it at a campfire.' },
  cooked_meat:  { name: 'Roast meat', kind: 'food', food: 32, heal: 8, value: 9, desc: 'Charred outside, pink inside. Filling.' },
  bread:        { name: 'Rye bread', kind: 'food', food: 20, heal: 2, value: 4, desc: 'Dense and a day old.' },
  stew:         { name: 'Mutton stew', kind: 'food', food: 50, heal: 20, value: 14, desc: "Hilde's stew, carried in a crock. Warms you through." },
  bandage:      { name: 'Linen bandage', kind: 'heal', heal: 35, value: 10, desc: 'Binds a wound. Restores 35 health over a few seconds.' },
  sticks:       { name: 'Dry sticks', kind: 'mat', value: 1, desc: 'Gathered from trees. Four make a campfire.' },
  hide:         { name: 'Raw hide', kind: 'mat', value: 6, desc: 'Deer or boar hide. The elder needs these for winter.' },
  wolf_pelt:    { name: 'Wolf pelt', kind: 'mat', value: 11, desc: 'Thick grey fur. Traders pay well for it.' },
  torch:        { name: 'Pitch torch', kind: 'tool', value: 5, desc: 'Burns for about four hours. Wolves keep their distance from it.' },
  rusty_dagger: { name: 'Rusty dagger', kind: 'weapon', dmg: [3, 6], cd: .38, stam: 7, reach: 30, value: 4, desc: 'Better than bare hands. Barely.' },
  short_sword:  { name: 'Short sword', kind: 'weapon', dmg: [6, 10], cd: .5, stam: 11, reach: 38, value: 40, desc: 'Plain, reliable village steel.' },
  hunting_spear:{ name: 'Hunting spear', kind: 'weapon', dmg: [7, 12], cd: .7, stam: 14, reach: 54, value: 55, desc: 'Long reach. Keeps teeth at a distance.' },
  longsword:    { name: 'Longsword', kind: 'weapon', dmg: [11, 17], cd: .62, stam: 16, reach: 44, value: 150, desc: 'A soldier’s blade, well balanced.' },
  battle_axe:   { name: 'Bearded axe', kind: 'weapon', dmg: [14, 22], cd: .9, stam: 22, reach: 40, value: 190, desc: 'Slow and heavy. Ends arguments.' },
  padded_jerkin:{ name: 'Padded jerkin', kind: 'armor', armor: 2, value: 10, desc: 'Quilted wool. Takes the edge off a bite.' },
  leather_armor:{ name: 'Boiled leather', kind: 'armor', armor: 4, value: 60, desc: 'Hardened hide over the chest and shoulders.' },
  chainmail:    { name: 'Mail hauberk', kind: 'armor', armor: 7, value: 200, slow: .9, desc: 'Heavy riveted rings. Slows you slightly.' },
};

const MOBS = {
  deer:    { name: 'Deer', hp: 18, speed: 108, r: 10, xp: 8, flee: true, col: '#8a5d36', drops: [['raw_meat', 1, 2, 1], ['hide', 1, 1, .9]] },
  boar:    { name: 'Wild boar', hp: 34, speed: 96, r: 11, xp: 16, dmg: [4, 8], cd: 1.1, aggro: 70, col: '#4b3a2d', drops: [['raw_meat', 2, 3, 1], ['hide', 1, 1, .7]] },
  wolf:    { name: 'Grey wolf', hp: 26, speed: 120, r: 10, xp: 18, dmg: [4, 7], cd: .9, aggro: 170, nightAggro: 270, fearsFire: true, col: '#7a7b7c', drops: [['wolf_pelt', 1, 1, .85], ['raw_meat', 1, 1, .5]] },
  bandit:  { name: 'Bandit', hp: 42, speed: 92, r: 11, xp: 30, dmg: [6, 10], cd: 1.2, aggro: 210, human: true, col: '#5c4535', coins: [4, 16], drops: [['bread', 1, 1, .4], ['bandage', 1, 1, .25], ['torch', 1, 1, .3]] },
  captain: { name: 'Rusk the Miller', hp: 150, speed: 86, r: 13, xp: 150, dmg: [10, 16], cd: 1.4, aggro: 240, human: true, boss: true, col: '#3a2620', coins: [60, 90], drops: [['bandage', 2, 2, 1]] },
};
const POP = { deer: 14, boar: 7, wolf: 10, bandit: 6 };

const QUESTS = {
  wolves: { title: 'Wolves at the Fold', desc: 'Wolves have been taking sheep from the fold. Kill four grey wolves in the woods around Greywater, then report to Elder Maren.',
            goal: q => `Wolves killed: ${Math.min(q.count, 4)} / 4`, ready: q => q.count >= 4 },
  hides:  { title: 'Hides for Winter', desc: 'The village needs leather before the snow. Hunt deer or boar and bring three raw hides to Elder Maren.',
            goal: () => `Hides carried: ${Math.min(inv('hide'), 3)} / 3`, ready: () => inv('hide') >= 3 },
  mill:   { title: 'The Old Mill', desc: 'Bandits led by Rusk the Miller hold the ruined mill to the northeast. The road north forks toward it. Kill Rusk.',
            goal: () => S.captainDead ? 'Rusk is dead. Return to Maren.' : 'Kill Rusk at the old mill (northeast).', ready: () => S.captainDead },
};

// ===================== utils =====================
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y, s) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s) { let t = 0, amp = .5, f = 1, n = 0; for (let i = 0; i < 4; i++) { t += vnoise(x * f, y * f, s + i * 31) * amp; n += amp; amp *= .5; f *= 2; } return t / n; }
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ===================== world =====================
const map = new Uint8Array(W * H);
const shade = new Float32Array(W * H);
const lamps = [];
const idx = (x, y) => y * W + x;
const getT = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? DEEP : map[idx(x, y)];
const setT = (x, y, t) => { if (x >= 0 && y >= 0 && x < W && y < H) map[idx(x, y)] = t; };

function genWorld() {
  const r = mulberry32(SEED);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const e = fbm(x / 22, y / 22, SEED), m = fbm(x / 16 + 500, y / 16 + 500, SEED + 7);
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
    const el = e - (edge < 8 ? (8 - edge) * .05 : 0);
    let t;
    if (el < .30) t = DEEP; else if (el < .36) t = WATER; else if (el < .39) t = SAND;
    else if (el > .68 && hash2(x, y, 99) < .5) t = ROCK;
    else if (m > .55) t = hash2(x, y, 5) < .6 ? TREE : FFLOOR;
    else { const h = hash2(x, y, 11); t = h < .025 ? TREE : h < .042 ? BUSH : GRASS; }
    map[idx(x, y)] = t;
    shade[idx(x, y)] = hash2(x, y, 3) * 2 - 1;
  }
  clearCircle(VX, VY, VILLAGE_R + 2);
  clearCircle(MILL.x, MILL.y, 8);
  // roads
  carveRoad(VX, VY, VX, 14, r);
  carveRoad(VX, VY, VX, H - 14, r);
  carveRoad(VX, VY, 14, VY, r);
  carveRoad(VX, VY, W - 14, VY, r);
  carveRoad(VX, VY - 22, MILL.x - 2, MILL.y + 3, r);
  for (let y = VY - 3; y <= VY + 4; y++) for (let x = VX - 3; x <= VX + 4; x++) setT(x, y, ROAD); // square
  // fields
  for (let y = VY + 3; y <= VY + 10; y++) for (let x = VX - 16; x <= VX - 12; x++) setT(x, y, FIELD);
  for (let y = VY - 10; y <= VY - 5; y++) for (let x = VX + 12; x <= VX + 15; x++) setT(x, y, FIELD);
  // buildings (x, y, w, h)
  building(VX - 12, VY - 10, 11, 7);  // inn
  building(VX + 4, VY - 9, 8, 6);     // general store
  building(VX - 11, VY + 4, 8, 6);    // elder
  building(VX + 5, VY + 5, 7, 5);     // smithy
  setT(VX - 3, VY + 2, WELL);
  [[VX - 4, VY - 4], [VX + 5, VY - 2], [VX - 4, VY + 5], [VX + 4, VY + 5], [VX, VY - 15], [VX + 1, VY + 15]]
    .forEach(([x, y]) => lamps.push({ x: x * T + T / 2, y: y * T + T / 2 }));
  // the ruined mill
  for (let y = MILL.y - 3; y <= MILL.y + 3; y++) for (let x = MILL.x - 4; x <= MILL.x + 4; x++) {
    const border = y === MILL.y - 3 || y === MILL.y + 3 || x === MILL.x - 4 || x === MILL.x + 4;
    setT(x, y, border ? (hash2(x, y, 77) < .62 ? WALL : FLOOR) : FLOOR);
  }
  setT(MILL.x, MILL.y + 3, FLOOR);
}
function clearCircle(cx, cy, rad) {
  for (let y = cy - rad - 2; y <= cy + rad + 2; y++) for (let x = cx - rad - 2; x <= cx + rad + 2; x++) {
    const d = Math.hypot(x - cx, y - cy) + hash2(x, y, 41) * 2;
    if (d < rad) setT(x, y, d > rad - 3 && hash2(x, y, 42) < .15 ? BUSH : GRASS);
  }
}
function carveRoad(x0, y0, x1, y1, r) {
  let x = x0, y = y0, guard = 0;
  while ((x !== x1 || y !== y1) && guard++ < 2000) {
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const t = getT(x + dx, y + dy);
      if (t === WATER || t === DEEP) setT(x + dx, y + dy, BRIDGE);
      else if (t !== WALL && t !== BRIDGE) setT(x + dx, y + dy, ROAD);
    }
    const ddx = x1 - x, ddy = y1 - y;
    const wobble = r() < .18;
    if (wobble) { if (Math.abs(ddx) > Math.abs(ddy)) y += r() < .5 ? -1 : 1; else x += r() < .5 ? -1 : 1; }
    else if (Math.abs(ddx) > Math.abs(ddy)) x += Math.sign(ddx); else y += Math.sign(ddy);
  }
}
function building(x, y, w, h) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const border = i === 0 || j === 0 || i === w - 1 || j === h - 1;
    setT(x + i, y + j, border ? WALL : FLOOR);
  }
  const dx = x + Math.floor(w / 2);
  setT(dx, y + h - 1, DOOR);
  setT(dx, y + h, ROAD);
  lamps.push({ x: dx * T + T / 2, y: (y + h - 2) * T + T / 2, inside: true });
}

const solidAt = (px, py) => SOLID[getT(Math.floor(px / T), Math.floor(py / T))] === 1;
function canStand(x, y, r) {
  return !solidAt(x - r, y - r) && !solidAt(x + r, y - r) && !solidAt(x - r, y + r) && !solidAt(x + r, y + r);
}
const villageDist = (x, y) => Math.hypot(x - (VX * T + T / 2), y - (VY * T + T / 2));
function moveEnt(e, dx, dy, keepOut) {
  const nx = e.x + dx, ny = e.y + dy;
  const ok = (x, y) => canStand(x, y, e.r) && (!keepOut || villageDist(x, y) > VILLAGE_R * T);
  let moved = false;
  if (ok(nx, e.y)) { e.x = nx; moved = true; }
  if (ok(e.x, ny)) { e.y = ny; moved = true; }
  return moved;
}

// ===================== state =====================
let S = null;                 // persistent state (saved)
let mobs = [], npcs = [], fires = [], parts = [], floats = [];
let nextId = 1;
const ui = { view: 'title', opts: [], npc: null, shop: null };
const logLines = [];

function newState() {
  return {
    v: 1, time: 7 * 60 + 30, day: 1, captainDead: false, harvested: {},
    quests: { wolves: { state: 'none', count: 0 }, hides: { state: 'none' }, mill: { state: 'none' } },
    p: {
      x: (VX - 7) * T + T / 2, y: (VY - 1) * T + T / 2, r: 9, face: 0,
      hp: 100, stam: 100, hunger: 75, lvl: 1, xp: 0, pts: 0, str: 0, end: 0, vit: 0, coins: 15,
      weapon: 'rusty_dagger', armor: 'padded_jerkin', torch: false, torchBurn: 0,
      inv: { bread: 2, berries: 3, bandage: 1, torch: 1 },
    },
  };
}
const P = () => S.p;
const inv = id => (S.p.inv[id] || 0);
function addItem(id, n = 1) { S.p.inv[id] = inv(id) + n; }
function takeItem(id, n = 1) { const c = inv(id) - n; if (c <= 0) delete S.p.inv[id]; else S.p.inv[id] = c; }
const maxHp = () => 90 + S.p.vit * 15 + S.p.lvl * 5;
const maxStam = () => 90 + S.p.end * 12;
const xpNeed = l => Math.round(60 * Math.pow(l, 1.45));
const absMin = () => S.day * 1440 + S.time;

function log(msg, tone) {
  logLines.push({ msg, tone, t: performance.now() });
  if (logLines.length > 6) logLines.shift();
  renderLog();
}

// ===================== npcs =====================
function spawnNpcs() {
  npcs = [
    { id: 'hilde', name: 'Hilde', role: 'Innkeeper', x: (VX - 7) * T + 16, y: (VY - 7) * T + 16, tunic: '#7a3b2e', hair: '#b9772f' },
    { id: 'tobin', name: 'Tobin', role: 'Trader', x: (VX + 8) * T + 16, y: (VY - 6) * T + 16, tunic: '#38506a', hair: '#3b2a1f' },
    { id: 'maren', name: 'Elder Maren', role: 'Village elder', x: (VX - 7) * T + 16, y: (VY + 6) * T + 16, tunic: '#5a4a6e', hair: '#d8d4cc' },
    { id: 'brann', name: 'Brann', role: 'Smith', x: (VX + 8) * T + 16, y: (VY + 7) * T + 16, tunic: '#4a4038', hair: '#1f1a16' },
    { id: 'osric', name: 'Osric', role: 'Watchman', x: VX * T + 16, y: (VY - 13) * T + 16, tunic: '#5b6a3e', hair: '#6b4a2a', guard: true,
      patrol: [[VX * T + 16, (VY - 13) * T], [(VX + 13) * T, VY * T + 16], [VX * T + 16, (VY + 13) * T], [(VX - 13) * T, VY * T + 16]], pi: 0, cd: 0 },
  ];
  for (const n of npcs) { n.r = 9; n.hx = n.x; n.hy = n.y; n.face = Math.PI / 2; n.walk = 0; n.wt = rand(1, 4); n.tx = n.x; n.ty = n.y; }
}

// ===================== mobs =====================
function makeMob(kind, x, y, fixed) {
  const d = MOBS[kind];
  return { id: nextId++, kind, x, y, r: d.r, hp: d.hp, max: d.hp, state: 'wander', tx: x, ty: y, wt: 0, cd: rand(.2, 1),
           face: rand(0, 6.28), walk: 0, kbx: 0, kby: 0, flash: 0, wind: 0, provoked: false, fixed: !!fixed };
}
function habitatOk(kind, t) {
  if (SOLID[t] || t === FLOOR || t === DOOR || t === WALL) return false;
  if (kind === 'wolf' || kind === 'boar') return t === FFLOOR || (t === GRASS && Math.random() < .35);
  if (kind === 'deer') return t === GRASS || t === FFLOOR || t === FIELD;
  return t === GRASS || t === ROAD || t === FFLOOR || t === SAND;
}
function findSpawn(kind, aroundPlayer) {
  const p = P();
  for (let i = 0; i < 40; i++) {
    let tx, ty;
    if (aroundPlayer) {
      const a = rand(0, Math.PI * 2), d = rand(16, 34);
      tx = Math.floor(p.x / T + Math.cos(a) * d); ty = Math.floor(p.y / T + Math.sin(a) * d);
    } else { tx = Math.floor(rand(10, W - 10)); ty = Math.floor(rand(10, H - 10)); }
    const t = getT(tx, ty);
    if (!habitatOk(kind, t)) continue;
    const x = tx * T + T / 2, y = ty * T + T / 2;
    if (villageDist(x, y) < (VILLAGE_R + 6) * T) continue;
    if (Math.hypot(tx - MILL.x, ty - MILL.y) < 13) continue;
    if (!canStand(x, y, 12)) continue;
    return { x, y };
  }
  return null;
}
function populate() {
  mobs = mobs.filter(m => m.fixed);
  for (const kind in POP) for (let i = 0; i < POP[kind]; i++) { const s = findSpawn(kind, false); if (s) mobs.push(makeMob(kind, s.x, s.y)); }
  spawnMillGang();
}
function spawnMillGang() {
  mobs = mobs.filter(m => !m.fixed);
  if (S.captainDead) return;
  const cx = MILL.x * T + T / 2, cy = MILL.y * T + T / 2;
  mobs.push(makeMob('captain', cx, cy - 16, true));
  [[-60, 30], [60, 30], [0, 120], [-110, -60]].forEach(([dx, dy]) => mobs.push(makeMob('bandit', cx + dx, cy + dy, true)));
}
let spawnTimer = 0;
function spawnTick(dt) {
  spawnTimer -= dt; if (spawnTimer > 0) return; spawnTimer = 2;
  const p = P();
  mobs = mobs.filter(m => m.fixed || Math.hypot(m.x - p.x, m.y - p.y) < 60 * T);
  const night = darkness() > .4;
  for (const kind in POP) {
    const want = Math.round(POP[kind] * (kind === 'wolf' && night ? 1.6 : 1));
    const have = mobs.filter(m => m.kind === kind && !m.fixed).length;
    if (have < want) { const s = findSpawn(kind, true); if (s) mobs.push(makeMob(kind, s.x, s.y)); }
  }
}

function nearFire(e, r) { return fires.some(f => Math.hypot(f.x - e.x, f.y - e.y) < r); }

function updateMob(m, dt) {
  const d = MOBS[m.kind], p = P();
  const dx = p.x - m.x, dy = p.y - m.y, dp = Math.hypot(dx, dy);
  m.cd -= dt; m.flash -= dt;
  if (Math.abs(m.kbx) + Math.abs(m.kby) > 4) { moveEnt(m, m.kbx * dt, m.kby * dt, true); m.kbx *= Math.pow(.002, dt); m.kby *= Math.pow(.002, dt); }

  const night = darkness() > .4;
  let aggro = d.aggro ? (night && d.nightAggro ? d.nightAggro : d.aggro) : 0;
  if (d.fearsFire && p.torch) aggro *= .55;
  if (m.provoked && !d.flee) aggro = Math.max(aggro, 340);
  const pSafe = villageDist(p.x, p.y) < VILLAGE_R * T;
  const fireWary = d.fearsFire && !m.provoked && nearFire(p, 140);

  if (m.state === 'windup') {
    m.wind -= dt; m.face = Math.atan2(dy, dx);
    if (m.wind <= 0) {
      m.state = 'chase'; m.cd = d.cd;
      if (dp < m.r + p.r + 20) hurtPlayer(randInt(d.dmg), m);
    }
    return;
  }

  if (d.flee) {
    if (dp < 160 || (m.provoked && dp < 400)) m.state = 'flee';
    else if (m.state === 'flee' && dp > 320) { m.state = 'wander'; m.provoked = false; }
  } else if (p.hp > 0 && !pSafe && !fireWary && dp < aggro) m.state = 'chase';
  else if (m.state === 'chase' && (dp > aggro * 1.6 || pSafe || fireWary)) { m.state = 'wander'; m.provoked = false; }

  let spd = d.speed, mx = 0, my = 0;
  if (m.state === 'chase') {
    mx = dx / dp; my = dy / dp;
    if (dp < m.r + p.r + 12) { mx = my = 0; if (m.cd <= 0) { m.state = 'windup'; m.wind = d.boss ? .55 : .38; } }
  } else if (m.state === 'flee') {
    mx = -dx / dp; my = -dy / dp;
  } else {
    m.wt -= dt;
    if (m.wt <= 0) {
      m.wt = rand(2, 6);
      const home = m.fixed ? { x: MILL.x * T, y: MILL.y * T } : m;
      m.tx = home.x + rand(-140, 140); m.ty = home.y + rand(-140, 140);
    }
    const tx = m.tx - m.x, ty = m.ty - m.y, tl = Math.hypot(tx, ty);
    if (tl > 8) { mx = tx / tl; my = ty / tl; spd *= .32; }
  }
  if (mx || my) {
    if (!moveEnt(m, mx * spd * dt, my * spd * dt, true)) {
      // slide around obstacles
      const side = m.id % 2 ? 1 : -1;
      moveEnt(m, -my * side * spd * dt, mx * side * spd * dt, true);
      if (m.state === 'wander') m.wt = 0;
    }
    m.face = Math.atan2(my, mx); m.walk += dt * spd / 18;
  }
}

function separate(list) {
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r;
    if (d > 0 && d < min) {
      const push = (min - d) / 2, ux = dx / d, uy = dy / d;
      moveEnt(a, -ux * push, -uy * push, a !== P()); moveEnt(b, ux * push, uy * push, b !== P());
    }
  }
}

function hurtMob(m, dmg, crit, src, byPlayer) {
  m.hp -= dmg; m.flash = .12; m.provoked = true;
  const a = Math.atan2(m.y - src.y, m.x - src.x);
  m.kbx = Math.cos(a) * 260; m.kby = Math.sin(a) * 260;
  if (m.state === 'windup' && crit) { m.state = 'chase'; m.cd = .5; } // a crit staggers
  floats.push({ x: m.x, y: m.y - 18, txt: String(dmg) + (crit ? '!' : ''), col: crit ? '#f2c86b' : '#f1e8d6', t: 0 });
  for (let i = 0; i < 6; i++) parts.push({ x: m.x, y: m.y, vx: Math.cos(a) * rand(30, 140) + rand(-40, 40), vy: Math.sin(a) * rand(30, 140) + rand(-40, 40), t: 0, life: rand(.3, .6), col: '#8e1f1a', s: rand(1.5, 3) });
  if (m.hp <= 0) killMob(m, byPlayer);
}
function killMob(m, byPlayer) {
  mobs = mobs.filter(x => x !== m);
  const d = MOBS[m.kind];
  if (!byPlayer) return;
  gainXp(d.xp);
  const got = [];
  for (const [id, a, b, ch] of d.drops) if (Math.random() < ch) { const n = randInt([a, b]); addItem(id, n); got.push(`${n} ${ITEMS[id].name}`); }
  if (d.coins) { const c = randInt(d.coins); P().coins += c; got.push(`${c} coin`); }
  const verb = d.human ? 'You search the body' : 'You butcher the carcass';
  log(`${d.name} killed. ${got.length ? verb + ': ' + got.join(', ') + '.' : ''}`);
  if (m.kind === 'wolf' && S.quests.wolves.state === 'active') {
    S.quests.wolves.count++;
    if (S.quests.wolves.count === 4) log('That is four wolves. Return to Elder Maren.', 'quest');
  }
  if (m.kind === 'captain') { S.captainDead = true; log('Rusk the Miller is dead. The mill is quiet.', 'quest'); }
  if (S.quests.hides.state === 'active' && inv('hide') >= 3 && got.some(g => g.includes('hide'))) log('You have three hides. Bring them to Maren.', 'quest');
}
function gainXp(x) {
  const p = P(); p.xp += x;
  while (p.xp >= xpNeed(p.lvl)) {
    p.xp -= xpNeed(p.lvl); p.lvl++; p.pts += 2; p.hp = maxHp(); p.stam = maxStam();
    log(`You reached level ${p.lvl}. Two points to spend in Hero (C).`, 'quest');
  }
}

// ===================== player =====================
const input = { keys: new Set(), atk: false, mouse: { x: 0, y: 0, aim: false, right: false }, tx: 0, ty: 0, run: false, block: false };

function updatePlayer(dt) {
  const p = P(), k = input.keys;
  let mx = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0) + input.tx;
  let my = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0) + input.ty;
  const len = Math.hypot(mx, my); if (len > 1) { mx /= len; my /= len; }
  const moving = len > .15;
  const wantBlock = k.has('k') || input.mouse.right || input.block;
  p.blocking = wantBlock && p.stam > 1;
  const running = (k.has('shift') || input.run) && moving && !p.blocking && p.stam > 2 && p.hunger > 0;
  const armor = ITEMS[p.armor];
  const spd = 118 * (running ? 1.65 : 1) * (p.blocking ? .45 : 1) * (armor.slow || 1) * (p.hunger <= 0 ? .8 : 1);
  if (moving) {
    moveEnt(p, mx * spd * dt, my * spd * dt, false);
    p.walk = (p.walk || 0) + dt * spd / 18;
    if (!input.mouse.aim) p.face = Math.atan2(my, mx);
  }
  if (input.mouse.aim) {
    const wm = screenToWorld(input.mouse.x, input.mouse.y);
    p.face = Math.atan2(wm.y - p.y, wm.x - p.x);
  }
  // stamina
  if (running) p.stam -= 22 * dt;
  else if (p.blocking) p.stam -= 3 * dt;
  else if (p.atkCd <= 0) p.stam += (p.hunger < 15 ? 8 : 20) * dt;
  p.stam = clamp(p.stam, 0, maxStam());
  // hunger: full to empty in about a day, twice as fast while running
  p.hunger -= dt * GMPS * (100 / 1440) * (running ? 2 : 1);
  if (p.hunger <= 0) { p.hunger = 0; p.hp -= dt * .6; if (Math.random() < dt / 20) log('You are starving. Eat something.', 'bad'); }
  // healing
  p.lastHurt = (p.lastHurt || 0) + dt;
  if (p.hunger > 40 && p.lastHurt > 6) p.hp += dt * .5;
  if (p.healPool > 0) { const h = Math.min(p.healPool, 12 * dt); p.hp += h; p.healPool -= h; }
  p.hp = Math.min(p.hp, maxHp());
  if (p.hp <= 0) return die();
  // attack
  p.atkCd = (p.atkCd || 0) - dt; p.swing = (p.swing || 0) - dt;
  if (input.atk) { input.atk = false; tryAttack(); }
  // torch
  if (p.torch) {
    p.torchBurn -= dt * GMPS;
    if (p.torchBurn <= 0) {
      if (inv('torch') > 0) { takeItem('torch'); p.torchBurn = 240; log('You light a fresh torch from the stub.'); }
      else { p.torch = false; log('Your torch gutters out.', 'bad'); }
    }
  }
}
function tryAttack() {
  const p = P(), w = ITEMS[p.weapon];
  if (p.atkCd > 0 || p.blocking) return;
  if (p.stam < w.stam * .5) { log('Too winded to swing.', 'bad'); return; }
  p.stam -= w.stam; p.atkCd = w.cd; p.swing = .2;
  for (const m of [...mobs]) {
    const d = dist(p, m);
    if (d > w.reach + m.r + p.r) continue;
    const ang = Math.abs(angDiff(Math.atan2(m.y - p.y, m.x - p.x), p.face));
    if (ang > 1.05 && d > p.r + m.r + 4) continue;
    let dmg = randInt(w.dmg) + p.str * 2;
    const crit = Math.random() < .1;
    if (crit) dmg = Math.round(dmg * 1.6);
    hurtMob(m, dmg, crit, p, true);
  }
}
function hurtPlayer(dmg, src) {
  const p = P();
  let d = dmg * (1 - ITEMS[p.armor].armor * .05);
  if (p.blocking) {
    const ang = Math.abs(angDiff(Math.atan2(src.y - p.y, src.x - p.x), p.face));
    if (ang < 1.2) {
      d *= .2; p.stam -= dmg * 1.3;
      for (let i = 0; i < 8; i++) parts.push({ x: (p.x + src.x) / 2, y: (p.y + src.y) / 2, vx: rand(-120, 120), vy: rand(-120, 120), t: 0, life: .25, col: '#ffd27a', s: 1.5 });
      if (p.stam <= 0) { p.stam = 0; p.blocking = false; log('Your guard breaks.', 'bad'); }
    }
  }
  d = Math.max(1, Math.round(d));
  p.hp -= d; p.lastHurt = 0; shake = Math.min(8, shake + d * .6);
  floats.push({ x: p.x, y: p.y - 20, txt: '-' + d, col: '#e0574b', t: 0 });
}
function die() {
  const p = P();
  const lost = Math.floor(p.coins / 2);
  p.coins -= lost;
  delete p.inv.raw_meat; delete p.inv.cooked_meat;
  p.hp = maxHp() * .5; p.stam = maxStam(); p.hunger = Math.max(p.hunger, 30); p.torch = false;
  p.x = (VX - 7) * T + T / 2; p.y = (VY - 6) * T + T / 2;
  advanceTime(360);
  input.keys.clear();
  openPanel('dead', { lost });
}

// ===================== time & light =====================
function advanceTime(min) {
  S.time += min;
  while (S.time >= 1440) { S.time -= 1440; S.day++; }
}
function darkness() {
  const h = S.time / 60;
  if (h >= 7 && h < 18) return 0;
  if (h >= 18 && h < 21) return (h - 18) / 3 * .84;
  if (h >= 5 && h < 7) return (1 - (h - 5) / 2) * .84;
  return .84;
}
function duskTint() {
  const h = S.time / 60;
  if (h >= 17 && h < 20) return Math.sin((h - 17) / 3 * Math.PI) * .18;
  if (h >= 5 && h < 7.5) return Math.sin((h - 5) / 2.5 * Math.PI) * .12;
  return 0;
}

// ===================== interaction =====================
function findInteract() {
  const p = P();
  let best = null, bd = 48;
  for (const n of npcs) { const d = dist(p, n); if (d < bd) { bd = d; best = { type: 'npc', npc: n, label: `Talk to ${n.name}` }; } }
  if (best) return best;
  for (const f of fires) if (dist(p, f) < 52) return { type: 'fire', fire: f, label: inv('raw_meat') ? `Cook ${inv('raw_meat')} raw meat` : 'Warm your hands (nothing to cook)' };
  // tile in front, then neighbours
  const fx = Math.floor((p.x + Math.cos(p.face) * 22) / T), fy = Math.floor((p.y + Math.sin(p.face) * 22) / T);
  const cands = [[fx, fy]];
  const ptx = Math.floor(p.x / T), pty = Math.floor(p.y / T);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) cands.push([ptx + dx, pty + dy]);
  for (const [x, y] of cands) {
    const t = getT(x, y), i = idx(x, y);
    const ready = !(S.harvested[i] > absMin());
    if (t === BUSH) return { type: 'bush', i, ready, label: ready ? 'Pick berries' : 'Bush is picked clean' };
    if (t === TREE) return { type: 'tree', i, ready, label: ready ? 'Gather dry sticks' : 'No dry wood left here' };
    if (t === WELL) return { type: 'well', label: 'Drink from the well' };
  }
  return null;
}
function interact() {
  const it = findInteract(); if (!it) return;
  const p = P();
  if (it.type === 'npc') return talk(it.npc);
  if (it.type === 'fire') {
    const n = inv('raw_meat');
    if (!n) return log('The fire crackles. You have nothing to cook.');
    takeItem('raw_meat', n); addItem('cooked_meat', n);
    advanceTime(10 * n);
    return log(`You roast ${n} piece${n > 1 ? 's' : ''} of meat over the coals.`);
  }
  if (it.type === 'bush') {
    if (!it.ready) return log('You already picked this bush. Berries regrow in a day.');
    const n = randInt([2, 4]); addItem('berries', n); S.harvested[it.i] = absMin() + 1440;
    return log(`You pick ${n} berries.`);
  }
  if (it.type === 'tree') {
    if (!it.ready) return log('You have taken all the dry wood from this tree.');
    const n = randInt([1, 3]); addItem('sticks', n); S.harvested[it.i] = absMin() + 2880;
    advanceTime(5);
    return log(`You gather ${n} dry stick${n > 1 ? 's' : ''}.`);
  }
  if (it.type === 'well') { p.stam = maxStam(); return log('Cold, clean water. You feel steadier.'); }
}
function eat(id) {
  const it = ITEMS[id], p = P();
  if (!inv(id)) return;
  if (it.kind === 'heal') {
    takeItem(id); p.healPool = (p.healPool || 0) + it.heal;
    return log(`You bind your wounds with a ${it.name.toLowerCase()}.`);
  }
  if (p.hunger > 96 && it.food > 0) return log('You are too full to eat.');
  takeItem(id);
  p.hunger = clamp(p.hunger + it.food, 0, 100);
  if (it.heal < 0) { p.hp += it.heal; log('You choke down the raw meat. Your stomach cramps.', 'bad'); }
  else { p.hp = Math.min(maxHp(), p.hp + it.heal); log(`You eat the ${it.name.toLowerCase()}.`); }
}
function buildFire() {
  const p = P();
  if (inv('sticks') < 4) return log('You need four dry sticks to build a campfire.', 'bad');
  if (villageDist(p.x, p.y) < 6 * T) return log('Not in the middle of the village.');
  takeItem('sticks', 4);
  fires.push({ x: p.x + Math.cos(p.face) * 26, y: p.y + Math.sin(p.face) * 26, burn: 480 });
  log('You build a campfire. It will burn for about eight hours.');
}
function toggleTorch() {
  const p = P();
  if (p.torch) { p.torch = false; p.torchBurn = Math.max(p.torchBurn, 0); return log('You snuff the torch.'); }
  if (p.torchBurn > 0) { p.torch = true; return log('You relight the torch.'); }
  if (!inv('torch')) return log('You have no torch. Tobin sells them.', 'bad');
  takeItem('torch'); p.torch = true; p.torchBurn = 240; log('You light a pitch torch.');
}

// ===================== dialogue =====================
const RUMOURS = [
  'Hold your shield up when a wolf crouches to spring. Block with K or the right mouse button.',
  'Raw meat will sicken you. Build a fire out of four sticks and roast it first.',
  'Wolves hunt bolder after dark, but they will not come near a fire.',
  'Brann says a spear is the best friend a hunter has. Keeps the teeth away from your legs.',
  'Nobody has ground flour at the old mill since Rusk and his lot moved in.',
  'Eat before you set out. A hungry body tires fast and heals slow.',
];
function talk(n) {
  ui.npc = n;
  const d = DIALOGUE[n.id]();
  openPanel('dialog', d);
}
const close = () => closePanel();
const DIALOGUE = {
  hilde: () => ({
    text: `“Fire’s warm and the stew’s hot. A bed is ten coin, stew is twelve. You look like you need both.”`,
    opts: [
      ['Buy a crock of stew (12 coin)', () => { if (pay(12)) { addItem('stew'); log('Hilde ladles out a crock of mutton stew.'); } talk(ui.npc); }],
      ['Rent a bed and sleep until morning (10 coin)', () => { if (pay(10)) sleep(); else talk(ui.npc); }],
      ['Heard anything lately?', () => openPanel('dialog', { text: `“${RUMOURS[Math.floor(Math.random() * RUMOURS.length)]}”`, opts: [['Ask something else', () => talk(ui.npc)], ['Leave', close]] })],
      ['Leave', close],
    ],
  }),
  tobin: () => ({ text: '“Bread, linen, pitch torches. And I’ll pay fair for pelts and hides, if you’ve the stomach to skin things.”',
    opts: [['Trade', () => openShop('tobin')], ['Leave', close]] }),
  brann: () => ({ text: '“Steel’s not cheap. Still cheaper than a funeral.”', opts: [['Trade', () => openShop('brann')], ['Leave', close]] }),
  osric: () => ({ text: `“${[
      'Stay inside the village and nothing will touch you. Past the fence line you are on your own.',
      'Wolves come closer after dark. Carry a torch, or sit by a fire.',
      'Bandits took the old mill. Follow the north road and take the fork east.',
      'Boar will leave you alone unless you crowd them. Then they will open your leg.'][Math.floor(Math.random() * 4)]}”`,
    opts: [['Leave', close]] }),
  maren: () => {
    const q = S.quests;
    const reward = (key, coins, xp, item) => {
      q[key].state = 'done'; P().coins += coins; gainXp(xp);
      if (item) addItem(item);
      log(`Quest complete: ${QUESTS[key].title}. +${coins} coin, +${xp} xp${item ? ', ' + ITEMS[item].name : ''}.`, 'quest');
      talk(ui.npc);
    };
    if (q.wolves.state === 'none') return { text: '“Wolves have taken three ewes from the fold this week. The shepherds are frightened to go out. Kill four of them and I will see you paid.”',
      opts: [['I’ll deal with the wolves.', () => { q.wolves.state = 'active'; log('New quest: Wolves at the Fold.', 'quest'); close(); }], ['Not now.', close]] };
    if (q.wolves.state === 'active') return QUESTS.wolves.ready(q.wolves)
      ? { text: '“Four pelts’ worth of wolf. The shepherds will sleep tonight. Here, as promised.”', opts: [['Take the reward', () => reward('wolves', 40, 70)]] }
      : { text: `“Four wolves. You’ve killed ${q.wolves.count} so far. They den in the deep woods.”`, opts: [['I’ll keep hunting.', close]] };
    if (q.hides.state === 'none') return { text: '“Winter is close and we are short on leather. Bring me three raw hides. Deer or boar, it doesn’t matter. Brann can make you something from the spares.”',
      opts: [['I’ll bring the hides.', () => { q.hides.state = 'active'; log('New quest: Hides for Winter.', 'quest'); close(); }], ['Not now.', close]] };
    if (q.hides.state === 'active') return QUESTS.hides.ready()
      ? { text: '“Good, thick hides. Take this. Brann boiled the leather himself.”', opts: [['Hand over three hides', () => { takeItem('hide', 3); reward('hides', 30, 60, 'leather_armor'); }]] }
      : { text: `“Three hides. You have ${inv('hide')}.”`, opts: [['I’ll be back.', close]] };
    if (q.mill.state === 'none') return { text: '“There is a worse problem. A man called Rusk holds the old mill to the northeast with a band of cutthroats. They rob the carts on the north road. Kill him and the rest will scatter. It will not be easy.”',
      opts: [['I’ll go to the mill.', () => { q.mill.state = 'active'; log('New quest: The Old Mill.', 'quest'); close(); }], ['I need to prepare first.', close]] };
    if (q.mill.state === 'active') return QUESTS.mill.ready()
      ? { text: '“Rusk is dead? Then the road is ours again. Take my late husband’s sword. He would want it used.”', opts: [['Accept the sword', () => reward('mill', 150, 200, 'longsword')]] }
      : { text: '“Rusk still holds the mill. Northeast, past the fork in the north road. Bring bandages.”', opts: [['I’ll go.', close]] };
    return { text: '“The vale is quieter than it has been in years. You are welcome at my fire any time.”', opts: [['Leave', close]] };
  },
};
function pay(n) { const p = P(); if (p.coins < n) { log('You cannot afford that.', 'bad'); return false; } p.coins -= n; return true; }
function sleep() {
  const p = P();
  const target = S.time < 7 * 60 ? 7 * 60 - S.time : 1440 - S.time + 7 * 60;
  advanceTime(target);
  p.hp = maxHp(); p.stam = maxStam(); p.hunger = Math.max(0, p.hunger - 20);
  fires = [];
  saveGame();
  log(`You sleep at the inn and wake on day ${S.day}. Game saved.`, 'quest');
  close();
}

const SHOPS = {
  tobin: { name: 'Tobin’s Goods', sells: ['bread', 'bandage', 'torch', 'sticks'] },
  brann: { name: 'Brann’s Forge', sells: ['short_sword', 'hunting_spear', 'longsword', 'battle_axe', 'leather_armor', 'chainmail'] },
};
const sellPrice = id => Math.max(1, Math.floor(ITEMS[id].value * .5));
const buyPrice = id => Math.max(1, Math.ceil(ITEMS[id].value * (ITEMS[id].kind === 'mat' ? 2 : 1)));
function openShop(id) { ui.shop = id; openPanel('shop'); }

// ===================== save / load =====================
function serialize() { return JSON.parse(JSON.stringify(S)); }
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(serialize())); } catch (e) { /* storage unavailable */ } }
function loadSaved() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function applyState(data) {
  const base = newState();
  S = Object.assign(base, data);
  S.p = Object.assign(newState().p, data.p || {});
  S.quests = Object.assign(newState().quests, data.quests || {});
  fires = []; parts = []; floats = [];
  spawnNpcs(); populate();
}

// ===================== rendering =====================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const lightC = document.createElement('canvas'), lctx = lightC.getContext('2d');
let VW = 0, VH = 0, DPR = 1, zoom = 1, camX = 0, camY = 0, shake = 0, clock = 0;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  VW = window.innerWidth; VH = window.innerHeight;
  canvas.width = Math.round(VW * DPR); canvas.height = Math.round(VH * DPR);
  lightC.width = Math.ceil(VW / 2); lightC.height = Math.ceil(VH / 2);
  zoom = VW < 640 ? .78 : VW > 1600 ? 1.2 : 1;
}
window.addEventListener('resize', resize);
const screenToWorld = (sx, sy) => ({ x: camX + sx / zoom, y: camY + sy / zoom });

function hsl(c, dl) { return `hsl(${c[0]},${c[1]}%,${c[2] + dl}%)`; }

function drawGround(x0, y0, x1, y1) {
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const t = getT(tx, ty), sx = tx * T, sy = ty * T, sh = tx >= 0 && ty >= 0 && tx < W && ty < H ? shade[idx(tx, ty)] : 0;
    let dl = sh * 2.2;
    if (t === WATER || t === DEEP) dl += Math.sin(clock * 1.3 + tx * .7 + ty * .4) * 1.4;
    ctx.fillStyle = hsl(TILE_HSL[t], dl);
    ctx.fillRect(sx, sy, T + .5, T + .5);
    if (t === GRASS || t === BUSH || t === ROCK) {
      if (sh > .3) { ctx.fillStyle = 'rgba(20,40,10,.35)'; ctx.fillRect(sx + 6 + sh * 10, sy + 10, 2, 5); ctx.fillRect(sx + 20 - sh * 6, sy + 20, 2, 5); }
    } else if (t === ROAD) {
      if (sh > .5) { ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(sx + 8, sy + 12 + sh * 8, 4, 3); }
    } else if (t === FLOOR || t === BRIDGE) {
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      for (let i = 1; i < 4; i++) ctx.fillRect(sx, sy + i * 8, T, 1);
    } else if (t === FIELD) {
      ctx.fillStyle = 'rgba(40,25,10,.45)'; for (let i = 0; i < 4; i++) ctx.fillRect(sx, sy + 3 + i * 8, T, 3);
      ctx.fillStyle = 'rgba(160,150,60,.6)'; for (let i = 0; i < 4; i++) ctx.fillRect(sx + 4 + ((i * 7) % 20), sy + i * 8, 2, 4);
    } else if (t === WALL) {
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(sx, sy, T, 6);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(sx, sy + T / 2, T, 1); ctx.fillRect(sx + (ty % 2 ? 10 : 22), sy + 6, 1, T / 2 - 6);
    } else if (t === WATER) {
      if (getT(tx, ty - 1) !== WATER && getT(tx, ty - 1) !== DEEP) { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(sx, sy, T, 3); }
    } else if (t === DOOR) {
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(sx + 4, sy + 2, T - 8, T - 4);
    }
  }
}

function drawProp(o) {
  const { t, tx, ty } = o, sx = tx * T, sy = ty * T, h = hash2(tx, ty, 8);
  if (t === TREE) {
    const cx = sx + 16 + (h - .5) * 6, cy = sy + 8, rr = 17 + h * 6;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(cx + 4, sy + 26, rr * .8, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3d2a1b'; ctx.fillRect(cx - 3, sy + 12, 6, 16);
    const harvested = S.harvested[idx(tx, ty)] > absMin();
    const g = h > .5 ? [118, 30, 18] : [96, 32, 20];
    ctx.fillStyle = hsl(g, harvested ? -3 : 0); ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.fill();
    ctx.fillStyle = hsl(g, 5); ctx.beginPath(); ctx.arc(cx - rr * .3, cy - rr * .3, rr * .6, 0, 7); ctx.fill();
    ctx.fillStyle = hsl(g, 10); ctx.beginPath(); ctx.arc(cx - rr * .4, cy - rr * .45, rr * .25, 0, 7); ctx.fill();
  } else if (t === ROCK) {
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sx + 18, sy + 26, 14, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6c6964'; ctx.beginPath(); ctx.moveTo(sx + 3, sy + 26); ctx.lineTo(sx + 8, sy + 6 + h * 4); ctx.lineTo(sx + 20, sy + 2); ctx.lineTo(sx + 30, sy + 12); ctx.lineTo(sx + 29, sy + 27); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#86837d'; ctx.beginPath(); ctx.moveTo(sx + 8, sy + 8 + h * 4); ctx.lineTo(sx + 20, sy + 3); ctx.lineTo(sx + 18, sy + 14); ctx.closePath(); ctx.fill();
  } else if (t === BUSH) {
    const ready = !(S.harvested[idx(tx, ty)] > absMin());
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(sx + 16, sy + 25, 12, 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2f4f22'; ctx.beginPath(); ctx.arc(sx + 11, sy + 18, 8, 0, 7); ctx.arc(sx + 21, sy + 17, 9, 0, 7); ctx.arc(sx + 16, sy + 11, 8, 0, 7); ctx.fill();
    if (ready) { ctx.fillStyle = '#a3243a'; [[10, 15], [19, 12], [22, 20], [14, 21], [16, 9]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(sx + a, sy + b, 1.8, 0, 7); ctx.fill(); }); }
  } else if (t === WELL) {
    ctx.fillStyle = '#5d5a55'; ctx.beginPath(); ctx.arc(sx + 16, sy + 16, 14, 0, 7); ctx.fill();
    ctx.fillStyle = '#16232c'; ctx.beginPath(); ctx.arc(sx + 16, sy + 16, 8, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3d2a1b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx + 2, sy - 6); ctx.lineTo(sx + 30, sy - 6); ctx.stroke();
  }
}

function drawHuman(e, opt) {
  const { x, y } = e, bob = Math.sin(e.walk || 0) * 1.5;
  ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(x, y + 9, 10, 4, 0, 0, 7); ctx.fill();
  // weapon behind/in front
  const swing = opt.swing > 0 ? (1 - opt.swing / .2) : -1;
  const wa = e.face + (swing >= 0 ? -1.1 + swing * 2.2 : .5);
  const reach = opt.reach || 22;
  const drawWeapon = () => {
    if (!opt.weapon) return;
    ctx.strokeStyle = opt.weaponCol || '#b8bcc0'; ctx.lineWidth = opt.heavy ? 4 : 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + Math.cos(wa) * 8, y - 2 + Math.sin(wa) * 8); ctx.lineTo(x + Math.cos(wa) * (8 + reach * .6), y - 2 + Math.sin(wa) * (8 + reach * .6)); ctx.stroke();
  };
  if (Math.sin(e.face) < 0) drawWeapon();
  ctx.fillStyle = e.flash > 0 ? '#fff' : opt.tunic;
  ctx.beginPath(); ctx.ellipse(x, y + bob * .3, 9, 10, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 9, y + 2, 18, 2);
  ctx.fillStyle = e.flash > 0 ? '#fff' : '#d9a982';
  ctx.beginPath(); ctx.arc(x, y - 11 + bob * .3, 6.5, 0, 7); ctx.fill();
  ctx.fillStyle = opt.hair;
  ctx.beginPath(); ctx.arc(x - Math.cos(e.face) * 2, y - 13 + bob * .3 - Math.sin(e.face) * 2, 6, Math.PI, 2 * Math.PI); ctx.fill();
  if (opt.hood) { ctx.fillStyle = opt.hood; ctx.beginPath(); ctx.arc(x, y - 12, 7.5, Math.PI * .9, Math.PI * 2.1); ctx.fill(); }
  if (Math.sin(e.face) >= 0) drawWeapon();
  if (opt.shield) {
    ctx.fillStyle = '#6b4a2a'; ctx.strokeStyle = '#a07a3c'; ctx.lineWidth = 2;
    const sa = e.face; ctx.beginPath(); ctx.arc(x + Math.cos(sa) * 11, y - 1 + Math.sin(sa) * 11, 7, 0, 7); ctx.fill(); ctx.stroke();
  }
}
function drawBeast(m) {
  const d = MOBS[m.kind], a = m.face, c = Math.cos(a), s = Math.sin(a);
  const bob = Math.sin(m.walk) * 1.2, len = m.kind === 'boar' ? 12 : 13, wid = m.kind === 'boar' ? 8 : 6.5;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(m.x, m.y + 8, len, 5, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(m.x, m.y + bob * .3); ctx.rotate(a);
  const col = m.flash > 0 ? '#fff' : d.col;
  // legs
  ctx.fillStyle = '#2a2018';
  const lg = Math.sin(m.walk) * 3;
  [[-7, -wid], [7, -wid], [-7, wid], [7, wid]].forEach(([lx, ly], i) => ctx.fillRect(lx + (i % 3 ? lg : -lg) - 1.5, ly - 1.5 + (ly > 0 ? 1 : -1), 3, 3));
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, len, wid, 0, 0, 7); ctx.fill();
  if (m.kind === 'wolf') { ctx.beginPath(); ctx.moveTo(-len + 1, 0); ctx.lineTo(-len - 9, -2 + bob); ctx.lineTo(-len - 7, 2); ctx.closePath(); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(len + 3, 0, m.kind === 'boar' ? 6 : 5.5, m.kind === 'boar' ? 5.5 : 4.5, 0, 0, 7); ctx.fill();
  if (m.kind === 'deer') {
    ctx.fillStyle = '#c9a77c'; ctx.beginPath(); ctx.ellipse(-len + 2, 0, 3, 3, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#d8c7a0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(len + 2, -3); ctx.lineTo(len - 2, -9); ctx.lineTo(len - 5, -8); ctx.moveTo(len + 2, 3); ctx.lineTo(len - 2, 9); ctx.lineTo(len - 5, 8); ctx.stroke();
  }
  if (m.kind === 'boar') { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(len + 6, -4, 3, 1.5); ctx.fillRect(len + 6, 2.5, 3, 1.5); ctx.fillStyle = '#2b1f17'; ctx.fillRect(-6, -1.5, 14, 3); }
  if (m.kind === 'wolf') { ctx.fillStyle = '#4f5051'; ctx.beginPath(); ctx.moveTo(len + 1, -3); ctx.lineTo(len - 2, -7); ctx.lineTo(len + 3, -4); ctx.moveTo(len + 1, 3); ctx.lineTo(len - 2, 7); ctx.lineTo(len + 3, 4); ctx.fill(); }
  ctx.fillStyle = m.state === 'chase' || m.state === 'windup' ? '#e0b040' : '#111';
  if (m.kind !== 'deer') { ctx.fillRect(len + 5, -2.5, 1.6, 1.6); ctx.fillRect(len + 5, 1, 1.6, 1.6); }
  ctx.restore();
}
function drawFire(f) {
  const fl = Math.sin(clock * 13 + f.x) * 1.5 + Math.sin(clock * 7.3) * 1.2;
  ctx.fillStyle = '#3a2a1c'; ctx.save(); ctx.translate(f.x, f.y);
  ctx.rotate(.5); ctx.fillRect(-11, -2, 22, 4); ctx.rotate(-1); ctx.fillRect(-11, -2, 22, 4); ctx.restore();
  ctx.fillStyle = '#d5652a'; ctx.beginPath(); ctx.ellipse(f.x, f.y - 5, 6, 9 + fl, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#f7c34f'; ctx.beginPath(); ctx.ellipse(f.x, f.y - 3, 3.5, 5 + fl * .6, 0, 0, 7); ctx.fill();
  if (Math.random() < .3) parts.push({ x: f.x + rand(-4, 4), y: f.y - 10, vx: rand(-10, 10), vy: rand(-50, -25), t: 0, life: rand(.5, 1), col: '#f39a3c', s: 1.4 });
}
function drawLamp(l) {
  if (l.inside) return;
  ctx.fillStyle = '#2a2018'; ctx.fillRect(l.x - 2, l.y - 22, 4, 26);
  ctx.fillStyle = darkness() > .2 ? '#f6c766' : '#6b5a3a'; ctx.fillRect(l.x - 4, l.y - 30, 8, 9);
}

function drawHpBar(e, max, w) {
  if (e.hp >= max) return;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(e.x - w / 2, e.y - 30, w, 4);
  ctx.fillStyle = '#c8473b'; ctx.fillRect(e.x - w / 2, e.y - 30, w * Math.max(0, e.hp / max), 4);
}

function render() {
  const p = P();
  const vw = VW / zoom, vh = VH / zoom;
  camX = clamp(p.x - vw / 2, 0, W * T - vw); camY = clamp(p.y - vh / 2, 0, H * T - vh);
  const sh = shake > .1 ? shake : 0;
  ctx.setTransform(DPR * zoom, 0, 0, DPR * zoom, 0, 0);
  ctx.translate(-camX + rand(-sh, sh), -camY + rand(-sh, sh));

  const x0 = Math.floor(camX / T) - 1, y0 = Math.floor(camY / T) - 1, x1 = Math.ceil((camX + vw) / T) + 1, y1 = Math.ceil((camY + vh) / T) + 2;
  drawGround(x0, y0, x1, y1);

  // y-sorted drawables
  const list = [];
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const t = getT(tx, ty);
    if (t === TREE || t === ROCK || t === BUSH || t === WELL) list.push({ y: ty * T + 26, k: 0, t, tx, ty });
  }
  const inView = e => e.x > camX - 60 && e.x < camX + vw + 60 && e.y > camY - 60 && e.y < camY + vh + 80;
  for (const l of lamps) if (inView(l)) list.push({ y: l.y, k: 4, e: l });
  for (const f of fires) if (inView(f)) list.push({ y: f.y, k: 3, e: f });
  for (const m of mobs) if (inView(m)) list.push({ y: m.y, k: 1, e: m });
  for (const n of npcs) if (inView(n)) list.push({ y: n.y, k: 2, e: n });
  list.push({ y: p.y, k: 5, e: p });
  list.sort((a, b) => a.y - b.y);
  for (const o of list) {
    if (o.k === 0) drawProp(o);
    else if (o.k === 1) {
      const m = o.e, d = MOBS[m.kind];
      if (d.human) drawHuman(m, { tunic: d.col, hair: '#2a1d14', hood: d.boss ? '#5a1f1a' : '#3b3128', weapon: true, reach: d.boss ? 34 : 24, heavy: d.boss, swing: m.state === 'windup' ? (m.wind / (d.boss ? .55 : .38)) * .2 : 0 });
      else drawBeast(m);
      if (m.state === 'windup') { ctx.strokeStyle = 'rgba(230,80,60,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 6 + m.wind * 10, 0, 7); ctx.stroke(); }
      drawHpBar(m, m.max, d.boss ? 40 : 24);
      if (d.boss) { ctx.fillStyle = '#e8d6b0'; ctx.font = '11px "Alegreya Sans", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(d.name, m.x, m.y - 36); }
    } else if (o.k === 2) {
      const n = o.e;
      drawHuman(n, { tunic: n.tunic, hair: n.hair, weapon: n.guard, reach: 40, weaponCol: '#8a6b45', swing: n.swing || 0 });
    } else if (o.k === 3) drawFire(o.e);
    else if (o.k === 4) drawLamp(o.e);
    else {
      const w = ITEMS[p.weapon], a = ITEMS[p.armor];
      drawHuman(p, { tunic: a.armor >= 7 ? '#7d8287' : a.armor >= 4 ? '#6e4b2e' : '#4d6178', hair: '#4a3020', weapon: true, reach: w.reach, heavy: p.weapon === 'battle_axe', swing: p.swing, shield: p.blocking });
      if (p.torch) { ctx.fillStyle = '#f6b44a'; ctx.beginPath(); ctx.arc(p.x - Math.sin(p.face) * 10, p.y - 10 + Math.cos(p.face) * 4, 3 + Math.random(), 0, 7); ctx.fill(); }
    }
  }
  // swing arc
  if (p.swing > 0) {
    const w = ITEMS[p.weapon];
    ctx.strokeStyle = `rgba(240,230,210,${p.swing * 2})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y - 2, w.reach + p.r, p.face - 1, p.face + 1); ctx.stroke();
  }
  // particles & floating text
  for (const q of parts) { ctx.globalAlpha = 1 - q.t / q.life; ctx.fillStyle = q.col; ctx.fillRect(q.x, q.y, q.s, q.s); }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.font = '700 13px "Alegreya Sans", sans-serif';
  for (const f of floats) { ctx.globalAlpha = 1 - f.t; ctx.fillStyle = '#000'; ctx.fillText(f.txt, f.x + 1, f.y - f.t * 26 + 1); ctx.fillStyle = f.col; ctx.fillText(f.txt, f.x, f.y - f.t * 26); }
  ctx.globalAlpha = 1;

  // lighting
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const tint = duskTint();
  if (tint > 0) { ctx.fillStyle = `rgba(214,110,50,${tint})`; ctx.fillRect(0, 0, VW, VH); }
  const dark = darkness();
  if (dark > 0) {
    const sc = .5 * zoom;
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, lightC.width, lightC.height);
    lctx.fillStyle = `rgba(6,9,22,${dark})`; lctx.fillRect(0, 0, lightC.width, lightC.height);
    lctx.globalCompositeOperation = 'destination-out';
    const light = (x, y, r, k = 1) => {
      const lx = (x - camX) * sc, ly = (y - camY) * sc, lr = r * sc;
      if (lx < -lr || ly < -lr || lx > lightC.width + lr || ly > lightC.height + lr) return;
      const g = lctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
      g.addColorStop(0, `rgba(0,0,0,${k})`); g.addColorStop(.55, `rgba(0,0,0,${k * .6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g; lctx.beginPath(); lctx.arc(lx, ly, lr, 0, 7); lctx.fill();
    };
    light(p.x, p.y, p.torch ? 230 + Math.sin(clock * 9) * 6 : 85, p.torch ? 1 : .55);
    for (const f of fires) light(f.x, f.y, 250 + Math.sin(clock * 11 + f.x) * 8);
    for (const l of lamps) light(l.x, l.y - 24, l.inside ? 150 : 140, .9);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(lightC, 0, 0, VW, VH);
    // warm glow
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, a) => {
      const sx = (x - camX) * zoom, sy = (y - camY) * zoom, sr = r * zoom;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      g.addColorStop(0, `rgba(255,150,60,${a * dark})`); g.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = g; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    };
    for (const f of fires) glow(f.x, f.y, 140, .35);
    if (p.torch) glow(p.x, p.y, 120, .25);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ===================== HUD =====================
const $ = id => document.getElementById(id);
const el = { hpFill: $('hpFill'), hpTxt: $('hpTxt'), stFill: $('stFill'), stTxt: $('stTxt'), huFill: $('huFill'), huTxt: $('huTxt'),
  lvl: $('lvlTxt'), xp: $('xpFill'), clock: $('clock'), coins: $('coins'), quest: $('quest-track'), log: $('log'), prompt: $('prompt'),
  panel: $('panel'), sheet: $('sheet'), mini: $('minimap') };
const miniBase = document.createElement('canvas');
function buildMinimap() {
  miniBase.width = W; miniBase.height = H;
  const m = miniBase.getContext('2d'), img = m.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const c = MINI_COL[map[i]], n = parseInt(c.slice(1), 16);
    img.data[i * 4] = n >> 16; img.data[i * 4 + 1] = (n >> 8) & 255; img.data[i * 4 + 2] = n & 255; img.data[i * 4 + 3] = 255;
  }
  m.putImageData(img, 0, 0);
}
function updateHud() {
  const p = P(), mh = maxHp(), ms = maxStam();
  el.hpFill.style.width = (p.hp / mh * 100) + '%'; el.hpTxt.textContent = `${Math.ceil(p.hp)} / ${mh}`;
  el.stFill.style.width = (p.stam / ms * 100) + '%'; el.stTxt.textContent = `${Math.floor(p.stam)}`;
  el.huFill.style.width = p.hunger + '%';
  el.huTxt.textContent = p.hunger > 70 ? 'Fed' : p.hunger > 40 ? 'Peckish' : p.hunger > 15 ? 'Hungry' : p.hunger > 0 ? 'Weak' : 'Starving';
  el.lvl.innerHTML = `Level <b>${p.lvl}</b> · ${esc(ITEMS[p.weapon].name)}${p.pts ? ` · <b>${p.pts} points to spend</b>` : ''}`;
  el.xp.style.width = (p.xp / xpNeed(p.lvl) * 100) + '%';
  const h = Math.floor(S.time / 60), mi = Math.floor(S.time % 60);
  const part = h < 5 ? 'Night' : h < 8 ? 'Dawn' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 21 ? 'Evening' : 'Night';
  el.clock.textContent = `Day ${S.day} · ${String(h).padStart(2, '0')}:${String(mi - mi % 10).padStart(2, '0')} · ${part}`;
  el.coins.textContent = `${p.coins} coin${p.torch ? ` · torch ${Math.ceil(p.torchBurn / 60)}h` : ''}`;
  // quest tracker
  const q = Object.keys(QUESTS).find(k => S.quests[k].state === 'active');
  el.quest.innerHTML = q ? `<div class="qt">${esc(QUESTS[q].title)}</div>${esc(QUESTS[q].goal(S.quests[q]))}` : (S.quests.wolves.state === 'none' ? '<div class="qt">Greywater</div>Elder Maren lives in the southwest house.' : '');
  // prompt
  const it = ui.view ? null : findInteract();
  if (it) { el.prompt.hidden = false; el.prompt.innerHTML = `<kbd>E</kbd> ${esc(it.label)}`; } else el.prompt.hidden = true;
  // minimap
  const m = el.mini.getContext('2d');
  m.drawImage(miniBase, 0, 0);
  m.fillStyle = 'rgba(0,0,0,' + darkness() * .5 + ')'; m.fillRect(0, 0, W, H);
  if (S.quests.mill.state === 'active' && !S.captainDead) { m.fillStyle = '#e04b3a'; m.fillRect(MILL.x - 2, MILL.y - 2, 5, 5); }
  m.fillStyle = '#f2d27a'; m.fillRect(VX - 1, VY - 1, 3, 3);
  m.fillStyle = '#fff'; m.fillRect(p.x / T - 1.5, p.y / T - 1.5, 3, 3);
  renderLog();
}
function renderLog() {
  const now = performance.now();
  el.log.innerHTML = logLines.map(l => {
    const age = (now - l.t) / 1000, op = age < 8 ? 1 : Math.max(0, 1 - (age - 8) / 4);
    const col = l.tone === 'bad' ? '#e98a7f' : l.tone === 'quest' ? '#e4bc6e' : '#e8e1d1';
    return `<div style="opacity:${op};color:${col}">${esc(l.msg)}</div>`;
  }).join('');
}

// ===================== panels =====================
function openPanel(view, arg) { ui.view = view; ui.arg = arg; renderPanel(); }
function closePanel() { ui.view = null; ui.opts = []; el.panel.hidden = true; canvas.focus?.(); }
function itemRow(id, n, actions, extra = '') {
  const it = ITEMS[id];
  let stat = '';
  if (it.kind === 'weapon') stat = ` · ${it.dmg[0]}–${it.dmg[1]} dmg, reach ${it.reach}`;
  if (it.kind === 'armor') stat = ` · armour ${it.armor}`;
  if (it.kind === 'food') stat = ` · +${it.food} food`;
  return `<div class="row"><div><span class="nm">${esc(it.name)}</span>${n > 1 ? ` <span class="ds">×${n}</span>` : ''}${extra}
    <div class="ds">${esc(it.desc)}${stat}</div></div><div class="acts">${actions}</div></div>`;
}
function renderPanel() {
  const v = ui.view, p = S ? P() : null;
  el.panel.hidden = false;
  let h = '';
  if (v === 'title') {
    const saved = loadSaved();
    h = `<h2>Greywater Hollow</h2>
      <p class="sub">A frontier village in a cold river valley. Wolves in the woods, bandits on the road, winter coming.</p>
      <p>Keep yourself fed, mind your stamina, and don’t walk the woods at night without a light. Elder Maren has work for you.</p>
      <h3>Controls</h3>
      <div class="keys">
        <span><kbd>WASD</kbd></span><span>Move · hold <kbd>Shift</kbd> to run</span>
        <span><kbd>Space</kbd> / click</span><span>Strike (aims at the mouse)</span>
        <span><kbd>K</kbd> / right-click</span><span>Block. Hold it as an enemy winds up (red ring)</span>
        <span><kbd>E</kbd></span><span>Talk, gather, cook at a fire</span>
        <span><kbd>I</kbd> <kbd>C</kbd> <kbd>Q</kbd></span><span>Pack, hero, quests</span>
        <span><kbd>T</kbd></span><span>Light or snuff a torch</span>
      </div>
      <div class="foot">
        ${saved ? `<button class="primary" data-act="continue" type="button">Continue (day ${saved.day}, level ${saved.p.lvl})</button>` : ''}
        <button class="${saved ? '' : 'primary'}" data-act="new" type="button">New game</button>
      </div>`;
  } else if (v === 'dialog') {
    const n = ui.npc, d = ui.arg;
    ui.opts = d.opts;
    h = `<h2>${esc(n.name)}</h2><div class="sub">${esc(n.role)}</div><p class="speech">${esc(d.text)}</p>
      <div class="opts">${d.opts.map((o, i) => `<button data-opt="${i}" type="button">${esc(o[0])}</button>`).join('')}</div>`;
  } else if (v === 'inv') {
    const ids = Object.keys(p.inv).filter(id => p.inv[id] > 0);
    const w = ITEMS[p.weapon], a = ITEMS[p.armor];
    h = `<h2>Pack</h2><div class="sub">${p.coins} coin · hunger ${Math.round(p.hunger)} / 100</div>
      <h3>Equipped</h3><div class="rows">
        ${itemRow(p.weapon, 1, '', '<span class="tag">weapon</span>')}
        ${itemRow(p.armor, 1, '', '<span class="tag">armour</span>')}
      </div>
      <h3>Carried</h3><div class="rows">${ids.length ? ids.map(id => {
        const it = ITEMS[id]; let acts = '';
        if (it.kind === 'food') acts += `<button data-act="eat" data-id="${id}" type="button">Eat</button>`;
        if (it.kind === 'heal') acts += `<button data-act="eat" data-id="${id}" type="button">Use</button>`;
        if (it.kind === 'weapon' || it.kind === 'armor') acts += `<button data-act="equip" data-id="${id}" type="button">Equip</button>`;
        if (id === 'sticks') acts += `<button data-act="fire" type="button" ${p.inv.sticks < 4 ? 'disabled' : ''}>Build fire</button>`;
        if (id === 'torch') acts += `<button data-act="torch" type="button">${p.torch ? 'Snuff' : 'Light'}</button>`;
        acts += `<button data-act="drop" data-id="${id}" type="button">Drop</button>`;
        return itemRow(id, p.inv[id], acts);
      }).join('') : '<p class="ds">Your pack is empty.</p>'}</div>
      <div class="foot"><button data-act="close" type="button">Close</button></div>`;
  } else if (v === 'char') {
    const w = ITEMS[p.weapon];
    h = `<h2>Hero</h2><div class="sub">Level ${p.lvl} · ${p.xp} / ${xpNeed(p.lvl)} xp to next level</div>
      <div class="stats">
        <div><b>Health</b>${Math.ceil(p.hp)} / ${maxHp()}</div>
        <div><b>Stamina</b>${Math.floor(p.stam)} / ${maxStam()}</div>
        <div><b>Damage</b>${w.dmg[0] + p.str * 2}–${w.dmg[1] + p.str * 2}</div>
        <div><b>Armour</b>${ITEMS[p.armor].armor} (−${ITEMS[p.armor].armor * 5}% damage)</div>
      </div>
      <h3>Attributes${p.pts ? ` · ${p.pts} to spend` : ''}</h3>
      <div class="rows">
        ${[['str', 'Strength', '+2 damage on every strike'], ['end', 'Endurance', '+12 maximum stamina'], ['vit', 'Vitality', '+15 maximum health']].map(([k, n, d]) =>
          `<div class="row"><div><span class="nm">${n}</span> <span class="ds">${p[k]}</span><div class="ds">${d}</div></div>
           <div class="acts"><button data-act="stat" data-id="${k}" type="button" ${p.pts ? '' : 'disabled'}>Raise</button></div></div>`).join('')}
      </div>
      <div class="foot"><button data-act="save" type="button">Save game</button><button data-act="close" type="button">Close</button></div>`;
  } else if (v === 'quests') {
    const ks = Object.keys(QUESTS).filter(k => S.quests[k].state !== 'none');
    h = `<h2>Quests</h2>
      <div class="rows">${ks.length ? ks.map(k => {
        const q = QUESTS[k], st = S.quests[k];
        return `<div class="row"><div><span class="nm">${esc(q.title)}</span><span class="tag">${st.state === 'done' ? 'Complete' : 'Active'}</span>
          <div class="ds">${esc(q.desc)}</div>${st.state === 'active' ? `<div>${esc(q.goal(st))}</div>` : ''}</div><div></div></div>`;
      }).join('') : '<p>No quests yet. Elder Maren lives in the southwest house of the village.</p>'}</div>
      <div class="foot"><button data-act="close" type="button">Close</button></div>`;
  } else if (v === 'shop') {
    const shop = SHOPS[ui.shop];
    const sellable = Object.keys(p.inv).filter(id => p.inv[id] > 0);
    h = `<h2>${esc(shop.name)}</h2><div class="sub">You have ${p.coins} coin.</div>
      <div class="cols"><div><h3>Buy</h3><div class="rows">${shop.sells.map(id =>
        itemRow(id, 1, `<button data-act="buy" data-id="${id}" type="button" ${p.coins < buyPrice(id) ? 'disabled' : ''}>${buyPrice(id)}c</button>`)).join('')}</div></div>
      <div><h3>Sell</h3><div class="rows">${sellable.length ? sellable.map(id =>
        itemRow(id, p.inv[id], `<button data-act="sell" data-id="${id}" type="button">${sellPrice(id)}c</button>`)).join('') : '<p class="ds">Nothing to sell.</p>'}</div></div></div>
      <div class="foot"><button data-act="back" type="button">Back</button><button data-act="close" type="button">Leave</button></div>`;
  } else if (v === 'dead') {
    h = `<h2>You fall</h2><p>The world goes dark. Some hours later, Hilde’s boy finds you and drags you back to the inn.</p>
      <p class="ds">You lost ${ui.arg.lost} coin and any meat you were carrying.</p>
      <div class="foot"><button class="primary" data-act="close" type="button">Get up</button></div>`;
  }
  el.sheet.innerHTML = h;
  const first = el.sheet.querySelector('button.primary, .opts button');
  if (first) first.focus({ preventScroll: true });
}
el.sheet.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const p = S ? P() : null, id = b.dataset.id;
  if (b.dataset.opt !== undefined) { ui.opts[+b.dataset.opt][1](); return; }
  switch (b.dataset.act) {
    case 'new': applyState(newState()); closePanel(); log('You arrive in Greywater with little more than a rusty dagger.'); log('Elder Maren may have work. Her house is southwest of the well.', 'quest'); break;
    case 'continue': applyState(loadSaved()); closePanel(); log(`Welcome back. Day ${S.day}.`); break;
    case 'close': closePanel(); break;
    case 'eat': eat(id); renderPanel(); break;
    case 'equip': {
      const it = ITEMS[id], slot = it.kind === 'weapon' ? 'weapon' : 'armor';
      addItem(p[slot]); takeItem(id); p[slot] = id; log(`You equip the ${it.name.toLowerCase()}.`); renderPanel(); break;
    }
    case 'drop': takeItem(id); renderPanel(); break;
    case 'fire': buildFire(); closePanel(); break;
    case 'torch': toggleTorch(); renderPanel(); break;
    case 'stat': if (p.pts > 0) { p.pts--; p[id]++; if (id === 'vit') p.hp += 15; } renderPanel(); break;
    case 'save': saveGame(); log('Game saved.'); renderPanel(); break;
    case 'buy': if (pay(buyPrice(id))) { addItem(id); log(`Bought ${ITEMS[id].name.toLowerCase()}.`); } renderPanel(); break;
    case 'sell': if (inv(id)) { takeItem(id); p.coins += sellPrice(id); } renderPanel(); break;
    case 'back': talk(ui.npc); break;
  }
});

// ===================== input wiring =====================
function onPress(k) {
  if (ui.view) {
    if (ui.view === 'title') { if (k === 'enter') el.sheet.querySelector('button')?.click(); return; }
    if (ui.view === 'dead') { if (k === 'enter' || k === 'escape' || k === 'e') closePanel(); return; }
    if (k === 'escape' || (k === 'i' && ui.view === 'inv') || (k === 'c' && ui.view === 'char') || (k === 'q' && ui.view === 'quests') || (k === 'tab' && ui.view === 'inv')) closePanel();
    else if (ui.view === 'dialog' && /^[1-9]$/.test(k) && ui.opts[+k - 1]) ui.opts[+k - 1][1]();
    return;
  }
  if (k === ' ' || k === 'j') input.atk = true;
  else if (k === 'e') interact();
  else if (k === 'i' || k === 'tab') openPanel('inv');
  else if (k === 'c') openPanel('char');
  else if (k === 'q') openPanel('quests');
  else if (k === 't') toggleTorch();
}
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(k) && !(ui.view && k === ' ')) e.preventDefault();
  if (!input.keys.has(k)) onPress(k);
  input.keys.add(k);
});
window.addEventListener('keyup', e => input.keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { input.keys.clear(); input.mouse.right = false; });
canvas.addEventListener('mousemove', e => { input.mouse.x = e.clientX; input.mouse.y = e.clientY; input.mouse.aim = true; });
canvas.addEventListener('mousedown', e => {
  if (ui.view) return;
  if (e.button === 0) input.atk = true;
  if (e.button === 2) input.mouse.right = true;
});
window.addEventListener('mouseup', e => { if (e.button === 2) input.mouse.right = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
$('btnInv').addEventListener('click', () => !ui.view && openPanel('inv'));
$('btnChar').addEventListener('click', () => !ui.view && openPanel('char'));
$('btnQuest').addEventListener('click', () => !ui.view && openPanel('quests'));

// touch
const stick = $('stick'), nub = $('nub');
let stickId = null;
function stickMove(t) {
  const r = stick.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = t.clientX - cx, dy = t.clientY - cy; const d = Math.hypot(dx, dy), max = r.width / 2 - 10;
  if (d > max) { dx *= max / d; dy *= max / d; }
  nub.style.transform = `translate(${dx}px, ${dy}px)`;
  input.tx = dx / max; input.ty = dy / max;
  input.mouse.aim = false;
}
stick.addEventListener('touchstart', e => { e.preventDefault(); const t = e.changedTouches[0]; stickId = t.identifier; stickMove(t); }, { passive: false });
stick.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === stickId) stickMove(t); }, { passive: false });
const stickEnd = e => { for (const t of e.changedTouches) if (t.identifier === stickId) { stickId = null; input.tx = input.ty = 0; nub.style.transform = ''; } };
stick.addEventListener('touchend', stickEnd); stick.addEventListener('touchcancel', stickEnd);
const tap = (id, fn) => $(id).addEventListener('pointerdown', e => { e.preventDefault(); if (!ui.view) fn(e); });
tap('tAtk', () => { input.atk = true; input.mouse.aim = false; });
tap('tUse', interact);
tap('tTorch', toggleTorch);
tap('tRun', () => { input.run = !input.run; $('tRun').classList.toggle('on', input.run); });
$('tBlock').addEventListener('pointerdown', e => { e.preventDefault(); input.block = true; });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => $('tBlock').addEventListener(ev, () => { input.block = false; }));

// ===================== main loop =====================
let last = performance.now(), hudT = 0, saveT = 0;
function updateNpcs(dt) {
  for (const n of npcs) {
    n.swing = Math.max(0, (n.swing || 0) - dt);
    if (n.guard) {
      n.cd -= dt;
      const foe = mobs.filter(m => !MOBS[m.kind].flee && dist(m, n) < 170).sort((a, b) => dist(a, n) - dist(b, n))[0];
      if (foe) {
        const d = dist(foe, n);
        n.face = Math.atan2(foe.y - n.y, foe.x - n.x);
        if (d > 40) { moveEnt(n, Math.cos(n.face) * 100 * dt, Math.sin(n.face) * 100 * dt, false); n.walk += dt * 6; }
        else if (n.cd <= 0) { n.cd = 1.1; n.swing = .2; hurtMob(foe, randInt([9, 14]), false, n, false); }
        continue;
      }
      const [px, py] = n.patrol[n.pi];
      const dx = px - n.x, dy = py - n.y, d = Math.hypot(dx, dy);
      if (d < 10) n.pi = (n.pi + 1) % n.patrol.length;
      else { n.face = Math.atan2(dy, dx); if (!moveEnt(n, dx / d * 45 * dt, dy / d * 45 * dt, false)) n.pi = (n.pi + 1) % n.patrol.length; n.walk += dt * 3; }
      continue;
    }
    // villagers potter about at home and look at you when you're near
    n.wt -= dt;
    if (n.wt <= 0) { n.wt = rand(2, 6); n.tx = n.hx + rand(-40, 40); n.ty = n.hy + rand(-30, 30); }
    const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
    if (dist(n, P()) < 70) n.face = Math.atan2(P().y - n.y, P().x - n.x);
    else if (d > 4) { n.face = Math.atan2(dy, dx); if (!moveEnt(n, dx / d * 30 * dt, dy / d * 30 * dt, false)) n.wt = 0; n.walk += dt * 2.5; }
  }
}
function tick(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; clock += dt;
  if (S && !ui.view) {
    advanceTime(dt * GMPS);
    updatePlayer(dt);
    if (!ui.view) {
      for (const m of [...mobs]) updateMob(m, dt);
      updateNpcs(dt);
      separate([P(), ...mobs.filter(m => dist(m, P()) < 200)]);
      spawnTick(dt);
      for (const f of fires) f.burn -= dt * GMPS;
      fires = fires.filter(f => f.burn > 0);
      saveT += dt; if (saveT > 30) { saveT = 0; saveGame(); }
    }
  }
  for (const q of parts) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .9; q.vy *= .9; }
  parts = parts.filter(q => q.t < q.life);
  for (const f of floats) f.t += dt * 1.2;
  floats = floats.filter(f => f.t < 1);
  shake *= Math.pow(.001, dt);
  if (S) {
    render();
    hudT -= dt; if (hudT <= 0) { hudT = .1; updateHud(); }
  }
  requestAnimationFrame(tick);
}

// ===================== boot =====================
genWorld();
buildMinimap();
resize();
function start(data) {
  // world shown behind the title screen
  applyState(data && data.p ? data : newState());
  if (data && data.p) { closePanel(); log(`Welcome back. Day ${S.day}.`); }
  else openPanel('title');
  updateHud();
  requestAnimationFrame(tick);
}
window.claude?.hot?.snapshot?.(() => S && serialize());
if (window.claude?.hot?.ready) window.claude.hot.ready(start); else start(window.claude?.hot?.data ?? {});
// console handle for debugging: __greywater.S, __greywater.mobs()
window.__greywater = { get S() { return S; }, mobs: () => mobs, spawn: (k, x, y) => mobs.push(makeMob(k, x, y)), talk: id => talk(npcs.find(n => n.id === id)) };
window.addEventListener('pagehide', () => { if (S && !ui.view) saveGame(); });
})();
