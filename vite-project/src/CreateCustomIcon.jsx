import { Icon } from "leaflet";
import { renderToStaticMarkup } from 'react-dom/server';

// Funzione per scurire un colore in formato HEX
const darkenColor = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return `#${(0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 + (B < 255 ? (B < 1 ? 0 : B) : 255)).toString(16).slice(1)}`;
};

// Funzione per generare l'icona SVG
const createCustomIcon = (color, rank=null) => {
    // Imposta il testo del rank se è fornito
    const rankText = rank ? `${rank}°` : '';

    // SVG come stringa
    const svgString = renderToStaticMarkup(
      <svg 
        height="38" 
        width="38" 
        viewBox="0 0 512 512" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M256,0C154.739,0,72.348,82.386,72.348,183.652c0,70.241,18.514,94.635,169.771,320.929
          C245.217,509.217,250.424,512,256,512s10.782-2.783,13.881-7.418c151.251-226.216,169.771-251.423,169.771-320.929
          C439.652,82.386,357.261,0,256,0z M256,267.13c-46.032,0-83.478-37.446-83.478-83.478c0-46.032,37.446-83.478,83.478-83.478
          s83.478,37.446,83.478,83.478C339.478,229.684,302.032,267.13,256,267.13z"
          fill={color}
        />
        {rank && (
          <text 
            x="256" 
            y="190" 
            fontSize="110" 
            textAnchor="middle" 
            fill={color}
            dominantBaseline="middle"
            fontFamily="Arial"
            fontWeight="bold" // Testo in grassetto
          >
            {rankText}
          </text>
        )}
      </svg>
    );
  
    // Codifica l'SVG come URL
    const encodedSvg = encodeURIComponent(svgString);
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
  
    return new L.Icon({
      iconUrl: svgUrl,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
      // Aggiungi altre opzioni se necessario
    });
};

export default createCustomIcon;
