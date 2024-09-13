import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaGlobe } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate
import './SearchBar.css'; 
import ButtonList from './SearchBarButtonList.jsx';


// Funzione per calcolare la distanza tra due punti usando la formula dell'Haversine
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raggio della Terra in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distanza in km
  return distance;
};

const SearchBarWithAutocomplete = ({sfsv, isFSV , selectedItems, setSelectedItems}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [countryCode, setCountryCode] = useState(null); // Aggiungi uno stato per il codice paese
  const [selectedCoordinates, setSelectedCoordinates] = useState(null); // Stato per le coordinate selezionate
  const navigate = useNavigate(); // Inizializza useNavigate

  // Ottenere la posizione dell'utente al caricamento della pagina
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition({ lat: latitude, lon: longitude });

          // Recuperiamo il country code dalla lat/lon dell'utente
          try {
            const reverseGeoResponse = await axios.get(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=a3486d3fed1b41939800bca4fbf9915c`
            );
            const country = reverseGeoResponse.data.results[0].components.country_code.toUpperCase();
            setCountryCode(country); // Imposta il codice paese (es. 'IT' per Italia)
          } catch (error) {
            console.error('Errore nel recupero del country code:', error);
          }
        },
        (error) => {
          console.error("Errore nella geolocalizzazione:", error);
          setUserPosition(null);
        }
      );
    }
  }, []);

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === '' || value === null) {
      setSuggestions([]);
      return;
    }

    if (value.length >= 1) {
      try {
        // Rimuovi il parametro countrycode per ricerche generiche (ad es. "mi")
        //const countryParam = (value.length > 2 && countryCode) ? `&countrycode=${countryCode}` : '';
        const countryParam = '';

        const response = await axios.get(
          `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(value)}&limit=10&type=city&key=a3486d3fed1b41939800bca4fbf9915c${countryParam}`
        );

        // Ricaviamo i risultati con nome e coordinate
        const results = response.data.results.map(result => ({
          name: result.formatted,
          lat: result.geometry.lat,
          lon: result.geometry.lng,
        }));

        // Se abbiamo la posizione dell'utente, ordina i risultati per vicinanza
        if (userPosition) {
          results.sort((a, b) => {
            const distanceA = calculateDistance(userPosition.lat, userPosition.lon, a.lat, a.lon);
            const distanceB = calculateDistance(userPosition.lat, userPosition.lon, b.lat, b.lon);
            return distanceA - distanceB; // Ordina dal più vicino al più lontano
          });
        }
        setSuggestions(results);

      } catch (error) {
        console.error('Errore nel recupero dei dati:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.name);
    setSelectedCoordinates({ lat: suggestion.lat, lon: suggestion.lon }); // Memorizza le coordinate
    console.log("lat: ", suggestion.lat, "lon: ", suggestion.lon);
    setSuggestions([]); // Nascondi la lista di suggerimenti dopo la selezione
  };

  // Funzione per zoomare sulla mappa
  const handleSearchClick = () => {
    if (selectedCoordinates) {
      // Naviga verso un nuovo URL con le coordinate
      navigate(`/?lat=${selectedCoordinates.lat}&lng=${selectedCoordinates.lon}`);
    }
  };

  return (
    <div className="search-container">
      <div className="search-box">
        <FaGlobe className="icon" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Find Location 🌍"
          className="search-input"
        />
        <FaSearch className="icon search-icon" onClick={handleSearchClick} /> 
      </div>

      {suggestions.length > 0 && (
        <ul className="suggestion-list">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="suggestion-item"
            >
              {suggestion.name}
            </li>
          ))}
        </ul>
      )}

      <ButtonList sfsv={sfsv} isFSV={isFSV } selectedItems={selectedItems} setSelectedItems={setSelectedItems} />
    </div>
  );
};

export default SearchBarWithAutocomplete;
