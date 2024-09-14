import React from 'react';
import Button from './SearchBarButton.jsx';
import ButtonEmoji from './SearchBarButtonEmoji.jsx';
import { FaEdit, FaDice, FaRegWindowClose } from 'react-icons/fa'; 
import { IoMdClose } from "react-icons/io";
import './SearchBarButtonList.css';
import { all } from 'axios';

const ButtonList = ({ sfsv, isFSV, selectedItems, setSelectedItems, markers, setMarkers}) => {
  // Funzione per il bottone che cambia isFSV
  const handleEditOrCloseClick = () => {
    sfsv(!isFSV);
  };

  // Funzione per il bottone Dice
  const handleDiceClick = () => {
    console.log("Dice button clicked!");
    const allMarkers = Object.values(window.globalMarkers || {});
    console.log("allMarkers: ", allMarkers);
    console.log("allMarkers.length: ", allMarkers.length);

    if (allMarkers.length > 0) {
      const randomIndex = Math.floor(Math.random() * allMarkers.length);
      const randomMarker = allMarkers[randomIndex];
      const randomMarkerCoords = randomMarker.getLatLng();
      console.log("randomMarkerCoords: ", randomMarkerCoords);

      const map = window.mapInstance;
      if (map) {
        map.setView(randomMarkerCoords, 17);

        allMarkers.forEach(marker => {
          if(marker.getLatLng().equals(randomMarkerCoords)) {
            marker.openPopup();
          }
        })
      }
    } else {
      console.log("Nessun marker disponibile per la selezione casuale.");
    }
  };

  const removeItem = (itemToRemove) => { 
    setSelectedItems((prevItems) =>
        prevItems.filter((item) => item !== itemToRemove)
    );
    const markers1 = { ...markers };
    delete markers1[itemToRemove.name];
    setMarkers(markers1);  
};

  const buttonsData = [
    {
      icon: isFSV ? <FaRegWindowClose /> : <FaEdit />,
      backgroundColor: isFSV ? "red" : "#7aa8c6",
      onClick: handleEditOrCloseClick,
    },
    {
      icon: <FaDice />,
      backgroundColor: '#4b7158',
      onClick: handleDiceClick,
    }
  ];

  return (
    <div className="button-list">
      {selectedItems.map((item, index) => (
        <ButtonEmoji
          key={index} // Usa l'indice se non hai un identificatore unico
          iconSrc={item.icon}
          onClick={() => removeItem(item)}
        />
      ))}
      {buttonsData.map((button, index) => (
        <Button
          key={index}
          icon={button.icon}
          backgroundColor={button.backgroundColor}
          onClick={button.onClick}
        />
      ))}
    </div>
  );
};

export default ButtonList;
