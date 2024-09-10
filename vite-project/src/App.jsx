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

// Layout persistente per mantenere il componente Map montato
const MapLayout = ({ markers }) => {
  return (
    <div className="map-layout">
      {/* Map rimane sempre montato */}
      <Map markers={markers} />

      {/* Le altre pagine saranno rese qui */}
      <Outlet /> 
    </div>
  );
};

// Dati dei marker
export default function App() {
  // State to hold markers data
  const [markers, setMarkers] = useState([]);

  // Fetch data from the local JSON file
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("./ranking/50topitaly.json", {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        const data = await response.json();
        console.log("Data fetched: ", data);
        // Transform data to match the markers structure
        //const transformedMarkers = transformDataToMarkers(data);
        setMarkers(data);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  const emptyMarkers = []; 
 /*
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="app-container">
            <div className="map-container">
              <Map markers={[]} />
            </div>
            <div className="food-search-container">
              <FoodSearch />
            </div>
          </div>
        }/>
        <Route path="/*" element={<MapLayout markers={markers} />}>
          <Route path="map" element={<SearchBarWithAutocomplete />} />
          <Route path="local" element={
            <div className="scheda-locale-container">
              <SchedaLocale />
              <SearchBarWithAutocomplete />
            </div>
          } />
        </Route>
      </Routes>
    </Router>
  );
  */
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <>
        {/* Landing Page */}
        <div className="app-container">
          <div className="map-container">
            <Map markers={emptyMarkers} />
          </div>
          <div className="food-search-container">
            <FoodSearch />
          </div>
        </div>
          </>
        }/>
        <Route path="/map" element={
          <>         
          <Map markers={markers} />
          <SearchBarWithAutocomplete />
          </>
        }/> 
        <Route path="/local" element={
          <>
          <Map markers={markers} />
          <div className="scheda-locale-container">
          <SchedaLocale />
          <SearchBarWithAutocomplete />
          </div>
          </>
        }/>
      </Routes>
    </Router>
  );
}
