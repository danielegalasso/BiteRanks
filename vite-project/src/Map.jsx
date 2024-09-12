import React, { useState, useEffect, memo } from "react";
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

//export function Map({ markers }) {
export const Map = memo(({ markers }) => {
  console.log("Map component rendered"); // Questo ti dirà ogni volta che il componente viene ri-renderizzato.

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
        {markers.map((subclassifica, subclassificaIndex) => (
          Object.keys(subclassifica).map((category, categoryIndex) => (
            subclassifica[category].map((locale, localeIndex) =>
              locale.coord.map((coords, coordsIndex) => (
                <Marker
                  key={`${subclassificaIndex}-${categoryIndex}-${localeIndex}-${coordsIndex}`}
                  position={coords}
                  icon={createCustomIcon(category, locale.position)}
                >
                  <Popup>
                    <SchedaLocale 
                      nome={nomeLocale}  // Assumendo che "nome" sia una proprietà di "locale"
                      classifiche={classifiche} // Assumendo che "classifiche" sia una proprietà di "locale"
                      linkGoogleMaps={linkGoogleMaps} // Assumendo che "linkGoogleMaps" sia una proprietà di "locale"
                      linkIndicazioniMaps={linkIndicazioniMaps} // Assumendo che "linkIndicazioniMaps" sia una proprietà di "locale"
                      linkSitoWeb={linkSitoWeb} // Assumendo che "linkSitoWeb" sia una proprietà di "locale"
                    />
                  </Popup>
                </Marker>
              ))
            )
          ))
        ))}
      </MarkerClusterGroup>
      
      )}
    </MapContainer>
  );
});
