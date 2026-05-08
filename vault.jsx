// vault.jsx — The Vault suspense screen + shared visual primitives.
// Used everywhere the animation needs silence and weight.

const COMFORTAA = "'Comfortaa', system-ui, -apple-system, sans-serif";

// ── Vault: backdrop layers, architectural lines, watermark, ambient drift ─
function Vault({ intensity = 1, showWatermark = true }) {
  const time = useTime();
  // Breathing pulse on radial gradient (4s cycle, 3% -> 7%)
  const pulse = 0.05 + Math.sin(time * (Math.PI * 2 / 4)) * 0.02;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Deep base */}
      <div style={{
        position: 'absolute', inset: 0,
        background: NEAR_BLACK_P,
      }} />
      {/* Faint purple bleed from edges inward */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at center, transparent 30%, rgba(74,63,160,${pulse * intensity}) 100%)`,
        willChange: 'opacity',
      }} />
      {/* Two thin vertical lines: stage edges */}
      <div style={{
        position: 'absolute',
        left: 96, top: '20%', width: 1, height: '60%',
        background: 'rgba(255,255,255,0.06)',
      }} />
      <div style={{
        position: 'absolute',
        right: 96, top: '20%', width: 1, height: '60%',
        background: 'rgba(255,255,255,0.06)',
      }} />
      {/* One thin horizontal gold line at 15% from bottom */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0,
        bottom: '15%',
        height: 1,
        background: 'rgba(201,168,76,0.08)',
      }} />
      {/* LRS monogram watermark */}
      {showWatermark && (
        <div style={{
          position: 'absolute',
          left: '50%', top: 36,
          transform: 'translateX(-50%)',
          fontFamily: COMFORTAA,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.6em',
          color: '#f5efe0',
          opacity: 0.07,
          textTransform: 'uppercase',
        }}>LRS</div>
      )}
    </div>
  );
}

// Continuous Vault-mode ambient drift hook
function useVaultDrift(active) {
  React.useEffect(() => {
    if (!active) return;
    const id = ParticleBus.registerContinuous((time, dt, bus) => {
      // Maintain ~16 ambient particles. Spawn when below threshold.
      const ambientCount = bus.particles.filter(p => p._ambient).length;
      if (ambientCount < 16 && Math.random() < dt * 8) {
        const isGold = Math.random() < 0.55;
        bus.add({
          x: Math.random() * 1920,
          y: isGold ? 1100 + Math.random() * 100 : Math.random() * 1080,
          vx: isGold ? (Math.random() - 0.5) * 6 : (Math.random() - 0.5) * 14,
          vy: isGold ? -10 - Math.random() * 12 : (Math.random() - 0.5) * 12,
          size: 1.5 + Math.random() * 1.5,
          color: isGold ? GOLD_P : PURPLE_P,
          life: 6 + Math.random() * 6,
          maxLife: 10,
          layer: 'bg',
          drag: 0.998,
          _ambient: true,
        });
      }
    });
    return () => ParticleBus.unregister(id);
  }, [active]);
  return null;
}

// VaultDrift is a no-render component that activates the drift while mounted.
function VaultDrift() {
  useVaultDrift(true);
  return null;
}

// ── Letter-by-letter staggered text reveal ─────────────────────────────
// Uses spring physics for each letter: translateY(20)+opacity(0) -> 0/1
// stagger ms per letter; once all in, stays.
function StaggeredText({
  text,
  size = 64,
  weight = 700,
  color = '#fefcf6',
  letterSpacing = '0',
  stagger = 0.04, // s per letter
  startAt = 0,    // local time when reveal begins
  fadeOutAt = null, // local time when fade out begins (s)
  fadeOutDur = 0.6,
  font = COMFORTAA,
  textShadow = 'none',
  fadeOutEase = Bezier.exit,
  letterEntrance = Springs.entrance,
}) {
  const { localTime } = useSprite();
  const letters = text.split('');
  const springFn = React.useMemo(() => spring(letterEntrance), [letterEntrance.stiffness, letterEntrance.damping, letterEntrance.mass]);

  const fadeOutP = fadeOutAt != null
    ? clamp((localTime - fadeOutAt) / fadeOutDur, 0, 1)
    : 0;
  const fadeOutOp = fadeOutAt != null ? 1 - fadeOutEase(fadeOutP) : 1;

  return (
    <div style={{
      display: 'inline-flex',
      whiteSpace: 'pre',
      fontFamily: font,
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing,
      textShadow,
      willChange: 'transform, opacity',
    }}>
      {letters.map((ch, i) => {
        const t0 = startAt + i * stagger;
        const sub = localTime - t0;
        // spring time scaling — spring needs ~1.5s to settle at default, normalize
        const sP = clamp(springFn(sub * 1.4), 0, 1.2);
        const opP = clamp(sub / 0.4, 0, 1);
        const ty = (1 - sP) * 20;
        const op = opP * fadeOutOp;
        return (
          <span key={i} style={{
            display: 'inline-block',
            transform: `translateY(${ty}px)`,
            opacity: op,
            willChange: 'transform, opacity',
          }}>{ch === ' ' ? '\u00A0' : ch}</span>
        );
      })}
    </div>
  );
}

// ── Drawn-from-left underline ──────────────────────────────────────────
function DrawnUnderline({
  width = 320, height = 2,
  color = GOLD_P,
  startAt = 0, dur = 0.6,
  fadeOutAt = null, fadeOutDur = 0.6,
  ease = Bezier.impactSettle,
}) {
  const { localTime } = useSprite();
  const p = clamp((localTime - startAt) / dur, 0, 1);
  const drawn = ease(p);
  const fadeOp = fadeOutAt != null ? 1 - clamp((localTime - fadeOutAt) / fadeOutDur, 0, 1) : 1;
  return (
    <div style={{
      width: width, height: height,
      position: 'relative',
      willChange: 'transform, opacity',
      opacity: fadeOp,
    }}>
      <div style={{
        position: 'absolute',
        left: 0, top: 0,
        width: '100%', height: '100%',
        background: color,
        boxShadow: `0 0 12px ${color}, 0 0 28px ${color}88`,
        transformOrigin: '0 50%',
        transform: `scaleX(${drawn})`,
        willChange: 'transform',
      }} />
    </div>
  );
}

// ── Card: glass card used in 4x3 grid ───────────────────────────────────
function NameCard({
  name,
  width = 360,
  px = 22, py = 14,
  topAccent = 'rgba(74,63,160,0.6)',
  // entry/exit
  enterAt = 0,
  exitAt = null, exitDur = 1.5,
  // particles burst on entry
  burst = true,
  // x/y center
  x, y,
}) {
  const { localTime } = useSprite();
  const sub = localTime - enterAt;
  const springFn = React.useMemo(() => spring(Springs.entrance), []);
  // use a normalized spring time so settle by sub ~1.0s
  const sP = clamp(springFn(sub * 1.6), 0, 1.15);
  const opP = clamp(sub / 0.4, 0, 1);

  const ty = (1 - sP) * -30;
  const sc = 0.88 + sP * 0.12;

  // exit: fade equally
  const exitP = exitAt != null ? clamp((localTime - exitAt) / exitDur, 0, 1) : 0;
  const exitOp = exitAt != null ? 1 - Bezier.fadeIn(exitP) : 1;
  const op = opP * exitOp;

  // Trigger card burst once when card crosses sub > 0
  const firedRef = React.useRef(false);
  React.useEffect(() => {
    if (burst && sub > 0 && sub < 0.2 && !firedRef.current) {
      firedRef.current = true;
      cardBurst(x, y);
    }
    if (sub < 0) firedRef.current = false;
  }, [sub > 0, burst, x, y]);

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      transform: `translate(-50%, calc(-50% + ${ty}px)) scale(${sc})`,
      opacity: op,
      willChange: 'transform, opacity',
      width,
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: `${py}px ${px}px`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: 'inset 0 0 20px rgba(74,63,160,0.08), 0 4px 24px rgba(0,0,0,0.3)',
        position: 'relative',
        textAlign: 'center',
      }}>
        {/* Top accent border */}
        <div style={{
          position: 'absolute',
          top: -1, left: 12, right: 12,
          height: 2,
          background: topAccent,
          borderRadius: 2,
        }} />
        <div style={{
          fontFamily: COMFORTAA,
          fontWeight: 700,
          fontSize: 18,
          color: '#fefcf6',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          overflow: 'visible',
        }}>{name}</div>
      </div>
    </div>
  );
}

window.COMFORTAA = COMFORTAA;
window.Vault = Vault;
window.VaultDrift = VaultDrift;
window.StaggeredText = StaggeredText;
window.DrawnUnderline = DrawnUnderline;
window.NameCard = NameCard;
