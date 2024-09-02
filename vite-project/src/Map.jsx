// Map.jsx
import React from "react";
import "./styles.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Icon, divIcon, point } from "leaflet";

// Creazione di un'icona personalizzata
const customIcon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
  iconSize: [38, 38], // Dimensione dell'icona
});

// Funzione per creare l'icona personalizzata del cluster
const createClusterCustomIcon = function (cluster) {
  return new divIcon({
    html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
    className: "custom-marker-cluster",
    iconSize: point(33, 33, true),
  });
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
        {/* Mappatura dei marker passati come props */}
        {markers.map((pizzeria, pizzeriaIndex) =>
          pizzeria[1].map((entry, entryIndex) =>
            entry[2].map((coords, coordsIndex) => (
              <Marker
                key={`${pizzeriaIndex}-${entryIndex}-${coordsIndex}`}
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
          )
        )}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
