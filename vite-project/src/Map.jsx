import React, { useState, useEffect, memo } from "react";
import "./Map.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import createClusterCustomIcon from "./CreateClusterCustomIcon";
import createCustomIcon from "./CreateCustomIcon";
import SchedaLocale from "./scheda/SchedaLocale";
//chidi
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
  const [renderMarkers, setRenderMarkers] = useState(false);
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);
  const defaultPosition = [48.8566, 2.3522]; // Paris fallback

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setGeolocationEnabled(true);
        },
        () => {
          setPosition(defaultPosition);
          setGeolocationEnabled(false);
        }
      );
    } else {
      setPosition(defaultPosition);
      setGeolocationEnabled(false);
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
              locale.coord.map((coords, coordsIndex) => {
                const nomeLocale = locale.name;
                const classifiche = [
                  [Object.keys(subclassifica)[0], locale.position, locale.ref],
                ];
                const linkGoogleMaps = `https://www.google.com/maps?q=${coords[0]},${coords[1]}`;
                const linkIndicazioniMaps = `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`;
                const linkSitoWeb = locale.webisite;
      
                return (
                  <Marker
                    key={`${subclassificaIndex}-${categoryIndex}-${localeIndex}-${coordsIndex}`}
                    position={coords}
                    icon={createCustomIcon(category, locale.position)}
                    ref={el => markerRefs.current[`${categoryIndex}-${localeIndex}-${coordsIndex}`] = el}
                  >
                    <Popup>
                      <SchedaLocale
                        nome={nomeLocale}
                        classifiche={classifiche}
                        linkGoogleMaps={linkGoogleMaps}
                        linkIndicazioniMaps={linkIndicazioniMaps}
                        linkSitoWeb={linkSitoWeb}
                        coords={coords}
                      />
                    </Popup>
                  </Marker>
                );
              })
            )
          ))
        ))}
      </MarkerClusterGroup>
      
      
      )}
    </MapContainer>
  );
});
