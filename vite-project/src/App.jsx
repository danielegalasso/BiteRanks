// App.jsx
import React, { useState, useEffect } from "react";
import "./styles.css";
import "leaflet/dist/leaflet.css";
import { Map } from "./Map"; // Importa il componente Map
import FoodSearch from "./home/FoodSearch";

// Dati dei marker
export default function App() {
  // State to hold markers data
  const [markers, setMarkers] = useState([]);

  // Fetch data from the local JSON file
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("./allCoordinates.json", {
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

 

  return (
    <div>
      {/* Pass markers as props to the Map component */}
      <Map markers={markers} />
    </div>
  );
}
