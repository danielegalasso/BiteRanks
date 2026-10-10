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
import closeicon from "./emoji/closeicon.svg";
import defaultIcon from "../../public/ranking-icon/Empty.png"; // Percorso all'icona di default


// Id dell'ultima ricerca avviata: i file di una ricerca precedente arrivati in ritardo vengono ignorati.
// È fuori dal componente perché FoodSearch viene smontato appena parte la ricerca.
let latestRequestId = 0;

const FoodSearch = ({sfsv, selectedItems, setSelectedItems, markers, setMarkers, activeTab, setActiveTab}) => {

  const [rankingItems, setRankingItems] = useState([]);
  const [foodItems, setFoodItems]= useState([]);

    // Lista di food-item (puoi aggiungere o modificare questi valori)
    //const foodItems = [
    //  { icon: pizzaicon, name: "Pizza" },
    //  { icon: icecreamicon, name: "Ice Cream" },
    //  { icon: sushiicon, name: "Sushi" },
    //  { icon: hamburgericon, name: "Hamburger" },
    //  { icon: steakhouseicon, name: "Steak House" },
    //  { icon: sweetsicon, name: "Sweets" },
    //];
  
  
  //fetch Dall'indice NomiRanking e NomiCibi
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
    // Funzione asincrona per caricare il file index.json e creare la mappa delle icone
    const fetchRankingsFoodsAndFindParam = async () => {
      try {
        // Fetch Rankings
        const response = await fetch('/ranking/index.json');
        const data = await response.json();

        const items = data.map((ranking) => {
          const unshowedRankingName = ranking.replace('.json', '');
          const rankingName = ranking.replace('.json', '').replace(/_/g, ' ');
          const iconPath = `/ranking-icon/${unshowedRankingName}.png`;
          const rankingPath = `/ranking/${unshowedRankingName}/`;

          return {
            icon: iconPath,
            name: rankingName,
            path: rankingPath
          };
        });

        setRankingItems(items);
        console.log("RankingItems:")
        console.log(items)

        
        // Fetch Foods
        const response1 = await fetch('/food/index.json'); // Modifica il percorso per puntare al file index.json di "Food"
        const data1 = await response1.json();

        const items1 = data1.map((category) => {
          const unshowedCategoryName = category.replace('.json', '');
          const categoryName = category.replace('.json', '').replace(/_/g, ' ');
          const iconPath = `/food-icon/${unshowedCategoryName}.png`; // Modifica il percorso dell'icona per il cibo
          const categoryPath = `/food/${category}`; // Modifica il percorso per la categoria di cibo

          return {
            icon: iconPath,
            name: categoryName,
            path: categoryPath
          };
        });

        setFoodItems(items1); // Modifica il set per gli elementi di "Food"
        console.log("FoodItems:")
        console.log(items1)



        







        // Find Param
        const searchParams = new URLSearchParams(window.location.search);
        const rankParm = searchParams.get('ranking');
        console.log("rankParm: ", rankParm);
        const subRankParm = searchParams.get('subranking');
        console.log("subRankParm: ", subRankParm);

        // Se esiste un foodName nell'URL, seleziona automaticamente quel cibo
        if (rankParm) {
          const foundItem = items.find(ranking => ranking.name.toLowerCase() === rankParm.toLowerCase());
          console.log(rankParm.toLowerCase());
          console.log("foundFood: ", foundItem);
          if (foundItem) {

            const fileToFetch = subRankParm.replace(/ /g, '') + '.json';

            const data = await fetchData(foundItem, fileToFetch); // Recupera i dati della sub-classifica
            
            const allData = {};
            allData[foundItem.name] = []
            if (data) {
              // Aggiungi i dati all'array solo se il recupero è stato un successo
              allData[foundItem.name].push(data);
            }
            setMarkers(allData);
            
          }
        }
      } catch (error) {
        console.error('Errore durante il caricamento delle classifiche:', error);
      }
    };

    fetchRankingsFoodsAndFindParam();
  }, []); // Esegui solo una volta all'inizio

  const handleClickItem = (item) => {



    setSelectedItems((prevSelectedItems) => {

      const updatedItems = prevSelectedItems.some(selectedItem => selectedItem.name === item.name)
        ? prevSelectedItems.filter((i) => i.name !== item.name) // Rimuovi l'item se è già selezionato
        : [...prevSelectedItems, item]; // Aggiungi l'item se non è già selezionato
  
      console.log('Updated selected items:', updatedItems); // Stampa l'array aggiornato
  
      return updatedItems;
    });
    
  };

  const [SearchbuttonClicked, setSearchbuttonClicked] = useState(false);

  const handleSearchButtonClick = () => {
    handleCloseButtonClick();
  };

  const handleCloseButtonClick = () => {
    setSearchbuttonClicked(true);
  };
  
  
  // fetch Dati sulla mappa
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
  
      // Tutti i file vengono scaricati in parallelo e ognuno finisce sulla mappa appena arriva,
      // invece di aspettare l'ultimo: i marker compaiono file per file.
      const fetchAllData = async () => {
        const requestId = ++latestRequestId;
        const isStale = () => requestId !== latestRequestId; // una nuova ricerca ha preso il posto di questa

        // Dizionario per raccogliere tutti i dati: una lista (vuota per ora) per ogni elemento selezionato
        const allData = {};
        selectedItems.forEach((item) => { allData[item.name] = []; });
        setMarkers(allData);

        const addData = (itemName, data) => {
          if (!data || isStale()) return;
          // se l'elemento è stato rimosso dalla mappa nel frattempo, il file arrivato in ritardo si scarta
          setMarkers((prev) => (itemName in prev ? { ...prev, [itemName]: [...prev[itemName], data] } : prev));
        };

        const fetchItem = async (item) => {
          // se gli elementi appartengono a Ranking: prima l'indice, poi tutte le sub-classifiche
          if (activeTab === "ranking") {
            const files = await fetchData(item, "index.json"); // Ottieni la lista dei file
            if (!files) {
              console.error("Errore nel recupero dell'index.json");
              return;
            }
            await Promise.all(files.map(async (file) => addData(item.name, await fetchData(item, file))));
          }
          // se gli elementi appartengono a Food il path è già il file della categoria
          else {
            addData(item.name, await fetchData(item, ""));
          }
        };

        await Promise.all(selectedItems.map(fetchItem));
      };
  
      fetchAllData(); // Richiama la funzione asincrona per ottenere tutti i dati
    }
  }, [SearchbuttonClicked, sfsv, setMarkers]); // Esegui l'effetto quando buttonClicked cambia
  


  const [searchText, setSearchText] = useState(""); // Stato per il testo della ricerca
  
  
 

  const navigate = useNavigate(); // Navigation hook




  

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
        <img src={closeicon} alt="Button Image"/>
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
      
      <div className="bttnSearch">
        <button className="search-button1" onClick={handleSearchButtonClick}>
          <TextPlusIcon text="Search" imageSrc={rocketicon} fSize="1.5rem" />
        </button>
      </div>
    </div>
  );
};

export default FoodSearch;
