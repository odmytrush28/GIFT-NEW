/* CREATE — WebGL layer (Three.js): coffee-to-gold streams, arrival bursts, ambient gold dust.
   Everything in the streams is a pure function of the film time, so Pause / Replay / seeking
   always keep the particles in sync with the video. */
import * as THREE from './three.module.min.js';

const C = window.CREATE;
const canvas = document.getElementById('fx');
const hero = document.getElementById('top');

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

if (C && canvas && hero && webglOK()) start();

function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  let W = 1, H = 1;
  const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -10, 10); // y grows downward, like the DOM

  const STREAMS = 5, PER_STREAM = 420, PER_BURST = 60, ORIGIN_N = 70, DUST_N = 150;
  const TOTAL = STREAMS * PER_STREAM + STREAMS * PER_BURST + ORIGIN_N + DUST_N;

  const pos = new Float32Array(TOTAL * 3);
  const col = new Float32Array(TOTAL * 3);
  const size = new Float32Array(TOTAL);
  const alpha = new Float32Array(TOTAL);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uDpr: { value: 1 } },
    vertexShader: `
      attribute float size; attribute float alpha; attribute vec3 color;
      varying float vA; varying vec3 vC; uniform float uDpr;
      void main(){ vA = alpha; vC = color; gl_PointSize = size * uDpr; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying float vA; varying vec3 vC;
      void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.0, d); float a = pow(core, 1.7) * vA;
        gl_FragColor = vec4(vC * (0.75 + core * 0.6), a); }`,
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  // Deterministic per-particle randomness
  const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const seeds = new Float32Array(TOTAL * 4);
  for (let i = 0; i < TOTAL * 4; i++) seeds[i] = rnd(i + 1);

  // Colors: coffee brown → bronze → champagne gold → ivory
  const COFFEE = [0.80, 0.42, 0.16], BRONZE = [0.95, 0.60, 0.26], GOLD = [0.98, 0.78, 0.43], IVORY = [1.0, 0.95, 0.82];
  function grad(s, out, o) {
    let a, b, f;
    if (s < 0.18) { a = COFFEE; b = BRONZE; f = s / 0.18; }
    else if (s < 0.55) { a = BRONZE; b = GOLD; f = (s - 0.18) / 0.37; }
    else { a = GOLD; b = IVORY; f = (s - 0.55) / 0.45; }
    out[o] = a[0] + (b[0] - a[0]) * f; out[o + 1] = a[1] + (b[1] - a[1]) * f; out[o + 2] = a[2] + (b[2] - a[2]) * f;
  }
  const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;

  function bez(p0, p1, p2, p3, s, out) {
    const u = 1 - s, a = u * u * u, b = 3 * u * u * s, c = 3 * u * s * s, d = s * s * s;
    out.x = a * p0.x + b * p1.x + c * p2.x + d * p3.x;
    out.y = a * p0.y + b * p1.y + c * p2.y + d * p3.y;
    const da = -3 * u * u, db = 3 * u * u - 6 * u * s, dc = 6 * u * s - 3 * s * s, dd = 3 * s * s;
    out.tx = da * p0.x + db * p1.x + dc * p2.x + dd * p3.x;
    out.ty = da * p0.y + db * p1.y + dc * p2.y + dd * p3.y;
  }

  // ---- Layout: where is the cup, where are the gift cards (relative to the hero) ----
  let origin = { x: 0, y: 0 };
  const targets = [];
  function layout() {
    const hr = canvas.getBoundingClientRect();
    const vr = C.video.getBoundingClientRect();
    origin = { x: vr.left - hr.left + C.CUP.x * vr.width, y: vr.top - hr.top + C.CUP.y * vr.height };
    C.tokens.forEach((tk, i) => {
      const img = tk.querySelector('img');
      const r = (img && img.offsetParent ? img : tk).getBoundingClientRect();
      targets[i] = { x: r.left - hr.left + r.width / 2, y: r.top - hr.top + r.height / 2 };
    });
  }
  function curveFor(i) {
    const O = origin, T = targets[i];
    const dx = T.x - O.x, dy = T.y - O.y, dist = Math.hypot(dx, dy) || 1;
    const lift = Math.max(70, dist * 0.32) * (0.8 + i * 0.16);
    const below = dy > 60; // mobile layout: the gifts sit under the film
    const p1 = below
      ? { x: O.x + dx * 0.15 + (i - 2) * 26, y: O.y - lift * 0.55 }
      : { x: O.x + dx * 0.28, y: O.y + dy * 0.1 - lift };
    const p2 = below
      ? { x: T.x - dx * 0.05, y: T.y - lift * 0.9 }
      : { x: O.x + dx * 0.78, y: T.y - lift * 0.35 };
    return [O, p1, p2, T];
  }

  function resize() {
    const r = hero.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    const dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    mat.uniforms.uDpr.value = dpr;
    camera.left = 0; camera.right = W; camera.top = 0; camera.bottom = H; camera.updateProjectionMatrix();
    layout();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
  window.addEventListener('resize', resize);
  resize();

  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(hero);
  }

  const tmp = { x: 0, y: 0, tx: 0, ty: 0 };
  let wall = 0, last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible) return;
    if (C.isReduced()) { renderer.clear(); return; }
    wall += dt;
    layout();

    const t = C.time();
    const S = C.STREAM;
    let p = 0;

    // ---- Five streams ----
    for (let i = 0; i < STREAMS; i++) {
      const L = S.first + i * S.gap;
      const active = !C.skipped() && t >= L && t < L + S.travel * 1.75;
      const ctrl = active ? curveFor(i) : null;
      const raw = (t - L) / S.travel;
      const head = raw <= 1 ? ease(clamp01(raw)) : 1 + (raw - 1); // keeps flowing into the card after arrival
      for (let k = 0; k < PER_STREAM; k++, p++) {
        const sd = p * 4;
        if (!active) { alpha[p] = 0; continue; }
        const u = Math.pow(k / PER_STREAM, 1.35);  // 0 = head, 1 = end of trail (denser near the head)
        const s = head - u * 0.6;
        if (s < 0 || s > 1) { alpha[p] = 0; continue; }
        bez(ctrl[0], ctrl[1], ctrl[2], ctrl[3], s, tmp);
        const tl = Math.hypot(tmp.tx, tmp.ty) || 1, nx = -tmp.ty / tl, ny = tmp.tx / tl;
        const stray = seeds[sd] > 0.86 ? 3.2 : 1;  // a few sparks drift away from the ribbon
        const amp = (3 + seeds[sd + 1] * 9) * stray * Math.sin(Math.PI * Math.min(1, s * 1.15));
        const wob = Math.sin(s * 14 + seeds[sd + 2] * 6.28 + t * 4) * amp;
        pos[p * 3] = tmp.x + nx * wob;
        pos[p * 3 + 1] = tmp.y + ny * wob;
        pos[p * 3 + 2] = 0;
        const headGlow = k < 6 && raw < 1 ? 1 : 0;
        grad(headGlow ? 0.62 : Math.min(1, s * 1.1 + (1 - u) * 0.25), col, p * 3);
        const halo = k % 5 === 2; // soft wide glow that turns the dots into a ribbon of light
        size[p] = headGlow ? 14 + seeds[sd + 3] * 10 : halo ? 14 + seeds[sd + 3] * 10 : (2.4 + seeds[sd + 3] * 4.2) * (stray > 1 ? 0.7 : 1) * (1.2 - u * 0.55);
        const flick = 0.78 + 0.22 * Math.sin(t * 18 + seeds[sd] * 50);
        alpha[p] = (headGlow ? 0.5 : halo ? 0.2 * (1 - u) : Math.pow(1 - u, 0.9)) * flick;
      }
    }

    // ---- Arrival bursts on each gift card ----
    for (let i = 0; i < STREAMS; i++) {
      const A = C.ARRIVE[i];
      const q = (t - A) / 1.3;
      const on = !C.skipped() && q >= 0 && q <= 1 && targets[i];
      for (let j = 0; j < PER_BURST; j++, p++) {
        if (!on) { alpha[p] = 0; continue; }
        const sd = p * 4, ang = seeds[sd] * Math.PI * 2, sp = 30 + seeds[sd + 1] * 70;
        const e = 1 - Math.pow(1 - q, 3);
        pos[p * 3] = targets[i].x + Math.cos(ang) * sp * e;
        pos[p * 3 + 1] = targets[i].y + Math.sin(ang) * sp * e + q * q * 18;
        grad(0.7 + seeds[sd + 2] * 0.3, col, p * 3);
        size[p] = 2 + seeds[sd + 3] * 4;
        alpha[p] = Math.pow(1 - q, 1.6);
      }
    }

    // ---- Glow at the cup: the coffee starts to shimmer, then turns gold ----
    const g0 = S.first - 2.6, g1 = C.ARRIVE[4];
    const gOn = !C.skipped() && t > g0 && t < g1 + 0.8;
    const gI = gOn ? Math.min(1, (t - g0) / 1.4) * (t > g1 ? 1 - (t - g1) / 0.8 : 1) : 0;
    for (let j = 0; j < ORIGIN_N; j++, p++) {
      if (!gOn) { alpha[p] = 0; continue; }
      const sd = p * 4, ph = (wall * (0.35 + seeds[sd] * 0.5) + seeds[sd + 1]) % 1;
      const ang = seeds[sd + 2] * 6.28 + wall * 0.8, rad = 6 + ph * (26 + seeds[sd + 3] * 24);
      pos[p * 3] = origin.x + Math.cos(ang) * rad;
      pos[p * 3 + 1] = origin.y + Math.sin(ang) * rad * 0.45 - ph * 34;
      grad(0.15 + ph * 0.8, col, p * 3);
      size[p] = j < 3 ? 46 : 2 + seeds[sd + 3] * 4;
      alpha[p] = (j < 3 ? 0.18 : (1 - ph) * 0.9) * gI;
    }

    // ---- Ambient gold dust over the hero ----
    for (let j = 0; j < DUST_N; j++, p++) {
      const sd = p * 4;
      const y = ((seeds[sd + 1] * H - wall * (6 + seeds[sd + 2] * 14)) % H + H) % H;
      pos[p * 3] = seeds[sd] * W + Math.sin(wall * 0.4 + seeds[sd + 3] * 6) * 14;
      pos[p * 3 + 1] = y;
      grad(0.6 + seeds[sd + 2] * 0.4, col, p * 3);
      size[p] = 1.2 + seeds[sd + 3] * 2.4;
      alpha[p] = (0.12 + 0.35 * (0.5 + 0.5 * Math.sin(wall * (0.8 + seeds[sd] * 2) + seeds[sd + 2] * 20))) * 0.8;
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.attributes.size.needsUpdate = true;
    geo.attributes.alpha.needsUpdate = true;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  window.CREATE.fxReady = true;
}
