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

// Funzione per creare un'icona a torta per il cluster FUNZIONE ATTUALE (la più bella)
const createClusterCustomIcon = (cluster) => {
    const childMarkers = cluster.getAllChildMarkers();
    const colors = childMarkers.map(marker => {
        const iconUrl = marker.options.icon.options.iconUrl;
        const svgString = decodeSvgUrl(iconUrl);
        const color = extractColor(svgString);
        return color;
    });

    const uniqueColors = [...new Set(colors)];
    const totalColors = uniqueColors.length;

    // Funzione per convertire coordinate polari in coordinate cartesiane
    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    // Se tutti i colori sono uguali, usa un cerchio monocolore
    if (totalColors === 1) {
        const singleColor = uniqueColors[0];
        const svgIcon = `
            <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="18" fill="${singleColor}" />
                <circle cx="18" cy="18" r="10" fill="white" />
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="black" font-size="12">${cluster.getChildCount()}</text>
            </svg>
        `;
        const encodedSvg = encodeURIComponent(svgIcon);
        const svgUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
        return divIcon({
            html: `<img src="${svgUrl}" />`,
            className: "custom-marker-cluster",
            iconSize: point(36, 36, true),
        });
    }

    // Altrimenti, crea un grafico a torta con colori multipli
    let currentAngle = 0;
    const slices = uniqueColors.map((color) => {
        const sliceAngle = 360 / totalColors;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;
        currentAngle += sliceAngle;

        const largeArcFlag = sliceAngle > 180 ? 1 : 0;
        const start = polarToCartesian(18, 18, 18, endAngle);
        const end = polarToCartesian(18, 18, 18, startAngle);

        return `
            <path d="M18,18 L${start.x},${start.y} A18,18 0 ${largeArcFlag},0 ${end.x},${end.y} Z" fill="${color}" />
        `;
    }).join('');

    const svgIcon = `
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            ${slices}
            <circle cx="18" cy="18" r="10" fill="white" />
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="black" font-size="12">${cluster.getChildCount()}</text>
        </svg>
    `;
    const encodedSvg = encodeURIComponent(svgIcon);
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
    return divIcon({
        html: `<img src="${svgUrl}" />`,
        className: "custom-marker-cluster",
        iconSize: point(36, 36, true),
    });
};

export default createClusterCustomIcon;