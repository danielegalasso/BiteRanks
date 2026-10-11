import { divIcon, point } from 'leaflet';

/*   VARIANTE PER FARE IL COLORE DEL CLUSTER CON LA MEDIA DEI COLORI SOTTOSTANTI DEI MARKETER
const combineColors = (colors) => {
    if (colors.length === 0) return 'black'; // Colore di default
    // Calcolare il colore medio
    let r = 0, g = 0, b = 0;
    colors.forEach(color => {
        const { r: red, g: green, b: blue } = tinycolor(color).toRgb();
        r += red;
        g += green;
        b += blue;
    });
    r = Math.round(r / colors.length);
    g = Math.round(g / colors.length);
    b = Math.round(b / colors.length);
    return tinycolor({ r, g, b }).toHexString();
};
const createClusterCustomIcon = (cluster) => {
    const childMarkers = cluster.getAllChildMarkers();
    const colors = childMarkers.map(marker => {
        // Assumendo che tu possa ottenere il colore dell'icona del marker
        // Devi assicurarti che il colore possa essere estratto dall'icona del marker
        const iconUrl = marker.options.icon.options.iconUrl;
        const svgString = decodeURIComponent(iconUrl.split(',')[1]);
        const colorMatch = svgString.match(/fill="([^"]*)"/);
        return colorMatch ? colorMatch[1] : 'black'; // Colore di default se non trovato
    });
    const clusterColor = combineColors(colors);
    return new divIcon({
        html: `<span class="cluster-icon" style="background-color: ${clusterColor};">${cluster.getChildCount()}</span>`,
        className: "custom-marker-cluster",
        iconSize: point(33, 33, true),
    });
};
*/

// Funzione per decodificare l'URL dell'icona SVG
const decodeSvgUrl = (url) => {
    const svgString = decodeURIComponent(url.split(',')[1]);
    return svgString;
};

// Funzione per estrarre il colore RGB dall'SVG
const extractColor = (svgString) => {
    // Regex per trovare il primo attributo fill
    const fillMatch = svgString.match(/fill\s*=\s*"rgb\((\d+),(\d+),(\d+)\)"/);
    if (fillMatch) {
        const [, r, g, b] = fillMatch;
        return `rgb(${r},${g},${b})`;
    }
    return 'black'; // Colore di default se non trovato
};

// Cluster con gli stessi colori e lo stesso numero di marker hanno la stessa icona
const clusterIconCache = new Map();

// Funzione per creare un'icona a torta per il cluster FUNZIONE ATTUALE (la più bella)
// La torta è disegnata in CSS (conic-gradient) e non come immagine SVG: il browser non deve
// decodificare un'immagine per ogni cluster, e lo zoom resta fluido anche con migliaia di locali.
const createClusterCustomIcon = (cluster) => {
    const childMarkers = cluster.getAllChildMarkers();
    const uniqueColors = [...new Set(childMarkers.map(marker => {
        const iconOptions = marker.options.icon.options;
        // il colore è salvato nelle opzioni dell'icona; decodificare l'SVG resta solo come ripiego
        return iconOptions.color || extractColor(decodeSvgUrl(iconOptions.iconUrl));
    }))];
    const count = cluster.getChildCount();
    const cacheKey = `${uniqueColors.join(';')}|${count}`;
    if (clusterIconCache.has(cacheKey)) {
        return clusterIconCache.get(cacheKey);
    }

    // una fetta uguale per ogni colore presente nel cluster
    const slice = 100 / uniqueColors.length;
    const stops = uniqueColors.map((color, i) => `${color} ${i * slice}% ${(i + 1) * slice}%`).join(', ');
    const icon = divIcon({
        html: `<div class="cluster-pie" style="background: conic-gradient(${stops})"><span>${count}</span></div>`,
        className: "custom-marker-cluster",
        iconSize: point(36, 36, true),
    });
    clusterIconCache.set(cacheKey, icon);
    return icon;
};

export default createClusterCustomIcon;
