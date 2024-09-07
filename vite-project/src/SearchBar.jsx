import React, { useState } from 'react';
import axios from 'axios';

const SearchBarWithAutocomplete = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 2) {
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
    <div style={{ position: 'relative', width: '300px' }}>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Cerca un luogo..."
        style={{ width: '100%', padding: '10px', margin: '10px 0' }}
      />
      {suggestions.length > 0 && (
        <ul style={{ listStyleType: 'none', padding: 0, margin: 0, position: 'absolute', top: '40px', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ddd', zIndex: 1000 }}>
          {suggestions.map((place) => (
            <li
              key={place.place_id}
              onClick={() => handleSuggestionClick(place)}
              style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid #ddd' }}
            >
              {place.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBarWithAutocomplete;
