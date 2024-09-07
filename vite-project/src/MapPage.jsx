import React from "react";
import { useLocation } from "react-router-dom"; // Hook to access passed state
import "./MapPage.css";

const MapPage = () => {
    const location = useLocation();
    const { selectedItem } = location.state || {}; // Recupera l'elemento selezionato

    return (
        <div className="map-page-container">
          <div className="search-container">
            <div className="search-bar">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Find Location          ">
                    
                </input>

                

                </div>
            </div>
        </div>
          
              
    );
  };
  
        {/*
              </div>
                <button className="search-button">
                    <i className="search-icon"></i>
                </button>
            </div>
            <div className="buttons-container">
                <button className="icon-button pizza">
                    <span role="img" aria-label="pizza">🍕</span>
                </button>
                <button className="icon-button sushi">
                    <span role="img" aria-label="sushi">🍣</span>
                </button>
                <button className="icon-button pencil">
                    <span role="img" aria-label="pencil">✏️</span>
                </button>
                <button className="icon-button dice">
                    <span role="img" aria-label="dice">🎲</span>
                </button>
            </div>
              </div>
        */}


export default MapPage;
