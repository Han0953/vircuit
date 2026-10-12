# Marketing background system

Scope: `/`, `/fitur`, `/belajar`, `/jelajahi`, `/harga`. No new dependencies,
canvas, scroll listener or animation frame loop. Product copy and foreground
scenes retain their existing owners.

## Art direction

| Route | Composition | Deliberate contrast |
| --- | --- | --- |
| Home | Technical hero, quiet broken traces, dark learning story, board blueprint, workspace grid, violet Cirra network | Challenge and final CTA invert with theme |
| Fitur | Precision grid, stage-dependent geometry, diagnostic traces, assistant network | Dark hero/CTA; runtime section inverts |
| Belajar | Connected roadmap nodes, course cycle paths, educational blueprint | Learning cycle inverts; closing stays dark |
| Jelajahi | Modular gallery tiles, capstone framing, level-specific traces | Capstone inverts; closing stays dark |
| Harga | Paired plan spotlights, precise comparison grid, quiet FAQ lines | Comparison inverts; closing stays dark |

The composition takes hierarchy and contrast inspiration from
[Nick Ho Motorsports](https://nickho-motorsports.nl/), without reusing its assets
or assuming how its effects are implemented.

## Authoring

`components/marketing/backgrounds/background-scenes.ts` contains 37 authored
treatments. Add a typed scene, then place `SectionBackground` directly inside
the semantic section. `PageHero` and `CtaSection` expose an optional background
prop. Their default behavior remains available outside these five pages.

The direct-child relationship scopes semantic tokens through CSS `:has()`.
Only the decorative plane bleeds to viewport width. Section ancestors never
receive a new clipping or transform rule, so existing sticky scenes remain
intact. Page-hero layout selectors target `data-page-hero-content` specifically.

Base, pattern, accent atmosphere and SVG signals form the visual layers.
Patterns leave the central reading area quiet. Hardware materials in
`.component-art` remain separate from section UI colors.

## Theme and motion ownership

`--section-bg`, `--section-fg`, `--section-muted`, `--section-card`,
`--section-border`, `--section-accent`, `--section-pattern`, `--section-glow`
and `--section-ambient` drive local UI surfaces, text, controls and SVG colors.
Selected `inverse` sections use navy in Light and pale blue in Dark. Registered
color properties interpolate gradient illumination and pattern colors; scoped
280ms transitions also cover text, surfaces and borders. Existing next-themes
and the marketing theme toggle remain the source of theme state.

HomepageExperience and PublicMotion own decorative scroll timelines through
their existing GSAP contexts. Feature-story and learning-roadmap backgrounds
join their existing timelines instead of adding another story controller.
Board spotlight colors follow the existing active-board attribute; feature
motifs follow the existing stage, and gallery accents follow the filter.

Scroll drawing, node opacity, short drift and scanner translation are bounded,
reversible motions. There are no permanent background loops or will-change
hints. Mobile illumination stays static instead of compositing a tall moving
gradient; signal drawing remains active and scanner travel is reduced. The
shared compact navbar logo also fits every marketing route at 360px. Reduced
motion uses complete static paths and no drift; the same complete artwork is
rendered without JS. Stage/filter accent selectors match the specificity of
Dark theme defaults so their state changes work in both themes.

## Validation

See `tests/unit/marketing-backgrounds.test.ts` and
`tests/e2e/marketing-backgrounds.spec.ts`. Browser checks cover all authored
scenes, six viewport sizes, Light/Dark/System, inversion colors, semantic
contrast, overflow, reversible drawing, reduced motion and no-JS rendering.
Existing homepage/public-page suites cover foreground scenes, sticky behavior,
navigation and synthetic production performance.

Screenshots and reports are local ignored Playwright artifacts. Measurements
are local Windows Edge samples, not physical-device or production field data.

### Verified results — 2026-10-12

- `pnpm lint`, `pnpm typecheck`, `pnpm build`: PASS on the final implementation.
- `pnpm test`: 221 passed; 6 opt-in live AI tests skipped.
- Broad marketing Playwright checkpoint: 67/70 passed. The failures were a
  360px navbar overflow (two checks) and a mobile rAF budget sample of 33.5ms.
  Compact logo sizing now applies to every marketing route; mobile background
  illumination no longer drifts as a tall composited layer.
- Follow-up: 21/22 passed, including all five routes at 360/390/430/768/1280/
  1440px, Light/Dark/System, mid-page theme changes, foreground/muted semantic
  contrast, reduced motion, no JS, reverse scrubbing, hero fit, sticky controls
  and mobile/desktop 3D budgets. It exposed Dark-mode filter accent specificity.
- Final targeted rerun after that fix: 3/3 passed (gallery filter accents,
  feature stage illumination in both themes, existing card/story/control
  ownership and route cleanup). The full application E2E suite was not rerun.
- Synthetic cold-cache marketing samples at 4x CPU / 1.6Mbps / 40ms RTT:
  LCP 960–1,256ms and CLS 0 across the five routes at 390/1440px. These samples
  precede the final CSS specificity fix and are not field INP or Lighthouse
  scores. Long tasks were observed under throttling.
- Final warm-world forward/reverse scroll sample: rAF p95 16.9ms at both
  390px and 1440px; story 33 draw calls / 7,304 triangles. Deferred world
  payload remains 251,649 bytes gzip. No background WebGL was introduced.

Visual inspection covered all five desktop heroes and representative mobile,
inverted-theme sections. After screenshots are retained in
`playwright-report/backgrounds/` (ignored), including `background-home-360-light.png`
and `background-home-1440-inverted.png`. No fresh before screenshots were taken.
Reports: `marketing-backgrounds-checkpoint.json`,
`marketing-backgrounds-layout-themes.json` and `marketing-backgrounds-final.json`
under `playwright-report/`. Physical devices, Safari and production field
performance remain unverified. No deploy or commit was performed.
