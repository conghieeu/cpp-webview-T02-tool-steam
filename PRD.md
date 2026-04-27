# Tactical Dark Web App

## Product Overview

**The Pitch:** A precision-focused configuration hub for gaming overlays and crosshairs. Provides rapid access to display tweaks, keybinds, and visual customization without bloat.

**For:** Competitive gamers and streamers who need pixel-perfect control over their HUDs and crosshairs.

**Device:** desktop

**Design Direction:** Tactical Dark. Deep obsidian backgrounds, sharp geometric edges, and high-contrast neon orange accents with subtle bloom effects. Feels like a military drone interface or an advanced gaming peripheral dashboard.

**Inspired by:** Valorant UI, Razer Synapse, Discord desktop app.

---

## Screens

- **Display Modes:** Configure fullscreen, windowed, and overlay behaviors.
- **Crosshairs:** Select, customize, and preview crosshair styles.
- **Position & Size:** Granular X/Y axis controls and scaling sliders.
- **Options:** General app settings, startup behaviors, and hidden toggles.
- **Help:** Documentation, quick-start guides, and troubleshooting.

---

## Key Flows

**Navigating Configuration Categories:** User explores different settings seamlessly.

1. User is on [Display Modes] -> sees active orange glow on sidebar item.
2. User clicks [Help] -> Sidebar updates active state with neon glow, main content instantly swaps to Help documentation.
3. Main content area populates with accordion-style guides.

**Dismissing System Warnings:** Managing critical alerts.

1. User is on [Any Screen] -> sees an orange-bordered warning banner at the top of the main content area.
2. User clicks `[X]` icon on the banner -> Banner slides up and fades out.
3. Interface shifts up to fill the vacated space.

---

<details>
<summary>Design System</summary>

## Color Palette

- **Primary:** `#FF5500` - Active states, toggles, call-to-action buttons, glow effects
- **Background:** `#0A0A0C` - App background, deep void
- **Surface:** `#121216` - Sidebar, panels, input fields
- **Surface Highlight:** `#1A1A20` - Hover states on cards/nav
- **Text:** `#EAEAEA` - Primary reading text, headers
- **Muted:** `#8B8B99` - Secondary text, inactive nav, borders
- **Accent:** `#FF3333` - Destructive actions, critical warnings

## Typography

- **Headings:** `Rajdhani`, 600, 24-32px (Uppercase, technical, squared)
- **Body:** `Space Grotesk`, 400, 14-16px (Geometric, clean readability)
- **Small text:** `Space Grotesk`, 400, 12px
- **Buttons:** `Rajdhani`, 700, 16px (Uppercase, wide tracking)

**Style notes:** 
- `0px` border radius on all major containers; maximum `2px` on inputs/buttons.
- `1px` solid borders using `#2A2A35` to define structure instead of shadows.
- Glow effects (`box-shadow: 0 0 10px rgba(255, 85, 0, 0.4)`) reserved strictly for active navigation and checked toggles.

## Design Tokens

```css
:root {
  --color-primary: #FF5500;
  --color-background: #0A0A0C;
  --color-surface: #121216;
  --color-surface-hover: #1A1A20;
  --color-text: #EAEAEA;
  --color-muted: #8B8B99;
  --color-border: #2A2A35;
  --font-heading: 'Rajdhani', sans-serif;
  --font-body: 'Space Grotesk', sans-serif;
  --radius-none: 0px;
  --radius-sm: 2px;
  --spacing-base: 8px;
  --glow-primary: 0 0 12px rgba(255, 85, 0, 0.5);
}
```

</details>

---

<details>
<summary>Screen Specifications</summary>

### Navigation & Layout Shell (Applies to all screens)

**Purpose:** Persistent framework housing the side nav, top bar, and content area.

**Layout:** 
- `240px` fixed Left Sidebar.
- `calc(100vw - 240px)` Main Content area.
- `64px` height Header spanning the Main Content area.

**Key Elements:**
- **Sidebar Logo:** Top left, 32px height, neon orange geometric icon.
- **Sidebar Nav:** 
  - Groups: "Essentials", "Customization", "Support". Group headers in `#8B8B99`, 12px, uppercase.
  - Items: 40px height, 14px text. Inactive `#8B8B99`, hover `#EAEAEA` with `#1A1A20` bg. Active state text `#FF5500`, glowing orange left border `3px solid #FF5500`.
- **Social Dock:** Bottom of sidebar. Flex row, 24px icons (Discord, TikTok, YT, Twitter) in `#8B8B99`, hover `#FF5500`.
- **Header Toggle:** Top right, "Hidden" toggle switch. `40px x 20px` pill, `#FF5500` when active.
- **Warning Banner:** Top of main content area. `#121216` background, `1px solid #FF5500`, left border `4px solid #FF5500`. Contains warning icon, message, and right-aligned `X` to dismiss.

### Display Modes

**Purpose:** Core settings for how the overlay renders on the system.

**Layout:** 1-column list of settings panels filling the main content area below the header/banner.

**Key Elements:**
- **Mode Selector:** Radio button group styled as segmented controls. Options: "Fullscreen", "Windowed", "Overlay". Active button `#FF5500` bg, `#0A0A0C` text.
- **Resolution Dropdown:** Native select styled with dark surface `#121216` and `#2A2A35` border.
- **Framerate Cap Slider:** Range input. Track `#2A2A35`, fill `#FF5500`, thumb square `#EAEAEA`.
- **Apply Button:** Bottom right, `120px x 40px`, `#FF5500` background, `#0A0A0C` text, uppercase, hover brightness 1.2.

**States:**
- **Unsaved Changes:** Show a pulsing orange dot next to "Display Modes" header.

**Interactions:**
- **Click Mode:** Instantly updates rendering context variable, triggers subtle flash on main content area to indicate applied state.

### Crosshairs

**Purpose:** Gallery and selection tool for crosshair reticles.

**Layout:** CSS Grid of crosshair cards (4 columns).

**Key Elements:**
- **Grid Cards:** `120px x 120px`. `#121216` background, `1px solid #2A2A35`. Center crosshair SVG. Hover border `#8B8B99`.
- **Active Card:** Border `1px solid #FF5500`, inner inset shadow `0 0 15px rgba(255, 85, 0, 0.1)`.
- **Upload Button:** Dashed border `#2A2A35`, `+` icon in center.

**Interactions:**
- **Hover Card:** Crosshair scales up `1.1x` smoothly (`200ms ease`).

### Help

**Purpose:** Support documentation and onboarding.

**Layout:** Single column, narrow readable width (`max-width: 800px`), centered.

**Key Elements:**
- **Search Bar:** Large `48px` height input, full width. Icon left, `#121216` bg, focus border `#FF5500`.
- **FAQ Accordions:** List of questions. `56px` height headers. Right aligned `+` icon. 
- **Expanded Accordion:** `+` rotates to `x`. Content area expands downwards with `#8B8B99` text.
- **Support CTA:** "Still need help?" box at bottom. Discord link button, solid `#5865F2` (Discord blue).

### Options

**Purpose:** Global app configurations.

**Layout:** 2-column grid for dense settings.

**Key Elements:**
- **Start with Windows:** Toggle switch.
- **Hardware Acceleration:** Toggle switch.
- **Language:** Dropdown menu.
- **Reset All Settings:** Danger button. `1px solid #FF3333`, transparent bg, `#FF3333` text. Hover solid `#FF3333` with `#0A0A0C` text.

</details>

---

<details>
<summary>Build Guide</summary>

**Build Order:**
1. **Layout Shell (Sidebar & Header):** Establish the fixed layout, navigation active states (glow effects), and CSS variables. This defines the core identity.
2. **Warning Banner:** Implement the absolute/relative positioning and dismiss logic.
3. **Display Modes Screen:** Build out the form controls (toggles, segmented controls, sliders) to establish the input design language.
4. **Help Screen:** Build the accordion logic and text typography scale.
5. **Crosshairs Screen:** Implement the CSS grid and hover interactions for cards.

</details>