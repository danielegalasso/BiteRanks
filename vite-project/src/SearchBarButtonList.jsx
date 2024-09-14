import React, {useState} from 'react';
import Button from './SearchBarButton.jsx';
import ButtonEmoji from './SearchBarButtonEmoji.jsx';
import { FaEdit, FaDice, FaRegWindowClose } from 'react-icons/fa'; 
import { IoMdClose } from "react-icons/io";
import './SearchBarButtonList.css';
import { all } from 'axios';

const ButtonList = ({ sfsv, isFSV, selectedItems, setSelectedItems, markers, setMarkers}) => {
  const [suggestedIndices, setSuggestedIndices] = useState([]);

  // Funzione per il bottone che cambia isFSV
  const handleEditOrCloseClick = () => {
    sfsv(!isFSV);
  };

  // Funzione per il bottone Dice
  const handleDiceClick = () => {
    console.log("Dice button clicked!");

    // Access the map instance
    const map = window.mapInstance;
    if (!map) {
      console.log("Map instance not found.");
      return;
    }

    // Get the current bounds of the map's view
    const bounds = map.getBounds();
    const allMarkers = Object.values(window.globalMarkers || {});
    const markersInView = allMarkers.filter(marker => {
      const markerLatLng = marker.getLatLng();
      return bounds.contains(markerLatLng);
    });
    console.log("markersInView: ", markersInView);
    console.log("markersInView.length: ", markersInView.length);

    // Filter out markers that have already been suggested
    const unSuggestedMarkers = markersInView.filter((marker, index) => !suggestedIndices.includes(index));

    if (unSuggestedMarkers.length > 0) {
      const randomIndex = Math.floor(Math.random() * unSuggestedMarkers.length);
      const randomMarker = unSuggestedMarkers[randomIndex];
      const randomMarkerIndex = markersInView.indexOf(randomMarker);
      const randomMarkerCoords = randomMarker.getLatLng();
      console.log("randomMarkerCoords: ", randomMarkerCoords);
      
      map.setView(randomMarkerCoords, 17);
      randomMarker.openPopup();
      /*
      allMarkers.forEach(marker => {
        if(marker.getLatLng().equals(randomMarkerCoords)) {
          marker.openPopup();
        }
      })
        */

      // Update the list of suggested indices
      setSuggestedIndices(prevIndices => [...prevIndices, randomMarkerIndex]);
    } else {
      console.log("Nessun marker disponibile nella visuale attuale.");
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
