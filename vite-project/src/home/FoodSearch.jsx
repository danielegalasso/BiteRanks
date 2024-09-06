import React, {useState} from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "./FoodSearch.css"; // Importiamo il file CSS
import FoodRankItem from "./FoodRankItem";

const FoodSearch = () => {
  const [searchText, setSearchText] = useState(""); // Stato per il testo della ricerca
  const [activeTab, setActiveTab] = useState("food"); // Stato per gestire quale pulsante è attivo
  const [selectedItem, setSelectedItem] = useState(null); // State for selected food
  const navigate = useNavigate(); // Navigation hook

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

  const handleClickItem = (item) => {
    console.log('Selected item:', item); // Debugging line
    setSelectedItem(item); // Store selected item
  };

  // Filtra i food/classifiche in base al testo inserito
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
  
  const handleSearchClick = () => {
    alert(selectedItem ? `Searching for ${selectedItem.name}...` : "No item selected!"); // Alert con il nome del cibo selezionato
    if (selectedItem) {
      navigate('/map', { state: { selectedItem } }); // Naviga alla nuova pagina passando i dati
    }
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
                onClick={() => handleClickItem(food)}  // Pass the food object
              />
            ))
          ) : (
            /* Mostra solo i food-item/classifiche filtrati */
            filteredItems(rankingItems).map((ranking, index) => (
              <FoodRankItem
                key={index}
                icon={ranking.icon}
                name={ranking.name}
                onClick={() => handleClickItem(ranking)}
              />
            ))
          )}
        </div>
      </div>

      <button className="search-button" onClick={handleSearchClick}>
        Search
      </button>
    </div>
  );
};

export default FoodSearch;
    