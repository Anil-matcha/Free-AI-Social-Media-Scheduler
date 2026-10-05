# 🎨 OpenSpaces Theme System: Light & Dark Mode Design Plan

## 1. Objective & Philosophy
To deliver an authentic, distraction-free collaborative experience modeled on OpenAI's ChatGPT Spaces and Canvas. The theme system dynamically adapts between a deep obsidian dark mode and a crisp, readable paper-white light mode using `next-themes` with zero layout shift or hydration flicker.

---

## 2. Core Color Palette & Token Hierarchy

| Token Name | CSS Variable | Light Mode Value | Dark Mode Value | Usage Context |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas Background** | `--bg-canvas` | `#fbfbfa` / `#f4f4f5` | `#141416` | Main working area, Page canvas |
| **Sidebar Background**| `--bg-sidebar` | `#f7f7f8` | `#18181b` | Navigation, spaces list |
| **Surface / Card** | `--bg-card` | `#ffffff` | `#1e1e24` | Modals, cards, editor toolbar |
| **Elevated Hover** | `--bg-hover` | `#f0f0f2` | `#27272a` | Hover states, selected tabs |
| **Border Primary** | `--border-primary` | `#e4e4e7` (Zinc 200) | `#2e2e34` (Zinc 800) | Structural dividers, tab borders |
| **Border Subtle** | `--border-subtle` | `#f4f4f5` (Zinc 100) | `#232328` (Zinc 850) | Inset cards, subtle separators |
| **Text Primary** | `--text-primary` | `#18181b` (Zinc 900) | `#f4f4f5` (Zinc 100) | Main headings, page content |
| **Text Secondary** | `--text-secondary` | `#52525b` (Zinc 600) | `#a1a1aa` (Zinc 400) | Subtitles, descriptions, captions |
| **Text Muted** | `--text-muted` | `#71717a` (Zinc 500) | `#71717a` (Zinc 500) | Timestamps, counters, icons |
| **Accent Primary** | `--accent-indigo` | `#4f46e5` (Indigo 600) | `#6366f1` (Indigo 500) | Buttons, active badges, highlights |
| **Accent Gradient** | `--accent-grad` | `from-indigo-600 to-violet-600` | `from-indigo-500 to-violet-500` | Brand logo, Dot agent avatars |
| **Agent Bubble** | `--bubble-agent` | `#f4f4f5` | `#202025` | AI/Dot response container |
| **User Bubble** | `--bubble-user` | `#4f46e5` | `#4f46e5` | User chat bubbles |

---

## 3. Implementation Plan with `next-themes`

1. **Provider Setup**:
   - `client/src/components/ThemeProvider.js` wrapping root layout with `attribute="class"`, `defaultTheme="system"`, and `enableSystem`.
2. **HTML Suppression**:
   - Add `suppressHydrationWarning` to `<html lang="en">` in `src/app/layout.js`.
3. **Tailwind v4 Configuration**:
   - Configure `@custom-variant dark (&:where(.dark, .dark *));` in `src/app/globals.css`.
4. **Theme Toggle Component**:
   - Create `src/components/ThemeToggle.js` for switching between Light, Dark, and System modes.
5. **Component Upgrades**:
   - Upgrade `Sidebar`, `SpaceHeader`, `PagesCanvas`, `SpaceChat`, `DotsManager`, and `MeetingIntelligence` to use seamless responsive dark/light classes.
