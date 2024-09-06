import React, {useState} from "react";
import "./FoodSearch.css"; // Importiamo il file CSS
import FoodRankItem from "./FoodRankItem";

const FoodSearch = () => {
  // Stato per il testo della ricerca
  const [searchText, setSearchText] = useState("");

  // Stato per gestire quale pulsante è attivo
  const [activeTab, setActiveTab] = useState("food");

  // Lista di food-item (puoi aggiungere o modificare questi valori)
  const foodItems = [
    { icon: "🍎", name: "Apple" },
    { icon: "🍕", name: "Pizza" },
    { icon: "🍣", name: "Sushi" },
    { icon: "🍌", name: "Banana" },
    { icon: "🥭", name: "Mango" },
    { icon: "🥣", name: "Muesli" }
  ];

  // Lista di ranking-items
  const rankingItems = [
    { icon: "🏆", name: "Top 50 Italia" },
    { icon: "🥇", name: "Top 20 Calabria" },
    { icon: "🥈", name: "Top 10 Napoli" }
  ];

  const handleFoodClick = (foodName) => {
    alert(`You clicked on ${foodName}!`);
    // Puoi fare qualsiasi altra cosa qui, come navigare a una nuova pagina o aggiornare lo stato
  };

  // Filtra i food-item/classifiche in base al testo inserito
  const filteredItems = (items) =>
    items.filter((item) =>
      item.name.toLowerCase().startsWith(searchText.toLowerCase())
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

  // Gestore per il cambio di tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="food-search-container">
      <div className="top-buttons">
        <button 
          className={activeTab === "food" ? "active" : ""} 
          onClick={() => handleTabChange("food")}>
          Food 😋
        </button>
        <button
          className={activeTab === "ranking" ? "active" : ""}
          onClick={() => handleTabChange("ranking")}>
          Ranking🥇
        </button>
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
          {/* Mostra solo gli item filtrati in base al tab attivo */}
          {activeTab === "food" ? (
            filteredItems(foodItems).map((food, index) => (
              <FoodRankItem
                key={index}
                icon={food.icon}
                name={food.name}
                onClick={() => handleFoodClick(food.name)}
              />
            ))
          ) : (
            /* Mostra solo i food-item/classifiche filtrati */
            filteredItems(rankingItems).map((item, index) => (
              <FoodRankItem
                key={index}
                icon={item.icon}
                name={item.name}
                onClick={() => handleFoodClick(item.name)}
              />
            ))
          )}
        </div>
      </div>

      <button className="search-button">Search 🚀</button>
    </div>
  );
};

export default FoodSearch;
    