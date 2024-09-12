import React, { useState, useEffect, memo, useRef } from "react";
import "./Map.css";
import "leaflet/dist/leaflet.css";
import { useSearchParams, useLocation } from 'react-router-dom'; // Aggiunto
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import createClusterCustomIcon from "./CreateClusterCustomIcon";
import createCustomIcon from "./CreateCustomIcon";
import SchedaLocale from "./scheda/SchedaLocale";

// Component to move the map to the user's location
function MoveToLocation({ position, geolocationEnabled}) {
  const map = useMap();
  const location = useLocation();
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (lat && lng) {
      // Se le coordinate sono presenti nell'URL, imposta lo zoom a 17
      const targetCoords = [parseFloat(lat), parseFloat(lng)];
      map.setView(targetCoords, 17);
      
    } else if (position) {
      // Se la geolocalizzazione è attiva zoomma a 7, altrimenti a 5 (quando l'utente non imposta la geolocalizzazione)
      const zoomLevel = geolocationEnabled ? 7 : 5;
      map.setView(position, zoomLevel);
    }
  }, [position, map, geolocationEnabled, location]);

  return null;
}

//export function Map({ markers }) {
export const Map = memo(({ markers }) => {
  //console.log("Map component rendered"); // Questo ti dirà ogni volta che il componente viene ri-renderizzato.
  const [position, setPosition] = useState(null);
  const [renderMarkers, setRenderMarkers] = useState(false);
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);
  const defaultPosition = [48.8566, 2.3522]; // Paris fallback
  const [searchParams] = useSearchParams(); // Aggiunto per leggere i parametri
  const markerRefs = useRef({}); // To store references to markers

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (lat && lng) {
      // Se ci sono lat e lng nell'URL, sposta la mappa a quelle coordinate
      setPosition(parseFloat(lat), parseFloat(lng));
    } else if (navigator.geolocation) {
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
  }, [searchParams]);

  // Load markers after a delay to avoid lag during transitions
  // FUNZIONE HOOK che si attiva ogni volta che la variabile position cambia
  useEffect(() => {
    if (position) {
      setRenderMarkers(true);
    }
  }, [position]);
  
  useEffect(() => {
    // Stampa i riferimenti e i marker nel log per debug
    console.log("Riferimenti ai marker creati: ", Object.keys(markerRefs.current).length);
    console.log("Numero totale dei marker attesi: ", Object.keys(markers).reduce((total, cat) => total + markers[cat].length, 0));
    
    // Calcola il numero totale di marker attesi, ovvero la somma di tutti i marker per categoria
    const expectedMarkersCount = Object.keys(markers).reduce((total, cat) => total + markers[cat].length, 0);
    
    // Se tutti i marker sono stati caricati, apri il popup del marker corrispondente alle coordinate nell'URL
    if (Object.keys(markerRefs.current).length >= expectedMarkersCount - 1) {
      console.log("Tutti i marker sono stati caricati");
      const lat = searchParams.get('lat');
      const lng = searchParams.get('lng');

      console.log("Latitudine e longitudine dall'URL: ", lat, lng);
      if (lat && lng) {
        const targetCoords = [parseFloat(lat), parseFloat(lng)];
      
        // Utilizza setTimeout per ritardare l'apertura del popup dopo 500ms (puoi modificare il tempo in base alle tue esigenze)
        setTimeout(() => {
          Object.values(markerRefs.current).forEach(marker => {
            if (marker && marker.getLatLng().equals(targetCoords)) {
              console.log("Apertura popup per il marker alle coordinate: ", targetCoords);
              marker.openPopup();
            }
          });
        }, 500);
      }
    }
  }, [markerRefs.current, markers]); 

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
      {position && <MoveToLocation position={position} geolocationEnabled={geolocationEnabled}/>}
      
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
