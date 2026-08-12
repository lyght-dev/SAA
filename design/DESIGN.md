<design-context>
---
version: alpha
name: ElevenLabs-design-analysis
description: A quietly editorial study product on an off-white canvas (`#f5f5f5`) with warm near-black ink (`#292524`). Soft pastel atmospheric gradient orbs (mint → peach → lavender → sky) provide the only color moments. Display uses Bookk Myungjo at weight 400; Bookk Gothic carries body, navigation, captions. CTAs are subtle: a near-black ink pill is the primary, a transparent outline is the secondary.

colors:
  primary: "#292524"
  primary-active: "#0c0a09"
  ink: "#0c0a09"
  body: "#4e4e4e"
  body-strong: "#292524"
  muted: "#777169"
  muted-soft: "#a8a29e"
  hairline: "#e7e5e4"
  hairline-soft: "#f0efed"
  hairline-strong: "#d6d3d1"
  canvas: "#f5f5f5"
  canvas-soft: "#fafafa"
  canvas-deep: "#0c0a09"
  surface-card: "#ffffff"
  surface-strong: "#f0efed"
  surface-dark: "#0c0a09"
  surface-dark-elevated: "#1c1917"
  on-primary: "#ffffff"
  on-dark: "#ffffff"
  on-dark-soft: "#a8a29e"
  gradient-mint: "#a7e5d3"
  gradient-peach: "#f4c5a8"
  gradient-lavender: "#c8b8e0"
  gradient-sky: "#a8c8e8"
  gradient-rose: "#e8b8c4"
  semantic-error: "#dc2626"
  semantic-success: "#16a34a"

typography:
  display-mega:
    fontFamily: "'BookkMyungjo', 'Batang', 'Times New Roman', serif"
    fontSize: 64px
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: -1.92px
  display-xl:
    fontFamily: "'BookkMyungjo', 'Batang', serif"
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: -0.96px
  display-lg:
    fontFamily: "'BookkMyungjo', 'Batang', serif"
    fontSize: 36px
    fontWeight: 400
    lineHeight: 1.17
    letterSpacing: -0.36px
  display-md:
    fontFamily: "'BookkMyungjo', 'Batang', serif"
    fontSize: 32px
    fontWeight: 400
    lineHeight: 1.13
    letterSpacing: -0.32px
  display-sm:
    fontFamily: "'BookkMyungjo', 'Batang', serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0
  title-md:
    fontFamily: "'BookkGothic', 'Apple SD Gothic Neo', sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: 0
  title-sm:
    fontFamily: "'BookkGothic', 'Apple SD Gothic Neo', sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.44
    letterSpacing: 0.18px
  body-md:
    fontFamily: "'BookkGothic', 'Apple SD Gothic Neo', sans-serif"
    fontSize: 16px
    fontWeight: 300
    lineHeight: 1.5
    letterSpacing: 0.16px
  body-strong:
    fontFamily: "'BookkGothic', 'Apple SD Gothic Neo', sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0.16px
  body-sm:
    fontFamily: "'BookkGothic', 'Apple SD Gothic Neo', sans-serif"
    fontSize: 15px
    fontWeight: 300
    lineHeight: 1.47
    letterSpacing: 0.15px
  caption:
    fontFamily: "'BookkGothic', 'Apple SD Gothic Neo', sans-serif"
    fontSize: 14px
    fontWeight: 300
    lineHeight: 1.5
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "'BookkGothic', 'Apple SD Gothic Neo', sans-serif"
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0.96px
    textTransform: uppercase
  button:
    fontFamily: "'BookkGothic', 'Apple SD Gothic Neo', sans-serif"
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: 0
  nav-link:
    fontFamily: "'BookkGothic', 'Apple SD Gothic Neo', sans-serif"
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  base: 16px
  md: 20px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 64px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 10px 20px
    height: 40px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 9px 19px
    height: 40px
  button-tertiary-text:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-mega}"
    padding: 96px
  gradient-orb-card:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xxl}"
    padding: 32px
  feature-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.xl}"
    padding: 24px
  product-card-stack:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 0
  voice-row:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    padding: 12px 0
  voice-icon-circular:
    backgroundColor: "{colors.surface-strong}"
    rounded: "{rounded.full}"
    size: 32px
  pricing-tier-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 32px
  pricing-tier-featured:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 32px
  text-input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 16px
    height: 44px
  badge-pill:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.ink}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  cta-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-lg}"
    padding: 96px
  testimonial-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 32px
  audio-waveform-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: 24px
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    padding: 64px 48px
  footer-link:
    backgroundColor: transparent
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
---

## Overview

ElevenLabs reads like a quietly editorial print magazine that happens to be a voice-AI product. The base canvas is off-white `{colors.canvas}` (#f5f5f5) holding warm near-black ink `{colors.ink}` (#0c0a09). The brand voltage is **photographic, not chromatic**: soft pastel atmospheric gradient orbs (mint, peach, lavender, sky, rose) drift through the page as the only "color" moments. There is no neon accent, no saturated CTA color, no dark-canvas dev-tools atmosphere.

Type pairs **부크크 명조(Bookk Myungjo)** at weight 400 for display with **부크크 고딕(Bookk Gothic)** for body, navigation, captions. The Korean serif display face is the editorial signature; normal display copy remains at 400.

CTAs are subtle: a near-black ink pill (`{component.button-primary}`) is the primary, a transparent outline (`{component.button-outline}`) is the secondary. The brand trusts atmospheric photography and modest type weights to carry brand work.

**Key Characteristics:**
- Off-white canvas, warm near-black ink. No saturated CTA color.
- Single primary action: ink pill at `{rounded.pill}`. Atmospheric gradients carry visual brand voltage.
- Display runs 부크크 명조 at weight 400 — editorial magazine voice.
- Body runs 부크크 고딕 Light at 300 with subtle letter-spacing (+0.15-0.18px).
- Pastel gradient orbs (5 tokens: mint, peach, lavender, sky, rose) used as atmospheric brand decoration only.
- Soft pill geometry (`{rounded.pill}` for CTAs, `{rounded.xl}` for cards).
- 96px section rhythm.

## Colors

### Brand & Accent
- **Ink Primary** (`{colors.primary}` — #292524): The primary action color — warm near-black pill. Used scarcely.
- **Ink Primary Active** (`{colors.primary-active}` — #0c0a09): Press state.

### Surface
- **Canvas** (`{colors.canvas}` — #f5f5f5): Off-white page floor.
- **Canvas Soft** (`{colors.canvas-soft}` — #fafafa): Lighter band for subtle alternating sections.
- **Canvas Deep** (`{colors.canvas-deep}` — #0c0a09): Same as ink — used for the rare dark-mode hero (Agents page).
- **Surface Card** (`{colors.surface-card}` — #ffffff): Pure white card.
- **Surface Strong** (`{colors.surface-strong}` — #f0efed): Badges, voice-icon plates.
- **Surface Dark** (`{colors.surface-dark}` — #0c0a09): Dark hero/CTA band canvas.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #1c1917): Cards on dark canvas.

### Hairlines
- **Hairline** (`{colors.hairline}` — #e7e5e4): Default 1px divider.
- **Hairline Soft** (`{colors.hairline-soft}` — #f0efed): Lighter divider.
- **Hairline Strong** (`{colors.hairline-strong}` — #d6d3d1): Stronger panel outline.

### Text
- **Ink** (`{colors.ink}` — #0c0a09): Display, primary text.
- **Body** (`{colors.body}` — #4e4e4e): Default running-text.
- **Body Strong** (`{colors.body-strong}` — #292524): Same as primary — emphasis.
- **Muted** (`{colors.muted}` — #777169): Sub-titles.
- **Muted Soft** (`{colors.muted-soft}` — #a8a29e): Disabled text.
- **On Primary** (`{colors.on-primary}` — #ffffff): White text on ink pill.
- **On Dark** (`{colors.on-dark}` — #ffffff): White text on dark hero.
- **On Dark Soft** (`{colors.on-dark-soft}` — #a8a29e): Muted off-white on dark.

### Atmospheric Gradient Stops (signature)
- **Gradient Mint** (`{colors.gradient-mint}` — #a7e5d3): Mint green orb.
- **Gradient Peach** (`{colors.gradient-peach}` — #f4c5a8): Peach orb.
- **Gradient Lavender** (`{colors.gradient-lavender}` — #c8b8e0): Lavender orb.
- **Gradient Sky** (`{colors.gradient-sky}` — #a8c8e8): Sky-blue orb.
- **Gradient Rose** (`{colors.gradient-rose}` — #e8b8c4): Rose orb.

These appear ONLY as soft radial-gradient atmospheric orbs inside `{component.gradient-orb-card}` and as background atmospheric blooms behind hero copy. Never as button fills, never as text colors.

### Semantic
- **Success** (`{colors.semantic-success}` — #16a34a): Confirmation.
- **Error** (`{colors.semantic-error}` — #dc2626): Validation errors.

## Typography

### Font Family
**부크크 명조(Bookk Myungjo)** carries display typography at weight 400. **부크크 고딕(Bookk Gothic)** carries body, navigation, captions, and buttons at weights 300 and 700. Fallback: `'Batang', 'Times New Roman', serif` for Bookk Myungjo and `'Apple SD Gothic Neo', sans-serif` for Bookk Gothic.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-mega}` | 64px | 400 | 1.05 | -1.92px | Homepage hero h1 |
| `{typography.display-xl}` | 48px | 400 | 1.08 | -0.96px | Subsidiary heroes |
| `{typography.display-lg}` | 36px | 400 | 1.17 | -0.36px | Section heads |
| `{typography.display-md}` | 32px | 400 | 1.13 | -0.32px | Sub-section heads |
| `{typography.display-sm}` | 24px | 400 | 1.2 | 0 | Card group titles |
| `{typography.title-md}` | 20px | 700 | 1.35 | 0 | Component titles — Bookk Gothic |
| `{typography.title-sm}` | 18px | 700 | 1.44 | 0.18px | List labels |
| `{typography.body-md}` | 16px | 300 | 1.5 | 0.16px | Default body — Bookk Gothic |
| `{typography.body-strong}` | 16px | 700 | 1.5 | 0.16px | Emphasized body |
| `{typography.body-sm}` | 15px | 300 | 1.47 | 0.15px | Footer body |
| `{typography.caption}` | 14px | 300 | 1.5 | 0 | Photo captions |
| `{typography.caption-uppercase}` | 12px | 700 | 1.4 | 0.96px | Section labels, badges |
| `{typography.button}` | 15px | 700 | 1.0 | 0 | CTA pill |
| `{typography.nav-link}` | 15px | 700 | 1.4 | 0 | Top-nav menu |

### Principles
- **Display weight stays at 400.** 부크크 명조의 가는 굵기가 editorial signature이며 일반 제목에는 볼드체를 사용하지 않는다.
- **Subtle letter-spacing on body.** Bookk Gothic at +0.15-0.18px tracking supports the editorial feel.
- **Negative letter-spacing on display.** Bookk Myungjo pulls -0.32px to -1.92px tighter on display sizes.

### Webfont Source
부크크 명조와 부크크 고딕은 `(주)부크크`가 제공하는 서체를 수정 없이 사용한다. 명조 웹폰트 선언과 라이선스는 [눈누 부크크 명조 페이지](https://noonnu.cc/font_page/1084), 고딕은 [눈누 부크크 고딕 페이지](https://noonnu.cc/font_page/1082)를 기준으로 한다. 고딕의 300은 `BookkGothic-Lt.woff2`, 700은 `BookkGothic-Bd.woff2`를 사용한다.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.base}` 16px · `{spacing.md}` 20px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** 96px.

### Grid & Container
- Max content width: ~1200px.
- Editorial body: 12-column grid.
- Feature card grids: 2-up at desktop for hero splits, 3-up for benefit grids.
- Footer: 5-column at desktop.

### Whitespace Philosophy
Generous editorial pacing — print-magazine feel. 96px between bands; cards inside bands sit close (16-24px gap). The atmospheric gradient orbs occupy generous breathing space without competing with copy.

## Elevation & Depth

The system uses **hairline + soft drop**. Cards float above the off-white canvas via 1px hairlines and a single subtle shadow tier. Atmospheric depth comes from gradient orbs.

| Level | Treatment | Use |
|---|---|---|
| Flat (canvas) | `{colors.canvas}` (#f5f5f5) | Body bands, footer |
| Card | `{colors.surface-card}` (#ffffff) | Content cards |
| Hairline border | 1px `{colors.hairline}` | Card outlines |
| Soft drop | `0 4px 16px rgba(0, 0, 0, 0.04)` | Hovered cards (single shadow tier) |
| Gradient orb | Radial gradient with one of `{colors.gradient-*}` | Atmospheric depth — never a card surface |

### Decorative Depth
- **Pastel gradient orbs** are the brand's strongest atmospheric pattern. Soft radial blooms in mint, peach, lavender, sky, or rose drift through hero bands and feature sections without containing any content — they are pure atmosphere.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Reserved |
| `{rounded.xs}` | 4px | Inline tags |
| `{rounded.sm}` | 6px | Compact rows |
| `{rounded.md}` | 8px | Form inputs |
| `{rounded.lg}` | 12px | Compact cards |
| `{rounded.xl}` | 16px | Feature cards, pricing tiers |
| `{rounded.xxl}` | 24px | Gradient orb cards (extra-soft) |
| `{rounded.pill}` | 9999px | All CTA buttons, badges |
| `{rounded.full}` | 9999px | Voice icon circles, avatars |

## Components

### Top Navigation

**`top-nav`** — Background `{colors.canvas}`, text `{colors.ink}`, height 64px. Layout: ElevenLabs wordmark left, primary horizontal menu (Creative / Agents / Video / Pricing / Enterprise / Docs), Sign In + "Try free" primary CTA right.

### Buttons

**`button-primary`** — Near-black ink pill. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}` (15px / 500), padding 10px × 20px, height 40px, rounded `{rounded.pill}`.

**`button-primary-active`** — Press state. Background `{colors.primary-active}`.

**`button-outline`** — Transparent pill with 1px ink border. Background transparent, text `{colors.ink}`, 1px `{colors.hairline-strong}` border.

**`button-tertiary-text`** — Inline ink text link.

### Hero & Atmospheric

**`hero-band`** — Background `{colors.canvas}`, full-width display headline in `{typography.display-mega}` (64px / 300 / -1.92px), subhead in `{typography.body-md}`, two CTAs, and an atmospheric gradient orb behind the centered headline.

**`gradient-orb-card`** — A large card with a soft radial-gradient orb behind centered display copy. Background `{colors.canvas-soft}`, rounded `{rounded.xxl}` (24px), padding 32px. Each variant uses one of the five gradient tokens (`gradient-mint`, `gradient-peach`, `gradient-lavender`, `gradient-sky`, `gradient-rose`).

**`audio-waveform-card`** — A waveform visualization card. Background `{colors.surface-card}`, rounded `{rounded.xl}`, padding 24px. Holds a play button + waveform glyph + voice metadata.

### Cards

**`feature-card`** — 2-up or 3-up grids. Background `{colors.surface-card}`, text `{colors.ink}`, rounded `{rounded.xl}`, padding 24px, 1px hairline border.

**`product-card-stack`** — Stacked product preview cards. Background `{colors.surface-card}`, rounded `{rounded.xl}`, no padding (children fill the card edge-to-edge).

**`testimonial-card`** — Quote card. Background `{colors.surface-card}`, text `{colors.body}`, rounded `{rounded.xl}`, padding 32px.

### Voice Library

**`voice-row`** — Horizontal row in voice list. Background transparent, 1px hairline divider. Layout: 32px circular voice icon (`{component.voice-icon-circular}`) left, voice name + accent stack, optional preview button right.

**`voice-icon-circular`** — Background `{colors.surface-strong}`, rounded `{rounded.full}`, 32px diameter. Holds initials or voice glyph.

### Pricing

**`pricing-tier-card`** — Background `{colors.surface-card}`, rounded `{rounded.xl}`, padding 32px, 1px hairline border.

**`pricing-tier-featured`** — Featured tier inverts. Background `{colors.surface-dark}`, text `{colors.on-dark}`. Same shape, dark inversion.

### Forms & Tags

**`text-input`** — Background `{colors.surface-card}`, text `{colors.ink}`, rounded `{rounded.md}` (8px), padding 12px × 16px, height 44px, 1px `{colors.hairline-strong}` border. On focus, border thickens to 2px ink.

**`badge-pill`** — Background `{colors.surface-strong}`, text `{colors.ink}`, type `{typography.caption-uppercase}`, rounded `{rounded.pill}`, padding 4px × 10px.

### CTA / Footer

**`cta-band`** — Pre-footer. Background `{colors.canvas}`, centered display headline in `{typography.display-lg}`, single ink pill CTA. 96px padding.

**`footer`** — Closing footer. Background `{colors.canvas}`, text `{colors.body}`. 5-column link list. 64×48px padding.

**`footer-link`** — Background transparent, text `{colors.body}`, type `{typography.body-sm}`.

## Do's and Don'ts

### Do
- Reserve `{colors.primary}` (ink pill) for primary CTAs.
- Use 부크크 명조 at weight 400 for every display headline. Never bold ordinary display copy.
- Use Bookk Gothic at +0.15-0.18px tracking for body — the editorial dialect.
- Use atmospheric gradient orbs (mint/peach/lavender/sky/rose) as decoration only.
- Use the pill shape for every CTA and badge.

### Don't
- Don't introduce a saturated brand action color. Ink pill is the only CTA color.
- Don't bold display copy. Display sits at weight 300 — bolding shifts the brand voice from editorial to consumer-marketing.
- Don't use gradient orbs as button fills, text colors, or component backgrounds. They are pure atmosphere.
- Don't use sharp `{rounded.none}` (0px) on CTAs. Pill geometry is the brand button.
- Don't replace body Bookk Gothic with Bookk Myungjo — body stays Gothic 300/700 for legibility.
- Don't extract a CTA color from a third-party widget (cookie consent, OneTrust). The brand's CTA color is what appears on actual product CTAs.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | Hero h1 64→32px; feature cards 1-up; nav hamburger; gradient orbs shrink. |
| Tablet | 640–1024px | Hero h1 48px; feature cards 2-up. |
| Desktop | 1024–1280px | Full hero h1 64px; feature cards 3-up. |
| Wide | > 1280px | Content caps at 1200px. |

### Touch Targets
- Primary pill at 40px height — at WCAG AA, padded for AAA.
- Voice icon circles 32px — padded row creates effective 48px tap zone.

### Collapsing Strategy
- Top nav switches to hamburger below 768px.
- Feature grid: 3-up → 2-up → 1-up.
- Gradient orbs reduce diameter at every breakpoint but never disappear.

## Iteration Guide

1. Focus on a single component at a time.
2. CTAs default to `{rounded.pill}`. Cards use `{rounded.xl}` (16px).
3. Variants live as separate entries.
4. Use `{token.refs}` everywhere — never inline hex.
5. Hover state never documented.
6. Bookk Myungjo 400 for display, Bookk Gothic 300/700 for body.
7. Gradient orbs scoped to atmospheric decoration.

## Known Gaps

- 부크크 명조 웹폰트는 외부 CDN에서 로드되므로 오프라인 웹뷰에서는 명조 계열 fallback이 사용된다.
- Animation timings (orb drift, waveform pulse, hero entrance) out of scope.
- In-product surfaces (voice library editor, agent playground) only partially captured via marketing mockups.
- Form validation states beyond focus not visible on captured surfaces.

</design-context>

Use the design system above for all UI you generate.
