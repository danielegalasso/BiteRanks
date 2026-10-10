// Ricerca luoghi per la barra "Find Location".
// Photon (OpenStreetMap) fa vero autocompletamento ("traste" -> Trastevere) ed è orientato
// verso la zona della mappa; OpenCage in italiano capisce i nomi italiani di città straniere
// ("Londra", "Parigi") che Photon non conosce. Le due liste vengono unite e riordinate.

const OPENCAGE_KEY = "a3486d3fed1b41939800bca4fbf9915c";
const PHOTON_LAYERS = ["city", "district", "locality", "county", "state", "country", "street"];
const OPENCAGE_MIN_LENGTH = 4; // sotto i 4 caratteri OpenCage restituisce solo rumore
const SHORT_QUERY = 4; // fino a 4 caratteri un nome identico non vale più di un prefisso ("nap" non è "NAP")
const BIG_AREAS = ["country", "state", "county", "city"];

// Peso del tipo di luogo: a parità di nome una città vale più di una via omonima
const TYPE_WEIGHT = { country: 30, city: 28, state: 22, district: 18, county: 12, street: 8 };

// Distanza (km) usata per lo zoom quando il risultato non ha un riquadro
const DEFAULT_DISTANCE = { country: 1500, state: 300, county: 60, city: 15, district: 4, street: 0.6 };

const OPENCAGE_TYPES = {
  country: "country",
  state: "state",
  region: "state",
  county: "county",
  state_district: "county",
  city: "city",
  town: "city",
  municipality: "city",
  village: "district",
  hamlet: "district",
  neighbourhood: "district",
  suburb: "district",
  city_district: "district",
  quarter: "district",
  road: "street",
};

const PHOTON_TYPES = {
  country: "country",
  state: "state",
  county: "county",
  city: "city",
  district: "district",
  locality: "district",
  street: "street",
};

export function normalize(text) {
  return (text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function uniqueParts(parts, exclude) {
  const seen = new Set([normalize(exclude)]);
  return parts.filter((p) => {
    const n = normalize(p);
    if (!n || seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

async function searchPhoton(query, bias, signal) {
  // "default" = nomi locali (italiani per l'Italia); senza, Photon segue la lingua del browser
  // e mostrerebbe "Rome", "Milan" a chi ha il browser in inglese (l'italiano non è supportato)
  const params = new URLSearchParams({ q: query, limit: "10", lang: "default" });
  PHOTON_LAYERS.forEach((layer) => params.append("layer", layer));
  if (bias) {
    params.set("lat", bias.lat.toFixed(4));
    params.set("lon", bias.lon.toFixed(4));
    params.set("zoom", "6");
    params.set("location_bias_scale", "0.6");
  }
  const response = await fetch(`https://photon.komoot.io/api/?${params}`, { signal });
  if (!response.ok) throw new Error(`Photon HTTP ${response.status}`);
  const data = await response.json();
  return (data.features || [])
    .map((feature, index) => {
      const p = feature.properties;
      const type = PHOTON_TYPES[p.type];
      if (!type || !p.name) return null;
      const [lon, lat] = feature.geometry.coordinates;
      // extent di Photon: [ovest, nord, est, sud]
      const bounds = p.extent ? { south: p.extent[3], west: p.extent[0], north: p.extent[1], east: p.extent[2] } : null;
      return {
        name: p.name,
        details: uniqueParts([p.city, p.county, p.state, p.country], p.name).join(", "),
        lat,
        lon,
        type,
        bounds,
        source: "photon",
        rank: index,
      };
    })
    .filter(Boolean);
}

async function searchOpenCage(query, signal) {
  const params = new URLSearchParams({
    q: query,
    key: OPENCAGE_KEY,
    language: "it",
    limit: "5",
    no_annotations: "1",
  });
  const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?${params}`, { signal });
  if (!response.ok) throw new Error(`OpenCage HTTP ${response.status}`);
  const data = await response.json();
  return (data.results || [])
    .map((result, index) => {
      let type = OPENCAGE_TYPES[result.components._type];
      if (!type) return null; // ristoranti, negozi, ecc.: non sono luoghi da cercare qui
      // via il CAP e la sigla della provincia: "00186 Roma RM" -> "Roma"
      const clean = (part) => part.replace(/\b\d{4,}\b/g, "").replace(/\s[A-Z]{2}$/, "").trim();
      const [name, ...rest] = result.formatted.split(",").map(clean).filter(Boolean);
      if (!name) return null;
      // "Parigi, Francia" arriva come quartiere ma è una città: senza altri livelli sopra è un luogo principale
      if ((type === "district" || type === "county") && rest.length <= 1) type = "city";
      const b = result.bounds;
      return {
        name,
        details: uniqueParts(rest, name).join(", "),
        lat: result.geometry.lat,
        lon: result.geometry.lng,
        type,
        bounds: b ? { south: b.southwest.lat, west: b.southwest.lng, north: b.northeast.lat, east: b.northeast.lng } : null,
        source: "opencage",
        rank: index,
      };
    })
    .filter(Boolean);
}

function nameScore(result, query) {
  const n = normalize(result.name);
  const q = normalize(query);
  if (!q) return 0;
  if (n === q) return q.length <= SHORT_QUERY ? 70 : 100;
  if (n.startsWith(q)) return 70;
  const tokens = q.split(" ");
  if (n.split(" ").some((word) => word.startsWith(tokens[0])) && tokens.every((t) => n.includes(t))) return 50;
  // "milano navig": le parole cercate stanno tra nome e città/regione; meglio se il nome
  // contiene la parola che si sta ancora scrivendo (l'ultima)
  const full = normalize(`${result.name} ${result.details}`);
  if (tokens.length > 1 && tokens.every((t) => full.includes(t))) {
    const last = tokens[tokens.length - 1];
    if (n.split(" ").some((word) => word.startsWith(last))) return 55;
    if (tokens.some((t) => n.includes(t))) return 45;
  }
  if (n.includes(q)) return 30;
  return 0;
}

function score(result, query, bias) {
  let match = nameScore(result, query);
  // OpenCage capisce i nomi italiani ("Parigi", "Nuova York") anche se non somigliano al nome trovato
  if (match === 0 && result.source === "opencage" && result.rank === 0) match = 60;
  let s = match + (TYPE_WEIGHT[result.type] || 0);
  // l'ordine dei servizi tiene conto dell'importanza del luogo, che altrimenti non conosciamo
  if (result.source === "photon") s += Math.max(0, 30 - result.rank * 4);
  else if (normalize(query).length > SHORT_QUERY) s += [35, 15][result.rank] || 0;
  if (bias) {
    const d = distanceKm(bias.lat, bias.lon, result.lat, result.lon);
    if (d < 50) s += 15;
    else if (d < 300) s += 6;
  }
  return s;
}

function samePlace(a, b) {
  const d = distanceKm(a.lat, a.lon, b.lat, b.lon);
  // due città/regioni quasi coincidenti sono lo stesso luogo anche con nomi diversi (Paris / Parigi)
  if (BIG_AREAS.includes(a.type) && BIG_AREAS.includes(b.type) && d < 10) return true;
  const bigArea = BIG_AREAS.includes(a.type) || BIG_AREAS.includes(b.type);
  return d < (bigArea ? 25 : 1.5) && (normalize(a.name) === normalize(b.name) || a.type === b.type);
}

export function zoomDistance(result) {
  if (result.bounds) {
    const { south, west, north, east } = result.bounds;
    const diagonal = distanceKm(south, west, north, east);
    if (diagonal > 0.05) return Math.max(diagonal, 0.4); // una via corta non deve zoomare fino al singolo edificio
  }
  return DEFAULT_DISTANCE[result.type] || 5;
}

// Cerca luoghi: "bias" ({lat, lon}) è il centro della mappa, così a parità di nome
// vince il luogo nella zona che si sta guardando.
export async function searchPlaces(query, { bias, signal, limit = 7 } = {}) {
  const q = query.trim();
  if (q.length < 2) return [];
  const requests = [searchPhoton(q, bias, signal)];
  if (q.length >= OPENCAGE_MIN_LENGTH) requests.push(searchOpenCage(q, signal));

  const settled = await Promise.allSettled(requests);
  if (signal && signal.aborted) throw new DOMException("Aborted", "AbortError");
  const failures = settled.filter((r) => r.status === "rejected");
  if (failures.length === settled.length) throw failures[0].reason;

  const candidates = settled
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .map((result) => ({ ...result, score: score(result, q, bias) }))
    .sort((a, b) => b.score - a.score || (bias ? distanceKm(bias.lat, bias.lon, a.lat, a.lon) - distanceKm(bias.lat, bias.lon, b.lat, b.lon) : 0));

  const merged = [];
  for (const candidate of candidates) {
    const dup = merged.find((m) => samePlace(m, candidate));
    if (!dup) merged.push(candidate);
    else if (!dup.bounds && candidate.bounds) dup.bounds = candidate.bounds;
    if (merged.length >= limit) break;
  }
  return merged;
}
