# Contributing to KiliSpatial

First off, thank you for considering contributing to KiliSpatial! 🎉

KiliSpatial is an open-source, production-grade 3D geospatial showcase and B2B embedding studio for Mount Kilimanjaro expeditions, designed for tour operators, mountain guides, and geospatial developers worldwide.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to [clevengodsontech@gmail.com](mailto:clevengodsontech@gmail.com).

---

## Free Core vs. Pro Commercial Extensions

- **Free Core (Open Source)**: The core repository is open to everyone under the MIT License. Contributions improving MapLibre 3D rendering, Svelte 5 component state, performance, documentation, accessibility, and route data accuracy are warmly welcomed!
- **Pro / Enterprise Features**: Certain high-tier commercial integrations (custom luxury operator white-labeling, live satellite GPS crew telemetry, multi-park East Africa expansion, CRM connectors) are developed separately as commercial enterprise solutions.

---

## Development Workflow

### 1. Prerequisites
- **Node.js**: `v22.0.0+`
- **Package Manager**: `pnpm` (recommended) or `npm`
- **Browser**: Modern browser with WebGL 2.0 support (Chrome, Firefox, Safari, Edge)

### 2. Fork & Clone
```bash
git clone https://github.com/cleven12/kilispatial-mvp.git
cd kilispatial-mvp
pnpm install
```

### 3. Local Development
```bash
# Start Astro dev server
pnpm dev
```
Open [http://localhost:4321](http://localhost:4321) to view the live studio.

### 4. Branching & Commit Conventions
We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New user-facing feature or enhancement
- `fix:` Bug fix or rendering correction
- `docs:` Documentation improvements
- `style:` Formatting, UI styling adjustments
- `refactor:` Code restructuring without functional changes
- `perf:` Performance or WebGL rendering optimizations
- `test:` Unit or integration test suites
- `chore:` Maintenance, dependency updates

Example:
```bash
git checkout -b feat/add-rongai-route-elevation
git commit -m "feat: add elevation profile points for Rongai route"
```

> [!IMPORTANT]
> **Commit Authorship Integrity**: Ensure your commits are authored with your actual git user name and email. Never include unauthorized bot or AI agent co-author metadata trailers.

### 5. Verify Build Before PR
Always ensure that the project builds cleanly with zero errors before submitting your pull request:
```bash
pnpm build
```

---

## Pull Request Guidelines

1. Ensure your PR description clearly explains the changes made and references any related issue (`Fixes #12`).
2. Keep PRs focused on a single logical change or feature.
3. Verify responsive layout across mobile, tablet, and desktop viewports.
4. Maintain clean TypeScript types without `any` where possible.

---

## Questions & Contact

For technical questions, architecture suggestions, or partnership inquiries:

- **Maintainer**: Cleven
- **Email**: [clevengodsontech@gmail.com](mailto:clevengodsontech@gmail.com)
- **WhatsApp**: [+255 692 654 000](https://wa.me/255692654000)
