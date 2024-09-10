// Map1.js
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import SchedaLocale from './scheda/SchedaLocale';


export const Map1 = ({ locations }) => {

  const nomeLocale = "Panificio Menchetti";
  const classifiche = [
    ["Top Pizza in Viaggio in Italia", 25, "https://example.com/top-pizza"],
    ["Tre Spicchi Gambero Rosso", 3, "https://example.com/gambero-rosso"]
  ];
  const linkGoogleMaps = "https://maps.google.com/?q=Panificio+Menchetti";
  const linkIndicazioniMaps = "https://maps.google.com/dir/?api=1&destination=Panificio+Menchetti";
  const linkSitoWeb = "https://www.panificiomenchetti.it";

  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: "100vh", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {locations.map((loc, index) => (
        <Marker key={index} position={loc.coordinates}>
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
      ))}
    </MapContainer>
  );
};
