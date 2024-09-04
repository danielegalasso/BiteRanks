import React from "react";
import "./FoodSearch.css"; // Importiamo il file CSS
import FoodItem from "./FoodItem";

const FoodSearch = () => {

  const handleFoodClick = (foodName) => {
    alert(`You clicked on ${foodName}!`);
    // Puoi fare qualsiasi altra cosa qui, come navigare a una nuova pagina o aggiornare lo stato
  };

  /* METODO VECCHIO SENZA L'USO DI UN COMPONENTE FOOD-ITEM SEPARATO
      <div className="food-item"
         onClick={() => handleFoodClick("Pizza")}>
          <i className="food-icon">🍎</i>
          <p>Apple</p>
      </div>
      <div className="food-item">
          <i className="food-icon">🍕</i>
          <p>Pizza</p>
      </div>
      <div className="food-item">
          <i className="food-icon">🍣</i>
          <p>Sushi</p>
      </div>
  */
  return (
    <div className="food-search-container">
      <div className="top-buttons">
        <button>Food 😋</button>
        <button>Ranking🥇</button>
      </div>
      <input
        type="text"
        className="search-bar"
        placeholder="Search for food..."
      />
      <div className="food-list-container">
        <FoodItem icon="🍎" name="Apple" />
        <FoodItem icon="🍕" name="Pizza" />
        <FoodItem icon="🍣" name="Sushi" />
        <FoodItem icon="🍣" name="Sushi" />
        {/* Aggiungi altri food-item qui */}
      </div>

      <button className="search-button">Search</button>
    </div>
  );
};

export default FoodSearch;
    