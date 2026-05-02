---
name: Kinetic Cyberpunk
colors:
  surface: '#0c1609'
  surface-dim: '#0c1609'
  surface-bright: '#323c2d'
  surface-container-lowest: '#071105'
  surface-container-low: '#141e11'
  surface-container: '#182214'
  surface-container-high: '#222d1e'
  surface-container-highest: '#2d3828'
  on-surface: '#dae6d0'
  on-surface-variant: '#baccb0'
  inverse-surface: '#dae6d0'
  inverse-on-surface: '#293324'
  outline: '#85967c'
  outline-variant: '#3c4b35'
  surface-tint: '#2ae500'
  primary: '#efffe3'
  on-primary: '#053900'
  primary-container: '#39ff14'
  on-primary-container: '#107100'
  inverse-primary: '#106e00'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474746'
  on-secondary-container: '#b6b5b4'
  tertiary: '#f9fafa'
  on-tertiary: '#2f3131'
  tertiary-container: '#dddddd'
  on-tertiary-container: '#606162'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#79ff5b'
  primary-fixed-dim: '#2ae500'
  on-primary-fixed: '#022100'
  on-primary-fixed-variant: '#095300'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#0c1609'
  on-background: '#dae6d0'
  surface-variant: '#2d3828'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-bold:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 20px
---

## Brand & Style

The brand personality is high-energy, focused, and utilitarian, designed to command the attention of a 13-15 year old demographic without patronizing them. The design system leverages a **Gaming-Inspired Minimalism** style, combining the aggressive visual language of tactical HUDs with the clean execution of modern fintech apps. 

The aesthetic is characterized by high-contrast interfaces, "void-black" environments, and neon signaling. It avoids soft gradients or playful illustrations, opting instead for structural precision and rhythmic motion. The goal is to provide a "flow state" environment that reduces cognitive load for users with ADHD by using clear visual hierarchies and rewarding interactions that feel like unlocking achievements.

## Colors

The color palette is built on a "Pure Dark" foundation to maximize contrast and reduce eye strain. 
- **Core Black (#0A0A0A):** Used for the primary canvas to create a sense of infinite depth.
- **Neon Green (#39FF14):** Reserved strictly for primary actions, progress indicators, and "success" states. It acts as a visual dopamine trigger.
- **Tactical Gray (#2A2A2A):** Used for card surfaces and secondary containers to create clear structural separation from the background.
- **High-Visibility White (#FFFFFF):** Used for primary text to ensure maximum legibility against the dark background.
- **Alert Red (#FF3131):** A high-saturation red for destructive actions or urgent notifications.

## Typography

This design system uses a dual-font approach to balance futuristic character with readability. **Space Grotesk** is utilized for headlines and labels to provide a technical, geometric edge reminiscent of gaming interfaces. **Manrope** is used for all body text and long-form content due to its superior legibility and modern, clean proportions. All labels should lean toward uppercase with slight tracking (letter spacing) to mimic a "system readout" aesthetic.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a strict 4px baseline rhythm. For mobile, a 4-column grid is used with 16px gutters and 20px outer margins. 

To accommodate ADHD users, spacing is used aggressively to group related tasks and separate distinct sections. Large "Zone" padding (32px+) is encouraged between major feature blocks to prevent visual clutter. Horizontal scrolling lists (carousels) should be used for secondary content to keep the vertical axis focused on primary tasks.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Layers** rather than traditional shadows. Because the background is a deep #0A0A0A, elevation is conveyed by lightening the surface color. 

- **Level 0 (Floor):** #0A0A0A (Main background)
- **Level 1 (Cards/Items):** #1A1A1A (Subtle lift)
- **Level 2 (Modals/Overlays):** #2A2A2A (Defined lift)

To maintain the futuristic aesthetic, a **Low-contrast outline** of 1px (at 10-15% opacity white) is applied to elevated elements. This creates a "glass-edge" effect that defines boundaries without the heaviness of drop shadows.

## Shapes

The shape language is defined by "Squircle" geometry. While the base containers use a **12px (0.75rem)** radius to maintain a modern, sophisticated feel, smaller elements like chips and tags should utilize a more aggressive "pill" shape to differentiate them from interactive cards. Buttons use the same 12px rounding to match the card language, creating a cohesive, structured look that feels intentional and architectural.

## Components

### Buttons
Primary buttons use a solid #39FF14 background with #0A0A0A text (Space Grotesk, Bold). Secondary buttons use a #2A2A2A background with #FFFFFF text. All buttons should have a subtle "active" state where they scale down slightly (98%) to provide tactile feedback.

### Cards
Cards are the primary container. They use the #2A2A2A surface with a 12px corner radius. Border strokes are only used for "selected" states, utilizing a 2px neon green border to clearly signal focus.

### Input Fields
Inputs are minimal: a bottom-border only or a fully dark container (#1A1A1A). The cursor and active focus state must use the neon green accent. Labels stay visible above the field in uppercase Space Grotesk.

### Progress Bars
Progress tracking is vital for the target audience. Use thick (8px+) bars with a #1A1A1A track and a #39FF14 fill. For "streak" indicators, use a glowing effect (outer glow) to emphasize achievement.

### ADHD-Specific Components
- **Focus Mode Toggle:** A prominent, high-contrast switch that simplifies the UI further when active.
- **Haptic Triggers:** Any completion of a task or "buff" update should trigger a distinct haptic vibration.
- **Micro-Interactions:** Use "loading" skeletons that pulse in a rhythmic, tech-inspired way to keep the user engaged during transitions.