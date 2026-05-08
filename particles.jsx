// particles.jsx — canvas-based particle engine. GPU-accelerated.
// Mounts a single fullscreen canvas; scenes call emit() to spawn bursts,
// or register continuous emitters that run until stopped.

const PURPLE_P  = '#4A3FA0';
const PURPLE_LP = '#7B6FE8';
const PURPLE_DP = '#2E2670';
const GOLD_P    = '#C9A84C';
const GOLD_LP   = '#F4D87A';
const NEAR_BLACK_P = '#0C0A08';

// Singleton particle bus. Scenes import emit/registerContinuous; Canvas reads.
const ParticleBus = (() => {
  const particles = []; // {x,y,vx,vy,size,color,life,maxLife,layer,fade}
  const continuous = new Map(); // id -> {fn, lastT}
  let nextId = 1;
  const subs = new Set();
  const notify = () => subs.forEach(s => s());

  return {
    particles,
    add(p) { particles.push(p); },
    burst(opts) {
      const {
        x, y,
        count = 80,
        speedMin = 0.4, speedMax = 3.2,
        sizeMin = 1.5, sizeMax = 5,
        lifeMin = 0.6, lifeMax = 2.8,
        colors = [PURPLE_LP, PURPLE_P],
        ringMode = false,        // particles emit in a ring shape
        ringSpeed = 1.6,
        layer = 'fg',             // 'fg' bright, 'bg' dim
      } = opts;
      for (let i = 0; i < count; i++) {
        const angle = ringMode
          ? (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.04
          : Math.random() * Math.PI * 2;
        const speed = ringMode
          ? ringSpeed + (Math.random() - 0.5) * 0.5
          : speedMin + Math.random() * (speedMax - speedMin);
        const life = lifeMin + Math.random() * (lifeMax - lifeMin);
        const sz = sizeMin + Math.random() * (sizeMax - sizeMin);
        const c = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed * 60,
          vy: Math.sin(angle) * speed * 60,
          size: sz,
          color: c,
          life,
          maxLife: life,
          layer,
          drag: 0.985,
        });
      }
    },
    registerContinuous(fn) {
      const id = nextId++;
      continuous.set(id, { fn, lastT: 0 });
      return id;
    },
    unregister(id) { continuous.delete(id); },
    tickContinuous(time, dt) {
      continuous.forEach((entry) => {
        entry.fn(time, dt, ParticleBus);
      });
    },
    clear() { particles.length = 0; },
    subscribe(s) { subs.add(s); return () => subs.delete(s); },
  };
})();

// Hex -> rgb
function hexRgb(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3
    ? h.split('').map(c => parseInt(c + c, 16))
    : [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)];
  return v;
}

function ParticleCanvas({ width = 1920, height = 1080 }) {
  const ref = React.useRef(null);
  const lastRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const reduced = React.useRef(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.scale(dpr, dpr);

    const tick = (ts) => {
      if (lastRef.current == null) lastRef.current = ts;
      const dt = Math.min(0.05, (ts - lastRef.current) / 1000);
      lastRef.current = ts;
      const time = ts / 1000;

      // Run continuous emitters (they push into bus.particles)
      ParticleBus.tickContinuous(time, dt);

      // Clear & draw with additive blend for glow feel
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      const arr = ParticleBus.particles;
      const dragMul = reduced.current ? 0.92 : 1;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.life -= dt;
        if (p.life <= 0) {
          arr.splice(i, 1);
          continue;
        }
        // physics
        p.vx *= p.drag || 0.985;
        p.vy *= p.drag || 0.985;
        p.x += p.vx * dt * dragMul;
        p.y += p.vy * dt * dragMul;
        // alpha falloff: ease-out cubic over life
        const t = p.life / p.maxLife;
        const alpha = (p.layer === 'bg' ? 0.55 : 1.0) * (t * t);
        const [r,g,b] = hexRgb(p.color);

        const sz = p.size * (p.layer === 'bg' ? 1 : 0.95);
        // glow halo
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 6);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.35})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz * 6, 0, Math.PI * 2);
        ctx.fill();

        // hot core
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [width, height]);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
    />
  );
}

// Helper hook: ambient drift (used during Vault screens and beyond).
// counts: { gold: 8, purple: 6 } etc.
function useAmbientDrift({ active, density = { gold: 8, purple: 6 } }) {
  React.useEffect(() => {
    if (!active) return;
    let last = performance.now() / 1000;
    const id = ParticleBus.registerContinuous((time, dt, bus) => {
      // Maintain target density softly. Random spawn at low rate.
      if (Math.random() < dt * (density.gold + density.purple) * 0.5) {
        const gold = Math.random() * (density.gold + density.purple) < density.gold;
        bus.add({
          x: Math.random() * 1920,
          y: gold ? 1100 + Math.random() * 60 : Math.random() * 1080,
          vx: gold ? (Math.random() - 0.5) * 8 : (Math.random() - 0.5) * 18,
          vy: gold ? -8 - Math.random() * 14 : (Math.random() - 0.5) * 14,
          size: 1.5 + Math.random() * 1.5,
          color: gold ? GOLD_P : PURPLE_P,
          life: 6 + Math.random() * 6,
          maxLife: 8,
          layer: 'bg',
          drag: 0.998,
        });
      }
    });
    return () => ParticleBus.unregister(id);
  }, [active, density.gold, density.purple]);
}

// Helper: ring-shape burst (particles emit outward in a ring pattern)
function ringBurst(x, y, opts = {}) {
  ParticleBus.burst({
    x, y,
    ringMode: true,
    count: opts.count ?? 80,
    ringSpeed: opts.speed ?? 2.4,
    sizeMin: 2, sizeMax: 4,
    lifeMin: 0.7, lifeMax: 1.4,
    colors: opts.colors ?? [PURPLE_LP, GOLD_LP],
    layer: 'fg',
  });
}

// Helper: full radial burst
function radialBurst(x, y, opts = {}) {
  ParticleBus.burst({
    x, y,
    count: opts.count ?? 200,
    speedMin: 0.6, speedMax: 4.5,
    sizeMin: 1.5, sizeMax: 5,
    lifeMin: 0.6, lifeMax: 2.4,
    colors: opts.colors ?? [PURPLE_LP, PURPLE_P, GOLD_P, GOLD_LP],
    layer: 'fg',
  });
}

// Helper: card-emergence subtle puff
function cardBurst(x, y) {
  ParticleBus.burst({
    x, y,
    count: 38,
    speedMin: 0.4, speedMax: 1.8,
    sizeMin: 1.2, sizeMax: 3,
    lifeMin: 0.6, lifeMax: 1.4,
    colors: [PURPLE_LP, PURPLE_P],
    layer: 'bg',
  });
}

Object.assign(window, {
  ParticleBus, ParticleCanvas, useAmbientDrift,
  ringBurst, radialBurst, cardBurst,
  PURPLE_P, PURPLE_LP, PURPLE_DP, GOLD_P, GOLD_LP, NEAR_BLACK_P,
});
