import React from 'react';
import Button from './SearchBarButton.jsx';
import {FaEdit, FaDice } from 'react-icons/fa'; 
import './SearchBarButtonList.css';


const ButtonList = () => {
  const buttonsData = [
    { icon: <FaEdit />, backgroundColor: '#7aa8c6' },
    { icon: <FaDice />, backgroundColor: '#4b7158' },
  ];

  const handleButtonClick = (icon) => {
    console.log(`${icon} button clicked!`);
  };

  return (
    <div className="button-list">
      {buttonsData.map((button, index) => (
        <Button
          key={index}
          icon={button.icon}
          backgroundColor={button.backgroundColor}
          onClick={() => handleButtonClick(button.icon)}
        />
      ))}
    </div>
  );
};

export default ButtonList;