# Gambit Promo Videos

Remotion-based video production for Gambit (Social Chaos).

## Quick Start

```bash
# Install dependencies
npm install

# Preview in browser (live reload)
npm run preview

# Render 9:16 vertical video (App Store / social)
npm run render:appstore

# Render default MP4
npm run render
```

## Video Structure

**Duration:** 30 seconds (900 frames @ 30fps)

| Sequence | Frames | Duration | Content |
|----------|--------|----------|---------|
| Opening | 0-120 | 4s | Logo + "Social chaos in your pocket" |
| Players | 120-300 | 6s | Avatar circle animation |
| Prompts | 300-540 | 8s | Card swipe demonstration |
| Chaos Level | 540-720 | 6s | Intensity meter filling |
| Closing | 720-900 | 6s | CTA + value prop |

## Colors

From Gambit design system:
- Background: `#1D1D1F`
- Foreground: `#F5F5F7`
- Accent: `#6366F1` (indigo)
- Accent gradient: `#818CF8` → `#6366F1`

## Springs

Using Maxwell's Studio canonical presets:
- `silk` - Default for card reveals, UI transitions
- `bouncy` - Player avatars, CTA button
- `heavy` - Chaos meter entrance

## Customization

Edit `src/GambitPromo.tsx` to:
- Change prompts text
- Adjust timing (frame numbers)
- Modify player names/emojis
- Update CTA text

## Output

Videos render to `out/` directory:
- `gambit-promo.mp4` - Default resolution
- `gambit-appstore.mp4` - 1080x1920 (9:16 vertical)

## Reference

See `/.studio/video/README.md` for the shared video production system and patterns.
