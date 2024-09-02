// Map.jsx
import React from "react";
import "./styles.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Icon, divIcon, point } from "leaflet";
import createClusterCustomIcon from "./CreateClusterCustomIcon";
import createCustomIcon from "./CreateCustomIcon";


//creazione mappa che associa per ad ogni classifica un colore
const colorMapping = {
  "50 Top Pizza Italia 2024": "red",
  "50 Top Pizza Italia 2024 Pizzerie Eccellenti": "blue",
  "50 Top Pizze In Viaggio 2024": "yellow",
  "50 Top Usa 2024": "orange",
  "50 top sushi": "green",
  // Aggiungi altre classifiche qui
};

// Componente Map modificato per accettare marker come props
export function Map({ markers }) {
  return (
    <MapContainer
      center={[48.8566, 2.3522]}
      zoom={5} // Diminuito lo zoom per mostrare più marker all'inizio
      style={{ height: "100vh", width: "100vw" }}
    >
      {/* Layer di OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      {/* Cluster dei marker */}
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterCustomIcon}
      >
        {markers.map((category, categoryIndex) => {
          const categoryName = category[0];
          const iconColor = colorMapping[categoryName] || "black"; // Nero di default se non mappato
          const customIcon = createCustomIcon(iconColor);
          //alert(iconColor + " " + categoryName);

          return category[1].map((entry, entryIndex) =>
            entry[2].map((coords, coordsIndex) => (
              <Marker
                key={`${categoryIndex}-${entryIndex}-${coordsIndex}`}
                position={coords}
                icon={customIcon}
              >
                <Popup>
                  <a href={entry[1]} target="_blank" rel="noopener noreferrer">
                    {entry[0]}
                  </a>
                </Popup>
              </Marker>
            ))
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
