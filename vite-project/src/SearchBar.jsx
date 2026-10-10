import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaGlobe, FaCompass, FaCity, FaRoad, FaFlag, FaMapMarkerAlt, FaMap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate
import './SearchBar.css';
import ButtonList from './SearchBarButtonList.jsx';
import { searchPlaces, zoomDistance, normalize } from './search/geocoder';

const DEBOUNCE_MS = 250; // si cerca quando l'utente fa una pausa, non a ogni tasto

const TYPE_ICONS = {
  country: FaFlag,
  state: FaMap,
  county: FaMap,
  city: FaCity,
  district: FaMapMarkerAlt,
  street: FaRoad,
};

// Centro della mappa visibile: i risultati vicini a dove si sta guardando vengono prima
const getMapCenter = () => {
  const map = window.mapInstance;
  if (!map) return null;
  const center = map.getCenter();
  return { lat: center.lat, lon: center.lng };
};

// Evidenzia la parte del nome che corrisponde al testo cercato
const Highlight = ({ text, query }) => {
  const q = normalize(query);
  const index = q ? normalize(text).indexOf(q) : -1;
  // normalize può cambiare la lunghezza solo per caratteri speciali rari: in quel caso niente evidenziazione
  if (index < 0 || normalize(text).length !== text.length) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="suggestion-match">{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  );
};

const SearchBarWithAutocomplete = ({sfsv, isFSV , selectedItems, setSelectedItems, markers, setMarkers}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // suggerimento evidenziato con le frecce
  const navigate = useNavigate(); // Inizializza useNavigate

  //devo usare una ref anche per i suggerimenti dell'API in quanto non sono considerati parte della search-bar, e io devo
  //nasconderli quando clicco fuori dalla search-bar e dalla lista dei suggerimenti
  const searchBarRef = useRef(null);
  const inputRef = useRef(null);
  const pendingSelectRef = useRef(false); // Invio premuto prima che arrivassero i risultati

  const goToPlace = (place) => {
    navigate(`/?lat=${place.lat}&lng=${place.lon}&type=${place.type}&distance=${zoomDistance(place)}`);
    resetState();
    if (inputRef.current) inputRef.current.blur();
  };

  // Ricerca con debounce: ogni nuova ricerca annulla quella precedente,
  // così una risposta lenta non sovrascrive i risultati del testo più recente
  useEffect(() => {
    const query = searchTerm.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setStatus('idle');
      return;
    }
    const controller = new AbortController();
    setStatus('loading');
    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaces(query, { bias: getMapCenter(), signal: controller.signal });
        setSuggestions(results);
        setActiveIndex(results.length ? 0 : -1);
        setStatus('done');
        if (pendingSelectRef.current) {
          pendingSelectRef.current = false;
          if (results.length) goToPlace(results[0]);
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Errore nel recupero dei luoghi:', error);
        setSuggestions([]);
        setStatus('error');
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    pendingSelectRef.current = false;
  };

  // Funzione per zoomare sulla mappa: va al suggerimento evidenziato (o al primo)
  const handleSearchClick = () => {
    const place = suggestions[activeIndex] || suggestions[0];
    if (place && status === 'done') {
      goToPlace(place);
    } else if (searchTerm.trim().length >= 2) {
      pendingSelectRef.current = true; // si va al primo risultato appena arriva
    }
  };

  // Funzione per zoomare sulla posizione dell'utente
  const handleUserPositionClick = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    // Richiedi sempre all'utente di attivare la geolocalizzazione
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Naviga verso la posizione dell'utente dopo aver ottenuto le coordinate
        navigate(`/?lat=${latitude}&lng=${longitude}`);
        resetState(); // Resetta lo stato
      },
      (error) => {
        // Mostra un messaggio solo in caso di rifiuto della geolocalizzazione
        if (error.code === error.PERMISSION_DENIED) {
          alert("Please enable geolocation in your browser settings to use this feature.");
        } else {
          alert("Error obtaining geolocation. Please try again.");
        }
      }
    );
  };

  const resetState = () => {
    setSearchTerm(''); // Resetta il termine di ricerca
    setSuggestions([]);
    setStatus('idle');
    setIsOpen(false);
    setActiveIndex(-1);
    pendingSelectRef.current = false;
  };

  // l'ultima voce della lista è sempre "Your Location"
  const optionCount = suggestions.length + 1;

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((i) => (i + 1) % optionCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? optionCount - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex === suggestions.length) handleUserPositionClick();
      else handleSearchClick(); // Chiama la funzione quando viene premuto il tasto Invio
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  //ORA CHE CLICCO FUORI LA SEARCHBAR I SUGGERIMENTI SPARISCONO
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showList = isOpen && searchTerm.length > 0;

  return (
    <div className="search-container" ref={searchBarRef}>
      <div className="search-box">
        <FaGlobe className="icon" />
        <input
          ref={inputRef} // Assegna il ref all'input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="Find Location 🌍"
          className="search-input"
          role="combobox"
          aria-expanded={showList}
          aria-controls="location-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={showList && activeIndex >= 0 ? `location-option-${activeIndex}` : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        <FaSearch className="icon search-icon" onClick={handleSearchClick} />
      </div>

      {/* Lista dei suggerimenti: luoghi trovati e, sempre per ultima, la posizione dell'utente */}
      {showList && (
        <ul className="suggestion-list" id="location-suggestions" role="listbox">
          {suggestions.map((suggestion, index) => {
            const Icon = TYPE_ICONS[suggestion.type] || FaMapMarkerAlt;
            return (
              <li
                key={`${suggestion.source}-${suggestion.lat}-${suggestion.lon}-${index}`}
                id={`location-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(e) => e.preventDefault()} // il focus resta sulla barra
                onClick={() => goToPlace(suggestion)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`suggestion-item ${index === activeIndex ? 'is-active' : ''}`}
              >
                <Icon className="suggestion-icon" aria-hidden="true" />
                <span className="suggestion-text">
                  <span className="suggestion-name"><Highlight text={suggestion.name} query={searchTerm} /></span>
                  {suggestion.details && <span className="suggestion-details">{suggestion.details}</span>}
                </span>
              </li>
            );
          })}

          {status === 'loading' && suggestions.length === 0 && (
            <li className="suggestion-item no-click suggestion-status">Searching…</li>
          )}
          {status === 'done' && suggestions.length === 0 && (
            <li className="suggestion-item no-click suggestion-status">No places found</li>
          )}
          {status === 'error' && (
            <li className="suggestion-item no-click suggestion-status">Search unavailable, please try again</li>
          )}

          {/* La posizione dell'utente sarà sempre visibile come ultima opzione */}
          <li
            key="user-position"
            id={`location-option-${suggestions.length}`}
            role="option"
            aria-selected={activeIndex === suggestions.length}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleUserPositionClick}
            onMouseEnter={() => setActiveIndex(suggestions.length)}
            className={`suggestion-item user-position-item ${activeIndex === suggestions.length ? 'is-active' : ''}`}
          >
            <FaCompass className="compass-icon geolocation-icon"/>
            <span className='geolocation-text'> Your Location </span>
          </li>
        </ul>
      )}

      <ButtonList sfsv={sfsv} isFSV={isFSV } selectedItems={selectedItems} setSelectedItems={setSelectedItems} markers={markers} setMarkers={setMarkers} />
    </div>
  );
};

export default SearchBarWithAutocomplete;
