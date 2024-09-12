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
import closeicon from "./emoji/closeicon.png"
import defaultIcon from "../../public/ranking-icon/Empty.png"; // Percorso all'icona di default


const FoodSearch = ({sfsv, selectedItems, setSelectedItems, markers, setMarkers}) => {

  const [rankingItems, setRankingItems] = useState([]);

  useEffect(() => {
    // Funzione per caricare il file index.json e creare la mappa delle icone
    const fetchRankings = async () => {
      try {
        // Fetch del file index.json
        const response = await fetch('/ranking/index.json');
        const data = await response.json();

        // Creare una lista di oggetti rankingItems
        const items = data.map((ranking) => {

          const unshowedRankingName =  ranking.replace('.json', '');
          const rankingName = ranking.replace('.json', '').replace(/_/g, ' ');
          const iconPath = `/ranking-icon/${unshowedRankingName}.png`;
          const rankingPath = `/ranking/${unshowedRankingName}/`;

          return { 
            icon: iconPath, 
            name: rankingName, 
            path: rankingPath 
          };
        });

        // Imposta i dati nel state
        setRankingItems(items);
      } catch (error) {
        console.error('Errore durante il caricamento delle classifiche:', error);
      }
    };

    fetchRankings();
  }, []);



  const [SearchbuttonClicked, setSearchbuttonClicked] = useState(false);

  const handleSearchButtonClick = () => {
    handleCloseButtonClick();
  };

  const handleCloseButtonClick = () => {
    setSearchbuttonClicked(true);
  };
  
  
  
  useEffect(() => {
    const fetchData = async (item, file) => {
      try {
        const filePath = `${item.path}${file}`;
        const response = await fetch(filePath, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
  
        if (!response.ok) {
          console.error(`Errore nel recupero del file: ${filePath}`);
          return null; // Restituisci null in caso di errore per gestirlo successivamente
        }
  
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Errore durante il recupero dei dati: ", error);
        return null; // Restituisci null in caso di errore
      }
    };
  
    if (SearchbuttonClicked) {
      sfsv(false); // Esegui l'aggiornamento dello stato solo quando buttonClicked è true
  
      const fetchAllData = async () => {
        const allData = []; // Array per raccogliere tutti i dati
  
        // Itera su ciascun elemento in selectedItems
        for (const item of selectedItems) {
          console.log(item.path);
          

          const filePath = `${item.path}index.json`;
          
          const response = await fetch(filePath, {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          });
          if (!response.ok) {
            console.error("Errore nel recupero dell'index.json");
            return;
          }
          const files = await response.json(); // Ottieni la lista dei file

          

          for (const file of files) {
            const data = await fetchData(item, file); // Usa await per attendere il risultato di fetchData
  
            if (data) {
              // Aggiungi i dati all'array solo se il recupero è stato un successo
              allData.push(data);
            }
          }
        }
  
        console.log(allData);
        setMarkers(allData); // Imposta i marker con tutti i dati recuperati
      };
  
      fetchAllData(); // Richiama la funzione asincrona per ottenere tutti i dati
    }
  }, [SearchbuttonClicked, sfsv, setMarkers]); // Esegui l'effetto quando buttonClicked cambia
  

  useEffect(() => {
    // Funzione per rimuovere i marker associati agli `selectedItems` rimossi
    const removeMarkers = () => {
      console.log("markers");
      
    };
  
    removeMarkers(); // Richiama la funzione per rimuovere i marker
  }, [selectedItems]); // Esegui l'effetto quando `selectedItems` cambia



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
                icon={ranking.icon || defaultIcon}
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
