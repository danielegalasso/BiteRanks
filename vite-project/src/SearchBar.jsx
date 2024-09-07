import React, { useState } from 'react';
import axios from 'axios';
import { FaSearch, FaGlobe } from 'react-icons/fa'; // Importa le icone
import './SearchBar.css'; // Importa il file CSS
import ButtonList from './SearchBarButtonList.jsx'; // Importa la lista dei bottoni

const SearchBarWithAutocomplete = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // search with 1 char or 0 -> no req and clean all
    if ((value.length <= 1) || (value.trim() === '')) {
      setSuggestions([]);
      return;
    }

    // if the text is more than 2 chars then do the request
    if (value.length > 1) {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json`
        );
        setSuggestions(response.data);
      } catch (error) {
        console.error('Errore nel recupero dei dati:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (place) => {
    setSearchTerm(place.display_name);
    setSuggestions([]);
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
        <FaSearch className="icon search-icon" />
      </div>

      {suggestions.length > 0 && (
        <ul className="suggestion-list">
          {suggestions.map((place) => (
            <li
              key={place.place_id}
              onClick={() => handleSuggestionClick(place)}
              className="suggestion-item"
            >
              {place.display_name}
            </li>
          ))}
        </ul>
      )}

      {/* Aggiungi la lista dei bottoni sotto la barra di ricerca */}
      <ButtonList />
    </div>
  );
};

export default SearchBarWithAutocomplete;
