// Map.jsx
import React, { useState, useEffect} from "react";
import "./styles.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

// Componente per spostare la mappa alla posizione dell'utente
function MoveToLocation({ position, geolocationEnabled }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      const zoomLevel = geolocationEnabled ? 7 : 5; // Più zoomato se geolocalizzazione abilitata, altrimenti vista globale
      map.setView(position, zoomLevel);
    }
  }, [position, map, geolocationEnabled]);

  return null;
}

export function Map({ markers }) {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renderMarkers, setRenderMarkers] = useState(false);
  const [geolocationEnabled, setGeolocationEnabled] = useState(false); // Nuovo stato per geolocalizzazione
  const defaultPosition = [48.8566, 2.3522]; // Parigi come fallback

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setGeolocationEnabled(true);
          setLoading(false);
        },
        () => {
          setPosition(defaultPosition);
          setGeolocationEnabled(false);
          setLoading(false);
        }
      );
    } else {
      setPosition(defaultPosition);
      setGeolocationEnabled(false);
      setLoading(false);
    }
  }, []);

  // Caricamento ritardato dei marker per evitare lag durante la transizione
  useEffect(() => {
    if (position) {
      const timer = setTimeout(() => {
        setRenderMarkers(true);
      }, 1000); // Ritardo di 1 secondo per il caricamento dei marker
      return () => clearTimeout(timer);
    }
  }, [position]);

  return (
    <MapContainer
      center={defaultPosition} // Partenza dalla vista generale
      zoom={5}
      style={{ height: "100vh", width: "100vw" }}
    >
      {position && <MoveToLocation position={position} geolocationEnabled={geolocationEnabled} />}
      
      {/* Layer di OpenStreetMap con opzioni di caricamento ottimizzate */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
        updateWhenIdle={false} // Carica i tile solo durante il movimento della mappa
        keepBuffer={10} // Mantiene un buffer di tile extra per un rendering più fluido
      />

      {/* Caricamento dei marker solo dopo la transizione */}
      {renderMarkers && (
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
        >
          {markers.map((category, categoryIndex) => {
            const categoryName = category[0];
            const iconColor = stringToColor(categoryName);
            const customIcon = createCustomIcon(iconColor);

            return category[1].map((entry, entryIndex) =>
              entry[2].map((coords, coordsIndex) => (
                <Marker
                  key={`${categoryIndex}-${entryIndex}-${coordsIndex}`}
                  position={coords}
                  icon={customIcon}
                >
                  <Popup>
                    <a
                      href={entry[1]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {entry[0]}
                    </a>
                  </Popup>
                </Marker>
              ))
            );
          })}
        </MarkerClusterGroup>
      )}
    </MapContainer>
  );
}