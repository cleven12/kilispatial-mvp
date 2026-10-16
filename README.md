# KiliSpatial B2B Showcase MVP

An interactive 3D Mount Kilimanjaro itinerary showcase for Tanzanian tour operators, built with **Astro 5**, **Svelte 5 (Runes)**, **TypeScript**, and **Tailwind CSS v4**.

## Features

- **Bidirectional postMessage SDK Bridge**: Seamless two-way communication between host itinerary elements and the embedded 3D viewer (`https://kili.xenohuru.com`).
- **Interactive Day-by-Day Flythrough**: Click any day in the itinerary to fly the 3D camera across camps—from Marangu/Machame gates up to Lava Tower, Barranco Wall, and Uhuru Peak (5,895m).
- **Multi-Route Switching**: Instant route switching between Machame, Lemosho, and Marangu expeditions.
- **Live Telemetry & Control Deck**: Real-time HUD displaying altitude, trail progress, drone orbit mode, and elevation scrubbing.
- **B2B Embed Code Generator**: Tour operators can configure URL parameters (`route`, `day`, `drone`, `chart`, `days`) and copy embed snippets (HTML `<iframe>` or `postMessage` sync API).
- **CSP & Whitelist Diagnostics**: In-viewport diagnostics that detect and guide origin whitelisting when connecting to remote instances.

## Tech Stack

- **Framework**: [Astro 5](https://astro.build)
- **UI Islands**: [Svelte 5](https://svelte.dev) (Runes: `$state`, `$derived`, `$effect`, `$bindable`, `$props`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) with `@tailwindcss/vite`
- **Language**: TypeScript (strict)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
# or npm install
```

### 2. Run the Development Server

```bash
# Foreground
pnpm dev

# Or in background mode
pnpm astro dev --background
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### 3. Build for Production

```bash
pnpm build
```

## Embedding Configuration

To embed the 3D viewer on your domain, ensure your engine deployment whitelists your domain:

- **CSP Headers** (`static/_headers`):
  ```http
  /embed*
    Content-Security-Policy: frame-ancestors 'self' http://localhost:4321 https://yourdomain.com;
  ```
- **Allowed Origins** (`.env`):
  ```env
  VITE_EMBED_ORIGINS=http://localhost:4321,https://yourdomain.com
  ```

## License

MIT
