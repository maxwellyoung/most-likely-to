import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from 'remotion';

// ============================================================================
// GAMBIT DESIGN SYSTEM
// Party chaos energy - bold, playful, high contrast
// ============================================================================
const COLORS = {
  // Dark mode (primary)
  background: '#0A0A0B',
  foreground: '#FFFFFF',
  muted: '#71717A',

  // Indigo accent system
  accent: '#6366F1',
  accentLight: '#818CF8',
  accentDark: '#4F46E5',

  // Category colors
  drinking: '#22C55E',
  action: '#F97316',
  social: '#3B82F6',
  dare: '#EC4899',

  // UI
  card: 'rgba(24, 24, 27, 0.95)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
};

const springPresets = {
  responsive: { mass: 0.8, stiffness: 400, damping: 28 },
  gentle: { mass: 1.0, stiffness: 200, damping: 24 },
  silk: { mass: 0.9, stiffness: 280, damping: 26 },
  bouncy: { mass: 0.6, stiffness: 300, damping: 12 },
  heavy: { mass: 1.2, stiffness: 180, damping: 30 },
};

// ============================================================================
// COMPONENTS
// ============================================================================

// Animated gradient blobs - chaotic energy
const ChaoticBackground = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {/* Primary indigo blob - moves erratically */}
      <div
        style={{
          position: 'absolute',
          width: '140%',
          height: '50%',
          top: '-10%',
          left: '-20%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.25) 0%, transparent 60%)',
          filter: 'blur(80px)',
          transform: `translate(${Math.sin(frame * 0.02) * 60}px, ${Math.cos(frame * 0.015) * 40}px) rotate(${frame * 0.1}deg)`,
        }}
      />
      {/* Pink chaos blob */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '40%',
          bottom: '10%',
          right: '-30%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.2) 0%, transparent 60%)',
          filter: 'blur(80px)',
          transform: `translate(${Math.cos(frame * 0.018) * 50}px, ${Math.sin(frame * 0.012) * 30}px)`,
        }}
      />
      {/* Orange energy blob */}
      <div
        style={{
          position: 'absolute',
          width: '80%',
          height: '35%',
          top: '40%',
          left: '-10%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.15) 0%, transparent 60%)',
          filter: 'blur(80px)',
          transform: `translate(${Math.sin(frame * 0.025) * 40}px, ${Math.cos(frame * 0.02) * 35}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Subtle noise for texture
const NoiseOverlay = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      opacity: 0.03,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '128px 128px',
      pointerEvents: 'none',
    }}
  />
);

// Player avatar - bouncy entrance
const PlayerAvatar = ({
  emoji,
  name,
  delay,
}: {
  emoji: string;
  name: string;
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: springPresets.bouncy,
  });

  const opacity = interpolate(frame - delay, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: COLORS.card,
          border: `2px solid ${COLORS.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {emoji}
      </div>
      <span
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: COLORS.foreground,
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}
      >
        {name}
      </span>
    </div>
  );
};

// Full-width prompt card for vertical layout
const PromptCard = ({
  text,
  category,
  delay,
}: {
  text: string;
  category: 'drinking' | 'action' | 'social' | 'dare';
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: springPresets.silk,
  });

  const opacity = interpolate(frame - delay, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const translateY = interpolate(frame - delay, [0, 20], [60, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const categoryColor = COLORS[category];
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div
      style={{
        width: width - 80,
        padding: 32,
        borderRadius: 28,
        backgroundColor: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity,
      }}
    >
      {/* Category badge */}
      <div
        style={{
          marginBottom: 20,
          padding: '8px 16px',
          borderRadius: 10,
          backgroundColor: `${categoryColor}20`,
          display: 'inline-block',
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: categoryColor,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          {categoryLabel}
        </span>
      </div>
      {/* Prompt text */}
      <p
        style={{
          margin: 0,
          fontSize: 32,
          fontWeight: 500,
          color: COLORS.foreground,
          lineHeight: 1.35,
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}
      >
        {text}
      </p>
    </div>
  );
};

// Chaos meter - horizontal bar filling up
const ChaosMeter = ({ delay }: { delay: number }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: springPresets.heavy,
  });

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const fillProgress = interpolate(frame - delay, [20, 80], [0.15, 0.9], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  return (
    <div
      style={{
        width: width - 120,
        transform: `scale(${scale})`,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: COLORS.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          Chaos Level
        </span>
        <span
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: COLORS.foreground,
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          {Math.round(fillProgress * 100)}%
        </span>
      </div>

      {/* Bar */}
      <div
        style={{
          width: '100%',
          height: 16,
          borderRadius: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${fillProgress * 100}%`,
            height: '100%',
            borderRadius: 8,
            background: `linear-gradient(90deg, ${COLORS.accentLight}, ${COLORS.accent}, ${COLORS.dare})`,
          }}
        />
      </div>

      {/* Range labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 16, color: COLORS.muted, fontFamily: 'Inter, -apple-system, sans-serif' }}>
          Chill
        </span>
        <span style={{ fontSize: 16, color: COLORS.dare, fontFamily: 'Inter, -apple-system, sans-serif' }}>
          Total Chaos
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPOSITION - Vertical Layout (1080x1920)
// ============================================================================
export const GambitPromo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const globalOpacity = interpolate(
    frame,
    [0, 15, durationInFrames - 20, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      <ChaoticBackground />
      <NoiseOverlay />

      <AbsoluteFill style={{ opacity: globalOpacity }}>
        {/* ================================================================
            SEQUENCE 1: Opening - Logo & Tagline (0-100 frames)
        ================================================================ */}
        <Sequence from={0} durationInFrames={100}>
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              padding: 40,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 32,
                opacity: interpolate(frame, [0, 25, 70, 100], [0, 1, 1, 0]),
                transform: `translateY(${interpolate(frame, [0, 25], [40, 0], {
                  extrapolateRight: 'clamp',
                })}px)`,
              }}
            >
              {/* App Icon */}
              <div
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 40,
                  background: `linear-gradient(135deg, ${COLORS.accentLight}, ${COLORS.accent})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 32px 80px rgba(99, 102, 241, 0.5)',
                }}
              >
                <span style={{ fontSize: 80 }}>🎲</span>
              </div>

              {/* App Name */}
              <h1
                style={{
                  margin: 0,
                  fontSize: 88,
                  fontWeight: 700,
                  color: COLORS.foreground,
                  letterSpacing: '-0.03em',
                }}
              >
                Gambit
              </h1>

              {/* Tagline */}
              <p
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight: 500,
                  color: COLORS.muted,
                  textAlign: 'center',
                  maxWidth: 500,
                }}
              >
                Social chaos in your pocket
              </p>
            </div>
          </AbsoluteFill>
        </Sequence>

        {/* ================================================================
            SEQUENCE 2: Add Players (100-250 frames)
        ================================================================ */}
        <Sequence from={100} durationInFrames={150}>
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              padding: 40,
            }}
          >
            {/* Title */}
            <div
              style={{
                position: 'absolute',
                top: 280,
                opacity: interpolate(frame - 100, [0, 20, 120, 150], [0, 1, 1, 0]),
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 44,
                  fontWeight: 600,
                  color: COLORS.foreground,
                  textAlign: 'center',
                }}
              >
                Add your crew
              </h2>
            </div>

            {/* Player grid - 2x3 for vertical */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 32,
                marginTop: 80,
                opacity: interpolate(frame - 100, [120, 150], [1, 0]),
              }}
            >
              <PlayerAvatar emoji="😎" name="Max" delay={115} />
              <PlayerAvatar emoji="🤪" name="Sarah" delay={125} />
              <PlayerAvatar emoji="🔥" name="Jake" delay={135} />
              <PlayerAvatar emoji="💀" name="Emma" delay={145} />
              <PlayerAvatar emoji="🎉" name="Chris" delay={155} />
              <PlayerAvatar emoji="✨" name="Mia" delay={165} />
            </div>
          </AbsoluteFill>
        </Sequence>

        {/* ================================================================
            SEQUENCE 3: Prompt Cards (250-500 frames)
        ================================================================ */}
        <Sequence from={250} durationInFrames={250}>
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              padding: 40,
            }}
          >
            {/* Title */}
            <div
              style={{
                position: 'absolute',
                top: 240,
                opacity: interpolate(frame - 250, [0, 20], [0, 1]),
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 44,
                  fontWeight: 600,
                  color: COLORS.foreground,
                  textAlign: 'center',
                }}
              >
                Swipe through chaos
              </h2>
            </div>

            {/* Stacked cards */}
            <div style={{ position: 'relative', marginTop: 120 }}>
              {/* Card 1 - exits */}
              <div
                style={{
                  opacity: interpolate(frame - 250, [100, 130], [1, 0]),
                  transform: `translateX(${interpolate(frame - 250, [100, 130], [0, width], {
                    extrapolateRight: 'clamp',
                    extrapolateLeft: 'clamp',
                  })}px)`,
                }}
              >
                <PromptCard
                  text="Max, do your best impression of Sarah for 30 seconds 🎭"
                  category="action"
                  delay={270}
                />
              </div>

              {/* Card 2 - appears after card 1 exits */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  opacity: interpolate(frame - 250, [130, 145, 200, 230], [0, 1, 1, 0]),
                  transform: `translateX(${interpolate(frame - 250, [200, 230], [0, width], {
                    extrapolateRight: 'clamp',
                    extrapolateLeft: 'clamp',
                  })}px)`,
                }}
              >
                <PromptCard
                  text="Everyone take a sip if you've ever ghosted someone 👻"
                  category="drinking"
                  delay={380}
                />
              </div>
            </div>

            {/* Swipe hint */}
            <div
              style={{
                position: 'absolute',
                bottom: 320,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: interpolate(frame - 250, [40, 60, 200, 250], [0, 0.7, 0.7, 0]),
              }}
            >
              <span style={{ fontSize: 28 }}>👈</span>
              <span style={{ fontSize: 18, color: COLORS.muted }}>Swipe to continue</span>
              <span style={{ fontSize: 28 }}>👉</span>
            </div>
          </AbsoluteFill>
        </Sequence>

        {/* ================================================================
            SEQUENCE 4: Chaos Level (500-680 frames)
        ================================================================ */}
        <Sequence from={500} durationInFrames={180}>
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              padding: 40,
            }}
          >
            {/* Title */}
            <div
              style={{
                position: 'absolute',
                top: 380,
                opacity: interpolate(frame - 500, [0, 20, 150, 180], [0, 1, 1, 0]),
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 44,
                  fontWeight: 600,
                  color: COLORS.foreground,
                  textAlign: 'center',
                }}
              >
                Set your intensity
              </h2>
            </div>

            <div
              style={{
                marginTop: 100,
                opacity: interpolate(frame - 500, [150, 180], [1, 0]),
              }}
            >
              <ChaosMeter delay={520} />
            </div>
          </AbsoluteFill>
        </Sequence>

        {/* ================================================================
            SEQUENCE 5: Closing CTA (680-900 frames)
        ================================================================ */}
        <Sequence from={680} durationInFrames={220}>
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              padding: 60,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 40,
                opacity: interpolate(frame - 680, [0, 30], [0, 1]),
                transform: `translateY(${interpolate(frame - 680, [0, 30], [40, 0], {
                  extrapolateRight: 'clamp',
                })}px)`,
              }}
            >
              {/* Value prop */}
              <h2
                style={{
                  margin: 0,
                  fontSize: 52,
                  fontWeight: 600,
                  color: COLORS.foreground,
                  textAlign: 'center',
                  lineHeight: 1.2,
                  maxWidth: 800,
                }}
              >
                Turn any gathering into
                <br />
                <span
                  style={{
                    background: `linear-gradient(90deg, ${COLORS.accentLight}, ${COLORS.accent}, ${COLORS.dare})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  unforgettable chaos
                </span>
              </h2>

              {/* Features */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  opacity: interpolate(frame - 680, [40, 60], [0, 1]),
                }}
              >
                <span style={{ fontSize: 20, color: COLORS.muted }}>480+ prompts</span>
                <span style={{ fontSize: 20, color: COLORS.muted }}>Multiple game modes</span>
                <span style={{ fontSize: 20, color: COLORS.muted }}>Free to play</span>
              </div>

              {/* CTA Button */}
              <div
                style={{
                  marginTop: 20,
                  padding: '24px 64px',
                  borderRadius: 20,
                  background: `linear-gradient(135deg, ${COLORS.accentLight}, ${COLORS.accent})`,
                  boxShadow: '0 16px 48px rgba(99, 102, 241, 0.5)',
                  transform: `scale(${spring({
                    frame: frame - 750,
                    fps,
                    config: springPresets.bouncy,
                  })})`,
                }}
              >
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: '#fff',
                  }}
                >
                  Download Free
                </span>
              </div>

              {/* Platform hint */}
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  color: COLORS.muted,
                  opacity: interpolate(frame - 680, [80, 100], [0, 1]),
                }}
              >
                Available on iOS & Android
              </p>
            </div>
          </AbsoluteFill>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
