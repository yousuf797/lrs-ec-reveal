// sequence-B.jsx — 12-card grid + four PlayStation-style reveals + Vault interludes.

const ACCEPTED = ['Maham Tahir', 'Ibrahim Arif Alvi', 'Hassaan Tayyab', 'Momina Imran'];
const PRESIDENT_NAME = 'Muhammad Ammar Faisal';

// Final row positions (centered) under president
const ROW_Y = 920;
const ROW_X = { 'Maham Tahir': 320, 'Ibrahim Arif Alvi': 800, 'Hassaan Tayyab': 1280, 'Momina Imran': 1680 };
function rowPos(name) { return { x: ROW_X[name], y: ROW_Y }; }

// ── Scene_Grid: 19-29s ─────────────────────────────────────────────────
// 0-2.5: cards enter in a staggered wave (90ms stagger), top-to-bottom by row
// 2.5-7.5: full hold (5s)
// 7.5-9: equal fade-out (1.5s)
// 9-10: brief vault transition
function Scene_Grid({ start = 19 }) {
  const dur = 10;
  return (
    <Sprite start={start} end={start + dur}>
      {({ localTime }) => {
        const fadeAt = 7.5;
        // Stagger order: row by row (top→bottom), L→R within row
        const stagger = 0.09;

        return (
          <div style={{ position: 'absolute', inset: 0, background: NEAR_BLACK_P }}>
            <Vault intensity={0.7} />

            {POOL_NAMES.map((name, i) => {
              const pos = gridPos(i);
              return (
                <NameCard
                  key={name}
                  name={name}
                  x={pos.x} y={pos.y}
                  width={CARD_W}
                  enterAt={i * stagger}
                  exitAt={fadeAt}
                  exitDur={1.5}
                  burst={true}
                />
              );
            })}

            <Vignette intensity={0.55} />
          </div>
        );
      }}
    </Sprite>
  );
}

// ── Scene_VaultPause ───────────────────────────────────────────────────
// Pure Vault screen for `dur` seconds. Optional center text.
function Scene_VaultPause({ start, dur, text = null, textStartAt = null, textFadeAt = null }) {
  return (
    <Sprite start={start} end={start + dur}>
      {({ localTime }) => (
        <div style={{ position: 'absolute', inset: 0 }}>
          <Vault intensity={1} />
          <VaultDrift />
          {text && (
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              willChange: 'transform, opacity',
            }}>
              <StaggeredText
                text={text}
                size={88}
                weight={700}
                color="#f5efe0"
                letterSpacing="0.06em"
                stagger={0.03}
                startAt={textStartAt ?? 0}
                fadeOutAt={textFadeAt}
                fadeOutDur={0.7}
                textShadow={`0 0 24px ${GOLD_P}66, 0 0 60px ${PURPLE_P}66`}
              />
            </div>
          )}
          <Vignette intensity={0.55} />
        </div>
      )}
    </Sprite>
  );
}

// ── Reveal: PlayStation-style prelude → convergence → detonation ─────
// Single name reveal scene: 8.5s total
//   0     - 4.0  : Prelude — energy lines, sonar ring, brightening pulse
//   4.0   - 5.4  : Convergence — lines violently rush to center, white point
//   5.4   - 5.5  : Peak white frame
//   5.5   - 7.5  : Detonation hold + ring snap + pulse twice
//   7.5   - 8.5  : Glide to row position, settle bounce
function Scene_Reveal({ start, dur = 8.5, name, fromDir = 'top', accent = 'purple' }) {
  return (
    <Sprite start={start} end={start + dur}>
      {({ localTime }) => {
        const T = localTime;
        const preludeEnd = 4.0;
        const convergeEnd = 5.4;
        const peakAt = 5.45;
        const detonateAt = 5.5;
        const holdEnd = 7.5;
        const glideEnd = 8.5;

        const colorPrimary = accent === 'gold' ? GOLD_P : (accent === 'purple-gold' ? GOLD_LP : PURPLE_LP);
        const colorSecondary = accent === 'gold' ? GOLD_LP : (accent === 'purple-gold' ? PURPLE_LP : PURPLE_P);
        const burstColors = accent === 'gold' ? [GOLD_P, GOLD_LP, PURPLE_P]
                          : accent === 'purple-gold' ? [GOLD_P, PURPLE_LP, PURPLE_P]
                          : [PURPLE_LP, PURPLE_P, GOLD_P];

        // ── PRELUDE ───────────────────────────────────────────────
        const inPrelude = T < preludeEnd;
        // breath pulse: every 1.2s, brighten slightly
        const breathPulse = inPrelude
          ? 0.5 + 0.5 * Math.sin(T * (Math.PI * 2 / 1.2))
          : 0;
        // accel toward end of prelude (last 0.7s): lines move faster
        const accelT = clamp((T - (preludeEnd - 0.7)) / 0.7, 0, 1);

        // Sonar ring: barely visible expanding ring
        const sonarPeriod = 2.5;
        const sonarT = (T % sonarPeriod) / sonarPeriod;
        const sonarR = 80 + sonarT * 700;
        const sonarOp = inPrelude ? (1 - sonarT) * 0.18 : 0;

        // ── CONVERGENCE ───────────────────────────────────────────
        const inConverge = T >= preludeEnd && T < convergeEnd;
        const convergeP = clamp((T - preludeEnd) / (convergeEnd - preludeEnd), 0, 1);
        const peakFlashOp = (T > peakAt - 0.05 && T < peakAt + 0.08) ? 1 : 0;

        // ── DETONATION ────────────────────────────────────────────
        const detT = T - detonateAt;
        const ringSnapFn = React.useMemo(() => spring(Springs.ringSnap), []);
        const shakeFn = React.useMemo(() => spring(Springs.shake), []);
        const glideFn = React.useMemo(() => spring(Springs.glide), []);

        let nameX = 960, nameY = 540, nameOp = 0, nameScale = 1, nameSize = 168, nameBlur = 0;
        let ringR = 0, ringOp = 0;

        const target = ROW_X[name] != null ? rowPos(name) : null;

        if (T < detonateAt) {
          nameOp = 0;
        } else if (T < holdEnd) {
          // Held at center
          nameX = 960; nameY = 540; nameSize = 168; nameOp = 1;
          // Spring scale on impact (overshoot) — uses `entrance` preset stretched
          const sP = clamp(ringSnapFn(detT * 1.6), 0, 1.15);
          nameScale = 0.85 + sP * 0.18;
          nameBlur = (1 - clamp(detT / 0.3, 0, 1)) * 12;
          // Ring sequence
          if (detT < 0.45) {
            // Expand 0 -> 140% width then snap back to hug
            const rp = clamp(detT / 0.45, 0, 1);
            const expand = ringSnapFn(rp * 1.6);
            // estimate name width from size
            const targetR = nameSize * 3.6;
            ringR = expand < 1 ? targetR * 1.4 * expand : targetR * (1.4 - 0.4 * (expand - 1));
            ringR = Math.max(20, ringR);
            ringOp = clamp(rp * 2, 0, 1);
          } else if (detT < 1.2) {
            // hug then pulse twice
            const pp = (detT - 0.45) / 0.75;
            const targetR = nameSize * 3.6;
            ringR = targetR + Math.sin(pp * Math.PI * 4) * 18;
            ringOp = 0.85;
          } else {
            // hold the ring
            const targetR = nameSize * 3.6;
            ringR = targetR;
            ringOp = 0.55 + Math.sin(detT * 4) * 0.1;
          }
        } else {
          // Glide to row
          const gp = clamp((T - holdEnd) / (glideEnd - holdEnd), 0, 1);
          const sp = clamp(glideFn(gp * 1.6), 0, 1.15);
          nameOp = 1;
          nameX = 960 + (target.x - 960) * sp;
          nameY = 540 + (target.y - 540) * sp;
          nameSize = 168 + (38 - 168) * sp;
        }

        // Screen shake on impact
        const shakeAmt = (T > detonateAt && T < detonateAt + 0.35)
          ? Math.sin((T - detonateAt) * 70) * 6 * (1 - (T - detonateAt) / 0.35)
          : 0;

        return (
          <div style={{
            position: 'absolute', inset: 0,
            transform: `translateX(${shakeAmt}px)`,
            willChange: 'transform',
          }}>
            <Vault intensity={inPrelude ? 0.6 : 0.3} />
            <VaultDrift />

            {/* Background pulse glow that breathes during prelude */}
            {inPrelude && (
              <RadialGlow x={960} y={540} radius={900}
                          color={colorPrimary}
                          intensity={0.08 + breathPulse * 0.10} />
            )}

            {/* Sonar ring */}
            {inPrelude && sonarOp > 0 && (
              <div style={{
                position: 'absolute',
                left: 960 - sonarR, top: 540 - sonarR,
                width: sonarR * 2, height: sonarR * 2,
                borderRadius: '50%',
                border: `1px solid ${colorPrimary}`,
                opacity: sonarOp,
                mixBlendMode: 'screen',
                pointerEvents: 'none',
                willChange: 'opacity',
              }} />
            )}

            {/* Energy lines — 12 organic lines from a center point outward */}
            {(inPrelude || inConverge) && (
              <EnergyLines
                T={T}
                preludeEnd={preludeEnd}
                convergeEnd={convergeEnd}
                accelT={accelT}
                convergeP={convergeP}
                color={colorPrimary}
              />
            )}

            {/* Convergence collapsing white point */}
            {inConverge && (
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                width: 30 + convergeP * convergeP * 60,
                height: 30 + convergeP * convergeP * 60,
                marginLeft: -(15 + convergeP * convergeP * 30),
                marginTop: -(15 + convergeP * convergeP * 30),
                borderRadius: '50%',
                background: '#fff',
                opacity: clamp(convergeP * 1.4, 0, 1),
                boxShadow: `0 0 ${60 + convergeP * 200}px ${20 + convergeP * 80}px ${colorPrimary}, 0 0 ${200 + convergeP * 400}px ${100 + convergeP * 200}px ${colorPrimary}77`,
                willChange: 'transform, opacity',
              }} />
            )}

            {/* 1-frame peak flash */}
            <div style={{
              position: 'absolute', inset: 0,
              background: '#fff',
              opacity: peakFlashOp,
              pointerEvents: 'none',
              willChange: 'opacity',
            }} />

            <DetonationFx
              T={T}
              detonateAt={detonateAt}
              centerX={960} centerY={540}
              colors={burstColors}
              accent={accent}
            />

            {/* Glow under name during hold */}
            {T >= detonateAt && T < holdEnd && (
              <RadialGlow x={nameX} y={nameY} radius={520}
                          color={colorPrimary}
                          intensity={0.5 + Math.sin(T * 3) * 0.06} />
            )}

            {/* Ring */}
            {ringOp > 0 && (
              <div style={{
                position: 'absolute',
                left: nameX - ringR, top: nameY - ringR,
                width: ringR * 2, height: ringR * 2,
                borderRadius: '50%',
                border: `2px solid ${colorPrimary}`,
                boxShadow: `0 0 30px ${colorPrimary}, inset 0 0 30px ${colorPrimary}88`,
                opacity: ringOp,
                mixBlendMode: 'screen',
                willChange: 'transform, opacity',
              }} />
            )}

            {/* The Name */}
            {nameOp > 0 && (
              <div style={{
                position: 'absolute',
                left: nameX, top: nameY,
                transform: `translate(-50%, -50%) scale(${nameScale})`,
                fontFamily: COMFORTAA,
                fontSize: nameSize,
                fontWeight: 700,
                color: '#fefcf6',
                whiteSpace: 'nowrap',
                opacity: nameOp,
                letterSpacing: '0.02em',
                filter: `blur(${nameBlur}px)`,
                textShadow: T < holdEnd
                  ? `0 0 30px ${colorPrimary}, 0 0 80px ${colorSecondary}aa, 0 4px 0 rgba(0,0,0,0.8)`
                  : `0 0 14px ${PURPLE_P}88`,
                willChange: 'transform, opacity, filter',
              }}>{name}</div>
            )}

            <Vignette intensity={0.55} />
          </div>
        );
      }}
    </Sprite>
  );
}

// 12 organic lines from random points moving toward center.
function EnergyLines({ T, preludeEnd, convergeEnd, accelT, convergeP, color }) {
  const lines = React.useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const ang = (i / 12) * Math.PI * 2 + (Math.sin(i * 19.7) * 0.5);
    const dist = 250 + (i * 73 % 350);
    const baseLen = 80 + (i * 41 % 160);
    return { ang, dist, baseLen, ph: i * 1.8 };
  }), []);

  const inConverge = T >= preludeEnd;

  return (
    <>
      {lines.map((l, i) => {
        // Position: during prelude, line origin sits at radius `dist` from center.
        // During convergence, it rushes inward.
        let originX, originY;
        if (!inConverge) {
          originX = 960 + Math.cos(l.ang) * l.dist;
          originY = 540 + Math.sin(l.ang) * l.dist;
        } else {
          const inward = Bezier.dramaticEntrance(convergeP);
          originX = 960 + Math.cos(l.ang) * l.dist * (1 - inward);
          originY = 540 + Math.sin(l.ang) * l.dist * (1 - inward);
        }

        const oscillate = Math.sin(T * 4 + l.ph) * 0.5 + 0.5;
        const lenBoost = 1 + accelT * 1.6;
        const len = (l.baseLen + oscillate * 60) * lenBoost * (inConverge ? 1.6 : 1);

        const angleToCenter = Math.atan2(540 - originY, 960 - originX);

        const baseOp = inConverge ? 0.9 : (0.35 + oscillate * 0.5);
        const opacity = baseOp;
        const thickness = inConverge ? 2.5 : (1 + oscillate * 1.2);

        return (
          <div key={i} style={{
            position: 'absolute',
            left: originX, top: originY,
            width: len, height: thickness,
            background: `linear-gradient(90deg, ${color}, ${color}66 60%, transparent 100%)`,
            transform: `translateY(-${thickness / 2}px) rotate(${angleToCenter}rad)`,
            transformOrigin: '0 50%',
            opacity,
            mixBlendMode: 'screen',
            filter: 'blur(0.5px)',
            boxShadow: `0 0 ${inConverge ? 12 : 6}px ${color}`,
            willChange: 'transform, opacity',
          }} />
        );
      })}
    </>
  );
}

// Single-fire detonation effects: shockwave + light rays + radial+ring particle bursts.
function DetonationFx({ T, detonateAt, centerX, centerY, colors, accent }) {
  const firedRef = React.useRef(false);
  React.useEffect(() => {
    if (T >= detonateAt && T < detonateAt + 0.15 && !firedRef.current) {
      firedRef.current = true;
      radialBurst(centerX, centerY, { count: 240, colors });
      ringBurst(centerX, centerY, { count: 60, colors, speed: 3.0 });
    }
    if (T < detonateAt - 0.1) firedRef.current = false;
  }, [T >= detonateAt && T < detonateAt + 0.15]);

  if (T < detonateAt) return null;
  const dt = T - detonateAt;
  const shockProg = clamp(dt / 1.6, 0, 1);
  const raysProg = clamp(dt / 1.0, 0, 1);
  const burstColor = colors[0];
  const burstColor2 = colors[1] || colors[0];
  return (
    <>
      <Shockwave x={centerX} y={centerY} progress={shockProg}
                 color={burstColor} maxRadius={1500} thickness={6} />
      <Shockwave x={centerX} y={centerY} progress={Math.max(0, shockProg - 0.1)}
                 color={burstColor2} maxRadius={1700} thickness={4} />
      <LightRays x={centerX} y={centerY} progress={raysProg}
                 color={burstColor} count={28} maxLen={1500} />
      <LightRays x={centerX} y={centerY} progress={Math.min(1, raysProg + 0.1)}
                 color={burstColor2} count={18} maxLen={1200} />
    </>
  );
}

// Pinned row name (after a reveal has glided into position and persists)
function PinnedRowName({ name, fadeInAt = 0 }) {
  const { localTime } = useSprite();
  const sub = localTime - fadeInAt;
  const opP = clamp(sub / 0.5, 0, 1);
  const pos = rowPos(name);
  return (
    <div style={{
      position: 'absolute',
      left: pos.x, top: pos.y,
      transform: 'translate(-50%, -50%)',
      fontFamily: COMFORTAA,
      fontSize: 38,
      fontWeight: 700,
      color: '#fefcf6',
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
      textShadow: `0 0 14px ${PURPLE_P}aa, 0 0 32px ${PURPLE_DP}88`,
      opacity: opP,
      willChange: 'transform, opacity',
    }}>{name}</div>
  );
}

window.ACCEPTED = ACCEPTED;
window.PRESIDENT_NAME = PRESIDENT_NAME;
window.rowPos = rowPos;
window.Scene_Grid = Scene_Grid;
window.Scene_VaultPause = Scene_VaultPause;
window.Scene_Reveal = Scene_Reveal;
window.PinnedRowName = PinnedRowName;
window.DetonationFx = DetonationFx;
