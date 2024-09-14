import React from 'react';
import closeicon from './home/emoji/closeicon.png'
import './SearchBarButtonEmoji.css'



const ButtonEmoji = ({ iconSrc, onClick }) => {
  function stringToAdjustment(str, min, max) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
    }
    return Math.min(max, Math.max(min, Math.abs(hash % (max - min)) + min));
  }

  function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
  
    let r, g, b;
  
    if (s === 0) {
        r = g = b = l; // Grayscale
    } else {
        const hueToRgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
  
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
  
        r = hueToRgb(p, q, h / 360 + 1 / 3);
        g = hueToRgb(p, q, h / 360);
        b = hueToRgb(p, q, h / 360 - 1 / 3);
    }
  
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
  }

  
  function stringToHue(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
    }
    return Math.abs((hash * 137.508) % 360);
  }

  function setcolor(str, condition) {

    if (condition) {
      // If condition is true, generate and return the color based only on str1
      const hue = stringToHue(str);  // Base hue from first string
      const sat = stringToAdjustment(str, 30, 90); // Use str1 for saturation
      let light = stringToAdjustment(str, 30, 80); // Use str1 for lightness
  
      let rgb = hslToRgb(hue, sat, light);
      return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    }

    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAa");
    console.log(str);


    const hue1 = stringToHue(str);  // Base hue from first string
    const sat1 = stringToAdjustment(str, 30, 90);//stringToAdjustment(str1, 30, 90); // Use str1 for saturation
    let light1 = stringToAdjustment(str, 30, 93);//stringToAdjustment(str1, 30, 80); // Use str1 for lightness
    
    let rgb1 = hslToRgb(hue1, sat1, light1);
    return `rgb(${rgb1.r},${rgb1.g},${rgb1.b})`;
    
  }

  // Ottieni tutto dopo l'ultimo "/" e prima di ".png" e 
 const nameItem = iconSrc.split('/').pop().replace(".png", "").replace(/_/g, " ");
 console.log("nameItem");
 console.log(nameItem);

  const color = setcolor(nameItem, (iconSrc.includes("food")));
  console.log("iconSrc:");
  console.log(iconSrc);
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

