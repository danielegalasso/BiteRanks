import { Icon } from "leaflet";
import { renderToStaticMarkup } from 'react-dom/server';

// Function to dynamically generate colors based on category name
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const r = (hash >> 16) & 0xff;
  const g = (hash >> 8) & 0xff;
  const b = hash & 0xff;
  return `rgb(${r},${g},${b})`;
}
// Function to lighten a color
function lightenColor(color, percent) {
  const [r, g, b] = color.match(/\d+/g).map(Number);
  const lighten = (channel) => Math.min(255, channel + (255 - channel) * (percent / 100));
  return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
}
// Function to darken a color
function darkenColor(color, percent) {
  const [r, g, b] = color.match(/\d+/g).map(Number);
  const darken = (channel) => Math.max(0, Math.min(255, channel - channel * (percent / 100)));
  return `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`;
}
// Function to calculate luminance of a color
function calculateLuminance(color) {
  const [r, g, b] = color.match(/\d+/g).map(Number);
  // Normalize RGB values to [0, 1] and apply gamma correction
  const a = [r, g, b].map(val => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  // Calculate luminance
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}
// Function to get the best text color (white or black) for readability
function getBestTextColor(backgroundColor) {
  const luminance = calculateLuminance(backgroundColor);
  // Use white text for dark backgrounds and black text for light backgrounds
  return luminance > 0.179 ? 'black' : 'white';
}

// Funzione per generare l'icona SVG
const createCustomIcon = (category, rank) => {
  const color = stringToColor(category); // Genera un colore unico per la categoria

  // Imposta il testo del rank se è fornito
  const rankNumber = rank ? `${rank}` : ''; // Solo il numero del rank
  const borderColor = darkenColor(color, 40); // Colore del bordo come una tonalità più scura del colore
  const textColor = getBestTextColor(color); // Colore del testo come il colore opposto

  // Nuovo SVG fornito con la possibilità di modificare testo e colore dinamicamente
  const svgString = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width="59" height="73" viewBox="0 0 59 73" fill={color}>
      <g filter="url(#filter0_d_96_494)">
        <path
          d="M21.5 60L24 62L36 50L38 48L39.5 46L41.5 42.5L42 39.5V36.5V34L41.5 31L40.5 28L39 26L37 23.5L35.5 22L33 20L31 19L28 18L25.5 17.5H21.5L19 18L16 19L14.5 20L12 22L10 24L9 25.5L8 27L6.5 30L5.5 34V37L6 40.5L7 43.5L8.5 46L12 50L16 54L19 57.5L21.5 60Z"
          //fill={color} // Colore fisso per questo path
          stroke={borderColor} // Colore del bordo
          strokeWidth="2" // Larghezza del bordo
        />
        {/* Aggiungi qui il testo del rank */}
        {rank && (
          <text
          x="42%" // Centrato orizzontalmente
          y="50%" // Centrato verticalmente
          fontSize="18" // Dimensione del testo
          fontWeight="bold"
          fontFamily="Raleway"
          textAnchor="middle"
          alignmentBaseline="central" // Miglioramento dell'allineamento verticale
          fill={textColor} // Colore del testo
          >
            {rankNumber}
          </text>
        )}
      </g>
    </svg>
  );

  // Codifica l'SVG come URL
  const encodedSvg = encodeURIComponent(svgString);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

  return new Icon({
    iconUrl: svgUrl,
    iconSize: [40, 50], // Dimensioni effettive dell'icona SVG
    iconAnchor: [20, 50], // Centro inferiore (larghezza/2, altezza)
    popupAnchor: [0, -50], // Posizione del popup rispetto all'icona
  });
};


export default createCustomIcon;
