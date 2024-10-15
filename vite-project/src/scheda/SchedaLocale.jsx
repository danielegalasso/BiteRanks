import React, { useState } from "react";
import "./SchedaLocale.css";
import triangoloNero2 from "./Black_triangle.png";

const SchedaLocale = ({ 
  nome, 
  subclassifiche, 
  nomeClassifica,
  linkGoogleMaps, 
  linkIndicazioniMaps, 
  linkSitoWeb,
  coords
}) => {
  const [copied, setCopied] = useState(false); // Stato per monitorare se il link è stato copiato

  const copyToClipboard = () => {
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);
    params.set('lat', coords[0]); // Aggiungi latitudine
    params.set('lng', coords[1]); // Aggiungi longitudine
    console.log("nome: ", nome, "subclassifiche: ", subclassifiche, "linkGoogleMaps: ", linkGoogleMaps, "linkIndicazioniMaps: ", linkIndicazioniMaps, "linkSitoWeb: ", linkSitoWeb, "coords: ", coords);
    console.log("nome classifica:" ,subclassifiche[0][0]);
    params.set('ranking', nomeClassifica); // Aggiungi classifica
    params.set('subranking', subclassifiche[0][0]); // Aggiungi classifica
    const shareableUrl = `${currentUrl.origin}${currentUrl.pathname}?${params.toString()}`;
    
    navigator.clipboard.writeText(shareableUrl)
      .then(() => {
        setCopied(true); // Imposta lo stato a true quando il link è copiato
        console.log("Link copiato: ", shareableUrl);
      })
      .catch(err => {
        console.error("Errore nel copiare il link: ", err);
      });
  };

  const resetIcon = () => {
    setCopied(false); // Reimposta lo stato a false quando il mouse lascia il bottone
  };

  const closePopups = () => {
    const popups = document.querySelectorAll(".leaflet-popup-close-button");
    popups.forEach(popup => popup.click());
  };



  return (
    <div className="outher-cont">
      <div className="containerScheda">
        <div className="closeContainer" onClick={closePopups}>
          <button className="closeScheda" >X</button>
        </div>
        <div className="info">
          <div className="header">
            <h3 className="localeTitle">{nome}</h3>
            <button 
              className="shareButton" 
              onClick={copyToClipboard}
              onMouseLeave={resetIcon} // Gestisce il ripristino dell'icona
            >
              {copied ? '✅ Copied' : '🔗'}
            </button>
          </div>
          <div className="divider"></div>
          {subclassifiche.map((classifica, index) => (
            <a key={index} href={classifica[2]} className="localeLink" target="_blank" style={{ color: '#63456E' }}>
              {classifica[1] ? `${classifica[1]} ` : ''} {classifica[0]}
            </a>
          ))}
          <div className="buttonContainer">
            <button className="mapButton" onClick={(e) => {e.preventDefault(); window.open(linkGoogleMaps, '_blank');}}>Google Maps</button>
            <button className="directionsButton" onClick={(e) => {e.preventDefault(); window.open(linkIndicazioniMaps, '_blank');}}>🧭</button>
          </div>
          {linkSitoWeb && (
            <div className="websiteButtonContainer">
              <button className="websiteButton" onClick={(e) => {e.preventDefault(); window.open(linkSitoWeb, '_blank');}}>Website</button>
            </div>
          )}

        </div>
      </div>

      <div className="containerimg">
        <img src={triangoloNero2} alt="triangolo" className="triangoloNero2" />  
      </div>
    </div>
  );
};

export default SchedaLocale;
