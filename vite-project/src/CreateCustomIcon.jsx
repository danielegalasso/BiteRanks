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
    <svg width="40" height="49" viewBox="0 0 40 49" xmlns="http://www.w3.org/2000/svg">
      <path d="M34.03 5.84A19.87 19.87 0 0 0 19.934 0 19.87 19.87 0 0 0 5.838 5.84c-7.784 7.784-7.784 20.405 0 28.19l14.096 14.095L34.03 34.031c7.784-7.786 7.784-20.407 0-28.191M31.904 31" fill={color}/>
        {/* Aggiungi qui il testo del rank */}
        {rank && (
          <text
          x="50%" // Centrato orizzontalmente
          y="45%" // Centrato verticalmente
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
      
    </svg>
  );

  // Codifica l'SVG come URL
  const encodedSvg = encodeURIComponent(svgString);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

  return new Icon({
    iconUrl: svgUrl,
    iconSize: [30, 36.75],
    iconAnchor: [15, 37.5],
    popupAnchor: [0, -37.5],
  });
};


export default createCustomIcon;
