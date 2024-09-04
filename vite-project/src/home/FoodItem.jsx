// FoodItem.js
import React from "react";
import "./FoodItem.css"; // Importa il CSS specifico per il componente

const FoodItem = ({ icon, name }) => {
  const handleClick = () => {
    alert(`You clicked on ${name}!`);
    // Puoi aggiungere qui qualsiasi altra logica che desideri eseguire al clic
  };

  return (
    <div className="food-item" onClick={handleClick}>
      <i className="food-icon">{icon}</i>
      <p>{name}</p>
    </div>
  );
};

export default FoodItem;
