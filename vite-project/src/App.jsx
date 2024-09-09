// App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "./App.css";
import "leaflet/dist/leaflet.css";
import { Map } from "./Map"; // Importa il componente Map
import FoodSearch from "./home/FoodSearch";
import SchedaLocale from "./scheda/SchedaLocale";
import SearchBarWithAutocomplete from "./SearchBar";
import TextPlusIcon from "./home/TextPlusIcon";

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
        

        
        
            <SchedaLocale />


            {/*
            <Map markers={markers} />
            <FoodSearch />
            <SchedaLocale />
            */}
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
          </div>
          </>
          
        }/>

      </Routes>
    </Router>
  );
  
  return (
    <div>
      {/* Pass markers as props to the Map component */}
      <Map markers={markers} />
      <FoodSearch />
    </div>
  );
}
