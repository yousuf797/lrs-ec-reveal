// motion.jsx — spring physics + cubic-bezier helpers (RAF-based via the Stage timeline).

// Cubic-bezier evaluator. Returns y for given x using Newton iteration.
function cubicBezier(p1x, p1y, p2x, p2y) {
  const A = (a, b) => 1 - 3 * b + 3 * a;
  const B = (a, b) => 3 * b - 6 * a;
  const C = (a) => 3 * a;
  const calc = (t, a1, a2) => ((A(a1,a2)*t + B(a1,a2))*t + C(a1))*t;
  const slope = (t, a1, a2) => 3*A(a1,a2)*t*t + 2*B(a1,a2)*t + C(a1);
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const cx = calc(t, p1x, p2x) - x;
      const sl = slope(t, p1x, p2x);
      if (Math.abs(sl) < 1e-6) break;
      t -= cx / sl;
    }
    return calc(t, p1y, p2y);
  };
}

// Named curves from the spec
const Bezier = {
  dramaticEntrance: cubicBezier(0.34, 1.56, 0.64, 1),
  fadeIn:           cubicBezier(0.25, 0.46, 0.45, 0.94),
  impactSettle:     cubicBezier(0.22, 1, 0.36, 1),
  exit:             cubicBezier(0.55, 0, 1, 0.45),
};

// Spring physics — analytic underdamped solution. Returns f(t in seconds) -> 0..1
// (and may overshoot then settle). Caches into a function.
function spring({ stiffness = 80, damping = 14, mass = 1.1, from = 0, to = 1 }) {
  const omega = Math.sqrt(stiffness / mass);
  const zeta  = damping / (2 * Math.sqrt(stiffness * mass));
  return (t) => {
    if (t < 0) return from;
    let progress;
    if (zeta < 1) {
      // underdamped
      const wd = omega * Math.sqrt(1 - zeta * zeta);
      progress = 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + (zeta * omega / wd) * Math.sin(wd * t));
    } else if (zeta === 1) {
      progress = 1 - Math.exp(-omega * t) * (1 + omega * t);
    } else {
      // overdamped
      const r1 = -omega * (zeta - Math.sqrt(zeta*zeta - 1));
      const r2 = -omega * (zeta + Math.sqrt(zeta*zeta - 1));
      const A = -r2 / (r1 - r2);
      const B = r1 / (r1 - r2);
      progress = 1 - (A * Math.exp(r1 * t) + B * Math.exp(r2 * t));
    }
    return from + (to - from) * progress;
  };
}

// Spec presets
const Springs = {
  entrance: { stiffness: 80,  damping: 14, mass: 1.1 },
  settle:   { stiffness: 200, damping: 22, mass: 0.9 },
  hover:    { stiffness: 300, damping: 20, mass: 1.0 },
  shake:    { stiffness: 500, damping: 8,  mass: 1.0 },
  ringSnap: { stiffness: 280, damping: 18, mass: 1.0 },
  glide:    { stiffness: 160, damping: 16, mass: 1.0 },
  converge: { stiffness: 400, damping: 10, mass: 1.0 },
};

// Spring helper that returns value at sub-time t given preset.
function springAt(preset, t) {
  return spring({ ...preset })(Math.max(0, t));
}

// Reduced-motion check
const PRM = (() => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
})();

// Wraps a value transform: if reduced motion, snap quickly. Otherwise use given fn.
function rm(fn, snap) {
  if (!PRM) return fn;
  return (t) => (t > 0.05 ? snap : 0);
}

Object.assign(window, { Bezier, cubicBezier, spring, Springs, springAt, PRM });
