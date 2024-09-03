// Map.jsx
import React from "react";
import "./styles.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Icon, divIcon, point } from "leaflet";
import createClusterCustomIcon from "./CreateClusterCustomIcon";
import createCustomIcon from "./CreateCustomIcon";

//per generare dinamicamente colori in base al nome della classifica, senza aver bisogno di un map classifica-> che renderebbe il
//codice poco flessibile
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const r = (hash >> 16) & 0xFF;
  const g = (hash >> 8) & 0xFF;
  const b = hash & 0xFF;
  return `rgb(${r},${g},${b})`;
}

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
          const iconColor = stringToColor(categoryName); // Nero di default se non mappato
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
