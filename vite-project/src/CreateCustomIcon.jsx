import { Icon } from "leaflet";
import { renderToStaticMarkup } from 'react-dom/server';

// Funzione per generare l'icona SVG
const createCustomIcon = (color, rank) => {
  // Imposta il testo del rank se è fornito
  const rankNumber = rank ? `${rank}` : ''; // Solo il numero del rank
  const rankSymbol = rank ? '°' : '';       // Il simbolo "°"

  // Nuovo SVG fornito
  const svgString = renderToStaticMarkup(
    <svg
      viewBox="0 0 450 450"
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
      height="60" // Manteniamo le stesse dimensioni
      width="60"
    >
      <g transform="matrix(0.7067389488220215, 0, 0, 0.6773630380630493, 57.11722353450126, 65.3020420462501)">
        <g>
          <path d="M406.033,62.148C364.604,20.719,310.306,0,256,0c-54.298,0-108.604,20.719-150.033,62.148c-82.859,82.859-82.859,217.208,0,300.066C106.803,363.051,256,512,256,512s149.197-148.949,150.033-149.786C488.892,279.356,488.892,145.007,406.033,62.148z M387.917,344.09c-0.845,0.845-92.194,92.041-131.917,131.703c-39.723-39.663-131.072-130.859-131.908-131.695c-72.738-72.738-72.738-191.095,0-263.834C159.326,45.03,206.174,25.626,256,25.626c49.835,0,96.683,19.405,131.917,54.639C460.655,153.003,460.655,271.36,387.917,344.09z"
            fill={color}
            stroke={color}
            strokeWidth="35" // Maggior spessore del bordo
            />
        </g>
      </g>
      {rank && (
        <text
          x="240" // Centrato orizzontalmente nel sistema di coordinate di viewBox
          y="260" // Posizionato verticalmente
          fontWeight="bold"
          fontFamily="Arial"
          textAnchor="middle"
          alignmentBaseline="middle"
          fill={color}
          stroke="black"
          strokeWidth="5" // Bordo nero
        >
          <tspan fontSize="150">{rankNumber}</tspan>
          <tspan fontSize="80" dy="-50">{rankSymbol}</tspan>
        </text>
      )}
    </svg>
  );

  // Codifica l'SVG come URL
  const encodedSvg = encodeURIComponent(svgString);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

  return new Icon({
    iconUrl: svgUrl,
    iconSize: [38, 38], // Dimensioni dell'icona
    iconAnchor: [19, 38], // Centra l'icona sulla mappa
    popupAnchor: [0, -38], // Posizione del popup rispetto all'icona
  });
};


export default createCustomIcon;
