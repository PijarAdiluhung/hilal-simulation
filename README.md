# 🌙 Hilal Simulator — Crescent Moon Visibility Tool

[![Live Demo](https://img.shields.io/badge/demo-live-2ea44f?style=for-the-badge)](https://hilal-sim.web.app/)

An interactive **hilal (crescent moon) visibility simulator** built with Vue 3. Visualize the sun and moon positions relative to an observer's horizon in real-time, compute key parameters for crescent sighting, and explore the celestial mechanics behind the lunar cycle.

---

## ✨ Features

- **Real-time celestial simulation** — Sun and moon positions update dynamically based on date, time, and observer location
- **Key sighting parameters** — Elongation (angular separation), lunar altitude at sunset, ecliptic offsets, and sky brightness
- **Interactive controls** — Adjust date/time, latitude, longitude, timezone, and zoom level
- **Visual guides** — Ecliptic reference line, elongation arc, altitude markers, and off-screen moon indicators
- **Dynamic sky rendering** — Transitions through day, sunset, twilight (syafaq), and night based on sun depression
- **Responsive design** — Works on desktop and mobile

---

## 🛠 Tech Stack

| Tech | Purpose |
|---|---|
| **Vue 3** (Composition API) | UI framework |
| **Vite** | Build tool & dev server |
| **Vue Router** | Client-side routing |
| **Pinia** | State management |
| **Tailwind CSS v4** | Styling |
| **Firebase Hosting** | Deployment & analytics |

---

## 🚀 Live Demo

[**hilal-sim.web.app**](https://hilal-sim.web.app/)

---

## 📦 Getting Started

```sh
npm install
```

### Development

```sh
npm run dev
```

### Production Build

```sh
npm run build
npm run preview   # Preview the build locally
```

---

## 📁 Project Structure

```
src/
├── components/        # Vue components
│   ├── CelestialBody.vue     # Sun/Moon SVG rendering
│   ├── ControlPanel.vue      # Simulation controls
│   ├── GuidingAids.vue       # Off-screen moon indicators
│   ├── ReferenceLines.vue    # Ecliptic & coordinate lines
│   ├── SkyBackground.vue     # Atmospheric sky layers
│   └── StatsOverlay.vue      # Altitude/elongation readout
├── composables/
│   └── useCelestialMath.js   # Core celestial calculation engine
├── router/                   # Vue Router configuration
├── stores/                   # Pinia state stores
├── views/                    # Page-level views
│   ├── SimView.vue           # Main simulation view
│   └── OldView.vue           # Legacy view
├── App.vue                   # Root component
├── main.js                   # App entry point
└── main.css                  # Global styles (Tailwind)
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
