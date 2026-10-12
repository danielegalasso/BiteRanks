# Geocoder per i locali delle classifiche che non forniscono coordinate.
# Usa servizi OpenStreetMap (Nominatim e Photon) e, solo per i locali che OSM non conosce, Google Places:
#   1. indirizzo (se la fonte lo fornisce): è il dato più affidabile
#   2. lo stesso locale in un'altra classifica con coordinate ufficiali (50 Top, Gambero Rosso 2027, ...)
#   3. nome del locale tra i punti di interesse OSM (ristoranti, bar, ...) nella città indicata
#   4. Google Places (Text Search), se in script/data/mapkey.txt c'è una chiave valida
#   5. centro della città, come ultima risorsa (precision = "city")
# Un risultato per nome viene accettato solo se cade vicino alla città indicata, così un locale
# omonimo in un'altra città non finisce sulla mappa nel posto sbagliato.
# I risultati sono salvati in script/data/geocache.json per non ripetere le richieste.

import glob
import json
import math
import os
import re
import time
import unicodedata

import requests

USER_AGENT = 'BiteRanks/1.0 (https://biteranks.com; ranking map geocoder)'
CACHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'geocache.json')
NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
PHOTON_URL = 'https://photon.komoot.io/api/'
GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchText'
GOOGLE_KEY_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'mapkey.txt')

# categorie OSM che possono essere un locale di una classifica gastronomica
POI_TAGS = [
    'amenity:restaurant', 'amenity:bar', 'amenity:pub', 'amenity:cafe', 'amenity:fast_food',
    'amenity:ice_cream', 'amenity:biergarten', 'shop:bakery', 'shop:pastry', 'shop:confectionery',
    'shop:deli', 'shop:butcher', 'shop:wine', 'shop:beverages', 'shop:coffee', 'shop:chocolate',
    'tourism:hotel', 'craft:brewery', 'craft:winery', 'man_made:works',
]
CITY_RADIUS_KM = 25  # distanza massima dal centro città per accettare un locale trovato per nome
SETTLEMENTS = {'city', 'town', 'village', 'hamlet', 'municipality', 'suburb', 'borough', 'quarter', 'neighbourhood', 'city_district'}

# classifiche le cui coordinate vengono dalla fonte stessa (non da un geocoder): un locale già presente
# lì viene riusato con quelle coordinate, più precise di qualsiasi ricerca per nome
RANKING_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'vite-project', 'public', 'ranking')
KNOWN_SOURCES = [os.path.join(RANKING_DIR, folder, '*.json') for folder in ('50_Top_Pizza', '50_Top_Italy', 'Burger_Battle')] + [
    os.path.join(RANKING_DIR, 'Gambero_Rosso', '*2027.json')]  # guide nel nuovo formato, con coordinate


def _normalize(text):
    text = unicodedata.normalize('NFD', text or '')
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', ' ', text.lower()).strip()


def _distance_km(a, b):
    lat1, lon1 = map(math.radians, a)
    lat2, lon2 = map(math.radians, b)
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))


_STOPWORDS = {'ristorante', 'trattoria', 'osteria', 'pizzeria', 'pizza', 'pizze', 'bar', 'the', 'la', 'il', 'lo', 'le', 'i', 'di',
              'da', 'del', 'della', 'al', 'alla', 'e', 'and', 'restaurant', 'cafe', 'caffe', 'pasticceria',
              'gelateria', 'forno', 'panificio', 'enoteca', 'cantina', 'locanda', 'hosteria', 'bistrot', 'bistro',
              # parole generiche del cibo: "Sushi Sawada" non deve somigliare a "Tokyo-Sushi-Bar"
              'sushi', 'burger', 'burgers', 'steak', 'steakhouse', 'grill', 'coffee', 'kitchen', 'house', 'restaurante'}


# tipi di locale: se entrambi i nomi ne dichiarano uno, deve essere lo stesso ("Sushi Amane" non è "Cafe Amane")
_KINDS = {'sushi': 'sushi', 'burger': 'burger', 'burgers': 'burger', 'steak': 'steak', 'steakhouse': 'steak',
          'pizza': 'pizza', 'pizzeria': 'pizza', 'cafe': 'cafe', 'caffe': 'cafe', 'coffee': 'cafe', 'bar': 'bar',
          'pub': 'bar', 'bakery': 'bakery', 'panificio': 'bakery', 'forno': 'bakery', 'gelateria': 'gelato',
          'ramen': 'ramen', 'pasticceria': 'pastry', 'patisserie': 'pastry', 'hotel': 'hotel'}


def _kinds(name):
    return {_KINDS[w] for w in _normalize(name).split() if w in _KINDS}


def _same_kind(wanted_name, found_name):
    wanted, found = _kinds(wanted_name), _kinds(found_name)
    return not wanted or not found or bool(wanted & found)


def _city_in_address(city, address, found_name):
    """La città compare nell'indirizzo, escluso il nome del locale: "Tokyo-Sushi-Bar, Mannheim" non è a Tokyo."""
    rest = f' {_normalize(address or "")} '.replace(f' {_normalize(found_name or "")} ', ' ')
    return f' {_normalize(city)} ' in rest


def _compact(name):
    return _normalize(name).replace(' ', '')


def _tokens(name):
    return {t for t in _normalize(name).split() if len(t) > 1 and t not in _STOPWORDS}


class PlaceGeocoder:

    def __init__(self, cache_path=CACHE_PATH, known_sources=None):
        self.cache_path = os.path.abspath(cache_path)
        try:
            with open(self.cache_path, encoding='utf-8') as f:
                self.cache = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            self.cache = {}
        self.known = self._load_known(KNOWN_SOURCES if known_sources is None else known_sources)
        self.session = requests.Session()
        self.session.headers['User-Agent'] = USER_AGENT
        self._last_nominatim = 0.0
        self.nominatim_down = False
        try:
            with open(GOOGLE_KEY_PATH) as f:
                self.google_key = f.read().strip() or None
        except FileNotFoundError:
            self.google_key = None  # dopo troppi 429 si passa a Photon per il resto dell'esecuzione

    @staticmethod
    def _load_known(patterns):
        known = []
        for pattern in patterns:
            for path in glob.glob(pattern):
                if path.endswith('index.json'):
                    continue
                with open(path, encoding='utf-8') as f:
                    for entries in json.load(f).values():
                        for entry in entries:
                            addresses = entry.get('address') or []
                            for i, coord in enumerate(entry.get('coord') or []):
                                if coord:
                                    base = entry['name'].split('|')[0]
                                    known.append((_tokens(base), _compact(base), coord[0], coord[1],
                                                  addresses[i] if i < len(addresses) else entry['name']))
        return known

    def _by_known(self, name, city_center):
        wanted = _tokens(name)
        wanted_compact = _compact(name)
        if not wanted or city_center is None:
            return None
        best = None
        for found, found_compact, lat, lon, address in self.known:
            common = len(wanted & found)
            # gran parte del nome cercato e del nome trovato coincidono: "180 G" non basta per "180 Grammi Pizzeria Romana"
            similar = common and common / len(wanted) >= 0.6 and common / len(found) >= 0.5
            # stesso nome scritto in modo diverso: "Cambiamenti" / "Cambia-Menti", "Denis Pizza di Montagna" / "Denis"
            prefix = min(len(wanted_compact), len(found_compact)) >= 5 and (
                wanted_compact.startswith(found_compact) or found_compact.startswith(wanted_compact))
            if not (similar or prefix):
                continue
            distance = _distance_km((lat, lon), (city_center['lat'], city_center['lon']))
            if distance > city_center.get('radius', CITY_RADIUS_KM):
                continue
            score = ((common / len(wanted) + common / len(found)) if similar else 1.0, -distance)
            if best is None or score > best[0]:
                best = (score, {'lat': lat, 'lon': lon, 'address': address, 'precision': 'known'})
        return best and best[1]

    def save(self):
        os.makedirs(os.path.dirname(self.cache_path), exist_ok=True)
        with open(self.cache_path, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, ensure_ascii=False, indent=1)

    # --- servizi -------------------------------------------------------------------------

    def _get(self, url, params):
        """GET con qualche tentativo: un timeout isolato non deve fermare una classifica di mille locali."""
        for attempt in range(3):
            try:
                return self.session.get(url, params=params, timeout=30)
            except requests.exceptions.RequestException as e:
                print(f'Errore di rete ({e.__class__.__name__}), tentativo {attempt + 1} di 3')
                time.sleep(10 * (attempt + 1))
        return None

    def _nominatim(self, params):
        key = 'nominatim|' + json.dumps(params, sort_keys=True, ensure_ascii=False)
        if key in self.cache:
            return self.cache[key]
        if self.nominatim_down:
            return []
        wait = 1.1 - (time.time() - self._last_nominatim)  # policy Nominatim: max 1 richiesta al secondo
        if wait > 0:
            time.sleep(wait)
        for attempt in range(4):
            self._last_nominatim = time.time()
            response = self._get(NOMINATIM_URL, params={**params, 'format': 'jsonv2', 'addressdetails': 1,
                                                        'limit': 5, 'accept-language': 'it'})
            if response is None:
                return []  # rete instabile: si salta questo passo, senza salvare in cache un risultato vuoto
            if response.status_code != 429:
                break
            if attempt == 3:
                print('Nominatim non risponde (429): si continua con Photon')
                self.nominatim_down = True
                return []
            time.sleep(30 * (attempt + 1))  # troppe richieste: si aspetta e si riprova
        response.raise_for_status()
        result = response.json()
        self.cache[key] = result
        return result

    def _photon(self, query, near=None, tags=None, layers=None):
        key = 'photon|' + json.dumps([query, near, tags] + ([layers] if layers else []), ensure_ascii=False)
        if key in self.cache:
            return self.cache[key]
        params = [('q', query), ('limit', '8')]
        if near:
            params += [('lat', f'{near[0]:.4f}'), ('lon', f'{near[1]:.4f}'), ('zoom', '12'), ('location_bias_scale', '0.1')]
        for tag in tags or []:
            params.append(('osm_tag', tag))
        for layer in layers or []:
            params.append(('layer', layer))
        time.sleep(0.3)
        response = self._get(PHOTON_URL, params=params)
        if response is None:
            return []
        response.raise_for_status()
        result = response.json().get('features', [])
        self.cache[key] = result
        return result

    # --- passi ----------------------------------------------------------------------------

    def locate_city(self, city, country=None):
        """Centro della città: serve come riferimento e come ultima risorsa."""
        query = ', '.join(p for p in [city, country] if p)
        results = self._nominatim({'q': query, 'featureType': 'settlement'}) + self._nominatim({'q': query})
        if not results and self.nominatim_down:
            return self._photon_city(query)
        if not results:
            return None
        # prima i centri abitati ("Livorno" città, non la provincia), poi tra gli omonimi il più importante:
        # "São Paulo, Brazil" è la città, non il quartiere nel Pará
        # a parità di importanza vince il luogo più grande (place_rank più basso: città prima del quartiere)
        r = max(results, key=lambda x: (x.get('addresstype') in SETTLEMENTS, float(x.get('importance') or 0),
                                        -int(x.get('place_rank') or 30)))
        south, north, west, east = map(float, r['boundingbox'])
        # per aree grandi ("New Jersey") il raggio di ricerca cresce con l'area
        radius = max(CITY_RADIUS_KM, _distance_km((south, west), (north, east)) / 2)
        return {'lat': float(r['lat']), 'lon': float(r['lon']), 'address': r.get('display_name'), 'radius': radius,
                'is_settlement': r.get('addresstype') in SETTLEMENTS}

    def _photon_city(self, query):
        """Come locate_city, ma con Photon (il primo risultato è già il più importante)."""
        features = self._photon(query, layers=['city', 'locality', 'district', 'county', 'state'])
        if not features:
            return None
        # "Brescia, Italia" restituisce anche la provincia: a parità di nome vince la città
        feature = next((f for f in features if f['properties'].get('type') == 'city'), features[0])
        props = feature['properties']
        lon, lat = feature['geometry']['coordinates']
        radius = CITY_RADIUS_KM
        if props.get('extent'):
            west, north, east, south = props['extent']
            radius = max(CITY_RADIUS_KM, _distance_km((south, west), (north, east)) / 2)
        label = ', '.join(p for p in [props.get('name'), props.get('state'), props.get('country')] if p)
        return {'lat': lat, 'lon': lon, 'address': label, 'radius': radius,
                'is_settlement': props.get('type') in ('city', 'locality', 'district')}

    def _by_address(self, address, city, country, city_center, radius=CITY_RADIUS_KM):
        def near(point):
            return city_center is None or _distance_km(point, city_center) <= radius

        parts = [p.strip() for p in address.split(',') if p.strip()]
        # il paese ripetuto o scritto in modi diversi ("UNITED KINGDOM", "USA") confonde la ricerca
        parts = [p for p in parts if not country or _normalize(p) != _normalize(country)]
        if city and not any(_normalize(city) in _normalize(p) for p in parts):
            parts.append(city)
        full = ', '.join(parts)
        # senza numeri civici e CAP: "Piazza Vittorio Veneto, 26A" -> "Piazza Vittorio Veneto"
        bare = ', '.join(p for p in (re.sub(r'\b\d+[a-zA-Z]?\b|\b[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}\b', '', q).strip(' ,') for q in parts) if p)
        for query in dict.fromkeys([full, bare]):
            for result in self._nominatim({'q': ', '.join(p for p in [query, country] if p)}):
                point = (float(result['lat']), float(result['lon']))
                if near(point):
                    return {'lat': point[0], 'lon': point[1], 'address': result.get('display_name'), 'precision': 'address'}
        # Photon tollera meglio errori di battitura e formati diversi, ma può trovare la stessa via
        # in un altro quartiere: CAP e numero civico, se presenti in entrambi, devono coincidere
        postcodes = set(re.findall(r'\b\d{4,5}\b', address))
        numbers = set(re.findall(r'\b(\d{1,4})[a-zA-Z]?\b', parts[0])) if parts else set()
        for feature in self._photon(full, near=city_center):
            props = feature['properties']
            if props.get('osm_key') == 'place' or props.get('type') in ('city', 'county', 'state', 'country'):
                continue
            if postcodes and props.get('postcode') and not (set(re.findall(r'\d{4,5}', props['postcode'])) & postcodes):
                continue
            if numbers and props.get('housenumber') and not (set(re.findall(r'\d{1,4}', props['housenumber'])) & numbers):
                continue
            lon, lat = feature['geometry']['coordinates']
            if near((lat, lon)):
                label = ', '.join(p for p in [props.get('street') or props.get('name'), props.get('housenumber'),
                                              props.get('city'), props.get('country')] if p)
                return {'lat': lat, 'lon': lon, 'address': label, 'precision': 'address'}
        return None

    def _by_name(self, name, city, country, city_center):
        wanted = _tokens(name)
        if not wanted:
            return None
        candidates = []
        bias = (city_center['lat'], city_center['lon']) if city_center and country else None
        for feature in self._photon(f'{name} {city or ""}'.strip(), near=bias, tags=POI_TAGS):
            props = feature['properties']
            lon, lat = feature['geometry']['coordinates']
            candidates.append((props.get('name', ''), lat, lon, ', '.join(
                p for p in [props.get('name'), props.get('street') and f"{props.get('street')} {props.get('housenumber', '')}".strip(),
                            props.get('city'), props.get('country')] if p)))
        for result in self._nominatim({'q': ', '.join(p for p in [name, city, country] if p)}):
            if result.get('category') in ('place', 'boundary', 'highway'):
                continue  # una via o una città con lo stesso nome del locale non è il locale
            candidates.append((result.get('name') or result['display_name'].split(',')[0], float(result['lat']), float(result['lon']), result.get('display_name')))

        best = None
        for found_name, lat, lon, address in candidates:
            found = _tokens(found_name)
            if not found:
                continue
            overlap = len(wanted & found) / len(wanted)
            # anche il nome trovato deve essere fatto in buona parte delle parole cercate:
            # "Zén" non è "Zen Fut Sai Kai Vegetarian Restaurant"
            if overlap < 0.5 or len(wanted & found) / len(found) < 0.3 or not _same_kind(name, found_name):
                continue
            # un omonimo parziale in un altro comune ("San Martino Bar" a Cerveteri per "San Martino Pizza & Bolle"
            # a Roma) non va bene: fuori dalla città indicata il nome deve coincidere del tutto
            if city and overlap < 1 and not _city_in_address(city, address, found_name):
                continue
            far = city_center is not None and _distance_km((lat, lon), (city_center['lat'], city_center['lon'])) > city_center.get('radius', CITY_RADIUS_KM)
            # senza paese la città può essere stata risolta altrove ("Alba" -> Romania): un locale
            # il cui indirizzo contiene proprio quella città resta valido
            if far and not (country is None and city and _city_in_address(city, address, found_name)):
                continue
            if best is None or overlap > best[0]:
                best = (overlap, {'lat': lat, 'lon': lon, 'address': address, 'precision': 'name', 'overlap': overlap})
        return best and best[1]

    def _google(self, query):
        key = 'google|' + query
        if key in self.cache:
            return self.cache[key]
        response = self.session.post(GOOGLE_PLACES_URL, timeout=30, json={'textQuery': query, 'languageCode': 'it', 'pageSize': 5},
                                     headers={'X-Goog-Api-Key': self.google_key,
                                              'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types'})
        if response.status_code in (400, 401, 403):  # chiave non valida o API non abilitata: si prosegue senza Google
            print('Google Places non disponibile:', response.json().get('error', {}).get('message'))
            self.google_key = None
            return []
        response.raise_for_status()
        result = response.json().get('places', [])
        self.cache[key] = result
        return result

    def _by_google(self, name, city, country, city_center):
        """Locale cercato su Google Places: stessi controlli della ricerca su OSM (nome simile, nella città giusta)."""
        if not self.google_key:
            return None
        wanted, wanted_compact = _tokens(name), _compact(name)
        best = None
        for place in self._google(', '.join(p for p in [name, city, country] if p)):
            types = place.get('types', [])
            if 'establishment' not in types and 'point_of_interest' not in types:
                continue  # una via o un comune con lo stesso nome non sono il locale
            found_name = place.get('displayName', {}).get('text', '')
            found = _tokens(found_name)
            if not _same_kind(name, found_name):
                continue
            overlap = len(wanted & found) / len(wanted) if wanted else 0
            if found and len(wanted & found) / len(found) < 0.3:
                overlap = 0  # vedi la stessa regola nella ricerca su OSM
            prefix = min(len(wanted_compact), len(_compact(found_name))) >= 5 and (
                wanted_compact.startswith(_compact(found_name)) or _compact(found_name).startswith(wanted_compact))
            if overlap < 0.5 and not prefix:
                continue
            lat, lon = place['location']['latitude'], place['location']['longitude']
            if city_center is not None and _distance_km((lat, lon), (city_center['lat'], city_center['lon'])) > city_center['radius']:
                continue
            address = place.get('formattedAddress')
            if city and overlap < 1 and not prefix and not _city_in_address(city, address, found_name):
                continue
            score = max(overlap, 1.0 if prefix else 0)
            if best is None or score > best[0]:
                best = (score, {'lat': lat, 'lon': lon, 'address': f'{found_name}, {address}', 'precision': 'google'})
        return best and best[1]

    def split_name_city(self, text, province):
        """ "Locanda dell'Olmo Bosco Marengo" + "AL" -> ("Locanda dell'Olmo", "Bosco Marengo"): la città è la parte
        finale più lunga (fino a 4 parole) che corrisponde a un comune italiano di quella provincia."""
        words = text.split()
        best = None
        for k in range(1, min(4, len(words) - 1) + 1):
            city = ' '.join(words[-k:])
            if self.nominatim_down:  # Photon non conosce la provincia: basta che sia una città italiana
                for feature in self._photon(f'{city}, Italia', layers=['city', 'locality']):
                    props = feature['properties']
                    if props.get('countrycode') == 'IT' and _normalize(props.get('name')) == _normalize(city):
                        best = (' '.join(words[:-k]), city)
                        break
                continue
            for result in self._nominatim({'q': f'{city}, Italia', 'featureType': 'settlement'}):
                found = result.get('address', {})
                same_province = found.get('ISO3166-2-lvl6', '').endswith('-' + province) if province else True
                if same_province and _normalize(result.get('name')) == _normalize(city):
                    best = (' '.join(words[:-k]), city)
                    break
        return best

    def geocode(self, name, city=None, country=None, address=None):
        """Restituisce {'lat', 'lon', 'address', 'precision'} con precision in address|known|name|google|city, oppure None."""
        city_center = self.locate_city(city, country) if city else None
        by_address = self._by_address(address, city, country, city_center and (city_center['lat'], city_center['lon']),
                                      city_center['radius'] if city_center else CITY_RADIUS_KM) if address else None
        if by_address is None:
            known = self._by_known(name, city_center)
            if known is not None:
                return known
        by_name = self._by_name(name, city, country, city_center)
        if by_name is not None:
            exact = by_name.pop('overlap') == 1
            # un indirizzo senza quartiere ("15 Claremont Street, Melbourne") può cadere nella via omonima
            # sbagliata: se il locale esiste in OSM con il nome esatto nella stessa zona, vale il punto OSM
            if by_address is None or (exact and _distance_km((by_name['lat'], by_name['lon']), (by_address['lat'], by_address['lon'])) < 15):
                return by_name
        if by_address is not None:
            return by_address
        by_google = self._by_google(name, city, country, city_center)
        if by_google is not None:
            return by_google
        # il centro città va bene come approssimazione, quello di una regione o di uno stato no
        if city_center is not None and (city_center['is_settlement'] or city_center['radius'] <= 60):
            return {'lat': city_center['lat'], 'lon': city_center['lon'], 'address': city_center['address'], 'precision': 'city'}
        return None
