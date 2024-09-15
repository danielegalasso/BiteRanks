import React from "react";
import "./FoodRankItem.css"; // Importa il CSS specifico per il componente

const FoodRankItem = ({ icon, name, onClick, isAnEmoji, isSelected }) => {
  // Determina la classe CSS da applicare in base al valore di isAnEmoji
  const iconClass = isAnEmoji ? "food-icon-isEmoji" : "food-icon-isNotEmoji";

  // Gestisce il click sul container
  const handleClick = () => {
    if (onClick) onClick(); // Esegui la funzione di onClick se fornita
  };

  // Aggiunge la classe "clicked" se l'elemento è stato cliccato
  const containerClass = `container ${isSelected ? "clicked" : ""}`;

  return (
    <div className="outer-container">
      <div className="container-wrapper">
        <div className={containerClass} onClick={handleClick}>
          {/* Usa l'immagine PNG e applica dinamicamente la classe CSS */}
          <img src={icon} className={`food-icon ${iconClass}`} alt={name} />
        </div>
      </div>
      {/* Testo centrato sotto l'immagine */}
      <p className="food-name">{name}</p>
    </div>
  );
};

export default FoodRankItem;
