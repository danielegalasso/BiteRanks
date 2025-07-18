// App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import "./App.css";
import "leaflet/dist/leaflet.css";
import { Map } from "./Map"; // Importa il componente Map
import SearchBarWithAutocomplete from "./SearchBar";
import bowser from 'bowser';
import { Helmet, HelmetProvider } from 'react-helmet-async'; // Importa Helmet

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

  // State to hold markers data
  const [markers, setMarkers] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // Mantenuto per compatibilità con SearchBar

  // Carica automaticamente i dati di 50 Top Pizza all'avvio
  useEffect(() => {
    const load50TopPizzaData = async () => {
      try {
        // Percorso per 50 Top Pizza (assumendo che sia nel formato corretto)
        const rankingPath = '/ranking/50_Top_Pizza/';
        
        // Fetch dell'index.json per ottenere la lista dei file
        const indexResponse = await fetch(`${rankingPath}index.json`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!indexResponse.ok) {
          console.error("Errore nel recupero dell'index.json di 50 Top Pizza");
          return;
        }

        const files = await indexResponse.json();
        
        // Inizializza i dati per 50 Top Pizza
        const allData = {};
        allData["50 Top Pizza"] = [];

        // Fetch di tutti i file della classifica
        for (const file of files) {
          try {
            const filePath = `${rankingPath}${file}`;
            const response = await fetch(filePath, {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            });

            if (!response.ok) {
              console.error(`Errore nel recupero del file: ${filePath}`);
              continue;
            }

            const data = await response.json();
            allData["50 Top Pizza"].push(data);
          } catch (error) {
            console.error(`Errore durante il recupero del file ${file}:`, error);
          }
        }

        console.log("Dati 50 Top Pizza caricati:", allData);
        setMarkers(allData);
        
      } catch (error) {
        console.error('Errore durante il caricamento dei dati di 50 Top Pizza:', error);
      }
    };

    load50TopPizzaData();
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <>
              <Helmet>
                <title>50 Top Pizza - La tua guida alle migliori pizzerie</title>
                <meta name="description" content="Scopri le migliori pizzerie d'Italia con la classifica ufficiale di 50 Top Pizza" />
                <meta name="keywords" content="50 top pizza, migliori pizzerie, pizza napoletana, pizzerie italia" />
                <meta property="og:title" content="50 Top Pizza - La tua guida alle migliori pizzerie" />
                <meta property="og:description" content="Trova le migliori pizzerie d'Italia con la classifica ufficiale di 50 Top Pizza" />
                <meta property="og:url" content="https://biteranks.com" />
                <meta property="og:site_name" content="50 Top Pizza" />
                <meta property="og:image" content="https://biteranks.com/public/logo.png" />
              </Helmet>
              
              {/* Contenuto principale - sempre visibile */}
              <div style={{ position: 'relative', zIndex: 0 }}>
                <Map markers={markers} />
                <SearchBarWithAutocomplete 
                  sfsv={() => {}} // Funzione vuota dato che non abbiamo più FoodSearch
                  isFSV={false}  // Sempre false dato che FoodSearch non esiste più
                  selectedItems={selectedItems} 
                  setSelectedItems={setSelectedItems}
                  markers={markers} 
                  setMarkers={setMarkers}
                />
              </div>
            </>
          }/>
        </Routes>
      </Router>
    </HelmetProvider>
  );
}