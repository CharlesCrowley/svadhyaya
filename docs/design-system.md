# Advaita Vidya Svadhyaya design system

## Visual thesis

A quiet morning-practice space inspired by parchment, temple lamp light and Advaita Vidya's saffron identity: devotional without ornament overload, modern without becoming a generic wellness app.

## Brand source

The official Advaita Vidya website currently uses these prominent colours:

| Existing role | Source colour |
|---|---|
| Saffron/orange | `#ED8B02` |
| Red | `#B62025` |
| Deep link maroon | `#72080A` |
| Earth brown | `#94553D` |
| Warm off-white | `#F8F5F4` |
| Body grey | `#4B4F58` |

The site also uses Prata and traditional serif faces. The Svadhyaya app retains the saffron, maroon, warm neutral ground and serif character while improving contrast, spacing and mobile legibility.

## Version 0.1 palette

```css
:root {
  --colour-canvas: #f7f1e7;
  --colour-surface: #fffaf2;
  --colour-surface-strong: #f0e3d2;
  --colour-ink: #281a18;
  --colour-ink-muted: #74625d;
  --colour-maroon: #72080a;
  --colour-maroon-pressed: #570507;
  --colour-saffron: #ed8b02;
  --colour-saffron-soft: #f7d49f;
  --colour-earth: #94553d;
  --colour-divider: #dfd0be;
  --colour-success: #536b4c;
  --colour-danger: #a43a35;
}
```

### Usage

- `canvas`: the main background.
- `surface`: the audio player and timer working surfaces.
- `ink`: all primary text.
- `maroon`: primary controls, selected navigation and progress.
- `saffron`: the single luminous accent—play state, timer ring and today's completion.
- `earth`: secondary illustration or metadata only.
- `success`: completed practice, kept muted so it does not compete with saffron.

Do not use saffron for large text on pale backgrounds; it lacks sufficient contrast. Use it for filled controls, graphical progress and small non-text accents, with dark ink where text appears on top.

## Typography

- **Display and section titles:** `Newsreader`, a contemporary, readable serif with a devotional/editorial character.
- **Interface and body:** `Manrope`, for compact mobile controls, timestamps and habit status.
- **Sanskrit transliteration:** Newsreader with generous line-height; do not force uppercase.

Use locally bundled or privacy-respecting hosted font files in production. Until then, fall back to Georgia for display and the system sans-serif stack for interface text.

## Composition

The app opens directly into the practice workspace—no marketing hero and no dashboard mosaic.

### Today screen

1. Compact Advaita Vidya mark and local date.
2. One dominant **Continue svadhyaya** player surface.
3. The five chants as an unboxed numbered sequence with fine dividers.
4. One meditation action with the current preset.
5. Two quiet completion rows for svadhyaya and meditation.
6. Bottom navigation: Today, Practice, History.

The player and timer may use bounded surfaces because they are the primary interactions. Habit history should remain an open list/calendar rather than a grid of cards.

## Shape and spacing

- Mobile side margin: 20 px.
- Main vertical rhythm: 24 or 32 px.
- Compact row gap: 12 px.
- Primary control minimum height: 52 px.
- Corner radius: 18 px for working surfaces; fully circular only for the play button and timer control.
- Dividers: one-pixel warm neutral.
- Shadows: minimal; prefer tonal separation. If needed, use `0 8px 30px rgba(65, 27, 20, 0.08)` only on the active player.

## Logo treatment

Use the official orange Advaita Vidya mark on a plain warm ground. In the compact app header, prefer the symbol portion where an approved symbol-only asset exists. Do not redraw or generically imitate the mark. Obtain the organisation's approved original asset before public release.

## Interaction thesis

- The active chant transitions into view with a short 180 ms fade-and-rise.
- Play/pause uses restrained scale and haptic feedback, with no pulsing animation during chanting.
- The meditation timer ring advances continuously; completion resolves into one warm saffron glow, then becomes still.
- Respect `prefers-reduced-motion` and Telegram's device-performance guidance.

## Dark appearance

Version 0.1 should follow one carefully designed light appearance rather than automatically inheriting Telegram dark mode with untested colours. A later dark palette should use charcoal-brown surfaces and muted amber, not pure black and neon orange.

## Avoid

- Generic purple meditation gradients
- Lotus stock icons and decorative mandala wallpaper
- White cards for every row
- Gamified flames, trophies or competitive streak language
- Excessive Sanskrit ornament used without semantic meaning
- Bright red and orange competing in the same view
- Thin saffron text on cream

## Primary device

Design and acceptance testing target the Samsung Galaxy A52s first. Verify at its common CSS viewport sizes with Android font scaling at 100% and 120%, then test Telegram desktop as a secondary surface.

## Website security observation

During review on 13 August 2026, the official site's rendered footer contained unrelated multilingual casino links. This appears consistent with injected SEO spam and should be investigated by the website administrator. The app must not embed or copy current site HTML, scripts or WordPress assets at runtime.
