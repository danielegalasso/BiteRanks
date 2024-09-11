import React from 'react';
import Button from './SearchBarButton.jsx';
import ButtonEmoji from './SearchBarButtonEmoji.jsx';
import { FaEdit, FaDice, FaRegWindowClose } from 'react-icons/fa'; 
import { IoMdClose } from "react-icons/io";
import './SearchBarButtonList.css';

const ButtonList = ({ sfsv, isFSV, selectedItems, setSelectedItems }) => {
  
  // Funzione per il bottone che cambia isFSV
  const handleEditOrCloseClick = () => {
    sfsv(!isFSV);
  };

  // Funzione per il bottone Dice
  const handleDiceClick = () => {
    console.log("Dice button clicked!");
    // Inserisci qui la logica che vuoi eseguire quando il bottone Dice viene cliccato
  };

  const removeItem = (itemToRemove) => {
    setSelectedItems((prevItems) =>
      prevItems.filter((item) => item !== itemToRemove)
    );
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
