import React from 'react';
import Button from './SearchBarButton.jsx';
import {FaEdit, FaDice, FaRegWindowClose } from 'react-icons/fa'; 
import { IoMdClose } from "react-icons/io";
import './SearchBarButtonList.css';


const ButtonList = ({sfsv, isFSV}) => {
  const buttonsData = [
    {
      icon: isFSV ? <FaRegWindowClose /> : <FaEdit />,
      backgroundColor: isFSV ? "red" : "#7aa8c6",
    },
    { icon: <FaDice />, backgroundColor: '#4b7158' },
  ];

  const handleButtonClick = (icon) => {
    
    sfsv(!isFSV);
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