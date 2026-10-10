import React, { useState, useEffect, memo } from "react";
import "./Map.css";
import "leaflet/dist/leaflet.css";
import { useSearchParams, useLocation } from 'react-router-dom'; // Aggiunto
import { MapContainer, useMap, LayersControl } from "react-leaflet";
import L from "leaflet";
import MarkersLayer from "./MarkersLayer";
import MaplibreTileLayer from "./MaplibreTileLayer";
import BestPizzaPanel from "./bestPizza/BestPizzaPanel";

const { BaseLayer} = LayersControl;

// Funzione per stampare i bounds dopo ogni zoom/pan
function LogMapBounds() {
  const map = useMap();

  useEffect(() => {
    const logBounds = () => {
      const zoom = map.getZoom();
      if (zoom < 3) {
        map.setZoom(3); // Imposta lo zoom a 3 se è minore di 3
        return; // Esci dalla funzione per evitare di stampare i bounds dopo l'azione
      }
      const bounds = map.getBounds();
      console.log("Zoom level:", zoom);
      console.log("Bounds:", bounds);
      //alert(`Zoom level: ${zoom}\nBounds: ${bounds.toBBoxString()}`); // Visualizzazione bounds su schermo tramite alert
    };

    map.on("moveend", logBounds); // Ascolta ogni movimento della mappa
    return () => {
      map.off("moveend", logBounds); // Rimuovi listener quando il componente viene smontato
    };
  }, [map]);

  return null;
}

// Component to move the map to the user's location
function MoveToLocation({ position, geolocationEnabled}) {
  const map = useMap();
  const location = useLocation();

  useEffect(() => {
    window.mapInstance = map; // Salva l'istanza della mappa globalmente
  }, [map]);
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const ranking = searchParams.get('ranking');
    const subranking = searchParams.get('subranking');
    const type = searchParams.get('type'); //TYPE POSSIBILI: road, attraction, neighbourhood, city, country
    const distanceArea = searchParams.get('distance'); // distanza in km della citta (simile all'area)
    if (lat && lng) {
      if(distanceArea){ //se è presente distanceArea nell'url grazie al FoodSearch 
        // l'area cercata (diagonale in km) deve stare tutta nello schermo, qualunque sia la sua dimensione
        const halfSideKm = parseFloat(distanceArea) / 2 / Math.SQRT2;
        const dLat = halfSideKm / 111.32;
        const dLng = halfSideKm / (111.32 * Math.cos(parseFloat(lat) * Math.PI / 180));
        const area = L.latLngBounds(
          [parseFloat(lat) - dLat, parseFloat(lng) - dLng],
          [parseFloat(lat) + dLat, parseFloat(lng) + dLng]
        );
        const zoomLevel = Math.min(map.getBoundsZoom(area), 17);
        map.setView([parseFloat(lat), parseFloat(lng)], zoomLevel);
      }
      else{ 
        if (ranking && subranking){ // se è un link di una scheda
          map.setView([parseFloat(lat), parseFloat(lng)], 15);
          console.log("sono qui");
        }
        else{ //se qualcuno a digitato a mano le coordinate
          map.setView([parseFloat(lat), parseFloat(lng)], 10);
        }
      }  
    } else if (position) { //se non è presente ho è un link, oppure ho acceduto normalmente
      const zoomLevel = 10;  // lo metto sempre a 7 per ottimizzazione del codice al caricamento della pagina
      map.setView(position, zoomLevel);
    }
  }, [position, map, geolocationEnabled, location]);

  return null;
}

//export function Map({ markers }) {
export const Map = memo(({ markers }) => {
  //console.log("Map component rendered"); // Questo ti dirà ogni volta che il componente viene ri-renderizzato.
  const [position, setPosition] = useState(null);
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);
  const defaultPosition = [41.9028, 12.4964]; // Rome fallback
  const [searchParams] = useSearchParams(); // Aggiunto per leggere i parametri

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

  //console.log("markers:");
  //console.log(markers)
  
  return (
    <MapContainer center={defaultPosition} zoom={10} maxZoom={20} zoomControl={false}>
      {position && <MoveToLocation position={position} geolocationEnabled={geolocationEnabled} />}
      
      <MaplibreTileLayer
        style="https://tiles.openfreemap.org/styles/liberty"
        attribution='<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
      />
      {/* Aggiungi qui il componente LogMapBounds per loggare i bounds e il livello di zoom */}

      {position && <MoveToLocation position={position} geolocationEnabled={geolocationEnabled} />}

      <BestPizzaPanel />

      <MarkersLayer markers={markers} />
    </MapContainer>
  );
});
