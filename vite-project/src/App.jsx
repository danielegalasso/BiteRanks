// App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import "./App.css";
import "leaflet/dist/leaflet.css";
import { Map } from "./Map"; // Importa il componente Map
import FoodSearch from "./home/FoodSearch";
import SearchBarWithAutocomplete from "./SearchBar";
import bowser from 'bowser';

// Dati dei marker
export default function App() {


  // Firefox shit
  useEffect(() => {
    const browser = bowser.getParser(window.navigator.userAgent);
    const browserName = browser.getBrowserName();

    if (browserName === 'Firefox') {
      // Crea un oggetto URL basato sulla URL corrente
      const currentUrl = new URL(window.location.href);

      // Aggiungi i parametri alla URL
      currentUrl.searchParams.set('lat', '41.9072293');
      currentUrl.searchParams.set('lng', '12.5015929');

      // Se l'URL è cambiato, aggiorna la pagina
      if (currentUrl.href !== window.location.href) {
        window.history.pushState({}, '', currentUrl.href);
        window.location.reload(); // Ricarica la pagina per applicare i nuovi parametri
      }
    }
  }, []);



  const [selectedItems, setSelectedItems] = useState([]); // Stato per gli elementi selezionati
  // State to hold markers data
  const [markers, setMarkers] = useState([]);
  const [isFoodSearchVisible, setFoodSearchVisible] = useState(true);
  const [activeTab, setActiveTab] = useState("food"); // Stato per gestire quale pulsante è attivo

  useEffect(() => {
    // Ottieni la query string dalla URL
    const searchParams = new URLSearchParams(window.location.search);

    // Estrai lat, lng, e locale dalla query string
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const ranking = searchParams.get('ranking');
    const subranking = searchParams.get('subranking');

    if (lat && lng && ranking && subranking) {
      setFoodSearchVisible(false);
    }
  }, []);

  // Style per il background overlay
  const overlayStyle = isFoodSearchVisible ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1
  } : {};

  return (
      <Router>
        <Routes>
          <Route path="/" element={
            <>
              {/* Overlay scuro per tutto il contenuto */}
              {isFoodSearchVisible && <div style={overlayStyle} />}
              
              {/* Contenuto principale */}
              <div style={{ position: 'relative', zIndex: 0 }}>
                <Map markers={markers} />
                <SearchBarWithAutocomplete 
                  sfsv={setFoodSearchVisible} 
                  isFSV={isFoodSearchVisible}  
                  selectedItems={selectedItems} 
                  setSelectedItems={setSelectedItems}
                  markers={markers} 
                  setMarkers={setMarkers}
                />
                </div>
                {isFoodSearchVisible && 
                  <FoodSearch 
                    sfsv={setFoodSearchVisible} 
                    selectedItems={selectedItems} 
                    setSelectedItems={setSelectedItems} 
                    markers={markers} 
                    setMarkers={setMarkers} 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab}
                  />}
            
            </>
          }/>
        </Routes>
      </Router>
  );
}
