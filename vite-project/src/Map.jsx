import React, { useState, useEffect, memo, useRef} from "react";
import "./Map.css";
import "leaflet/dist/leaflet.css";
import { useSearchParams, useLocation } from 'react-router-dom'; // Aggiunto
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import createClusterCustomIcon from "./CreateClusterCustomIcon";
import createCustomIcon from "./CreateCustomIcon";
import SchedaLocale from "./scheda/SchedaLocale";

const getZoomLevelByDistance = (distance) => {
  // Punti di riferimento per distanza e zoom
  const referencePoints = [
    { distance: 0.22, zoom: 18 },
    { distance: 16, zoom: 14 },
    { distance: 162, zoom: 10 },
    { distance: 694, zoom: 8 },
    { distance: 1656.38, zoom: 6 }
  ];
  // Ordina i punti di riferimento per distanza crescente
  referencePoints.sort((a, b) => a.distance - b.distance);
  // Trova i due punti di riferimento tra i quali la distanza rientra
  for (let i = 0; i < referencePoints.length - 1; i++) {
    const start = referencePoints[i];
    const end = referencePoints[i + 1];
    if (distance >= start.distance && distance <= end.distance) {
      // Interpola tra i due punti di riferimento
      const ratio = (distance - start.distance) / (end.distance - start.distance);
      return start.zoom + ratio * (end.zoom - start.zoom);
    }
  }
  // Se la distanza è inferiore al primo punto di riferimento, restituisci il livello di zoom massimo
  if (distance < referencePoints[0].distance) {
    return referencePoints[0].zoom;
  }
  // Se la distanza è superiore all'ultimo punto di riferimento, restituisci il livello di zoom minimo
  return referencePoints[referencePoints.length - 1].zoom;
};

// Component to move the map to the user's location
function MoveToLocation({ position, geolocationEnabled}) {
  const map = useMap();
  const location = useLocation();
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const type = searchParams.get('type'); //TYPE POSSIBILI: road, attraction, neighbourhood, city, country
    const distanceArea = searchParams.get('distance'); // distanza in km della citta (simile all'area)
    if (lat && lng) {
      if(distanceArea){ //se è presente distanceArea nell'url grazie al FoodSearch 
        const zoomLevel = getZoomLevelByDistance(parseFloat(distanceArea));
        map.setView([parseFloat(lat), parseFloat(lng)], zoomLevel);
      }
      else{ //se non è presente distanceArea nell'url, ma sono presenti le coordinate, vuol dire che è il link per la posizione di un ristorante
        map.setView([parseFloat(lat), parseFloat(lng)], 15);
      }      
    } else if (position) { //se non è presente ho è un link, oppure ho acceduto normalmente
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

  console.log("markers:");
  console.log(markers)
  
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
        {Object.entries(markers).map(([classificaKey, classifica], classificaIndex) => (
          Object.entries(classifica).map(([subclassificaKey, subclassifica], subclassificaIndex) => (
            Object.entries(subclassifica).map(([categoryKey, category], categoryIndex) => (
              category.map((locale, localeIndex) =>
                locale.coord.map((coords, coordsIndex) => {
                  const nomeLocale = locale.name;

                  const nomeClassifica = locale.ranking;
                  const subclassifiche = [[locale["sub-ranking"], locale.position, locale.ref]];
                  const linkGoogleMaps = `https://www.google.com/maps?q=${coords[0]},${coords[1]}`;
                  const linkIndicazioniMaps = `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`;
                  const linkSitoWeb = locale.website; // Corretto da `webisite` a `website`

                  const nomeChiaveJson = Object.keys(markers)[0];
                  
                  return (
                    <Marker
                      key={`${classificaIndex}-${subclassificaIndex}-${categoryIndex}-${localeIndex}-${coordsIndex}`}
                      position={coords}
                      //icon={createCustomIcon(nomeClassifica, categoryKey, locale.position)}
                      icon={createCustomIcon(nomeClassifica, categoryKey, locale.position, locale["sub-ranking"], nomeChiaveJson)}
                      ref={el => markerRefs.current[`${categoryIndex}-${localeIndex}-${coordsIndex}`] = el}
                    >
                      <Popup>
                        <SchedaLocale
                          nome={nomeLocale}
                          nomeClassifica = {nomeClassifica}
                          subclassifiche={subclassifiche}
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
          ))
        ))}
      </MarkerClusterGroup>
      
      
      
      )}
    </MapContainer>
  );
});
