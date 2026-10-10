// Classifica unica delle pizzerie: ogni pizzeria viene ordinata per il suo miglior piazzamento
// (pesato in base all'importanza della classifica); a parità contano i piazzamenti successivi.

// L'ordine conta: vince la prima regola che fa match sul nome della sub-ranking.
// "base" è il punteggio del 1° classificato, "step" quanto si perde per ogni posizione.
const TIERS = [
  { match: /^50 Top World \d{4}$/i, label: () => "World", base: 1000, step: 3 },
  { match: /Artisan Pizza Chains/i, label: () => "Chains", base: 600, step: 4 },
  { match: /Excellent Pizza Chains/i, label: () => "Chain Eccellente", base: 330, step: 0 },
  { match: /(Eccellenti|Excellent Pizzerias)/i, label: (s) => `${regionOf(s)} Eccellente`.trim(), base: 350, step: 0 },
  { match: /Usa \d{4} Slice/i, label: () => "USA Slice", base: 650, step: 5 },
  { match: /Pizze In Viaggio/i, label: () => "Pizze in Viaggio", base: 750, step: 5 },
  { match: /50 Top (Pizza )?(Italia|Europa|Europe|Usa|Latin America|Asia Pacific)/i, label: (s) => regionOf(s), base: 800, step: 4 },
  { match: /Tre Spicchi/i, label: () => "Tre Spicchi GR", base: 560, step: 0 },
  { match: /Tre Rotelle/i, label: () => "Tre Rotelle GR", base: 520, step: 0 },
];
const DEFAULT_TIER = { label: (s) => s, base: 300, step: 0 };

// Distanze (metri) entro cui due voci di classifiche diverse sono considerate lo stesso locale
const SAME_SPOT_METERS = 30;
const SAME_NAME_METERS = 500;

const REGIONS = [
  [/Italia/i, "Italia"],
  [/Europ/i, "Europa"],
  [/Usa/i, "USA"],
  [/Latin America/i, "Latin America"],
  [/Asia Pacific/i, "Asia Pacific"],
];

function regionOf(subRanking) {
  const found = REGIONS.find(([re]) => re.test(subRanking));
  return found ? found[1] : "";
}

function tierOf(subRanking) {
  return TIERS.find((t) => t.match.test(subRanking)) || DEFAULT_TIER;
}

function parsePosition(position) {
  const n = parseInt(position, 10);
  return Number.isFinite(n) ? n : null;
}

function appearanceScore(tier, position) {
  // una voce senza posizione in una classifica posizionata vale come l'ultima della lista
  const pos = position ?? (tier.step ? 100 : 1);
  return tier.base - (pos - 1) * tier.step;
}

function distanceMeters([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const STOPWORDS = new Set([
  "pizzeria", "pizzerie", "pizza", "pizze", "ristorante", "trattoria", "bar", "and", "the",
  "di", "da", "del", "della", "dei", "la", "il", "lo", "le", "i", "e", "a", "al", "o", "by", "pizzaiolo",
]);

function nameTokens(name) {
  return name
    .split("|")[0]
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function shareToken(a, b) {
  return a.some((t) => b.includes(t));
}

// Gambero Rosso scrive i nomi come "SEU PIZZA ILLUMINATI | ROMA"
function prettyName(name) {
  const base = name.split("|")[0].trim();
  if (base !== base.toUpperCase()) return base;
  return base.toLowerCase().replace(/(^|[\s\-'’(])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
}

function cityFromName(name) {
  const parts = name.split("|");
  return parts.length > 1 ? prettyName(parts[1]) : null;
}

// Confronta due pizzerie piazzamento per piazzamento (le appearances sono già ordinate per punteggio)
function compareAppearances(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = (b[i] ? b[i].score : 0) - (a[i] ? a[i].score : 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// Trasforma le voci del Pizza.json in una lista di pizzerie, ognuna con le sue sedi
// e le classifiche in cui compare.
// La stessa pizzeria può avere nomi diversi tra 50 Top Pizza e Gambero Rosso:
// le voci vengono unite quando le sedi coincidono.
export function buildPizzerias(entries) {
  const locations = [];
  const grid = new Map(); // indice spaziale grezzo (~1 km) per non confrontare tutto con tutto
  const cellKey = (lat, lon) => `${Math.floor(lat * 100)}:${Math.floor(lon * 100)}`;

  const findLocation = (coord, tokens) => {
    const [lat, lon] = coord;
    let best = null;
    for (let dLat = -1; dLat <= 1; dLat++) {
      for (let dLon = -1; dLon <= 1; dLon++) {
        const bucket = grid.get(cellKey(lat + dLat / 100, lon + dLon / 100)) || [];
        for (const location of bucket) {
          const d = distanceMeters(coord, location.coord);
          const sameSpot = d <= SAME_SPOT_METERS;
          const sameName = d <= SAME_NAME_METERS && shareToken(tokens, location.tokens);
          if ((sameSpot || sameName) && (!best || d < best.d)) best = { location, d };
        }
      }
    }
    return best && best.location;
  };

  // union-find: le sedi della stessa voce (o di voci che condividono una sede) sono la stessa pizzeria
  const parent = [];
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (a, b) => { parent[find(a)] = find(b); };

  const entryInfo = [];
  entries.forEach((entry) => {
    const tier = tierOf(entry["sub-ranking"]);
    const position = parsePosition(entry.position);
    const info = {
      entry,
      isGamberoRosso: entry.name.includes("|"),
      appearance: {
        ranking: entry.ranking,
        subRanking: entry["sub-ranking"],
        position: entry.position,
        ref: entry.ref,
        label: tier.label(entry["sub-ranking"]),
        score: appearanceScore(tier, position),
        positionNumber: position,
      },
      locationIds: [],
    };
    const tokens = nameTokens(entry.name);

    (entry.coord || []).forEach((coord, i) => {
      if (!Array.isArray(coord) || coord.length !== 2) return;
      let location = findLocation(coord, tokens);
      if (!location) {
        location = {
          idx: locations.length,
          coord,
          tokens,
          address: (entry.address && entry.address[i]) || cityFromName(entry.name),
          addressFromGR: info.isGamberoRosso,
        };
        locations.push(location);
        parent.push(location.idx);
        const key = cellKey(coord[0], coord[1]);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(location);
      } else {
        location.tokens = [...new Set([...location.tokens, ...tokens])];
        if (location.addressFromGR && !info.isGamberoRosso && entry.address && entry.address[i]) {
          location.address = entry.address[i];
          location.addressFromGR = false;
        }
      }
      info.locationIds.push(location.idx);
    });
    for (let k = 1; k < info.locationIds.length; k++) union(info.locationIds[0], info.locationIds[k]);
    entryInfo.push(info);
  });

  const byRoot = new Map();
  const pizzeriaOf = (root) => {
    if (!byRoot.has(root)) byRoot.set(root, { id: String(root), locations: [], sources: [] });
    return byRoot.get(root);
  };

  for (const location of locations) {
    pizzeriaOf(find(location.idx)).locations.push({ idx: location.idx, coord: location.coord, address: location.address });
  }

  // ogni piazzamento resta legato alle sedi della voce da cui proviene: una catena con sedi
  // in più città (es. Caserta e Miami) mostra in ogni zona solo i piazzamenti di quelle sedi
  for (const info of entryInfo) {
    if (!info.locationIds.length) continue; // voce senza coordinate: non è sulla mappa
    pizzeriaOf(find(info.locationIds[0])).sources.push({
      appearance: info.appearance,
      locationIds: new Set(info.locationIds),
      name: prettyName(info.entry.name),
      isGamberoRosso: info.isGamberoRosso,
      website: info.entry.website || null,
    });
  }

  return [...byRoot.values()];
}

// Piazzamenti, nome e sito della pizzeria considerando solo le sedi indicate
function describe(pizzeria, locationIds) {
  // per ogni sede e classifica vale la voce più specifica (con meno sedi): la scheda
  // "I Masanielli" include anche la sede di Miami, che però ha una sua voce nella stessa classifica
  const sources = new Set();
  for (const id of locationIds) {
    const bySubRanking = new Map();
    for (const src of pizzeria.sources) {
      if (!src.locationIds.has(id)) continue;
      const best = bySubRanking.get(src.appearance.subRanking);
      if (!best || src.locationIds.size < best.locationIds.size ||
          (src.locationIds.size === best.locationIds.size && src.appearance.score > best.appearance.score)) {
        bySubRanking.set(src.appearance.subRanking, src);
      }
    }
    bySubRanking.forEach((src) => sources.add(src));
  }
  const appearances = [];
  for (const { appearance } of sources) {
    const same = appearances.find((a) => a.subRanking === appearance.subRanking);
    if (!same) appearances.push(appearance);
    else if (appearance.score > same.score) appearances[appearances.indexOf(same)] = appearance;
  }
  appearances.sort((a, b) => b.score - a.score);
  // il nome di 50 Top Pizza è più leggibile di quello in maiuscolo di Gambero Rosso
  const byScore = [...sources].sort((a, b) => b.appearance.score - a.appearance.score);
  const named = byScore.find((src) => !src.isGamberoRosso) || byScore[0];
  return {
    appearances,
    score: appearances[0].score,
    name: named.name,
    website: (byScore.find((src) => src.website) || {}).website || null,
  };
}

// "bounds" è un L.LatLngBounds. Restituisce le migliori "limit" pizzerie con almeno
// una sede visibile (valutate solo per i piazzamenti di quelle sedi) e il totale.
export function bestPizzeriasIn(pizzerias, bounds, limit) {
  const visible = [];
  for (const pizzeria of pizzerias) {
    const visibleLocations = pizzeria.locations.filter((l) => bounds.contains(l.coord));
    if (!visibleLocations.length) continue;
    const details = describe(pizzeria, new Set(visibleLocations.map((l) => l.idx)));
    visible.push({ id: pizzeria.id, visibleLocations, ...details });
  }
  visible.sort((a, b) => compareAppearances(a.appearances, b.appearances));
  return { list: visible.slice(0, limit), total: visible.length };
}

export function badgeText(appearance) {
  return appearance.positionNumber ? `${appearance.label} #${appearance.positionNumber}` : appearance.label;
}
