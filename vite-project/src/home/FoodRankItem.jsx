// FoodItem.js
import React from "react";
import "./FoodRankItem.css"; // Importa il CSS specifico per il componente

const FoodRankItem = ({ icon, name, onClick }) => {
  return (
    <div className="food-item" onClick={onClick}>
      <i className="food-icon">{icon}</i>
      <p>{name}</p>
    </div>
  );
};

export default FoodRankItem;
