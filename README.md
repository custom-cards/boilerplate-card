# Boilerplate Card

A community-driven boilerplate of best practices for Home Assistant Lovelace custom cards.

[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE.md)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg?style=for-the-badge)](https://github.com/custom-components/hacs)
[![GitHub Activity][commits-shield]][commits]

---

## Overview

This project is a fully-featured starting point for building your own custom Lovelace card. It is built on modern tooling (Lit 3, TypeScript 5, Rollup 4) and demonstrates real-world patterns used in production HA custom cards:

- Visual editor with collapsible accordion sections
- Multiple entity support
- Conditional card visibility based on entity states
- Custom attribute display with label and unit overrides
- Multiple layout modes (vertical, horizontal) and display modes (card, badge)
- Comprehensive tap / hold / double-tap action support with repeat and haptic feedback
- Skeleton loading state while `hass` initialises
- Responsive design and theme-aware CSS custom properties

---

## Installation

### HACS (recommended)

1. Open HACS in your Home Assistant instance.
2. Go to **Frontend** → **+ Explore & Download Repositories**.
3. Search for **Boilerplate Card** and click **Download**.
4. Refresh your browser.

### Manual

1. Download `boilerplate-card.js` from the [latest release][releases].
2. Copy it to `<config>/www/boilerplate-card.js`.
3. Add a resource entry in your dashboard settings:

```yaml
resources:
  - url: /local/boilerplate-card.js
    type: module
```

---

## Configuration

### Minimal example

```yaml
type: custom:boilerplate-card
entity: light.living_room
```

### Full example

```yaml
type: custom:boilerplate-card
entity: light.living_room
name: Living Room
icon: mdi:ceiling-light
layout: vertical
display_mode: card
card_style: default
accent_color: [255, 152, 0]
attribute_limit: 3
show_timestamps: true
tap_action:
  action: toggle
hold_action:
  action: more-info
double_tap_action:
  action: navigate
  navigation_path: /lovelace/lights
```

---

## Options

### Core

| Name           | Type    | Required     | Description                                      | Default           |
| -------------- | ------- | ------------ | ------------------------------------------------ | ----------------- |
| `type`         | string  | **Required** | `custom:boilerplate-card`                        |                   |
| `entity`       | string  | **Optional** | Primary HA entity ID                             | `none`            |
| `name`         | string  | **Optional** | Card title override                              | Entity friendly name |
| `icon`         | string  | **Optional** | MDI icon override (e.g. `mdi:lightbulb`)         | Domain default    |
| `area`         | string  | **Optional** | HA area to associate with the card               | `none`            |
| `show_error`   | boolean | **Optional** | Render the error card template (for testing)     | `false`           |
| `show_warning` | boolean | **Optional** | Render the warning banner template (for testing) | `false`           |

### Actions

| Name                | Type   | Required     | Description                     | Default             |
| ------------------- | ------ | ------------ | ------------------------------- | ------------------- |
| `tap_action`        | object | **Optional** | Action on single tap            | `action: more-info` |
| `hold_action`       | object | **Optional** | Action on 500 ms hold           | `action: none`      |
| `double_tap_action` | object | **Optional** | Action on double tap            | `action: none`      |

#### Action object

| Name              | Type   | Required     | Description                                                                             | Default     |
| ----------------- | ------ | ------------ | --------------------------------------------------------------------------------------- | ----------- |
| `action`          | string | **Required** | `more-info` `toggle` `navigate` `url` `call-service` `fire-dom-event` `none`           | `more-info` |
| `navigation_path` | string | **Optional** | Path for `navigate` (e.g. `/lovelace/0/`)                                              | `none`      |
| `url_path`        | string | **Optional** | URL for `url` action — opens in a new tab                                               | `none`      |
| `service`         | string | **Optional** | Service for `call-service` (e.g. `light.turn_on`)                                      | `none`      |
| `service_data`    | object | **Optional** | Service data payload for `call-service`                                                 | `none`      |
| `haptic`          | string | **Optional** | Haptic feedback: `success` `warning` `failure` `light` `medium` `heavy` `selection`    | `none`      |
| `repeat`          | number | **Optional** | Repeat interval in ms while held (`hold_action` only)                                  | `none`      |
| `repeat_limit`    | number | **Optional** | Maximum number of repeats (`hold_action` only)                                          | `none`      |

### Appearance

| Name           | Type     | Required     | Description                                                              | Default              |
| -------------- | -------- | ------------ | ------------------------------------------------------------------------ | -------------------- |
| `layout`       | string   | **Optional** | `vertical` (stacked) or `horizontal` (icon + info + actions in one row) | `vertical`           |
| `display_mode` | string   | **Optional** | `card` (full ha-card) or `badge` (compact inline chip)                  | `card`               |
| `card_style`   | string   | **Optional** | `default` `compact` `detailed` `minimal`                                | `default`            |
| `accent_color` | [r, g, b] | **Optional** | RGB accent color applied via `--card-accent-color`                     | Theme primary color  |

#### Card styles

| Value      | Effect                                             |
| ---------- | -------------------------------------------------- |
| `default`  | Standard padding and font sizes                    |
| `compact`  | Reduced padding and smaller text                   |
| `detailed` | Enlarged text, bigger icon, extra padding          |
| `minimal`  | Entity row only — attributes and timestamps hidden |

### Display

| Name              | Type    | Required     | Description                                         | Default |
| ----------------- | ------- | ------------ | --------------------------------------------------- | ------- |
| `attribute_limit` | number  | **Optional** | Maximum number of attributes to display (`0` = none). Shown as a slider (0–10) in the visual editor. | `3`     |
| `show_timestamps` | boolean | **Optional** | Show last changed / last updated timestamps         | `true`  |

---

## Developer Guide

### Prerequisites

| Tool    | Minimum version | Notes                               |
| ------- | --------------- | ----------------------------------- |
| Node.js | 24              | Required by `custom-card-helpers@2` |
| Yarn    | 4               | Managed via Corepack                |

TypeScript, Rollup, ESLint, and all other build tools are installed locally via `yarn install` — no global installs needed.

### Quick start — devcontainer (recommended)

The devcontainer gives you a full HA development environment in one click with no local setup required.

1. Open the project in VS Code.
2. When prompted, click **Reopen in Container** (or run **Dev Containers: Rebuild Container**).
3. A local Home Assistant instance starts automatically at `http://localhost:8123`.
4. Log in with `dev` / `dev`.
5. The built card is served from the container and hot-reloads on every save (`yarn start` is launched automatically).

**Requires:** [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension.

### Quick start — local

```bash
# 1. Clone or use the GitHub "Use this template" button
git clone https://github.com/custom-cards/boilerplate-card.git my-card
cd my-card

# 2. Install dependencies
yarn install

# 3. Verify the build works
yarn build

# 4. Start the development watcher
yarn start
```

Then add your local file as a Lovelace resource:

```yaml
resources:
  - url: /local/boilerplate-card.js
    type: module
```

Copy or symlink `dist/boilerplate-card.js` into your HA `www/` folder, or use the devcontainer where this is handled automatically.

### Available scripts

| Command          | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `yarn build`     | Lint + production bundle (minified, ES2022 output)      |
| `yarn rollup`    | Production bundle only (skips lint)                     |
| `yarn start`     | Development watcher with hot reload (`rollup --watch`)  |
| `yarn lint`      | ESLint across all `src/` files                          |

### Project structure

```
src/
├── boilerplate-card.ts          # Main card element — LitElement subclass
├── editor.ts                    # Visual editor — implements LovelaceCardEditor
├── types.ts                     # TypeScript interfaces for all config fields
├── const.ts                     # CARD_VERSION constant
├── action-handler-directive.ts  # Lit directive: tap / hold / double-tap gestures
└── localize/
    ├── localize.ts              # i18n helper
    └── languages/
        ├── en.json              # English strings
        └── nb.json              # Norwegian strings
dist/
└── boilerplate-card.js          # Build output — serve this to HA
```

### Adapting the boilerplate for your own card

Search the codebase for `TODO` — every required change is marked. The key steps in order:

1. **Rename the element** — change `boilerplate-card` everywhere: the `@customElement` decorator, the `customCards.push` entry, the editor tag name in `getConfigElement`, and your YAML `type:` field.
2. **Define config fields** — add your options to `BoilerplateCardConfig` in `types.ts`.
3. **Validate and set defaults** — update `setConfig()` in `boilerplate-card.ts`. Throw for missing required fields; spread sensible defaults for optional ones.
4. **Update `getStubConfig`** — return a minimal valid config so the card picker renders something immediately without the editor.
5. **Build your render** — replace `_renderContent()` and `_renderAttributes()` with your domain-specific templates.
6. **Update the visual editor** — add your config fields to the relevant accordion section in `editor.ts`. Use `ha-selector` for type-safe inputs that match HA's UI conventions.
7. **Add user-facing strings** — put labels and messages in `src/localize/languages/en.json` and reference them with `localize('key')`.

### Toolchain summary

| Tool                        | Version | Role                                                       |
| --------------------------- | ------- | ---------------------------------------------------------- |
| Lit                         | 3.2     | Web components framework                                   |
| TypeScript                  | 5.6     | Type checking and compilation                              |
| Rollup                      | 4       | Bundler — single `.js` output with tree-shaking            |
| `@rollup/plugin-typescript` | 11      | TypeScript integration                                     |
| `@rollup/plugin-terser`     | 0.4     | Minifier                                                   |
| ESLint                      | 8       | Linting with TypeScript and Prettier integration           |

> **Important:** Rollup and Terser are both configured for ES2022 output (`ecma: 2022`, `target: 'ES2022'`). Do **not** lower these targets. Lit 3 uses native ES6 `class` syntax and the `extends` keyword; downgrading to ES5 causes a runtime `TypeError: Class constructor cannot be invoked without 'new'`.

### Action handler directive

`action-handler-directive.ts` is a Lit directive that attaches gesture recognisers to any element. Wire it up with the `actionHandler()` function and listen for the `@action` event:

```typescript
import { actionHandler } from './action-handler-directive';
import { handleAction, ActionHandlerEvent } from 'custom-card-helpers';

// In your render():
html`
  <div
    ${actionHandler({ hasHold: true, hasDoubleClick: true })}
    @action=${this._handleAction}
    tabindex="0"
  >...</div>
`

// Handler:
private _handleAction(ev: ActionHandlerEvent): void {
  handleAction(this, this.hass, this.config, ev.detail.action);
}
```

| Gesture       | Activated by                             |
| ------------- | ---------------------------------------- |
| Tap           | Release before the hold threshold        |
| Hold          | Press held for 500 ms                    |
| Hold + repeat | Fires every `repeat` ms while held       |
| Double tap    | Two taps within 250 ms                   |
| Keyboard      | Enter or Space triggers tap              |

### Adding a new language

1. Copy `src/localize/languages/en.json` to `src/localize/languages/<lang>.json`.
2. Translate the values (keep all keys identical).
3. Import and register the new translations in `src/localize/localize.ts`.

### Contributing

1. Fork the repository and create a feature branch from `master`.
2. Run `yarn build` before opening a PR — all lint checks must pass.
3. Keep PRs focused on a single change.
4. Code style is enforced automatically by Prettier and ESLint on build.

---

## Troubleshooting

**Card not appearing after install**
Clear your browser cache or do a hard reload (`Ctrl+Shift+R` / `Cmd+Shift+R`).

**`TypeError: Class constructor cannot be invoked without 'new'`**
Your bundler is transpiling Lit's class syntax down to ES5. Ensure `rollup.config.js` has `terser({ ecma: 2020 })` and `typescript({ compilerOptions: { target: 'ES2022' } })`.

**Visual editor not opening**
Check the browser console for import errors from the dynamic `import('./editor')` in `getConfigElement`. Also confirm the `boilerplate-card-editor` custom element tag matches what `getConfigElement` creates.

**Card stuck on skeleton / not rendering**
`shouldUpdate` may be returning `false` before `hass` is ready. The safest implementation for a single entity is:
```typescript
protected shouldUpdate(changedProps: PropertyValues): boolean {
  if (!this.config) return false;
  return changedProps.has('config') || changedProps.has('hass');
}
```

**General Lovelace plugin troubleshooting**
See the [thomasloven wiki][troubleshooting].

---

[commits-shield]: https://img.shields.io/github/commit-activity/y/custom-cards/boilerplate-card.svg?style=for-the-badge
[commits]: https://github.com/custom-cards/boilerplate-card/commits/master
[license-shield]: https://img.shields.io/github/license/custom-cards/boilerplate-card.svg?style=for-the-badge
[releases-shield]: https://img.shields.io/github/release/custom-cards/boilerplate-card.svg?style=for-the-badge
[releases]: https://github.com/custom-cards/boilerplate-card/releases
[troubleshooting]: https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins
