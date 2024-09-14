import React from 'react';
import closeicon from './home/emoji/closeicon.png'
import './SearchBarButtonEmoji.css'



const ButtonEmoji = ({ iconSrc, onClick }) => {
  const color = "blue";

  return (
    <button
      className="custom-button"
      onClick={onClick}
      style={{ border: `0.15rem solid ${color}` }}
    >
      <img src={iconSrc} alt="icon" className="src-icon" />
      <img src={closeicon} alt="close" className="x-icon" />
    </button>
  );
};

export default ButtonEmoji;

