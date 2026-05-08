// sequence-A.jsx — Cold Open + Title Slam + 12-Card Grid + first Vault interlude.

const POOL_NAMES = [
  'Aimen Malik',
  'Muhammad Ammar Faisal',
  'Mohammad Mujtaba Abdullah',
  'Ruqayya Siddiqui',
  'Ibrahim Arif Alvi',
  'Momina Imran',
  'Muhammad Ahmed Sameen',
  'Maham Tahir',
  'Hassaan Tayyab',
  'Muhammad Abdullah',
  'Moeez Asadallah Khan',
  'Amina Naeem',
];

// 4 columns x 3 rows on a 1920x1080 stage. Generous padding.
const GRID_COLS = 4, GRID_ROWS = 3;
const GRID_LEFT = 200, GRID_RIGHT = 200, GRID_TOP = 220, GRID_BOTTOM = 200;
const CARD_W = 360, CARD_H = 70;
const GRID_X_STEP = (1920 - GRID_LEFT - GRID_RIGHT - CARD_W) / (GRID_COLS - 1);
const GRID_Y_STEP = (1080 - GRID_TOP - GRID_BOTTOM - CARD_H) / (GRID_ROWS - 1);
function gridPos(i) {
  const col = i % GRID_COLS;
  const row = Math.floor(i / GRID_COLS);
  return {
    x: GRID_LEFT + CARD_W / 2 + col * GRID_X_STEP,
    y: GRID_TOP + CARD_H / 2 + row * GRID_Y_STEP,
  };
}

// ── Cold Open: 0-12s ───────────────────────────────────────────────────
// 0-1s: black
// 1-4s: galaxy birth (canvas particles spawning from center)
// 3-7s: "LUMS Religious Society" letter-by-letter reveal (gold, large, Comfortaa)
// 7-7.6s: gold underline draws
// 7.6-10.6s: hold (3 full seconds)
// 10.6-11.5s: shockwave + scatter
// 11.5-12s: blackout
function Scene_ColdOpen({ start = 0 }) {
  const dur = 12;
  return (
    <Sprite start={start} end={start + dur}>
      {({ localTime }) => {
        const galaxyT = localTime - 1;
        const galaxyAlive = galaxyT > 0 && galaxyT < 7;
        // Galaxy emitter: spawns purple particles drifting outward from center.
        // Drives via continuous bus emitter we register here.

        const shockProg = clamp((localTime - 10.6) / 0.9, 0, 1);
        const blackoutOp = localTime > 11.4 ? clamp((localTime - 11.4) / 0.6, 0, 1) : 0;

        return (
          <div style={{ position: 'absolute', inset: 0, background: NEAR_BLACK_P }}>
            {/* Background glow once particles begin */}
            {galaxyAlive && (
              <RadialGlow
                x={960} y={540}
                radius={Math.min(900, 200 + galaxyT * 130)}
                color={PURPLE_P}
                intensity={0.5 * Math.min(1, galaxyT / 1.2)}
              />
            )}

            <ColdOpenEmitter localTime={localTime} />

            {/* Title */}
            <div style={{
              position: 'absolute',
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              willChange: 'transform, opacity',
            }}>
              <StaggeredText
                text="LUMS RELIGIOUS SOCIETY"
                size={64}
                weight={700}
                color={GOLD_P}
                letterSpacing="0.2em"
                stagger={0.04}
                startAt={3.0}
                fadeOutAt={localTime > 10.6 ? 10.6 : null}
                fadeOutDur={0.4}
                textShadow={`0 0 30px ${GOLD_P}aa, 0 0 80px ${GOLD_P}55`}
              />
              <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
                <DrawnUnderline
                  width={620}
                  height={2}
                  color={GOLD_P}
                  startAt={6.6}
                  dur={0.6}
                  fadeOutAt={localTime > 10.6 ? 10.6 : null}
                  fadeOutDur={0.4}
                />
              </div>
            </div>

            {/* Shockwave */}
            <Shockwave x={960} y={540} progress={shockProg}
                       color="#ffffff" maxRadius={2000} thickness={10} />
            <Shockwave x={960} y={540}
                       progress={Math.max(0, shockProg - 0.12)}
                       color={PURPLE_LP} maxRadius={2400} thickness={5} />

            {/* Blackout */}
            <div style={{
              position: 'absolute', inset: 0,
              background: '#000',
              opacity: blackoutOp,
              pointerEvents: 'none',
              willChange: 'opacity',
            }} />

            <Vignette intensity={0.45} />
          </div>
        );
      }}
    </Sprite>
  );
}

// Continuous emitter for cold-open galaxy birth — outward-drifting purple+gold.
// Mounts/unmounts based on the local time window inside the cold open.
function ColdOpenEmitter({ localTime }) {
  const idRef = React.useRef(null);
  const lastTRef = React.useRef(0);
  const stateRef = React.useRef({ active: false });

  // Decide active window: 1.0 -> 7.0, then a brief burst at shock (10.6)
  const wantActive = (localTime > 1.0 && localTime < 7.2);

  React.useEffect(() => {
    if (wantActive && idRef.current == null) {
      idRef.current = ParticleBus.registerContinuous((time, dt, bus) => {
        // Center-of-stage spawn. Build up to ~120 active particles.
        const alive = bus.particles.filter(p => p._galaxy).length;
        if (alive < 130 && Math.random() < dt * 80) {
          const ang = Math.random() * Math.PI * 2;
          const speed = 30 + Math.random() * 90;
          const isGold = Math.random() < 0.07;
          bus.add({
            x: 960 + Math.cos(ang) * 8,
            y: 540 + Math.sin(ang) * 8,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed * 0.78,
            size: 1.5 + Math.random() * 3,
            color: isGold ? GOLD_LP : PURPLE_LP,
            life: 2.5 + Math.random() * 2,
            maxLife: 4,
            layer: Math.random() < 0.4 ? 'fg' : 'bg',
            drag: 0.992,
            _galaxy: true,
          });
        }
      });
    }
    if (!wantActive && idRef.current != null) {
      ParticleBus.unregister(idRef.current);
      idRef.current = null;
    }
    return () => {
      if (idRef.current != null) {
        ParticleBus.unregister(idRef.current);
        idRef.current = null;
      }
    };
  }, [wantActive]);

  // Trigger shockwave radial burst once at ~10.6
  const shockFiredRef = React.useRef(false);
  React.useEffect(() => {
    if (localTime > 10.55 && localTime < 10.85 && !shockFiredRef.current) {
      shockFiredRef.current = true;
      radialBurst(960, 540, { count: 220, colors: [PURPLE_LP, PURPLE_P, GOLD_P] });
    }
    if (localTime < 10.4) shockFiredRef.current = false;
  }, [localTime > 10.55]);

  return null;
}

// ── Title Slam: 12-19s ──────────────────────────────────────────────────
// "EXECUTIVE COUNCIL" slams in with line-of-light expand, shake on impact.
function Scene_TitleSlam({ start = 12 }) {
  const dur = 7;
  return (
    <Sprite start={start} end={start + dur}>
      {({ localTime }) => {
        const lineProg = clamp(localTime / 0.5, 0, 1);
        const slamProg = clamp((localTime - 0.4) / 0.4, 0, 1);
        const titleVisible = localTime > 0.4 && localTime < 6.0;
        const shake = localTime > 0.5 && localTime < 1.0
          ? Math.sin(localTime * 80) * (1 - (localTime - 0.5) / 0.5) * 6 : 0;
        const implodeT = clamp((localTime - 5.4) / 1.0, 0, 1);
        const implodeScale = 1 - Bezier.exit(implodeT) * 1;
        const explosionProg = clamp((localTime - 6.2) / 0.6, 0, 1);
        const flashOp = explosionProg > 0 && explosionProg < 1
          ? (explosionProg < 0.2 ? explosionProg / 0.2 : 1 - (explosionProg - 0.2) / 0.8) : 0;

        const titleScale = (localTime < 0.85
          ? 0.85 + Bezier.dramaticEntrance(slamProg) * 0.15
          : 1) * (localTime > 5.4 ? implodeScale : 1);

        return (
          <div style={{ position: 'absolute', inset: 0, background: NEAR_BLACK_P }}>
            {localTime < 0.6 && (
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                width: lineProg * 1900, height: 2 + (1 - lineProg) * 4,
                background: '#fff',
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 40px #fff, 0 0 80px ${PURPLE_LP}`,
                willChange: 'transform, opacity',
              }} />
            )}
            {titleVisible && (
              <RadialGlow x={960} y={540} radius={750} color={PURPLE_P}
                          intensity={0.55 * (localTime > 5.4 ? implodeScale : 1)} />
            )}
            {titleVisible && (
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: `translate(calc(-50% + ${shake}px), calc(-50% + ${shake * 0.4}px)) scale(${titleScale})`,
                textAlign: 'center',
                filter: `blur(${(1 - slamProg) * 6}px)`,
                opacity: localTime > 5.4 && localTime < 5.5 ? 1 : (localTime > 6.0 ? 0 : 1),
                willChange: 'transform, opacity, filter',
              }}>
                <div style={{
                  fontFamily: COMFORTAA, fontSize: 22, fontWeight: 400,
                  color: '#e8e2d0', letterSpacing: '0.55em',
                  textTransform: 'uppercase', marginBottom: 28, opacity: 0.85,
                }}>The New</div>
                <div style={{
                  fontFamily: COMFORTAA, fontSize: 134, fontWeight: 700,
                  color: '#fefcf6', letterSpacing: '0.04em', lineHeight: 0.92,
                  textShadow: `0 0 60px ${PURPLE_LP}aa, 0 0 120px ${PURPLE_P}88, 0 4px 0 rgba(0,0,0,0.8)`,
                  whiteSpace: 'nowrap',
                }}>EXECUTIVE COUNCIL</div>
                <div style={{
                  fontFamily: COMFORTAA, fontSize: 56, fontWeight: 700,
                  color: GOLD_P, letterSpacing: '0.18em', marginTop: 24,
                  textShadow: `0 0 30px ${GOLD_P}88`,
                }}>2026 — 2027</div>
              </div>
            )}
            {/* implosion light */}
            {localTime > 5.6 && localTime < 6.4 && (
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                width: 24, height: 24,
                marginLeft: -12, marginTop: -12,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: `0 0 80px 30px #fff, 0 0 200px 80px ${PURPLE_LP}`,
                transform: `scale(${1 + (localTime - 5.6) * 8})`,
                willChange: 'transform',
              }} />
            )}
            <div style={{
              position: 'absolute', inset: 0,
              background: '#fff',
              opacity: flashOp,
              pointerEvents: 'none',
              willChange: 'opacity',
            }} />
            <Vignette intensity={0.5} />
          </div>
        );
      }}
    </Sprite>
  );
}

window.POOL_NAMES = POOL_NAMES;
window.gridPos = gridPos;
window.Scene_ColdOpen = Scene_ColdOpen;
window.Scene_TitleSlam = Scene_TitleSlam;
