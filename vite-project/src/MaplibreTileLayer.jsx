import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";

// Layer vettoriale MapLibre dentro la mappa Leaflet (tile gratuite di OpenFreeMap, senza API key)
const MaplibreTileLayer = ({ style, attribution }) => {
  const map = useMap();

  useEffect(() => {
    const layer = L.maplibreGL({ style, attribution }).addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, style, attribution]);

  return null;
};

export default MaplibreTileLayer;
