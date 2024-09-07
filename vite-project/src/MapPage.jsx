import React from "react";
import { useLocation } from "react-router-dom"; // Hook to access passed state

const MapPage = () => {
    const location = useLocation();
    const { selectedItem } = location.state || {}; // Recupera l'elemento selezionato
  
    return (
      <div className="map-page-container">
        <button className="back-button" onClick={() => window.history.back()}>
          Back
        </button>
        <div className="search-container">
          <input
            type="text"
            className="search-bar"
            placeholder="Search on the map..."
          />
          {selectedItem && (
            <div className="selected-item-container">
              <i className="selected-item-icon">{selectedItem.icon}</i>
              <p>{selectedItem.name}</p>
            </div>
          )}
        </div>
        {/* Qui puoi aggiungere il codice per il tuo map component */}
      </div>
    );
  };

export default MapPage;
