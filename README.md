<p align="center">
  <img src="public/logo.webp" alt="MapToPoster JS Logo" width="200">
</p>

# MapToPoster JS

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML) [![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS) [![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) [![Leaflet](https://img.shields.io/badge/Leaflet-199903?style=for-the-badge&logo=Leaflet&logoColor=white)](https://leafletjs.com/) [![MapLibre](https://img.shields.io/badge/MapLibre-212121?style=for-the-badge&logo=maplibre&logoColor=white)](https://maplibre.org/) [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

MapToPoster JS is a client-side web application designed to generate high-resolution map posters. It allows users to search for any location in the world and transform it into a piece of art with customizable themes, layouts, and export formats.

![MapToPoster JS Preview](public/screenshot.webp)

## 🚀 Key Features

- **Dual Rendering Engine**: 
  - **Standard Mode**: Efficient tile-based mapping powered by Leaflet, supporting various base map styles (Minimal, Dark, Satellite, Voyager).
  - **Artistic Mode**: Vector-based procedural themes powered by MapLibre GL, offering unique styles like Arctic Frost, Aurora Glow, Cyber Glitch, and more.
- **Global Search**: Find any city or landmark worldwide via Nominatim API.
- **Dynamic Composition**: 
  - Real-time perspective and zoom controls.
  - Customizable poster overlays (size, background style).
  - Geographic coordinate display with per-field visibility toggles.
- **Draggable City Label**: Drag the location text overlay to any position on the poster canvas. Position presets (3 × 3 grid) and a reset button are also available for quick placement.
- **Background Styles**: Choose between None & Vignette (linear gradient) for the poster overlay background.
- **Show / Hide Label Fields**: Toggle the country name and coordinates independently on the poster canvas without removing them from the form.
- **High-Resolution Export**: Export your creations as high-quality PNG files with preset sizes (A4, Instagram, Stories) or custom pixel dimensions.
- **Persistent Settings**: Your preferences and last viewed location are automatically saved to local storage.
- **Privacy Focused**: All rendering and data processing happen entirely on the client-side.

## 🎨 Themes

MapToPoster JS offers two distinct ways to style your maps:

### Standard Themes (Leaflet)
Based on high-quality raster tiles from established providers:
- **Minimal White**: Clean and modern (CartoDB Positron).
- **Midnight Dark**: Sleek dark mode (CartoDB Dark Matter).
- **Classic Street**: Standard OpenStreetMap cartography.
- **Modern Voyager**: Colorful and detailed (CartoDB Voyager).
- **Satellite View**: High-resolution imagery (Esri World Imagery).

### Artistic Themes (MapLibre GL)
Hand-crafted vector styles with procedural colors:
- **Arctic Frost**: Pale blues and crisp whites.
- **Aurora Glow**: Iridescent greens and pinks.
- **Cyber Glitch**: Neon accents for a digital look.
- **Paper Heritage**: Vintage sepia tones and inked roads.
- **Volcanic Ash**: Deep charcoal with glowing ember accents.
- **Blueprint Classic**: Technical cyanotype style for an architectural feel.
- **Retro Synth**: 80s outrun aesthetic with neon magentas and electric blues.
- **Desert Mirage**: Sun-bleached sands and warm terracotta tones.
- **Copper Patina**: Aged bronze and oxidized turquoise for a weathered metal look.
- **Sakura Bloom**: Soft cherry blossom pinks and delicate cream tones.
- **Royal Velvet**: Deep regal purples paired with rich metallic gold.
- **Forest Shadow**: Moody deep evergreen tones with misty highlights.
- **Ethereal Ghost**: Ultra-minimalist light greys and silvery whites.
- **Solar Flare**: High-energy oranges and blacks inspired by sunspots.
- **Charcoal Sketch**: The look of graphite on textured heavy-grain paper.
- **Ancient Woodland**: Deep forest greens and mossy textures.
- **Riverine Flow**: Cool aquas and deep teals emphasizing water movement.
- **Arid Canyon**: Dusty ochre and sun-scorched earth tones.
- **Mangrove Maze**: Murky swamp tones and brackish water for coastal wetlands.
- **Steel Metropolis**: Cold slate and concrete greys for a modern cityscape.

### Customizing Themes
You can easily add your own artistic themes by editing [src/core/artistic-themes.js](src/core/artistic-themes.js):

1. Open `artistic-themes.js`.
2. Add a new object to the `artisticThemes` export:
```javascript
your_theme_key: {
    name: "Your Theme Name",
    description: "Brief description of the style",
    bg: "#HEXCODE",           // Page/Background color
    text: "#HEXCODE",         // Labels and text color
    water: "#HEXCODE",        // Rivers, lakes, and oceans
    parks: "#HEXCODE",        // Green spaces and forests
    road_motorway: "#HEXCODE",
    road_primary: "#HEXCODE",
    road_secondary: "#HEXCODE",
    road_default: "#HEXCODE"
}
```
The application will automatically pick up the new theme and display it in the selection menu.

## 🛠️ Tech Stack

- **Framework**: Vanilla JavaScript (ES Modules)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Mapping**: [Leaflet](https://leafletjs.com/) & [MapLibre GL](https://maplibre.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Rendering**: [html2canvas](https://html2canvas.hertzen.com/)
- **Typography**: Outfit, Playfair Display, Cormorant Garamond (Google Fonts)

## 📦 Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites

* **Node.js**: Version 18.0.0 or higher
* **npm**: Usually comes with Node.js

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/dimartarmizi/map-to-poster.git
   cd map-to-poster
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

4. **Build for production**
   ```bash
   npm run build
   ```
   Optimized files will be generated in the `dist/` folder.

## 📜 Technical Overview

1. **State Management**: A reactive state store in `src/core/state.js` synchronizes changes between the UI and both map engines. Overlay position (`overlayX`, `overlayY`), field visibility (`showCountry`, `showCoords`), and all other poster settings are persisted to `localStorage`.
2. **Synchronized Viewports**: The Leaflet and MapLibre viewports are bidirectionally synced, ensuring consistency regardless of which interface is being manipulated.
3. **Draggable Overlay**: The city-label overlay is positioned with CSS `left`/`top` percentages and `translate(-50%, -50%)`. During drag and on every style update, the overlay's rendered `offsetWidth`/`offsetHeight` are read and used to clamp its position so it never bleeds outside the poster edges — providing a symmetric 8 px minimum gap on all four sides regardless of city name length.
4. **Capture Logic**: High-fidelity exports are achieved by scaling the map containers to the target resolution before rendering with `html2canvas` or internal GL buffers. The `onclone` callback replicates all live-preview styles — including overlay position clamping, vignette type, and field visibility — into the cloned document before capture.

## 📧 Contact

If you have any questions, suggestions, or just want to reach out, feel free to contact me at [dimartarmizi@gmail.com](mailto:dimartarmizi@gmail.com).

## ⚖️ License

This project is open-source and available under the [MIT License](LICENSE).
