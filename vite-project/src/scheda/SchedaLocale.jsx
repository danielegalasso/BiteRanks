import React from "react";
import "./SchedaLocale.css";
import triangoloNero from "./Black_triangle.svg";
import triangoloNero1 from "./Black_triangle1.svg";
import triangoloNero2 from "./Black_triangle.png";

const SchedaLocale = ({ 
  nome, 
  classifiche, 
  linkGoogleMaps, 
  linkIndicazioniMaps, 
  linkSitoWeb 
}) => {
  
  return (
    <div className="outher-cont">
    


    <div className="containerScheda">
      
      <div className="closeContainer">
      <button className="closeScheda">X</button>
      </div>
      <div className="info">
        
        <div className="header">
          <h3 className="localeTitle">{nome}</h3>
          <button className="shareButton">🔗</button>
        </div>
        <div className="divider"></div>
        {classifiche.map((classifica, index) => (
            <a key={index} href={classifica[2]} className="localeLink">
              {classifica[1]}° {classifica[0]}
            </a>
          ))}
        <div className="buttonContainer">
          <button className="mapButton" onClick={(e) => {e.preventDefault(); window.open(linkGoogleMaps, '_blank');}}>Google Maps</button>
          <button className="directionsButton" onClick={(e) => {e.preventDefault(); window.open(linkIndicazioniMaps, '_blank');}}>🧭</button>
        </div>
        <div className="websiteButtonContainer">
          <button className="websiteButton" onClick={(e) => {e.preventDefault(); window.open(linkSitoWeb, '_blank');}}>Website</button>
        </div>
      </div>
   </div>

   <div className="containerimg">
    <img src={triangoloNero2} alt="triangolo" className="triangoloNero2"/>  
   </div>

    </div>
  );
};

export default SchedaLocale;
