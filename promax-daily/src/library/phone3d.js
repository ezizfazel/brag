// PROMAX 3D device library — procedural, parametric smartphone models (three.js).
// Dimensions and official colour names come from src/library/gsmarena-catalog.json.
// Each model is an original CG model of the device's design language (body, frame,
// camera layout, display) — not a copy of any manufacturer CAD file.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ---------------------------------------------------------------- catalogue
// archetype: how the back/camera looks. dims in mm (h, w, d).
export const MODELS = [
  { id: 'iphone-16', name: 'iPhone 16', brand: 'Apple', series: 'iPhone 16 Series', arch: 'pill2', dims: [147.6, 71.6, 7.8], island: 'island', frame: 'alu',
    colors: { Black: '#3B3D42', White: '#F3F2EE', Pink: '#F2AED6', Teal: '#A8D3CF', Ultramarine: '#8FA3F2' } },
  { id: 'iphone-16-plus', name: 'iPhone 16 Plus', brand: 'Apple', series: 'iPhone 16 Series', arch: 'pill2', dims: [160.9, 77.8, 7.8], island: 'island', frame: 'alu',
    colors: { Black: '#3B3D42', White: '#F3F2EE', Pink: '#F2AED6', Teal: '#A8D3CF', Ultramarine: '#8FA3F2' } },
  { id: 'iphone-16-pro', name: 'iPhone 16 Pro', brand: 'Apple', series: 'iPhone 16 Series', arch: 'tri', dims: [149.6, 71.5, 8.3], island: 'island', frame: 'ti',
    colors: { 'Black Titanium': '#3A3A3C', 'White Titanium': '#EFEEEA', 'Natural Titanium': '#C3BDB2', 'Desert Titanium': '#C2A68F' } },
  { id: 'iphone-16-pro-max', name: 'iPhone 16 Pro Max', brand: 'Apple', series: 'iPhone 16 Series', arch: 'tri', dims: [163, 77.6, 8.3], island: 'island', frame: 'ti',
    colors: { 'Black Titanium': '#3A3A3C', 'White Titanium': '#EFEEEA', 'Natural Titanium': '#C3BDB2', 'Desert Titanium': '#C2A68F' } },
  { id: 'iphone-16e', name: 'iPhone 16e', brand: 'Apple', series: 'iPhone 16 Series', arch: 'single', dims: [146.7, 71.5, 7.8], island: 'notch', frame: 'alu',
    colors: { Black: '#2E3136', White: '#F4F4F2' } },
  { id: 'iphone-17', name: 'iPhone 17', brand: 'Apple', series: 'iPhone 17 Series', arch: 'pill2', dims: [149.6, 71.5, 8], island: 'island', frame: 'alu',
    colors: { Black: '#2D2E31', White: '#F4F4F0', 'Mist Blue': '#AFC2DA', Sage: '#B3C0A6', Lavender: '#D5C8E8' } },
  { id: 'iphone-air', name: 'iPhone Air', brand: 'Apple', series: 'iPhone 17 Series', arch: 'bar', dims: [156.2, 74.7, 5.6], island: 'island', frame: 'ti',
    colors: { 'Space Black': '#2A2A2D', 'Cloud White': '#F3F3F1', 'Light Gold': '#EEE1C6', 'Sky Blue': '#D2E2F0' } },
  { id: 'iphone-17-pro', name: 'iPhone 17 Pro', brand: 'Apple', series: 'iPhone 17 Series', arch: 'plateau', dims: [150, 71.9, 8.8], island: 'island', frame: 'alu-uni',
    colors: { Silver: '#E2E4E7', 'Cosmic Orange': '#E8772E', 'Deep Blue': '#2F3C58' } },
  { id: 'iphone-17-pro-max', name: 'iPhone 17 Pro Max', brand: 'Apple', series: 'iPhone 17 Series', arch: 'plateau', dims: [163.4, 78, 8.8], island: 'island', frame: 'alu-uni',
    colors: { Silver: '#E2E4E7', 'Cosmic Orange': '#E8772E', 'Deep Blue': '#2F3C58' } },
  { id: 'iphone-17e', name: 'iPhone 17e', brand: 'Apple', series: 'iPhone 17 Series', arch: 'single', dims: [146.7, 71.5, 7.8], island: 'notch', frame: 'alu',
    colors: { Black: '#2E3136', White: '#F4F4F2', 'Soft Pink': '#F4D5D8' } },
  { id: 'iphone-18-pro', name: 'iPhone 18 Pro', brand: 'Apple', series: 'iPhone 18 Series', arch: 'plateau', dims: [150, 71.9, 8.8], island: 'island', frame: 'alu-uni',
    colors: { Black: '#2B2C30', Silver: '#E3E4E6', Glacier: '#C6D7E7', Burgundy: '#6B2231' } },
  { id: 'iphone-18-pro-max', name: 'iPhone 18 Pro Max', brand: 'Apple', series: 'iPhone 18 Series', arch: 'plateau', dims: [163.4, 78, 8.8], island: 'island', frame: 'alu-uni',
    colors: { Black: '#2B2C30', Silver: '#E3E4E6', Glacier: '#C6D7E7', Burgundy: '#6B2231' } },
  { id: 'iphone-duo', name: 'iPhone Duo', brand: 'Apple', series: 'iPhone Duo', arch: 'fold', dims: [117.8, 84.1, 5.2], island: 'hole', frame: 'ti',
    colors: { 'Night Sky': '#2B3447', 'Star White': '#EDEDEA' } },
  { id: 'galaxy-s26', name: 'Galaxy S26', brand: 'Samsung', series: 'Galaxy S26 Series', arch: 'sam3', dims: [149.6, 71.7, 7.2], island: 'hole', frame: 'alu',
    colors: { 'Cobalt Violet': '#6C6597', 'Sky Blue': '#BFD6EA', Black: '#2A2C2F', White: '#F2F2F2', 'Silver Shadow': '#C8CACD', 'Pink Gold': '#E9CBBB' } },
  { id: 'galaxy-s26-plus', name: 'Galaxy S26+', brand: 'Samsung', series: 'Galaxy S26 Series', arch: 'sam3', dims: [158.4, 75.8, 7.3], island: 'hole', frame: 'alu',
    colors: { 'Cobalt Violet': '#6C6597', 'Sky Blue': '#BFD6EA', Black: '#2A2C2F', White: '#F2F2F2', 'Silver Shadow': '#C8CACD', 'Pink Gold': '#E9CBBB' } },
  { id: 'galaxy-s26-ultra', name: 'Galaxy S26 Ultra', brand: 'Samsung', series: 'Galaxy S26 Series', arch: 'ultra', dims: [163.6, 78.1, 7.9], island: 'hole', frame: 'alu',
    colors: { 'Cobalt Violet': '#6C6597', 'Sky Blue': '#BFD6EA', Black: '#2A2C2F', White: '#F2F2F2', 'Silver Shadow': '#C8CACD', 'Pink Gold': '#E9CBBB' } },
  { id: 'galaxy-s26-fe', name: 'Galaxy S26 FE', brand: 'Samsung', series: 'Galaxy S26 Series', arch: 'sam3', dims: [161.6, 76.9, 7.4], island: 'hole', frame: 'alu',
    colors: { Blueberry: '#3F4F7C', Graphite: '#4A4C51', Pistachio: '#C9DCC3' } },
];

const S = 0.01; // mm -> scene units (1 unit = 100 mm)
let Q = { curve: 48, bevel: 10, wp: 1, lens: 64 };
/** 'high' for rendering, 'export' for compact GLB files */
export function setDetail(level) { Q = level === 'export' ? { curve: 18, bevel: 4, wp: 0.5, lens: 28 } : { curve: 48, bevel: 10, wp: 1, lens: 64 }; }
const lum = (hex) => { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };

function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2); s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5); return s;
}
function slab(w, h, d, r, bevel) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - 2 * bevel, h - 2 * bevel, Math.max(0.001, r - bevel)), { depth: d - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: Q.bevel, curveSegments: Q.curve });
  g.translate(0, 0, -(d - 2 * bevel) / 2); g.computeVertexNormals(); return g;
}
function plate(w, h, r) { const g = new THREE.ShapeGeometry(roundedRect(w, h, r), Q.curve); return g; }

// wallpaper: original abstract gradient matched to the device colour (no OS wallpapers copied)
function wallpaper(hex, brand, w = 512, h = 1100) {
  w = Math.round(w * Q.wp); h = Math.round(h * Q.wp);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const base = new THREE.Color(hex); const hsl = {}; base.getHSL(hsl);
  const col = (dh, s, l) => `hsl(${((hsl.h + dh) * 360 + 360) % 360}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  const sat = Math.max(0.35, Math.min(0.85, hsl.s + 0.3));
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, col(-0.03, sat, 0.18)); bg.addColorStop(0.55, col(0.02, sat, 0.42)); bg.addColorStop(1, col(0.06, sat * 0.8, 0.12));
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5; i++) {
    const rg = g.createRadialGradient(w * (0.2 + 0.15 * i), h * (0.25 + 0.13 * i), 10, w * (0.2 + 0.15 * i), h * (0.25 + 0.13 * i), w * (0.55 + 0.1 * (i % 2)));
    rg.addColorStop(0, col(0.04 * i, sat, 0.72 - i * 0.06)); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'screen'; g.fillStyle = rg; g.fillRect(0, 0, w, h);
  }
  g.globalCompositeOperation = 'source-over';
  g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 3;
  for (let k = 0; k < 6; k++) { g.beginPath(); for (let y = 0; y <= h; y += 20) { const x = w * 0.5 + Math.sin(y / 140 + k * 0.9) * w * (0.18 + k * 0.05); y ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function mats(hex, frameKind) {
  const L = lum(hex);
  const body = new THREE.MeshPhysicalMaterial({ name: 'body', color: hex, roughness: frameKind === 'alu-uni' ? 0.42 : 0.5, metalness: frameKind === 'alu-uni' ? 0.35 : 0.05, clearcoat: 0.6, clearcoatRoughness: 0.45, sheen: 0.2 });
  const frameCol = new THREE.Color(hex).lerp(new THREE.Color(frameKind === 'ti' ? '#b9b6b0' : '#c9cdd3'), frameKind === 'ti' ? 0.35 : 0.18);
  if (L < 0.12) frameCol.lerp(new THREE.Color('#55575c'), 0.3);
  const frame = new THREE.MeshPhysicalMaterial({ name: 'frame', color: frameCol, metalness: 1, roughness: frameKind === 'ti' ? 0.32 : 0.22, clearcoat: 0.3 });
  const glossy = new THREE.MeshPhysicalMaterial({ name: 'glass_panel', color: new THREE.Color(hex).multiplyScalar(0.96), roughness: 0.18, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08 });
  const camRing = new THREE.MeshPhysicalMaterial({ name: 'cam_ring', color: frameCol, metalness: 1, roughness: 0.18 });
  const lensBlack = new THREE.MeshPhysicalMaterial({ name: 'lens_black', color: '#07080a', roughness: 0.15, metalness: 0.2, clearcoat: 1 });
  const lensGlass = new THREE.MeshPhysicalMaterial({ name: 'lens_glass', color: '#1a2a5a', roughness: 0.02, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0, iridescence: 1, iridescenceIOR: 1.6 });
  const black = new THREE.MeshStandardMaterial({ name: 'black', color: '#050506', roughness: 0.3 });
  const flash = new THREE.MeshStandardMaterial({ name: 'flash', color: '#f6efd8', emissive: '#3a3420', roughness: 0.35 });
  return { body, frame, glossy, camRing, lensBlack, lensGlass, black, flash };
}

function lens(m, r, z, big = true) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r, z, Q.lens), m.camRing); ring.rotation.x = Math.PI / 2; g.add(ring);
  const black = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.84, r * 0.84, z * 1.02, Q.lens), m.lensBlack); black.rotation.x = Math.PI / 2; g.add(black);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(r * (big ? 0.5 : 0.45), 48, 16, 0, Math.PI * 2, 0, Math.PI / 2.6), m.lensGlass); glass.rotation.x = -Math.PI / 2; glass.position.z = -z * 0.5; glass.scale.set(1, 0.35, 1); g.add(glass);
  return g;
}
function dot(mat, r, z) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, z, 40), mat); m.rotation.x = Math.PI / 2; return m; }

/** Build one device. Back faces -Z (camera side), screen faces +Z. Returns THREE.Group named by model id. */
export function buildPhone(spec, colorName) {
  const hex = spec.colors[colorName];
  const [H, W, D] = spec.dims.map((v) => v * S);
  const m = mats(hex, spec.frame);
  const root = new THREE.Group(); root.name = `${spec.id}__${colorName}`;
  root.userData = { model: spec.id, color: colorName, hex };
  if (spec.arch === 'fold') return buildFold(spec, colorName, m, root);
  const sam = spec.brand === 'Samsung';
  const R = sam ? (spec.arch === 'ultra' ? W * 0.07 : W * 0.15) : W * 0.165;
  const bevel = sam ? D * 0.18 : (spec.frame === 'alu-uni' ? D * 0.34 : D * 0.12);
  // chassis
  const body = new THREE.Mesh(slab(W, H, D, R, bevel), m.frame); body.name = 'chassis'; root.add(body);
  // back panel (colour) — slightly inset; Pros/Unibody: whole back colour; glossy lower glass panel on 17/18 Pro
  const backW = W - bevel * 1.2, backH = H - bevel * 1.2;
  const back = new THREE.Mesh(plate(backW, backH, R - bevel * 0.6), m.body); back.position.z = -D / 2 - 0.0004; back.rotation.y = Math.PI; back.name = 'back'; root.add(back);
  // display
  const scrW = W - 0.02 * (sam ? 0.9 : 1), scrH = H - 0.02 * (sam ? 0.9 : 1);
  const bez = new THREE.Mesh(plate(W - bevel * 0.4, H - bevel * 0.4, R - bevel * 0.2), m.black); bez.position.z = D / 2 + 0.0003; root.add(bez);
  const scrMat = new THREE.MeshPhysicalMaterial({ name: 'screen', map: wallpaper(hex, spec.brand), roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, emissive: '#ffffff', emissiveIntensity: 0.0 });
  scrMat.emissiveMap = scrMat.map; scrMat.emissiveIntensity = 0.55;
  const scr = new THREE.Mesh(plate(scrW - 0.06, scrH - 0.06, Math.max(0.01, R - 0.05)), scrMat); scr.position.z = D / 2 + 0.0006; scr.name = 'screen';
  // uv for plate: map shape coords to 0..1
  remapUV(scr.geometry, scrW - 0.06, scrH - 0.06); root.add(scr);
  if (spec.island === 'island') { const isl = new THREE.Mesh(plate(W * 0.3, W * 0.088, W * 0.044), m.black); isl.position.set(0, H / 2 - 0.11, D / 2 + 0.0009); root.add(isl); }
  if (spec.island === 'notch') { const n = new THREE.Mesh(plate(W * 0.44, W * 0.11, W * 0.05), m.black); n.position.set(0, H / 2 - 0.05, D / 2 + 0.0009); root.add(n); }
  if (spec.island === 'hole') { const h = new THREE.Mesh(new THREE.CircleGeometry(W * 0.028, 32), m.black); h.position.set(0, H / 2 - 0.1, D / 2 + 0.0009); root.add(h); }
  // side buttons
  const btn = (y, len, side) => { const b = new THREE.Mesh(new RoundedBoxGeometry(0.02, len, D * 0.42, 3, 0.008), m.frame); b.position.set(side * (W / 2 + 0.004), y, 0); root.add(b); };
  if (sam) { btn(H * 0.22, H * 0.14, 1); btn(H * 0.05, H * 0.07, 1); }
  else { btn(H * 0.26, H * 0.05, -1); btn(H * 0.14, H * 0.1, -1); btn(H * 0.0, H * 0.1, -1); btn(H * 0.12, H * 0.15, 1); if (/17|16(?!e)|air|18/.test(spec.id) && !/16e|17e/.test(spec.id)) btn(-H * 0.12, H * 0.07, 1); }
  // camera
  const cam = new THREE.Group(); cam.name = 'camera'; cam.position.z = -D / 2; root.add(cam);
  const L = lum(hex);
  const bump = (w, h, r, z, x, y, mat = m.body) => { const g = slab(w, h, z, r, Math.min(z * 0.45, r * 0.9)); const b = new THREE.Mesh(g, mat); b.position.set(x, y, -z / 2); cam.add(b); return b; };
  const at = (o, x, y, z) => { o.position.set(x, y, z); cam.add(o); return o; };
  // camera X is mirrored on the back: back-left (seen from behind) = +X in model space
  const cx = (u) => W / 2 - u * W;
  switch (spec.arch) {
    case 'pill2': { // iPhone 16 / 17: vertical pill, two lenses
      const pw = W * 0.29, ph = W * 0.53, x = cx(0.22), y = H / 2 - ph / 2 - W * 0.08;
      bump(pw, ph, pw / 2, 0.018, x, y, m.glossy);
      at(lens(m, pw * 0.36, 0.03), x, y + ph * 0.24, -0.03); at(lens(m, pw * 0.36, 0.03), x, y - ph * 0.24, -0.03);
      at(dot(m.flash, W * 0.03, 0.004), cx(0.42), H / 2 - W * 0.12, -0.003); break;
    }
    case 'tri': { // 16 Pro: square bump, triangle lenses
      const s = W * 0.5, x = cx(0.29), y = H / 2 - s / 2 - W * 0.06;
      bump(s, s, s * 0.25, 0.02, x, y, m.glossy);
      const r = s * 0.2;
      at(lens(m, r, 0.035), x + s * 0.22, y + s * 0.22, -0.035); at(lens(m, r, 0.035), x + s * 0.22, y - s * 0.22, -0.035); at(lens(m, r, 0.035), x - s * 0.2, y, -0.035);
      at(dot(m.flash, s * 0.07, 0.006), x - s * 0.24, y + s * 0.3, -0.021); at(dot(m.black, s * 0.06, 0.006), x - s * 0.24, y - s * 0.3, -0.021); break;
    }
    case 'single': { // 16e / 17e
      const s = W * 0.2, x = cx(0.18), y = H / 2 - W * 0.17;
      at(lens(m, s * 0.55, 0.025), x, y, -0.025); at(dot(m.flash, W * 0.025, 0.003), cx(0.34), y, -0.003); break;
    }
    case 'bar': { // iPhone Air: full-width plateau bar
      const bh = W * 0.27, y = H / 2 - bh / 2 - W * 0.04;
      bump(W * 0.9, bh, bh / 2, 0.014, 0, y, m.glossy);
      at(lens(m, bh * 0.34, 0.025), cx(0.2), y, -0.028); at(dot(m.flash, bh * 0.08, 0.004), cx(0.36), y, -0.016); at(dot(m.black, bh * 0.07, 0.004), cx(0.8), y, -0.016); break;
    }
    case 'plateau': { // 17 Pro / 18 Pro: full-width aluminium plateau
      const ph = H * 0.29, y = H / 2 - ph / 2;
      bump(W - bevel * 0.6, ph, R * 0.95, 0.022, 0, y - 0.005, m.body);
      // lower ceramic-glass panel (MagSafe area)
      const gp = new THREE.Mesh(plate(W * 0.84, H * 0.58, W * 0.09), m.glossy); gp.position.set(0, -H * 0.12, -D / 2 - 0.0012); gp.rotation.y = Math.PI; root.add(gp);
      const r = W * 0.105, x0 = cx(0.25);
      at(lens(m, r, 0.04), x0 + r * 0.05, y + r * 1.15, -0.06); at(lens(m, r, 0.04), x0 + r * 0.05, y - r * 1.15, -0.06); at(lens(m, r, 0.04), x0 - r * 1.75, y, -0.06);
      at(dot(m.flash, r * 0.36, 0.005), cx(0.83), y + r * 1.0, -0.025); at(dot(m.black, r * 0.3, 0.005), cx(0.83), y - r * 1.0, -0.025); break;
    }
    case 'sam3': { // S26 / S26+ / FE: three floating lens rings
      const r = W * 0.085, x = cx(0.17);
      for (let i = 0; i < 3; i++) at(lens(m, r, 0.03), x, H / 2 - W * 0.17 - i * r * 2.5, -0.03);
      at(dot(m.flash, W * 0.022, 0.003), cx(0.33), H / 2 - W * 0.17, -0.003); break;
    }
    case 'ultra': { // S26 Ultra: three big + two small lenses
      const r = W * 0.1, x = cx(0.2);
      for (let i = 0; i < 3; i++) at(lens(m, r, 0.032), x, H / 2 - W * 0.19 - i * r * 2.45, -0.032);
      at(lens(m, r * 0.62, 0.026, false), cx(0.4), H / 2 - W * 0.19, -0.026); at(lens(m, r * 0.62, 0.026, false), cx(0.4), H / 2 - W * 0.19 - r * 2.45, -0.026);
      at(dot(m.flash, W * 0.024, 0.003), cx(0.4), H / 2 - W * 0.19 - r * 1.22, -0.003);
      const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.002, 24), m.frame); pen.position.set(-W / 2 + 0.12, -H / 2, 0); root.add(pen); break;
    }
  }
  // no manufacturer logos/wordmarks are reproduced on the models
  return root;
}

function remapUV(geo, w, h) {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  uv.needsUpdate = true;
}
// simple apple-like emblem made from primitives (generic fruit silhouette, subtle tone-on-tone)
function logo(root, m, D, L, y) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(118, 150, 70, 80, 0, 0, Math.PI * 2); g.fill();
  g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(205, 138, 34, 0, Math.PI * 2); g.fill();
  g.globalCompositeOperation = 'source-over'; g.beginPath(); g.ellipse(138, 52, 16, 34, 0.6, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshPhysicalMaterial({ name: 'emblem', color: L > 0.5 ? '#d9d9d9' : '#9aa0a8', metalness: 0.9, roughness: 0.15, alphaMap: t, transparent: true });
  const e = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.17), mat); e.position.set(0, y, -D / 2 - 0.0016); e.rotation.y = Math.PI; root.add(e);
}
function wordmark(root, D, L, H) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.font = '600 64px Inter, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SAMSUNG', 256, 50);
  const t = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ name: 'wordmark', color: L > 0.5 ? '#9fa2a8' : '#c9ccd2', alphaMap: t, transparent: true, opacity: 0.55 });
  const e = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.041), mat); e.position.set(0, -H * 0.3, -D / 2 - 0.0016); e.rotation.y = Math.PI; root.add(e);
}

// iPhone Duo: book-style foldable shown half-open
function buildFold(spec, colorName, m, root) {
  const [H, W, D] = spec.dims.map((v) => v * S); // folded half: H tall, W wide, D = unfolded thickness
  const half = (side) => {
    const g = new THREE.Group();
    const R = W * 0.12, bevel = D * 0.2;
    const body = new THREE.Mesh(slab(W, H, D, R, bevel), m.frame); g.add(body);
    const back = new THREE.Mesh(plate(W - bevel, H - bevel, R - bevel * 0.5), m.body); back.position.z = -D / 2 - 0.0004; back.rotation.y = Math.PI; g.add(back);
    const bez = new THREE.Mesh(plate(W - bevel * 0.3, H - bevel * 0.3, R), m.black); bez.position.z = D / 2 + 0.0003; g.add(bez);
    g.position.x = side * W / 2;
    // shift so the hinge is at x=0
    g.children.forEach((c) => (c.position.x += 0));
    return g;
  };
  const left = new THREE.Group(), right = new THREE.Group();
  const hl = half(-1), hr = half(1); left.add(hl); right.add(hr);
  // inner continuous display across both halves (texture split)
  const tex = wallpaper(spec.colors[colorName], 'Apple', 1024, 720);
  const mkScr = (side) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(0.5, 1); t.offset.set(side < 0 ? 0 : 0.5, 0);
    const mat = new THREE.MeshPhysicalMaterial({ name: 'screen', map: t, emissiveMap: t, emissive: '#fff', emissiveIntensity: 0.55, roughness: 0.08, clearcoat: 1 });
    const s = new THREE.Mesh(plate(W - 0.05, H - 0.06, 0.04), mat); remapUV(s.geometry, W - 0.05, H - 0.06); s.position.set(side * W / 2, 0, D / 2 + 0.0006); return s; };
  left.add(mkScr(-1)); right.add(mkScr(1));
  // camera pill on the outer back of the left half (horizontal: 2 lenses + flash)
  const cam = new THREE.Group(); cam.position.set(-W / 2, H / 2 - W * 0.22, -D / 2); left.add(cam);
  const pw = W * 0.62, ph = W * 0.27;
  const pill = new THREE.Mesh(slab(pw, ph, 0.016, ph / 2, 0.006), m.glossy); pill.position.set(W * 0.07, 0, -0.008); cam.add(pill);
  const l1 = lens(m, ph * 0.36, 0.028); l1.position.set(W * 0.27, 0, -0.024); cam.add(l1);
  const l2 = lens(m, ph * 0.36, 0.028); l2.position.set(W * 0.07, 0, -0.024); cam.add(l2);
  const fl = dot(m.flash, ph * 0.1, 0.004); fl.position.set(-W * 0.14, -ph * 0.1, -0.017); cam.add(fl);
  // hinge
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(D * 0.55, D * 0.55, H * 0.98, 32), m.frame); root.add(hinge);
  root.add(left, right); root.userData.fold = { left, right };
  setFold(root, 150);
  return root;
}
/** open angle in degrees (180 = flat). */
export function setFold(root, deg) {
  const f = root.userData.fold; if (!f) return;
  const a = ((180 - deg) / 2) * (Math.PI / 180);
  f.left.rotation.y = -a; f.right.rotation.y = a;
}
