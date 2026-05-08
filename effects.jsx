// effects.jsx — DOM-based visual primitives still used: Shockwave, RadialGlow,
// LightRays, WhiteFlash, Vignette. Particles now live on canvas (particles.jsx).

function RadialGlow({ x = 960, y = 540, radius = 600, color = '#4A3FA0', intensity = 0.7 }) {
  return (
    <div style={{
      position: 'absolute',
      left: x - radius, top: y - radius,
      width: radius * 2, height: radius * 2,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity: intensity,
      mixBlendMode: 'screen',
      pointerEvents: 'none',
      filter: 'blur(20px)',
      willChange: 'transform, opacity',
    }} />
  );
}

function Shockwave({ x = 960, y = 540, progress = 0, color = '#fff', maxRadius = 1600, thickness = 6 }) {
  if (progress <= 0 || progress >= 1) return null;
  const r = maxRadius * Bezier.impactSettle(progress);
  const op = (1 - progress) * 0.9;
  const tw = thickness * (1 - progress * 0.5);
  return (
    <div style={{
      position: 'absolute',
      left: x - r, top: y - r,
      width: r * 2, height: r * 2,
      borderRadius: '50%',
      border: `${tw}px solid ${color}`,
      opacity: op,
      pointerEvents: 'none',
      boxShadow: `0 0 60px ${color}, inset 0 0 60px ${color}`,
      mixBlendMode: 'screen',
      willChange: 'transform, opacity',
    }} />
  );
}

function LightRays({ x = 960, y = 540, progress = 0, color = '#C9A84C', count = 24, maxLen = 1500 }) {
  if (progress <= 0 || progress >= 1) return null;
  const len = maxLen * Bezier.impactSettle(progress);
  const op = (1 - progress) * 0.85;
  const rays = React.useMemo(() => Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + (Math.sin(i * 7.13) * 0.05);
    const w = 2 + (i % 3) * 1.5;
    return { a, w };
  }), [count]);
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: 0, height: 0,
      pointerEvents: 'none', mixBlendMode: 'screen',
    }}>
      {rays.map((r, i) => (
        <div key={i} style={{
          position: 'absolute', left: 0, top: 0,
          width: len, height: r.w,
          background: `linear-gradient(90deg, ${color}, ${color}aa 30%, transparent 100%)`,
          transform: `translateY(${-r.w/2}px) rotate(${r.a}rad)`,
          transformOrigin: '0 50%',
          opacity: op,
          filter: 'blur(0.5px)',
          willChange: 'transform, opacity',
        }} />
      ))}
    </div>
  );
}

function WhiteFlash({ progress = 0, color = '#fff', maxOpacity = 1 }) {
  if (progress <= 0 || progress >= 1) return null;
  const op = progress < 0.15
    ? Bezier.impactSettle(progress / 0.15) * maxOpacity
    : (1 - Bezier.exit((progress - 0.15) / 0.85)) * maxOpacity;
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: color,
      opacity: op,
      pointerEvents: 'none',
      mixBlendMode: 'screen',
      willChange: 'opacity',
    }} />
  );
}

function Vignette({ intensity = 0.6 }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${intensity}) 100%)`,
      pointerEvents: 'none',
    }} />
  );
}

window.RadialGlow = RadialGlow;
window.Shockwave = Shockwave;
window.LightRays = LightRays;
window.WhiteFlash = WhiteFlash;
window.Vignette = Vignette;
