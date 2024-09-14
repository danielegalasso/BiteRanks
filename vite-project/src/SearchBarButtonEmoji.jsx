import React from 'react';
import closeicon from './home/emoji/closeicon.png'
import './SearchBarButtonEmoji.css'


const ButtonEmoji = ({ iconSrc, onClick}) => {
  return (
    <button className="custom-button" onClick={onClick} >

      <img src={iconSrc} alt="close" className="src-icon" />
      <img src={closeicon} alt="close" className="x-icon"  />

    </button>
  );
};

export default ButtonEmoji;
