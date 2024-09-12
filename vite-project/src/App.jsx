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
          {isFoodSearchVisible && <FoodSearch sfsv = {setFoodSearchVisible} selectedItems={selectedItems} setSelectedItems={setSelectedItems} markers={markers} setMarkers={setMarkers}/>}

          </>
        }/>
        {/* AGGIUNTA DA ME /map NON CI DOVREBBE ESSERE*/ }
        <Route path="/map" element={
          <>         
          <Map markers={markers} />
          <SearchBarWithAutocomplete />
          </>
        }/> 
      </Routes>
    </Router>
  );
}
