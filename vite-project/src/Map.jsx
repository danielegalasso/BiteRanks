import React, { useState, useEffect } from "react";
import "./Map.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Icon } from "leaflet";
import createClusterCustomIcon from "./CreateClusterCustomIcon";
import createCustomIcon from "./CreateCustomIcon";
import SchedaLocale from "./scheda/SchedaLocale";

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


  const nomeLocale = "Panificio Menchetti";
  const classifiche = [
    ["Top Pizza in Viaggio in Italia", 25, "https://example.com/top-pizza"],
    ["Tre Spicchi Gambero Rosso", 3, "https://example.com/gambero-rosso"]
  ];
  const linkGoogleMaps = "https://maps.google.com/?q=Panificio+Menchetti";
  const linkIndicazioniMaps = "https://maps.google.com/dir/?api=1&destination=Panificio+Menchetti";
  const linkSitoWeb = "https://www.panificiomenchetti.it";

  return (
    <MapContainer center={defaultPosition} zoom={5} zoomControl={false}>
      {position && <MoveToLocation position={position} geolocationEnabled={geolocationEnabled} />}
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
        updateWhenIdle={false}
        keepBuffer={10}
      />

      <div className="map-control-bottom-right">
      <ZoomControl position="bottomright" />
      </div>

      {renderMarkers && (
        <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterCustomIcon}>
          {Object.keys(markers).map((category, categoryIndex) => {

            //locale = pizzeria/gelateria/ristorante presente nelle varie classifiche.
            return markers[category].map((locale, localeIndex) =>
              locale.coord.map((coords, coordsIndex) => (
                <Marker
                  key={`${categoryIndex}-${localeIndex}-${coordsIndex}`}
                  position={coords}
                  icon={createCustomIcon(category,locale.position)}
                >
                  <Popup>
                    <SchedaLocale 
                      nome={nomeLocale}
                      classifiche={classifiche}
                      linkGoogleMaps={linkGoogleMaps}
                      linkIndicazioniMaps={linkIndicazioniMaps}
                      linkSitoWeb={linkSitoWeb}
                    />
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
