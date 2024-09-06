// FoodItem.js
import React from "react";
import "./FoodRankItem.css"; // Importa il CSS specifico per il componente

const FoodRankItem = ({ icon, name }) => {
  const handleClick = () => {
    alert(`You clicked on ${name}!`);
    // Puoi aggiungere qui qualsiasi altra logica che desideri eseguire al clic
  };

  return (
    <div className="food-item" onClick={handleClick}>
      
      {/* <i className="food-icon">{icon}</i>
      <p>{name}</p>
      */}
    </div>
  );
};

export default FoodRankItem;
