import { Icon } from "leaflet";
import { renderToStaticMarkup } from 'react-dom/server';

// Funzione per generare l'icona SVG
const createCustomIcon = (color) => {
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