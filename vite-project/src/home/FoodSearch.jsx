import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "./FoodSearch.css"; // Importiamo il file CSS
import FoodRankItem from "./FoodRankItem";
import TextPlusIcon from "./TextPlusIcon";

import rocketicon from "./emoji/rocket.png";
import medalicon from "./emoji/medal.png";
import foodicon from "./emoji/food.png";
import pizzaicon from "./emoji/pizza.png";
import icecreamicon from "./emoji/icecream.png";
import sushiicon from "./emoji/sushi.png";
import hamburgericon from "./emoji/hamburger.png";
import steakhouseicon from "./emoji/steakhouse.png";
import sweetsicon from "./emoji/sweets.png";
import cinquantaTopPizzaicon from "./emoji/50-Top-Pizza.jpg";
import michelinStaricon from "./emoji/Michelin-Star.jpg";
import gamberoRossoicon from "./emoji/Gambero-Rosso.jpeg";
import twcinquantabesticon from "./emoji/tw50br.jpeg";
import closeicon from "./emoji/closeicon.png"

const FoodSearch = ({sfsv, selectedItems, setSelectedItems}) => {

  const [SearchbuttonClicked, setSearchbuttonClicked] = useState(false);

  const handleSearchButtonClick = () => {
    handleCloseButtonClick();
  };

  const handleCloseButtonClick = () => {
    setSearchbuttonClicked(true);
  };
  
  useEffect(() => {
    if (SearchbuttonClicked) {
      // Esegui l'aggiornamento dello stato solo quando buttonClicked è true
      sfsv(false);

      // Pulizia (opzionale): Rimuovi lo stato se il componente viene smontato
      return () => {
        sfsv(false);
      };
    }
  }, [SearchbuttonClicked, sfsv]); // Esegui l'effetto quando buttonClicked cambia


  const [searchText, setSearchText] = useState(""); // Stato per il testo della ricerca
  const [activeTab, setActiveTab] = useState("food"); // Stato per gestire quale pulsante è attivo
  

  const navigate = useNavigate(); // Navigation hook

  // Lista di food-item (puoi aggiungere o modificare questi valori)
  const foodItems = [
    { icon: pizzaicon, name: "Pizza" },
    { icon: icecreamicon, name: "Ice Cream" },
    { icon: sushiicon, name: "Sushi" },
    { icon: hamburgericon, name: "Hamburger" },
    { icon: steakhouseicon, name: "Steak House" },
    { icon: sweetsicon, name: "Sweets" },
  ];

  // Lista di ranking-items
  const rankingItems = [
    { icon: cinquantaTopPizzaicon, name: "50 Top Pizza" },
    { icon: twcinquantabesticon, name: "TW50BR" },
    { icon: gamberoRossoicon, name: "Gambero Rosso" },
    { icon: michelinStaricon, name: "Michelin Star" },
  ];

  const handleClickItem = (item) => {
    setSelectedItems((prevSelectedItems) => {
      const updatedItems = prevSelectedItems.some(selectedItem => selectedItem.name === item.name)
        ? prevSelectedItems.filter((i) => i.name !== item.name) // Rimuovi l'item se è già selezionato
        : [...prevSelectedItems, item]; // Aggiungi l'item se non è già selezionato
  
      //console.log('Updated selected items:', updatedItems); // Stampa l'array aggiornato
  
      return updatedItems;
    });
    
  };

  // Filtra i food/classifiche in base al testo inserito
  const filteredItems = (items) =>
    items.filter((item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) // Usa includes invece di startsWith
    );

  // Funzione che si attiva ogni qual volta che viene inserito un carattere nella search-bar
  const handleChange = (e) => {
    let newText = e.target.value;
    if (newText.startsWith(" ") && searchText === "") {
      // Se il testo inizia con uno spazio e il campo è vuoto, rimuovi lo spazio (rende codice più robusto)
      newText = newText.trimStart();
    }
    setSearchText(newText);
  };

  // Gestore per il cambio di tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchText("");
    setSelectedItems([]);

  };

  const handleSearchClick = () => {
    if (selectedItems.length > 0) {
      navigate('/map', { state: { selectedItems } }); // Naviga alla nuova pagina passando i dati
    } else {
      alert("No items selected!");
    }
  };

  const isSelectedCheck = (foodName) => {
    return selectedItems.some(item => item.name === foodName);
  };
  


  return (
    <div className="food-search-container">
      <button className="cBttn" onClick={handleCloseButtonClick}>
        <img src={closeicon} alt="Button Image" />
      </button>
      
      <div className="top-buttons">
        <button
          className={activeTab === "food" ? "active" : ""}
          onClick={() => handleTabChange("food")}
        >
          <TextPlusIcon text="Food" imageSrc={foodicon} fSize="1.5rem" />
        </button>

        <button
          className={activeTab === "ranking" ? "active" : ""}
          onClick={() => handleTabChange("ranking")}
        >
          <TextPlusIcon text="Ranking" imageSrc={medalicon} fSize="1.5rem" />
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
                isAnEmoji={true}
                key={index}
                icon={food.icon}
                name={food.name}
                activeTab={activeTab}
                isSelected={isSelectedCheck(food.name)} // Passa se l'item è selezionato
                onClick={() => handleClickItem(food)} // Pass the food object
              />
            ))
          ) : (
            /* Mostra solo i food-item/classifiche filtrati */
            filteredItems(rankingItems).map((ranking, index) => (
              <FoodRankItem
                isAnEmoji={false}
                key={index}
                icon={ranking.icon}
                name={ranking.name}
                activeTab={activeTab}
                isSelected={isSelectedCheck(ranking.name)} // Passa se l'item è selezionato
                onClick={() => handleClickItem(ranking)}
              />
            ))
          )}
        </div>
      </div>

      <button className="search-button1" onClick={handleSearchButtonClick}>
        <TextPlusIcon text="Search" imageSrc={rocketicon} fSize="1.5rem" />
      </button>
    </div>
  );
};

export default FoodSearch;
