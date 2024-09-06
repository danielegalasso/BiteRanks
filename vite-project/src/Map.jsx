import React, { useState, useEffect } from "react";
import "./styles.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Icon } from "leaflet";
import createClusterCustomIcon from "./CreateClusterCustomIcon";
import createCustomIcon from "./CreateCustomIcon";

// Function to dynamically generate colors based on category name
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const r = (hash >> 16) & 0xff;
  const g = (hash >> 8) & 0xff;
  const b = hash & 0xff;
  return `rgb(${r},${g},${b})`;
}

// Component to move the map to the user's location
function MoveToLocation({ position, geolocationEnabled }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      const zoomLevel = geolocationEnabled ? 7 : 5;
      map.setView(position, zoomLevel);
    }
  }, [position, map, geolocationEnabled]);

  return null;
}

export function Map({ markers }) {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renderMarkers, setRenderMarkers] = useState(false);
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);
  const defaultPosition = [48.8566, 2.3522]; // Paris fallback

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

  // Load markers after a delay to avoid lag during transitions
  useEffect(() => {
    if (position) {
      const timer = setTimeout(() => {
        setRenderMarkers(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [position]);

  return (
    <MapContainer center={defaultPosition} zoom={5} style={{ height: "100vh", width: "100vw" }}>
      {position && <MoveToLocation position={position} geolocationEnabled={geolocationEnabled} />}
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
        updateWhenIdle={false}
        keepBuffer={10}
      />

      {renderMarkers && (
        <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterCustomIcon}>
          {Object.keys(markers).map((category, categoryIndex) => {
            const iconColor = stringToColor(category);
            const customIcon = createCustomIcon(iconColor,12);

            return markers[category].map((pizzeria, pizzeriaIndex) =>
              pizzeria.coord.map((coords, coordsIndex) => (
                <Marker
                  key={`${categoryIndex}-${pizzeriaIndex}-${coordsIndex}`}
                  position={coords}
                  icon={customIcon}
                >
                  <Popup>
                    <b>
                      Rank: {pizzeria.position}
                      <br />
                    </b>
                    <a href={pizzeria.ref} target="_blank" rel="noopener noreferrer">
                      {pizzeria.name}
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
