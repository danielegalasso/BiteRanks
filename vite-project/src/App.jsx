// App.jsx
import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import "./App.css";
import "leaflet/dist/leaflet.css";
import { Map } from "./Map"; // Importa il componente Map
import FoodSearch from "./home/FoodSearch";
import SchedaLocale from "./scheda/SchedaLocale";
import SearchBarWithAutocomplete from "./SearchBar";
import TextPlusIcon from "./home/TextPlusIcon";

// Dati dei marker
export default function App() {

  const [selectedItems, setSelectedItems] = useState([]); // Stato per gli elementi selezionati

  const nomeLocale = "Panificio Menchetti";
  const classifiche = [
    ["Top Pizza in Viaggio in Italia", 25, "https://example.com/top-pizza"],
    ["Tre Spicchi Gambero Rosso", 3, "https://example.com/gambero-rosso"]
  ];
  const linkGoogleMaps = "https://maps.google.com/?q=Panificio+Menchetti";
  const linkIndicazioniMaps = "https://maps.google.com/dir/?api=1&destination=Panificio+Menchetti";
  const linkSitoWeb = "https://www.panificiomenchetti.it";
  const locations = [
    {
      nome: 'Luogo 1',
      coordinates: [51.505, -0.09],
      classifiche: [['Classifica 1', 1, 'https://link1.com']],
      linkGoogleMaps: 'https://maps.google.com',
      linkIndicazioniMaps: 'https://maps.google.com/dir',
      linkSitoWeb: 'https://example.com'
    },
    {
      nome: 'Luogo 2',
      coordinates: [51.515, -0.1],
      classifiche: [['Classifica 2', 2, 'https://link2.com']],
      linkGoogleMaps: 'https://maps.google.com',
      linkIndicazioniMaps: 'https://maps.google.com/dir',
      linkSitoWeb: 'https://example.com'
    }
  ];


  // State to hold markers data
  const [markers, setMarkers] = useState([]);


  const [isFoodSearchVisible, setFoodSearchVisible] = useState(true);




  

  const emptyMarkers = []; 

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <>         
          <Map markers={markers} />
          <SearchBarWithAutocomplete sfsv = {setFoodSearchVisible} isFSV = {isFoodSearchVisible}  selectedItems={selectedItems} setSelectedItems={setSelectedItems}/>
          {isFoodSearchVisible && <FoodSearch sfsv = {setFoodSearchVisible} selectedItems={selectedItems} setSelectedItems={setSelectedItems} setMarkers={setMarkers}/>}

          </>
        }/>


      
      

      </Routes>
    </Router>
  );
}
