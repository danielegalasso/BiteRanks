import React from "react";
import "./SchedaLocale.css";

const SchedaDelLocale = () => {
  return (
    <div className="containerScheda">
      
      <div className="closeContainer">
      <button className="closeScheda">X</button>
      </div>
      <div className="info">
      
        <div className="header">
          <h3 className="localeTitle">Panificio Menchetti</h3>
          <button className="shareButton">🔗</button>
        </div>
        <div className="divider"></div>
        <a href="#" className="localeLink">
          25° 50 Top Pizza in Viaggio in Italia 2024
        </a>
        <a href="#" className="localeLink">
          Tre Spicchi Gambero Rosso 2024
        </a>
        <div className="buttonContainer">
          <button className="mapButton">Google Maps</button>
          <button className="directionsButton">🧭</button>
        </div>
        <div className="websiteButtonContainer">
          <button className="websiteButton">Website</button>
        </div>
      </div>
    </div>
  );
};

export default SchedaDelLocale;
