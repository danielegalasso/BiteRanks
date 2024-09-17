import React, {useState} from 'react';
import Button from './SearchBarButton.jsx';
import ButtonEmoji from './SearchBarButtonEmoji.jsx';
import { FaEdit, FaDice, FaRegWindowClose } from 'react-icons/fa'; 
import "leaflet.markercluster";
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

    // Check if all indices have been used
    const allIndices = markersInView.map((_, index) => index);
    const unusedIndices = allIndices.filter(index => !suggestedIndices.includes(index));

    // Reset suggestedIndices if all markers have been suggested
    if (unusedIndices.length === 0) {
      setSuggestedIndices([]);
      // Recalculate unused indices
      unusedIndices.push(...allIndices);
    }
    
    if (unusedIndices.length > 0) {
      // Choose a random unused index
      const randomIndex = Math.floor(Math.random() * unusedIndices.length);
      const chosenIndex = unusedIndices[randomIndex];
      const randomMarker = markersInView[chosenIndex];
      const randomMarkerCoords = randomMarker.getLatLng();
      console.log("randomMarkerCoords: ", randomMarkerCoords);

      const clusterLayer = window.globalClusters.getVisibleParent(randomMarker);
      console.log("clusterLayer: ", clusterLayer, "clusterLayer._childCount: ", clusterLayer._childCount);
      if (clusterLayer && clusterLayer._childCount) {
        // Il marker è dentro un cluster
        clusterLayer.spiderfy(); // Espande il cluster senza zoomare
  
        // Apri il popup del marker selezionato
        setTimeout(() => {
          randomMarker.openPopup();
        }, 300); // Un piccolo ritardo per assicurarsi che il cluster si sia espanso
      } else {
        // Il marker è visibile, apri direttamente il popup
        randomMarker.openPopup();
      }

      // Update the list of suggested indices
      setSuggestedIndices(prevIndices => [...prevIndices, chosenIndex]);
      console.log("suggestedIndices: ", suggestedIndices);
    } else {
      console.log("No markers available to suggest.");
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
