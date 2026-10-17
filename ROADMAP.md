# KiliSpatial Roadmap

This document outlines the product vision, planned enhancements, and feature milestones for **KiliSpatial**.

---

## Product Vision

To build the world's most immersive, accurate, and accessible 3D spatial intelligence platform for Mount Kilimanjaro and East African mountain expeditions—transforming how safari and trekking operators showcase itineraries, brief climbers, and manage expeditions.

---

## Phase 1: v1.0.0 — Production MVP (Current Release)

- [x] **Native 3D WebGL Engine**: 3D terrain mesh powered by MapLibre GL, AWS Terrarium DEM raster tiles (1.35x elevation exaggeration), and Esri World Satellite imagery.
- [x] **Dynamic Route Architecture**: High-accuracy GPS traces for primary Kilimanjaro routes (Machame, Lemosho, Marangu).
- [x] **Point-to-Point Stage Illumination**: Active day trail segment extraction with glowing highlight for the trail path between Departure (Point A) and Camp (Point B).
- [x] **Summit-Oriented Close-Up Zoom**: High-zoom camera perspective (`zoom: 15.0`, `pitch: 70°`) oriented towards Uhuru Peak (5,895m) for dramatic 3D cliff and ridge visualization.
- [x] **Uncluttered Studio Workspace**: Hidden-by-default flight controls deck maximizing 3D screen real estate, with a floating action pill and collapsible SVG elevation chart.
- [x] **Bidirectional postMessage Bridge**: Queue-safe two-way communication between host websites and embedded 3D simulator.
- [x] **B2B Embed Snippet Generator**: Interactive modal for tour operators to generate customizable `<iframe>` and JavaScript integration snippets.

---

## Phase 2: v1.1.0 — Free Core Enhancements (Q2 2026)

- [ ] **Complete 7-Route Coverage**: Add full stage data and waypoint markers for Rongai, Umbwe, Northern Circuit, and Shira Plateau routes.
- [ ] **GPX / KML Trail Exporter**: Allow climbers and operators to download verified GPS tracks directly to Garmin/Suunto smartwatches.
- [ ] **Live Mountain Weather Overlay**: Integration with Open-Meteo API for real-time wind speed, temperature, and cloud base at each camp and Uhuru Peak.
- [ ] **PWA Offline Support**: Service worker caching enabling mountain guides and porters to consult 3D trail topography offline on Android/iOS.
- [ ] **Multi-Language Itinerary Support**: Localized itinerary summaries in English, Swahili, German, French, Spanish, and Italian.

---

## Phase 3: Pro & Enterprise Solutions (Commercial Upgrades)

The open-source core is free for community exploration, learning, and independent developers. The following enterprise capabilities are offered as commercial upgrades and custom software implementations for luxury safari and trekking operators:

### 1. White-Label Branding & Domain Masking
- Complete removal of KiliSpatial watermarks.
- Custom corporate typography, brand colors, custom map pins, and branded elevation charts.
- Subdomain or reverse proxy hosting on the operator's main website (e.g. `3d.yourluxurytrek.com`).

### 2. Live Satellite Crew & Client Tracking
- Real-time satellite synchronization with **Garmin inReach**, **SPOT Gen4**, or **Zoleo**.
- Live 3D position marker of the climbing group on the mountain for anxious family members and remote operations teams.
- Emergency SOS status broadcasting and daily check-in pings.

### 3. Multi-Mountain & Wildlife Safari Corridors
- **Mount Meru (4,562m)**: Complete 3D caldera, ash cone, and Socialist Peak trek simulator.
- **Ol Doinyo Lengai (2,962m)**: Active stratovolcano ("Mountain of God") steep ascent mapping.
- **Rwenzori Mountains & Mount Kenya**: Central and East African alpine peaks.
- **Serengeti Wildlife Migration Corridors**: 3D spatial tracking of wildebeest herds through the Mara River and Grumeti crossings.

### 4. Booking Engine & CRM Connectors
- Direct integration with **SafariBookings**, **Wetu**, **Peek Pro**, and **FareHarbor**.
- Automated lead capture syncing directly into **HubSpot**, **Salesforce**, or **Pipedrive** when clients interact with specific expedition dates.
- Instant quote calculator embedded within the 3D map.

### 5. Interactive Expo Displays (Kiosk Mode)
- Ultra-high-resolution (4K/8K) touch-kiosk presentation mode for international tourism expos (**ITB Berlin**, **WTM London**, **Indaba Durban**).
- Automated idle-loop flythrough demo with physical controller or touch gestures.

---

## Enterprise Inquiries & Custom Development

To discuss commercial licensing, custom mountain mapping, or custom integrations for your travel company:

- **Founder & Maintainer**: Cleven
- **Email**: [clevengodsontech@gmail.com](mailto:clevengodsontech@gmail.com)
- **WhatsApp**: [+255 692 654 000](https://wa.me/255692654000)
