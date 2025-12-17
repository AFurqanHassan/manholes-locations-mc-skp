# Manhole Locations & Zones - MC SKP

An interactive web map visualizing manhole covers and zones for MC Sheikhupura (SKP). This project was generated using QGIS2Web and customized with modern styling and image integration.

## 🌍 Live Demo

[**View the Map**](https://AFurqanHassan.github.io/manholes-locations-mc-skp/)

## ✨ Features

- **Interactive Mapping**: Seamlessly zoom, pan, and explore the municipality's data.
- **Image Popups**: Click on any manhole cover to view on-site photographs.
  - _Smart Fallback_: Automatically handles local and remote image paths.
- **Layer Control**:
  - Toggle visibility for "Manhole Covers", "MC SKP Zones", and "OSM Standard".
  - Custom-styled legend with modern aesthetics (rounded corners, shadows).
- **Search Functionality**: Quickly find locations using the integrated address search.
- **Measurement Tools**: Measure distances and areas directly on the map.
- **Responsive Design**: optimized for both desktop and mobile viewing.

## 🛠️ Technologies Used

- **QGIS**: Used for data preparation and management.
- **qgis2web**: Plugin to export QGIS projects to web maps.
- **Leaflet.js**: Open-source JavaScript library for mobile-friendly interactive maps.
- **HTML5 & CSS3**: Custom styling for popups and controls.

## 📂 Project Structure

```
├── css/             # Stylesheets (Leaflet, FontAwesome, custom styles)
├── data/            # GeoJSON data files (ManholeCovers, Zones)
├── images/          # Image assets for popups
├── js/              # JavaScript libraries (Leaflet plugins, logic)
├── legend/          # Icons for the layer control
├── index.html       # Main entry point
└── README.md        # Project documentation
```

## 🚀 How to Run Locally

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/AFurqanHassan/manholes-locations-mc-skp.git
    cd manholes-locations-mc-skp
    ```

2.  **Start a local server**:
    Since this project fetches local JSON data, it requires a local web server to run correctly (opening `index.html` directly may cause CORS errors).

    - **Using Python**:
      ```bash
      python -m http.server 8000
      ```
    - **Using Node.js**:
      ```bash
      npx http-server
      ```

3.  **Open in Browser**:
    Navigate to `http://localhost:8000` to view the map.

## 👤 Author

**Ahmad Furqan Hassan**

---

_Generated with QGIS 3.x and qgis2web._
