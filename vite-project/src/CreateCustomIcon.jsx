import { Icon } from "leaflet";
import { renderToStaticMarkup } from 'react-dom/server';

// Function to generate base Hue from a string
function stringToHue(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
  }
  return Math.abs((hash * 137.508) % 360);
}

// Function to adjust saturation and lightness within a range
function stringToAdjustment(str, min, max) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
  }
  return Math.min(max, Math.max(min, Math.abs(hash % (max - min)) + min));
}

// HSL to RGB conversion remains the same
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

// Function to generate a small hue adjustment based on the second string
function adjustHueWithSecondString(hue, str2) {
  // Generate an adjustment value in the range of -10% to +10% of the hue
  const adjustment = stringToAdjustment(str2, -36, 36); // 10% of 360 is 36
  let newHue = hue + adjustment;
  
  // Keep hue within the 0-360 range
  if (newHue < 0) newHue += 360;
  if (newHue >= 360) newHue -= 360;

  return newHue;
}

// Main function to generate distinguishable color
function stringToColor(str1, str2) {
  let hue = stringToHue(str1);  // Base hue from first string
  hue = adjustHueWithSecondString(hue, str2); // Adjust hue with second string
  
  const sat = stringToAdjustment(str2, 40, 90); // Higher saturation for vibrancy
  let light = stringToAdjustment(str2, 30, 70); // Adjust lightness to ensure good contrast

  let rgb = hslToRgb(hue, sat, light);
  const luminance = calculateLuminance(`rgb(${rgb.r},${rgb.g},${rgb.b})`);

  // Adjust lightness if color is too dark for visibility
  if (luminance < 0.2) {
      light = Math.min(85, light + 20);
      rgb = hslToRgb(hue, sat, light);
  }

  return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
}

/*
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
  */
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
const createCustomIcon = (rankName, category, rank) => {
  const color = stringToColor(rankName, category); // Genera un colore unico per la categoria

  // Imposta il testo del rank se è fornito
  const rankNumber = rank ? `${rank}` : ''; // Solo il numero del rank
  const borderColor = darkenColor(color, 40); // Colore del bordo come una tonalità più scura del colore
  const textColor = getBestTextColor(color); // Colore del testo come il colore opposto

  // Nuovo SVG fornito con la possibilità di modificare testo e colore dinamicamente
  const svgString = renderToStaticMarkup(
    <svg width="40" height="49" viewBox="-2 -2 40 49" xmlns="http://www.w3.org/2000/svg">
    <g transform="scale(0.9)">
      <path d="M34.03 5.84A19.87 19.87 0 0 0 19.934 0 19.87 19.87 0 0 0 5.838 5.84c-7.784 7.784-7.784 20.405 0 28.19l14.096 14.095L34.03 34.031c7.784-7.786 7.784-20.407 0-28.191M31.904 31" 
      fill={color}
      stroke={borderColor} // Colore del bordo
      strokeWidth="2" // Spessore del bordo (puoi modificarlo come preferisci)
      />
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
    </g>
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
