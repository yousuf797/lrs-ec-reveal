// video.jsx — root composition for the LRS EC 2026–2027 announcement.

// ── Timeline ────────────────────────────────────────────────────────────
//  0  - 12   Cold open (galaxy birth + LUMS title + shockwave)
// 12  - 19   Title slam (THE NEW EXECUTIVE COUNCIL 2026—2027)
// 19  - 29   12-card grid (4×3 staggered, 5s hold, equal fade)
// 29  - 31   Vault interlude
// 31  - 39.5 Reveal 1 — Maham Tahir
// 39.5- 42   Vault interlude
// 42  - 50.5 Reveal 2 — Ibrahim Arif Alvi
// 50.5- 53   Vault interlude
// 53  - 61.5 Reveal 3 — Hassaan Tayyab
// 61.5- 64   Vault interlude
// 64  - 72.5 Reveal 4 — Momina Imran
// 72.5- 76.5 Row pulse + extended Vault
// 76.5- 83   "And the President?" Vault
// 83  - 99   President sequence (extended prelude + detonation + lock + connectors)
// 99  -110   Final hierarchy + roles + footer
const TOTAL_DURATION = 110;

const REVEAL_STARTS = {
  'Maham Tahir':       31.0,
  'Ibrahim Arif Alvi': 42.0,
  'Hassaan Tayyab':    53.0,
  'Momina Imran':      64.0,
};
const REVEAL_END = (s) => s + 8.5;

// Persistent pinned name layer — starts at glide-end of its reveal and runs to TOTAL.
function PinnedRowSprite({ name }) {
  const start = REVEAL_END(REVEAL_STARTS[name]);
  // The President scene draws its own pinned row (we hide the global ones during it).
  return (
    <Sprite start={start} end={83}>
      {() => <PinnedRowName name={name} fadeInAt={0} />}
    </Sprite>
  );
}

// Brief row-pulse moment after Reveal 4 finishes (72.5 -> 76.5).
function RowPulseScene({ start = 72.5, dur = 4 }) {
  return (
    <Sprite start={start} end={start + dur}>
      {({ localTime }) => {
        const T = localTime;
        const pulseT = clamp((T - 0.6) / 1.4, 0, 1);
        const pulseOp = pulseT > 0 && pulseT < 1
          ? (pulseT < 0.3 ? pulseT / 0.3 : 1 - (pulseT - 0.3) / 0.7) * 0.55
          : 0;
        return (
          <div style={{ position: 'absolute', inset: 0 }}>
            <Vault intensity={0.8} />
            <VaultDrift />
            {ACCEPTED.map(n => <PinnedRowName key={n} name={n} fadeInAt={0} />)}
            {pulseOp > 0 && (
              <div style={{
                position: 'absolute',
                left: 0, right: 0, top: ROW_Y_BAND_TOP, height: ROW_Y_BAND_H,
                background: `radial-gradient(ellipse at center, ${PURPLE_LP}cc 0%, ${PURPLE_P}66 40%, transparent 80%)`,
                opacity: pulseOp,
                mixBlendMode: 'screen',
                pointerEvents: 'none',
                willChange: 'opacity',
              }} />
            )}
            <Vignette intensity={0.55} />
          </div>
        );
      }}
    </Sprite>
  );
}

const ROW_Y_BAND_TOP = 860;
const ROW_Y_BAND_H = 120;

function Video() {
  const t = useTime();
  const sec = Math.floor(t);
  return (
    <div data-screen-label={`t=${sec}s`} style={{ position: 'absolute', inset: 0 }}>
      {/* Always-on canvas particle layer behind everything but above background.
          Each scene puts its own backdrop down first, so place this above. */}
      <ParticleCanvas width={1920} height={1080} />

      <Scene_ColdOpen   start={0}  />
      <Scene_TitleSlam  start={12} />
      <Scene_Grid       start={19} />

      {/* Vault interludes between reveals */}
      <Scene_VaultPause start={29}   dur={2} />
      <Scene_Reveal     start={31}   name="Maham Tahir"       fromDir="top"    accent="purple" />
      <Scene_VaultPause start={39.5} dur={2.5} />
      <Scene_Reveal     start={42}   name="Ibrahim Arif Alvi" fromDir="left"   accent="purple-gold" />
      <Scene_VaultPause start={50.5} dur={2.5} />
      <Scene_Reveal     start={53}   name="Hassaan Tayyab"    fromDir="right"  accent="purple" />
      <Scene_VaultPause start={61.5} dur={2.5} />
      <Scene_Reveal     start={64}   name="Momina Imran"      fromDir="bottom" accent="gold" />

      {/* Persistent row of accepted names (each fades in once its reveal glides home). */}
      <PinnedRowSprite name="Maham Tahir" />
      <PinnedRowSprite name="Ibrahim Arif Alvi" />
      <PinnedRowSprite name="Hassaan Tayyab" />
      <PinnedRowSprite name="Momina Imran" />

      <RowPulseScene    start={72.5} dur={4} />
      <Scene_VaultPause start={76.5} dur={6.5}
                        text={'And the President?'}
                        textStartAt={1.5}
                        textFadeAt={5.0} />

      <Scene_President  start={83} />
      <Scene_Final      start={99} />
    </div>
  );
}

function App() {
  return (
    <Stage
      width={1920}
      height={1080}
      duration={TOTAL_DURATION}
      background={NEAR_BLACK_P}
      persistKey="lrs-ec-2026-27-v2"
    >
      <Video />
    </Stage>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
