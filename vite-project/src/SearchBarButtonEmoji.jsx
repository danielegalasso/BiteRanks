import React from 'react';
import closeicon from './home/emoji/closeicon.png'
import './SearchBarButtonEmoji.css'


const ButtonEmoji = ({ iconSrc, onClick}) => {
  return (
    <button className="custom-button" >

      <img src={iconSrc} alt="close" className="src-icon" />
      <img src={closeicon} alt="close" className="x-icon" onClick={onClick} />

    </button>
  );
};

export default ButtonEmoji;
