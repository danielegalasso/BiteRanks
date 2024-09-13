import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { LatLngBounds } from 'leaflet'; // Assicurati di avere Leaflet importato
import { FaSearch, FaGlobe, FaCompass } from 'react-icons/fa';
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
  const [suggestionType, setSuggestionType] = useState(''); // per memorizzare il tipo di luogo selezionato (nel suggerimento API), puo essere city, country
  const [distanceArea, setDistanceArea] = useState(null); // calcola la distanza di una bounding box (per capire l'area di una città) quanto è grande
  //ma non è proprio un'area, è una distanza tra i due angoli estremi della bounding box di una citta
  const navigate = useNavigate(); // Inizializza useNavigate

  //devo usare una ref anche per i suggerimenti dell'API in quanto non sono considerati parte della search-bar, e io devo 
  //nasconderli quando clicco fuori dalla search-bar e dalla lista dei suggerimenti
  const searchBarRef = useRef(null);
  const suggestionsRef = useRef(null); // Riferimento anche per i suggerimenti

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
          type: result.components._type, // Aggiungiamo il tipo di luogo (es. city, country)
          //TYPE POSSIBILI: road, attraction, neighbourhood, city, country
          //esempio road: "via dei condotti", attraction: "colosseo", neighbourhood: "trastevere", city: "roma", country: "italia"
          boundingBox: result.bounds ? { // Verifica se result.bounds esiste prima di usarlo
            southwest: {
              lat: result.bounds.southwest.lat,
              lon: result.bounds.southwest.lng
            },
            northeast: {
              lat: result.bounds.northeast.lat,
              lon: result.bounds.northeast.lng
            }
          } : null // Imposta a null se la boundingBox non è presente
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
    setSuggestionType(suggestion.type);
    console.log("bounding box: ", suggestion.boundingBox);
    const distance = calculateBoundingBoxDistance(suggestion.boundingBox);
    setDistanceArea(distance);
    //console.log("lat: ", suggestion.lat, "lon: ", suggestion.lon);
    setSuggestions([]); // Nascondi la lista di suggerimenti dopo la selezione
  };

  // Funzione per zoomare sulla mappa
  const handleSearchClick = () => {
    if (selectedCoordinates) {
      // Naviga verso un nuovo URL con le coordinate
      navigate(`/?lat=${selectedCoordinates.lat}&lng=${selectedCoordinates.lon}&type=${suggestionType}&distance=${distanceArea}`);
      resetState(); // Resetta lo stato
    }
  };
  // Funzione per zoomare sulla posizione dell'utente
  const handleUserPositionClick = () => {
    if (userPosition) {
      navigate(`/?lat=${userPosition.lat}&lng=${userPosition.lon}`);
      resetState(); // Resetta lo stato
    }
  };
  const resetState = () => {
    setSearchTerm(''); // Resetta il termine di ricerca
    setSelectedCoordinates(null); // Resetta le coordinate selezionate
    setUserPosition(null); // Resetta la posizione dell'utente
    setSuggestionType(''); // Resetta il tipo di luogo
    setDistanceArea(null); // Resetta la distanza dell'area
  };
  
  // Funzione per calcolare la distanza tra due coordinate (latitudine e longitudine)
  const calculateBoundingBoxDistance = (boundingBox) => {
    const sw = boundingBox.southwest; // Coordinate dell'angolo sud-ovest
    const ne = boundingBox.northeast; // Coordinate dell'angolo nord-est

    // Calcola la distanza diagonale tra i due angoli della bounding box usando la formula dell'Haversine
    return calculateDistance(sw.lat, sw.lon, ne.lat, ne.lon);
  };

  //ORA CHE CLICCO FUORI LA SEARCHBAR I SUGGERIMENTI SPARISCONO
  // Funzione per gestire i clic al di fuori della SearchBar
  // Funzione per gestire i clic al di fuori della SearchBar e dei suggerimenti
  const handleClickOutside = (event) => {
    // Controlla se searchBarRef esiste e se il clic non è all'interno della search bar
    const clickedOutsideSearchBar = searchBarRef.current && !searchBarRef.current.contains(event.target);
    // Controlla se suggestionsRef esiste e se il clic non è all'interno della lista suggerimenti
    const clickedOutsideSuggestions = suggestionsRef.current && !suggestionsRef.current.contains(event.target);

    // Se il clic è al di fuori sia della search bar che dei suggerimenti, resetta i suggerimenti
    if (clickedOutsideSearchBar && clickedOutsideSuggestions) {
      setSuggestions([]);
    }
  };
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="search-container" ref={searchBarRef}>
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
        <ul className="suggestion-list" ref={suggestionsRef}>
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="suggestion-item"
            >
              {suggestion.name}
            </li>
          ))}
          {userPosition && (
            <li
              key="user-position"
              onClick={handleUserPositionClick}
              className="suggestion-item user-position-item"
            >
              <FaCompass className="compass-icon" /> La tua posizione
            </li>
          )}
        </ul>
      )}

      <ButtonList sfsv={sfsv} isFSV={isFSV } selectedItems={selectedItems} setSelectedItems={setSelectedItems} />
    </div>
  );
};

export default SearchBarWithAutocomplete;
