import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";

// Gli edifici 3D (fill-extrusion) sono la parte più pesante da disegnare: ogni zoom costava
// fino a 3 volte di più. Si tengono gli edifici piatti, estesi a tutti i livelli di zoom.
function withFlatBuildings(style) {
  const layers = style.layers
    .filter((layer) => layer.type !== "fill-extrusion")
    .map((layer) => (layer.id === "building" ? { ...layer, maxzoom: undefined } : layer));
  return { ...style, layers };
}

// Layer vettoriale MapLibre dentro la mappa Leaflet (tile gratuite di OpenFreeMap, senza API key)
const MaplibreTileLayer = ({ style, attribution }) => {
  const map = useMap();

  useEffect(() => {
    let layer = null;
    let cancelled = false;
    const add = (styleOrUrl) => {
      if (cancelled) return;
      // fadeDuration 0: le etichette compaiono subito, senza ridisegni extra dopo ogni zoom
      layer = L.maplibreGL({ style: styleOrUrl, attribution, fadeDuration: 0 }).addTo(map);
    };
    fetch(style)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((json) => add(withFlatBuildings(json)))
      .catch(() => add(style)); // se lo stile non si scarica qui, lo carica MapLibre com'è
    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map, style, attribution]);

  return null;
};

export default MaplibreTileLayer;
