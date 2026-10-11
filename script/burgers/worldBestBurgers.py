# Due classifiche mondiali degli hamburger (edizione 2026):
#   - World's 101 Best Burgers (worldbestburgers.com, stessi autori della 101 Best Steak): "No. N / NOME / città"
#   - The World's Best Burgers by Burgerdudes (theworldsbestburgers.com): top 25 con nome, città e recensione
# I locali chiusi definitivamente non vanno sulla mappa. Coordinate con PlaceGeocoder (nome + città).
# Uso: dalla cartella in cui salvare i file, python path/to/worldBestBurgers.py [101best|burgerdudes]

import os
import re
import sys

import requests
from bs4 import BeautifulSoup

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'utils'))
from place_geocoder import PlaceGeocoder
from ranking_writer import make_entry, save_ranking

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.3'
}
YEAR = 2026
category = '🍔'


def page_lines(url):
    soup = BeautifulSoup(requests.get(url, headers=headers, timeout=30).text, 'html.parser')
    for t in soup(['script', 'style', 'nav', 'footer']):
        t.decompose()
    return [l.replace('​', '').strip() for l in soup.body.get_text('\n').split('\n') if l.replace('​', '').strip()]


def title(text):
    # "THE GRILL at the International" -> "The Grill at the International"; i nomi già misti restano come sono
    return ' '.join(w.capitalize() if w.isupper() and len(w) > 1 else w for w in text.split())


def parse_101_best(url):
    lines = page_lines(url)
    places = []
    starts = [i for i, l in enumerate(lines) if re.fullmatch(r'No\. ?\d+', l)]
    for k, i in enumerate(starts):
        block = lines[i + 1:starts[k + 1] if k + 1 < len(starts) else i + 5]
        if any('permanently closed' in l.lower() for l in block):
            continue  # chiuso: non va sulla mappa
        # blocco: righe del nome (anche "Burger", "St Pancras"), poi la città
        block = [l for l in block if l.upper() not in ('SEARCH', 'BACK TO TOP', 'TOP OF PAGE')][:4]
        city = block[-1] if len(block) > 1 else None
        name = ' '.join(block[:-1]) if len(block) > 1 else block[0]
        places.append((int(re.search(r'\d+', lines[i]).group()), title(name), city, None))
    return places


def parse_burgerdudes(url):
    soup = BeautifulSoup(requests.get(url, headers=headers, timeout=30).text, 'html.parser')
    reviews = {a.get_text(strip=True): a['href'] for a in soup.find_all('a', href=True) if 'burgerdudes' in a['href']}
    lines = page_lines(url)
    places, seen = [], set()
    for i in range(len(lines) - 2):
        # "25 / The Food Truck Store / Buenos Aires / recensione..."
        if re.fullmatch(r'\d{1,2}', lines[i]) and len(lines[i + 1]) < 40 and len(lines[i + 2]) < 40 \
                and not re.fullmatch(r'[\d-]+', lines[i + 1]) and int(lines[i]) not in seen:
            seen.add(int(lines[i]))
            # più sedi ("Malmö & Lund", "Chicago & New York"): si mette sulla mappa la prima città
            city = re.split(r'\s*&\s*|\s*/\s*|,\s*', lines[i + 2])[0]
            places.append((int(lines[i]), lines[i + 1], city, reviews.get(lines[i + 1])))
    return sorted(places)


LISTS = {
    '101best': {'ranking': '101 Best Burgers', 'sub_ranking': f"World's 101 Best Burgers {YEAR}",
                'url': 'https://www.worldbestburgers.com/our-list', 'parse': parse_101_best},
    'burgerdudes': {'ranking': 'Burgerdudes', 'sub_ranking': f"The World's Best Burgers {YEAR} by Burgerdudes",
                    'url': 'https://www.theworldsbestburgers.com/', 'parse': parse_burgerdudes},
}


if __name__ == '__main__':
    geocoder = PlaceGeocoder()
    for key in sys.argv[1:] or list(LISTS):
        config = LISTS[key]
        places = config['parse'](config['url'])
        print(config['sub_ranking'], len(places), 'locali')
        entries, precision = [], []
        for position, name, city, ref in places:
            geo = geocoder.geocode(name, city)
            print(position, name, '|', city, '|', geo and geo['precision'])
            entries.append(make_entry(config['ranking'], config['sub_ranking'], category, name, ref or config['url'], position, None, geo))
            precision.append(geo and geo['precision'])
        geocoder.save()
        save_ranking(config['sub_ranking'], entries, precision=precision)
