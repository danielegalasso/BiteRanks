import React from "react";
import "./FoodRankItem.css"; // Importa il CSS specifico per il componente

const FoodRankItem = ({ icon, name, onClick, isAnEmoji }) => {
  // Determina la classe CSS da applicare in base al valore di isAnEmoji
  const iconClass = isAnEmoji ? "food-icon-isEmoji" : "food-icon-isNotEmoji";

  return (
    <div className="outer-container">
      <div className="container" onClick={onClick}>
        {/* Usa l'immagine PNG e applica dinamicamente la classe CSS */}
        <img src={icon} className={`food-icon ${iconClass}`} alt={name} />
      </div>
      {/* Testo centrato sotto l'immagine */}
      <p className="food-name">{name}</p>
    </div>
  );
};

export default FoodRankItem;
