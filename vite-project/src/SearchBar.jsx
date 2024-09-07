import React, { useState } from 'react';
import axios from 'axios';
import { FaSearch, FaGlobe } from 'react-icons/fa';
import './SearchBar.css'; 
import ButtonList from './SearchBarButtonList.jsx';

const SearchBarWithAutocomplete = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length <= 1 || value.trim() === '' || value === null) {
      setSuggestions([]);
      return;
    }

    if (value.length > 1) {
      try {
        const response = await axios.get(
          `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(value)}&key=a3486d3fed1b41939800bca4fbf9915c`
        );

        // the api returns the names into "formatted" field
        const results = response.data.results.map(result => result.formatted);
        setSuggestions(results);
      } catch (error) {
        console.error('Errore nel recupero dei dati:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
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
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="suggestion-item"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      <ButtonList />
    </div>
  );
};

export default SearchBarWithAutocomplete;
