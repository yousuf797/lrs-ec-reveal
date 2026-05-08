// sequence-C.jsx — president sequence + final hierarchy.

// President reveal: extended prelude (6s of lines) + violent convergence + detonation.
// Locks above the row of 4. Then connectors draw + roles snap in.
// Total scene duration: 16s (83 -> 99)
function Scene_President({ start = 83 }) {
  const dur = 16;
  return (
    <Sprite start={start} end={start + dur}>
      {({ localTime }) => {
        const T = localTime;
        const preludeEnd = 6.0;
        const convergeEnd = 8.0;
        const peakAt = 8.05;
        const detonateAt = 8.1;
        const holdEnd = 13.0; // hold huge name center
        const settleEnd = 14.5; // glide up to position above row
        // 14.5 -> 16: connectors draw, breathing

        const colorPrimary = GOLD_P;
        const colorSecondary = GOLD_LP;
        const burstColors = [GOLD_P, GOLD_LP, PURPLE_LP, PURPLE_P];

        const inPrelude = T < preludeEnd;
        const inConverge = T >= preludeEnd && T < convergeEnd;
        const convergeP = clamp((T - preludeEnd) / (convergeEnd - preludeEnd), 0, 1);
        const peakFlashOp = (T > peakAt - 0.05 && T < peakAt + 0.10) ? 1 : 0;
        const breathPulse = inPrelude ? 0.5 + 0.5 * Math.sin(T * (Math.PI * 2 / 1.2)) : 0;
        const accelT = clamp((T - (preludeEnd - 0.9)) / 0.9, 0, 1);
        const sonarPeriod = 2.2;
        const sonarT = (T % sonarPeriod) / sonarPeriod;
        const sonarR = 100 + sonarT * 900;
        const sonarOp = inPrelude ? (1 - sonarT) * 0.22 : 0;

        // Name placement
        const presFinalY = 360;
        let nameX = 960, nameY = 540, nameOp = 0, nameScale = 1, nameSize = 92, nameBlur = 0;
        const detT = T - detonateAt;

        if (T < detonateAt) {
          nameOp = 0;
        } else if (T < holdEnd) {
          nameOp = 1;
          nameSize = 92;
          // Spring scale on impact
          const sP = clamp(spring(Springs.ringSnap)(detT * 1.6), 0, 1.15);
          nameScale = 0.85 + sP * 0.20;
          nameBlur = (1 - clamp(detT / 0.4, 0, 1)) * 14;
          // breathing alive name
          const breathe = 0.5 + 0.5 * Math.sin((T - detonateAt) * 1.4);
          nameScale *= 1 + breathe * 0.018;
        } else if (T < settleEnd) {
          // Glide up to final position
          const gp = clamp((T - holdEnd) / (settleEnd - holdEnd), 0, 1);
          const sp = clamp(spring(Springs.glide)(gp * 1.6), 0, 1.15);
          nameOp = 1;
          nameY = 540 + (presFinalY - 540) * sp;
          nameSize = 92 + (96 - 92) * sp;
        } else {
          // Locked at final position, breathing
          nameOp = 1;
          nameY = presFinalY;
          nameSize = 96;
          const breathe = 0.5 + 0.5 * Math.sin((T - settleEnd) * 1.2);
          nameScale = 1 + breathe * 0.012;
        }

        const shakeAmt = (T > detonateAt && T < detonateAt + 0.5)
          ? Math.sin((T - detonateAt) * 70) * 14 * (1 - (T - detonateAt) / 0.5)
          : 0;

        // Connector lines (after name settles)
        const linesP = clamp((T - settleEnd) / 1.2, 0, 1);

        return (
          <div style={{
            position: 'absolute', inset: 0,
            transform: `translate(${shakeAmt}px, ${shakeAmt * 0.4}px)`,
            willChange: 'transform',
          }}>
            <Vault intensity={inPrelude ? 0.7 : 0.3} />
            <VaultDrift />

            {inPrelude && (
              <RadialGlow x={960} y={540} radius={1100}
                          color={colorPrimary}
                          intensity={0.10 + breathPulse * 0.14} />
            )}
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
              }} />
            )}

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

            {inConverge && (
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                width: 60 + convergeP * convergeP * 120,
                height: 60 + convergeP * convergeP * 120,
                marginLeft: -(30 + convergeP * convergeP * 60),
                marginTop: -(30 + convergeP * convergeP * 60),
                borderRadius: '50%',
                background: '#fff',
                opacity: clamp(convergeP * 1.4, 0, 1),
                boxShadow: `0 0 ${100 + convergeP * 300}px ${40 + convergeP * 120}px ${colorPrimary}, 0 0 ${300 + convergeP * 500}px ${150 + convergeP * 250}px ${colorSecondary}aa`,
                willChange: 'transform, opacity',
              }} />
            )}

            <div style={{
              position: 'absolute', inset: 0,
              background: '#fff',
              opacity: peakFlashOp,
              pointerEvents: 'none',
            }} />

            <DetonationFx
              T={T}
              detonateAt={detonateAt}
              centerX={960} centerY={540}
              colors={burstColors}
              accent="gold"
            />
            {/* Extra screen-fill flash for president */}
            {T > detonateAt && T < detonateAt + 1.0 && (
              <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse at center, ${GOLD_LP}cc 0%, ${GOLD_P}66 30%, transparent 70%)`,
                opacity: clamp(1 - (T - detonateAt) / 1.0, 0, 1) * 0.85,
                mixBlendMode: 'screen',
                pointerEvents: 'none',
              }} />
            )}

            {/* Big radial glow under president once visible */}
            {T >= detonateAt && (
              <RadialGlow x={nameX} y={nameY} radius={1100}
                          color={colorPrimary}
                          intensity={0.55 + Math.sin(T * 1.4) * 0.10} />
            )}

            {/* Persistent row of 4 names already in place */}
            {ACCEPTED.map(n => <PinnedRowName key={n} name={n} fadeInAt={0} />)}

            {/* Connector lines (gold) */}
            {linesP > 0 && ACCEPTED.map((n, i) => {
              const target = rowPos(n);
              const dx = target.x - 960;
              const dy = target.y - presFinalY;
              const length = Math.sqrt(dx*dx + dy*dy);
              const angle = Math.atan2(dy, dx);
              const drawLen = length * Bezier.impactSettle(clamp((linesP * 1.2) - i * 0.05, 0, 1));
              return (
                <div key={i} style={{
                  position: 'absolute',
                  left: 960, top: presFinalY + 120,
                  width: drawLen, height: 1.5,
                  background: `linear-gradient(90deg, ${GOLD_P}ee, ${GOLD_LP}cc 50%, ${GOLD_P}88)`,
                  transform: `rotate(${angle}rad)`,
                  transformOrigin: '0 50%',
                  opacity: 0.85,
                  boxShadow: `0 0 8px ${GOLD_P}`,
                  pointerEvents: 'none',
                  willChange: 'transform, opacity',
                }} />
              );
            })}

            {/* The president — bordered gold frame */}
            {nameOp > 0 && (
              <div style={{
                position: 'absolute',
                left: nameX, top: nameY,
                transform: `translate(-50%, -50%) scale(${nameScale})`,
                opacity: nameOp,
                filter: `blur(${nameBlur}px)`,
                willChange: 'transform, opacity, filter',
              }}>
                <div style={{
                  fontFamily: COMFORTAA,
                  fontSize: nameSize,
                  fontWeight: 700,
                  color: '#fefcf6',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                  textShadow: `0 0 30px ${GOLD_LP}, 0 0 80px ${GOLD_P}cc, 0 0 160px ${GOLD_P}88, 0 6px 0 rgba(0,0,0,0.85)`,
                  padding: '14px 32px',
                  border: `2px solid ${GOLD_P}`,
                  borderRadius: 8,
                  boxShadow: `0 0 60px ${GOLD_P}88, inset 0 0 40px ${GOLD_P}33`,
                  background: `linear-gradient(180deg, rgba(74,63,160,0.18), rgba(12,10,8,0.6))`,
                }}>{PRESIDENT_NAME.toUpperCase()}</div>
              </div>
            )}

            <Vignette intensity={0.45} />
          </div>
        );
      }}
    </Sprite>
  );
}

// ── Final hierarchy: 99-110s ────────────────────────────────────────────
// Roles snap in beneath each name with stagger.
// Pulse at ~+1.5s. Bottom credit fades in at ~+2.5s. Hold to end.
function Scene_Final({ start = 99 }) {
  const dur = 11;
  const ROLES = [
    { name: PRESIDENT_NAME, role: 'President', gold: true },
    { name: 'Maham Tahir', role: 'Vice President', gold: false },
    { name: 'Ibrahim Arif Alvi', role: 'General Secretary', gold: false },
    { name: 'Hassaan Tayyab', role: 'Treasurer', gold: false },
    { name: 'Momina Imran', role: "Head of Women's Initiatives", gold: false },
  ];
  const presFinalY = 360;

  return (
    <Sprite start={start} end={start + dur}>
      {({ localTime }) => {
        const T = localTime;
        const roleDelays = [0.0, 0.25, 0.5, 0.75, 1.0];
        const pulseStart = 1.7;
        const pulseProg = clamp((T - pulseStart) / 1.0, 0, 1);
        const pulseOp = pulseProg > 0 && pulseProg < 1
          ? (pulseProg < 0.25 ? pulseProg / 0.25 : 1 - (pulseProg - 0.25) / 0.75) : 0;
        const bottomProg = clamp((T - 2.5) / 1.2, 0, 1);

        return (
          <div style={{ position: 'absolute', inset: 0 }}>
            <Vault intensity={0.5} showWatermark={false} />
            <VaultDrift />

            {/* Persistent connector lines */}
            {ACCEPTED.map((n, i) => {
              const target = rowPos(n);
              const dx = target.x - 960;
              const dy = target.y - presFinalY;
              const length = Math.sqrt(dx*dx + dy*dy);
              const angle = Math.atan2(dy, dx);
              return (
                <div key={i} style={{
                  position: 'absolute',
                  left: 960, top: presFinalY + 120,
                  width: length, height: 1.5,
                  background: `linear-gradient(90deg, ${GOLD_P}cc, ${GOLD_LP}aa 50%, ${GOLD_P}77)`,
                  transform: `rotate(${angle}rad)`,
                  transformOrigin: '0 50%',
                  opacity: 0.7,
                  boxShadow: `0 0 6px ${GOLD_P}88`,
                  pointerEvents: 'none',
                }} />
              );
            })}

            {/* President framed name */}
            <div style={{
              position: 'absolute',
              left: 960, top: presFinalY,
              transform: 'translate(-50%, -50%)',
            }}>
              <div style={{
                fontFamily: COMFORTAA,
                fontSize: 96,
                fontWeight: 700,
                color: '#fefcf6',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                textShadow: `0 0 30px ${GOLD_LP}, 0 0 80px ${GOLD_P}cc, 0 0 160px ${GOLD_P}77`,
                padding: '14px 32px',
                border: `2px solid ${GOLD_P}`,
                borderRadius: 8,
                boxShadow: `0 0 60px ${GOLD_P}88, inset 0 0 40px ${GOLD_P}33`,
                background: `linear-gradient(180deg, rgba(74,63,160,0.18), rgba(12,10,8,0.6))`,
              }}>{PRESIDENT_NAME.toUpperCase()}</div>
            </div>

            {/* President role */}
            {(() => {
              const p = clamp((T - roleDelays[0]) / 0.4, 0, 1);
              const sp = clamp(spring(Springs.settle)(p * 1.6), 0, 1.15);
              if (p <= 0) return null;
              return (
                <div style={{
                  position: 'absolute',
                  left: 960, top: presFinalY + 120,
                  transform: `translate(-50%, ${(1 - sp) * 12}px)`,
                  fontFamily: COMFORTAA,
                  fontSize: 22,
                  fontWeight: 700,
                  color: GOLD_LP,
                  letterSpacing: '0.5em',
                  textTransform: 'uppercase',
                  opacity: p,
                  textShadow: `0 0 14px ${GOLD_P}aa`,
                  willChange: 'transform, opacity',
                }}>President</div>
              );
            })()}

            {/* Row names + roles */}
            {ACCEPTED.map((name, i) => {
              const role = ROLES.find(r => r.name === name).role;
              const pos = rowPos(name);
              const p = clamp((T - roleDelays[i + 1]) / 0.4, 0, 1);
              const sp = clamp(spring(Springs.settle)(p * 1.6), 0, 1.15);
              return (
                <React.Fragment key={name}>
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
                  }}>{name}</div>
                  {p > 0 && (
                    <div style={{
                      position: 'absolute',
                      left: pos.x, top: pos.y + 36,
                      transform: `translate(-50%, ${(1 - sp) * 10}px)`,
                      fontFamily: COMFORTAA,
                      fontSize: 14,
                      fontWeight: 400,
                      color: '#cfc8b8',
                      letterSpacing: '0.32em',
                      textTransform: 'uppercase',
                      opacity: p * 0.9,
                      whiteSpace: 'nowrap',
                      willChange: 'transform, opacity',
                    }}>{role}</div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Final pulse */}
            {pulseOp > 0 && (
              <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(circle at center, ${GOLD_P}cc 0%, ${PURPLE_P}66 35%, transparent 80%)`,
                opacity: pulseOp,
                mixBlendMode: 'screen',
                pointerEvents: 'none',
                willChange: 'opacity',
              }} />
            )}

            {/* Bottom credit */}
            {bottomProg > 0 && (
              <div style={{
                position: 'absolute',
                left: '50%', bottom: 50,
                transform: `translate(-50%, ${(1 - Bezier.fadeIn(bottomProg)) * 14}px)`,
                fontFamily: COMFORTAA,
                fontSize: 16,
                fontWeight: 400,
                color: '#a89e88',
                letterSpacing: '0.45em',
                textTransform: 'uppercase',
                opacity: Bezier.fadeIn(bottomProg),
                whiteSpace: 'nowrap',
                willChange: 'transform, opacity',
              }}>Executive Council&nbsp;&nbsp;·&nbsp;&nbsp;LUMS Religious Society&nbsp;&nbsp;·&nbsp;&nbsp;2026 — 2027</div>
            )}

            <Vignette intensity={0.55} />
          </div>
        );
      }}
    </Sprite>
  );
}

// ── Row state holder: between reveals, accepted names persist at row position
// This is rendered as a separate layer in the video composition.
function PersistentRow({ revealIdx }) {
  // Render the names that have been revealed up through revealIdx (1..4).
  const order = ACCEPTED.slice(0, revealIdx);
  return (
    <Sprite start={0} end={9999}>
      {() => (
        <>
          {order.map(n => (
            <div key={n} style={{
              position: 'absolute',
              left: rowPos(n).x, top: rowPos(n).y,
              transform: 'translate(-50%, -50%)',
              fontFamily: COMFORTAA,
              fontSize: 38,
              fontWeight: 700,
              color: '#fefcf6',
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
              textShadow: `0 0 14px ${PURPLE_P}aa, 0 0 32px ${PURPLE_DP}88`,
            }}>{n}</div>
          ))}
        </>
      )}
    </Sprite>
  );
}

window.Scene_President = Scene_President;
window.Scene_Final = Scene_Final;
