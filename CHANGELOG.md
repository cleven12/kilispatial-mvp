# Changelog

All notable changes to **KiliSpatial** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-17

### Added
- **Native 3D WebGL Engine**: Full 3D terrain elevation mesh powered by MapLibre GL with AWS Terrarium DEM tiles (1.35x elevation exaggeration) and high-resolution Esri World Satellite imagery.
- **Dynamic Route Data Architecture**: Integrated real GPS traces for Mount Kilimanjaro routes (`machame`, `lemosho`, `marangu`, `northern-circuit`, `rongai`, `umbwe`, `shira`).
- **Stage Segment Illumination**: High-visibility neon glowing ribbon (`#10b981`) and bright core line (`#ffffff`) dynamically extracted from GPS points to clearly illuminate the trail segment between Departure (Point A) and Destination (Point B).
- **Summit-Oriented Close-Up Zoom**: High-zoom camera flythroughs (`zoom: 15.0`, `pitch: 70°`) calculating bearings directly toward Uhuru Peak (5,895m) to visualize steep volcanic ridges, valleys, and cliffs (e.g. Barranco Wall, Lava Tower).
- **Point-to-Point Itinerary Drawer**: Enhanced day cards in the Expedition Itinerary Drawer displaying explicit "FROM" and "TO" points with individual "Zoom" and "Locate Stage" action triggers.
- **Uncluttered Studio Workspace**: Hidden-by-default flight control deck maximizing 3D screen real estate with a floating action dock and collapsible SVG elevation chart.
- **Bidirectional postMessage SDK**: Resilient, queue-safe postMessage communication bridge supporting two-way event synchronization between host websites and 3D embeds.
- **B2B Embed Code Generator**: Interactive modal allowing tour operators and safari companies to generate customized `<iframe>` snippets and JavaScript sync code.
- **International Open-Source Standards**: Added MIT License, Code of Conduct, Contributing Guide, Security Policy, Roadmap, GitHub Actions CI, Issue Templates, and Makefile.

---

[1.0.0]: https://github.com/cleven12/kilispatial-mvp/releases/tag/v1.0.0
