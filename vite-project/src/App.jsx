// App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "./App.css";
import "leaflet/dist/leaflet.css";
import { Map } from "./Map"; // Importa il componente Map
import { Map1 } from "./Map1"; // Importa il componente Map
import FoodSearch from "./home/FoodSearch";
import SchedaLocale from "./scheda/SchedaLocale";
import SearchBarWithAutocomplete from "./SearchBar";
import TextPlusIcon from "./home/TextPlusIcon";

// Dati dei marker
export default function App() {

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

        <Route path="/map1" element={
          <>         
          <Map1 locations={locations}/>
          </>
        }/> 
      
        <Route path="/local" element={
          <>
          <Map markers={markers} />
          <div className="scheda-locale-container">
          <SchedaLocale 
            nome={nomeLocale}
            classifiche={classifiche}
            linkGoogleMaps={linkGoogleMaps}
            linkIndicazioniMaps={linkIndicazioniMaps}
            linkSitoWeb={linkSitoWeb}
          />
          <SearchBarWithAutocomplete />
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
