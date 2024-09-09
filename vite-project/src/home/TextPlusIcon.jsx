import React from "react";
import "./TextPlusIcon.css"; // Importa il CSS specifico per il componente
import pizzaIcon from "./emoji/pizza.png"; // Importa l'icona PNG dalla cartella emoji

const TextPlusIcon = ({ text, imageSrc, fSize }) => {
  return (
    <div className="text-plus-icon-container">
      <span className="text-plus-icon-text" style={{ fontSize: fSize }}>{text}</span>
      <img src={imageSrc} alt="Icon" className="text-plus-icon-image" style={{ width: fSize}} />
    </div>
  );
};

export default TextPlusIcon;
