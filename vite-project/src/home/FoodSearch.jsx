import React, {useState} from "react";
import "./FoodSearch.css"; // Importiamo il file CSS
import FoodItem from "./FoodItem";

const FoodSearch = () => {
  // Stato per il testo della ricerca
  const [searchText, setSearchText] = useState("");

  // Lista di food-item (puoi aggiungere o modificare questi valori)
  const foodItems = [
    { icon: "🍎", name: "Apple" },
    { icon: "🍕", name: "Pizza" },
    { icon: "🍣", name: "Sushi" },
    { icon: "🍌", name: "Banana" },
    { icon: "🥭", name: "Mango" },
    { icon: "🥣", name: "Muesli" }
  ];

  const handleFoodClick = (foodName) => {
    alert(`You clicked on ${foodName}!`);
    // Puoi fare qualsiasi altra cosa qui, come navigare a una nuova pagina o aggiornare lo stato
  };

  // Filtra i food-item in base al testo inserito
  const filteredFoodItems = foodItems.filter((food) =>
    food.name.toLowerCase().startsWith(searchText.toLowerCase())
  );

  //funzione che si attiva ogni qual volta che viene inserito un carattere nella search-bar
  const handleChange = (e) => {
    let newText = e.target.value;
    if (newText.startsWith(" ") && searchText === "") {
      // Se il testo inizia con uno spazio e il campo è vuoto, rimuovi lo spazio  (rende codice piu robusto)
      newText = newText.trimStart();
    }
    setSearchText(newText);
  };

  return (
    <div className="food-search-container">
      <div className="top-buttons">
        <button>Food 😋</button>
        <button>Ranking🥇</button>
      </div>
      {/* Contenitore con sfondo più scuro */}
      <div className="dark-container">
        <input
          type="text"
          className="search-bar"
          placeholder="Search for food..."
          value={searchText} 
          onChange={handleChange} 
        />
        <div className="food-list-container">
          {/* Mostra solo i food-item filtrati */}
          {filteredFoodItems.map((food, index) => (
            <FoodItem
              key={index}
              icon={food.icon}
              name={food.name}
              onClick={() => handleFoodClick(food.name)}
            />
          ))}
        </div>
      </div>

      <button className="search-button">Search</button>
    </div>
  );
};

export default FoodSearch;
    