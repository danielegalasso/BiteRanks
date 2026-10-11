// Classifica unica dei locali selezionati (categorie di cibo o classifiche): ogni locale viene ordinato
// per il suo miglior piazzamento, pesato in base all'importanza della classifica; a parità contano
// i piazzamenti successivi. Lo stesso locale presente in più guide viene riunito in una sola voce.

// L'ordine conta: vince la prima regola che fa match sul nome della sub-ranking.
// "base" è il punteggio del 1° classificato, "step" quanto si perde per ogni posizione
// (0 per i riconoscimenti senza posizione, come le Tre Forchette).
const TIERS = [
  // classifiche mondiali
  { match: /^50 Top World \d{4}$/i, label: () => "50 Top World", base: 1000, step: 3 },
  { match: /World's 50 Best Restaurants/i, label: () => "50 Best", base: 1000, step: 3 },
  { match: /World's 50 Best Bars/i, label: () => "50 Best Bars", base: 1000, step: 3 },
  { match: /101 Best Steak/i, label: () => "101 Best Steak", base: 1000, step: 3 },
  { match: /100 Best Coffee Shops/i, label: () => "100 Best Coffee", base: 1000, step: 3 },
  // Top 100 mondiale dei pizzaioli (thebestchefpizza.com): va prima di "Pizza Awards"
  { match: /Best Pizza Awards/i, label: () => "Best Pizza Awards", base: 950, step: 3 },
  { match: /101 Best Burgers/i, label: () => "101 Best Burgers", base: 1000, step: 3 },
  { match: /Best Burgers .* by Burgerdudes/i, label: () => "Burgerdudes", base: 960, step: 6 },
  { match: /Top 50 Sushi Worldwide/i, label: () => "Top 50 Sushi", base: 980, step: 5 },
  // La Liste: oltre 1200 posizioni (Top 1000 più gli ex aequo), quindi un passo piccolo
  { match: /La Liste Top 1000/i, label: () => "La Liste", base: 1000, step: 0.25 },
  // classifiche regionali di 50 Best: subito sotto quella mondiale
  { match: /^(Asia's|Latin America's|North America's) 50 Best Restaurants/i, label: (s) => `${s.split("'")[0]} 50 Best`, base: 930, step: 3 },
  { match: /^(Asia's|Latin America's|North America's) 50 Best Bars/i, label: (s) => `${s.split("'")[0]} 50 Best Bars`, base: 930, step: 3 },
  // TasteAtlas "Where to Eat": i migliori posti per un piatto (30 per piatto)
  { match: /TasteAtlas Where to Eat/i, label: (s) => `TasteAtlas ${s.replace(/.*Where to Eat\s*/i, "")}`, base: 820, step: 8 },
  { match: /Most Legendary Ice Cream/i, label: () => "TasteAtlas Gelato", base: 850, step: 2 },
  { match: /Most Legendary Dessert/i, label: () => "TasteAtlas Dessert", base: 850, step: 2 },
  { match: /Most Legendary/i, label: () => "TasteAtlas", base: 850, step: 2 },

  // 50 Top Italy: le classifiche da 50 e i premi "top 10"
  { match: /Ristoranti Italiani \d{4} Grandi Ristoranti/i, label: () => "50 Top Italy", base: 900, step: 4 },
  { match: /Ristoranti Italiani \d{4} Luxury/i, label: () => "50 Top Luxury", base: 880, step: 4 },
  { match: /Ristoranti Italiani \d{4} Trattorie/i, label: () => "50 Top Trattorie", base: 850, step: 4 },
  { match: /Ristoranti Italiani Nel Mondo/i, label: () => "50 Top Nel Mondo", base: 850, step: 4 },
  { match: /Sotto I 100/i, label: () => "50 Top Sotto 100€", base: 820, step: 12 },
  { match: /Bistro Vegetali/i, label: () => "50 Top Vegetali", base: 820, step: 12 },
  { match: /Ristoranti Di Pesce/i, label: () => "50 Top Pesce", base: 820, step: 12 },
  { match: /Migliori Panini/i, label: () => "50 Top Panini", base: 820, step: 12 },
  { match: /Migliori Street Food \d{4}/i, label: () => "50 Top Street Food", base: 820, step: 12 },
  { match: /Amatriciane/i, label: () => "50 Top Amatriciana", base: 820, step: 12 },
  { match: /Cacio E Pepe/i, label: () => "50 Top Cacio e Pepe", base: 820, step: 12 },
  { match: /50 Top Italy Migliori Sushi/i, label: () => "50 Top Sushi", base: 820, step: 12 },

  // 50 Top Pizza e Pizza Awards
  { match: /Artisan Pizza Chains/i, label: () => "Chains", base: 600, step: 4 },
  { match: /Excellent Pizza Chains/i, label: () => "Chain Eccellente", base: 330, step: 0 },
  { match: /(Eccellenti|Excellent Pizzerias)/i, label: (s) => `${regionOf(s)} Eccellente`.trim(), base: 350, step: 0 },
  { match: /Usa \d{4} Slice/i, label: () => "USA Slice", base: 650, step: 5 },
  { match: /Pizze In Viaggio/i, label: () => "Pizze in Viaggio", base: 750, step: 5 },
  { match: /50 Top (Pizza )?(Italia|Europa|Europe|Usa|Latin America|Asia Pacific)/i, label: (s) => regionOf(s), base: 800, step: 4 },
  { match: /^Pizza Awards Italia/i, label: () => "Pizza Awards", base: 790, step: 4 },

  // riconoscimenti senza posizione
  { match: /^Le Soste$/i, label: () => "Le Soste", base: 620, step: 0 },
  { match: /Qualità Prezzo/i, label: () => "GR Qualità/Prezzo", base: 480, step: 0 },
  { match: /Tre Forchette/i, label: () => "Tre Forchette GR", base: 600, step: 0 },
  { match: /Trattorie Italia Gambero Rosso/i, label: () => "Tre Gamberi GR", base: 560, step: 0 },
  { match: /Tre Spicchi/i, label: () => "Tre Spicchi GR", base: 560, step: 0 },
  { match: /Tre Coni/i, label: () => "Tre Coni GR", base: 560, step: 0 },
  { match: /Tre Torte/i, label: () => "Tre Torte GR", base: 560, step: 0 },
  { match: /Tre Pani/i, label: () => "Tre Pani GR", base: 560, step: 0 },
  { match: /Migliori Bar Gambero Rosso/i, label: () => "Tre Tazzine GR", base: 560, step: 0 },
  { match: /Tre Bacchette/i, label: () => "Tre Bacchette GR", base: 560, step: 0 },
  { match: /Tre Rotelle/i, label: () => "Tre Rotelle GR", base: 520, step: 0 },
  { match: /Tre Mappamondi/i, label: () => "Tre Mappamondi GR", base: 500, step: 0 },
  { match: /Street Food Gambero Rosso/i, label: () => "Street Food GR", base: 480, step: 0 },
  { match: /Chiocciole Osterie/i, label: () => "Chiocciola Slow Food", base: 560, step: 0 },
  { match: /Birre .*Chiocchiole/i, label: () => "Birre: Chiocciola", base: 500, step: 0 },
  { match: /Birre .*Eccellenze/i, label: () => "Birre: Eccellenza", base: 450, step: 0 },
  { match: /Birre .*Locali Eccellenti/i, label: () => "Birre: Locale Eccellente", base: 450, step: 0 },
  { match: /Birre .*Filiera/i, label: () => "Birre: Filiera", base: 420, step: 0 },
  { match: /Slow Wine/i, label: () => "Slow Wine", base: 450, step: 0 },
  { match: /Burger Battle/i, label: () => "Burger Battle", base: 400, step: 0 },
];
// classifiche nuove non ancora in tabella: un peso medio, più alto se hanno le posizioni
const DEFAULT_RANKED = { label: (s) => s.replace(/\s*\d{4}\s*/g, " ").trim(), base: 700, step: 4 };
const DEFAULT_AWARD = { label: (s) => s.replace(/\s*\d{4}\s*/g, " ").trim(), base: 400, step: 0 };

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

// regioni italiane come compaiono nei nomi delle guide ("Old Sponge - Alba Adriatica (TE) - Abruzzo")
const ITALIAN_REGIONS = new Set([
  "abruzzo", "basilicata", "calabria", "campania", "emilia romagna", "friuli venezia giulia", "lazio", "liguria",
  "lombardia", "marche", "molise", "piemonte", "puglia", "sardegna", "sicilia", "toscana", "trentino alto adige",
  "umbria", "valle d aosta", "veneto",
]);

function regionOf(subRanking) {
  const found = REGIONS.find(([re]) => re.test(subRanking));
  return found ? found[1] : "";
}

function tierOf(subRanking, hasPosition) {
  return TIERS.find((t) => t.match.test(subRanking)) || (hasPosition ? DEFAULT_RANKED : DEFAULT_AWARD);
}

function parsePosition(position) {
  const n = parseInt(position, 10);
  return Number.isFinite(n) ? n : null;
}

function appearanceScore(tier, position) {
  // una voce senza posizione in una classifica posizionata vale come l'ultima della lista
  const pos = position ?? (tier.step ? 100 : 1);
  return Math.max(tier.base - (pos - 1) * tier.step, 100);
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
  "pizzeria", "pizzerie", "pizza", "pizze", "ristorante", "trattoria", "osteria", "bar", "and", "the",
  "di", "da", "del", "della", "dei", "la", "il", "lo", "le", "i", "e", "a", "al", "o", "by", "pizzaiolo",
]);

function normalize(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const PROVINCE = /\s*[([][A-Z]{2}[)\]]$/;

// Separa nome del locale e città nei vari formati delle guide:
//   "SEU PIZZA ILLUMINATI | ROMA", "Pepe In Grani | Caiazzo (CE)"   (Gambero Rosso)
//   "Al Maniero – Issogne (AO)", "Acino – Teramo"                   (Slow Food)
//   "Le Vigneron - Arvier [AO]"                                       (Gambero Rosso 2025)
//   "Old Sponge - Alba Adriatica (TE) - Abruzzo"                     (Birre Slow Food)
//   "Abruzzo - Castel di Sangro [AQ] - Taverna ..."                  (Street Food Gambero Rosso 2025)
function splitNameCity(name, ranking) {
  if (name.includes("|")) {
    const [base, city] = name.split("|");
    return [base.trim(), city ? city.replace(PROVINCE, "").trim() : null];
  }
  if (ranking !== "Slowfood" && ranking !== "Gambero Rosso") return [name.trim(), null];
  let parts = name.split(/\s+[–-]\s+/).map((p) => p.trim());
  if (parts.length < 2) return [name.trim(), null];
  if (ITALIAN_REGIONS.has(normalize(parts[0]))) return [parts[parts.length - 1], parts[1].replace(PROVINCE, "")];
  if (ITALIAN_REGIONS.has(normalize(parts[parts.length - 1]))) parts = parts.slice(0, -1);
  if (parts.length < 2) return [parts[0], null];
  // nelle guide Slow Food l'ultima parte è sempre la città; in Gambero Rosso solo se ha la provincia
  if (ranking === "Slowfood" || PROVINCE.test(parts[parts.length - 1])) {
    return [parts.slice(0, -1).join(" – "), parts[parts.length - 1].replace(PROVINCE, "")];
  }
  return [name.trim(), null];
}

function nameTokens(name) {
  return normalize(name)
    .split(" ")
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function shareToken(a, b) {
  return a.some((t) => b.includes(t));
}

// nomi tutti in maiuscolo ("SEU PIZZA ILLUMINATI") in forma leggibile
function prettyName(name) {
  if (name !== name.toUpperCase()) return name;
  return name.toLowerCase().replace(/(^|[\s\-'’(])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
}

// Confronta due locali piazzamento per piazzamento (le appearances sono già ordinate per punteggio)
function compareAppearances(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = (b[i] ? b[i].score : 0) - (a[i] ? a[i].score : 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// Fonti con i nomi più puliti: a parità di locale si mostra il loro
const NAME_PRIORITY = ["50 Top Pizza", "50 Top Italy", "TW50B", "101WB Steak Houses", "100 Best Coffee Shops", "Le Soste"];

// Trasforma le voci delle classifiche in una lista di locali, ognuno con le sue sedi
// e le classifiche in cui compare. Lo stesso locale può avere nomi diversi tra una guida e l'altra:
// le voci vengono unite quando le sedi coincidono.
export function buildPlaces(entries) {
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

  // union-find: le sedi della stessa voce (o di voci che condividono una sede) sono lo stesso locale
  const parent = [];
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (a, b) => { parent[find(a)] = find(b); };

  const entryInfo = [];
  entries.forEach((entry) => {
    const position = parsePosition(entry.position);
    const tier = tierOf(entry["sub-ranking"], position !== null);
    const [baseName, city] = splitNameCity(entry.name, entry.ranking);
    const info = {
      entry,
      // "I Masanielli (Francesco Martucci)": nella Top 100 dei pizzaioli il nome del pizzaiolo è tra parentesi
      name: prettyName(baseName).replace(/\s*\([^)]*\)$/, ""),
      city: city ? prettyName(city) : null,
      appearance: {
        ranking: entry.ranking,
        subRanking: entry["sub-ranking"],
        emoji: entry.emoji,
        position: entry.position,
        ref: entry.ref,
        label: tier.label(entry["sub-ranking"]),
        score: appearanceScore(tier, position),
        positionNumber: position,
      },
      locationIds: [],
    };
    const tokens = nameTokens(info.name);

    (entry.coord || []).forEach((coord, i) => {
      if (!Array.isArray(coord) || coord.length !== 2) return;
      const address = entry.address && entry.address[i];
      let location = findLocation(coord, tokens);
      if (!location) {
        location = { idx: locations.length, coord, tokens, address: address || info.city };
        locations.push(location);
        parent.push(location.idx);
        const key = cellKey(coord[0], coord[1]);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(location);
      } else {
        location.tokens = [...new Set([...location.tokens, ...tokens])];
        // un indirizzo vero è meglio della sola città
        if (address && (!location.address || location.address === info.city)) location.address = address;
      }
      info.locationIds.push(location.idx);
    });
    for (let k = 1; k < info.locationIds.length; k++) union(info.locationIds[0], info.locationIds[k]);
    entryInfo.push(info);
  });

  const byRoot = new Map();
  const placeOf = (root) => {
    if (!byRoot.has(root)) byRoot.set(root, { id: String(root), locations: [], sources: [] });
    return byRoot.get(root);
  };

  for (const location of locations) {
    placeOf(find(location.idx)).locations.push({ idx: location.idx, coord: location.coord, address: location.address });
  }

  // ogni piazzamento resta legato alle sedi della voce da cui proviene: una catena con sedi
  // in più città (es. Caserta e Miami) mostra in ogni zona solo i piazzamenti di quelle sedi
  for (const info of entryInfo) {
    if (!info.locationIds.length) continue; // voce senza coordinate: non è sulla mappa
    placeOf(find(info.locationIds[0])).sources.push({
      appearance: info.appearance,
      locationIds: new Set(info.locationIds),
      name: info.name,
      ranking: info.entry.ranking,
      website: info.entry.website || null,
    });
  }

  return [...byRoot.values()];
}

// Piazzamenti, nome e sito del locale considerando solo le sedi indicate
function describe(place, locationIds) {
  // per ogni sede e classifica vale la voce più specifica (con meno sedi): la scheda
  // "I Masanielli" include anche la sede di Miami, che però ha una sua voce nella stessa classifica
  const sources = new Set();
  for (const id of locationIds) {
    const bySubRanking = new Map();
    for (const src of place.sources) {
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
  const byScore = [...sources].sort((a, b) => b.appearance.score - a.appearance.score);
  const named = NAME_PRIORITY.map((r) => byScore.find((src) => src.ranking === r)).find(Boolean) || byScore[0];
  return {
    appearances,
    score: appearances[0].score,
    emoji: appearances[0].emoji,
    name: named.name,
    website: (byScore.find((src) => src.website) || {}).website || null,
  };
}

// "bounds" è un L.LatLngBounds. Restituisce i migliori "limit" locali con almeno
// una sede visibile (valutati solo per i piazzamenti di quelle sedi) e il totale.
export function bestPlacesIn(places, bounds, limit) {
  const visible = [];
  for (const place of places) {
    const visibleLocations = place.locations.filter((l) => bounds.contains(l.coord));
    if (!visibleLocations.length) continue;
    const details = describe(place, new Set(visibleLocations.map((l) => l.idx)));
    visible.push({ id: place.id, visibleLocations, ...details });
  }
  visible.sort((a, b) => compareAppearances(a.appearances, b.appearances));
  return { list: visible.slice(0, limit), total: visible.length };
}

// Tutte le voci della struttura dei marker ({classifica: [{sub-classifica: [locale, ...]}, ...]})
export function entriesOf(markers) {
  const entries = [];
  Object.values(markers || {}).forEach((group) =>
    group.forEach((sub) => Object.values(sub).forEach((list) => entries.push(...list)))
  );
  return entries;
}

export function badgeText(appearance) {
  return appearance.positionNumber ? `${appearance.label} #${appearance.positionNumber}` : appearance.label;
}
