# The World's 100 Best Coffee Shops: la pagina Top 100 elenca le caffetterie in ordine,
# ogni scheda (/locales/...) ha città, paese, indirizzo e sito web.
# Uso: dalla cartella in cui salvare il file, python path/to/worldBestCoffeeShops.py

import os
import re
import sys
from time import sleep

import requests
from bs4 import BeautifulSoup

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'utils'))
from place_geocoder import PlaceGeocoder
from ranking_writer import make_entry, save_ranking

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.3'
}

YEAR = 2026
RANKING = '100 Best Coffee Shops'
SUB_RANKING = f"The World's 100 Best Coffee Shops {YEAR}"
category = '☕'
BASE = 'https://theworlds100bestcoffeeshops.com'


def detail_urls():
    html = requests.get(f'{BASE}/top-100-coffee-shops/', headers=headers, timeout=30).text
    return list(dict.fromkeys(re.findall(re.escape(BASE) + r'/locales/[^"\']+', html)))


def parse_detail(url):
    soup = BeautifulSoup(requests.get(url, headers=headers, timeout=30).text, 'html.parser')
    for t in soup(['script', 'style', 'nav', 'header', 'footer']):
        t.decompose()
    lines = soup.body.get_text('\n', strip=True).split('\n')
    # intestazione: nome, città, paese, posizione
    start = next(i for i, l in enumerate(lines) if re.fullmatch(r'\d{1,3}', l)) - 3
    name, city, country, position = lines[start:start + 4]
    address, website = None, None
    if 'Contact' in lines:
        after = lines[lines.index('Contact') + 1:]
        address = after[0] if after and not after[0].startswith('http') else None
        website = next((l for l in after[:3] if l.startswith('http') and 'instagram' not in l), None)
    return int(position), name, city, country, address, website


if __name__ == '__main__':
    geocoder = PlaceGeocoder()
    entries, precision = [], []
    for url in detail_urls():
        try:
            position, name, city, country, address, website = parse_detail(url)
        except (AttributeError, StopIteration, ValueError):
            print('non è una scheda:', url)  # tra i link /locales/ c'è anche qualche pagina generica
            continue
        geo = geocoder.geocode(name, city, country, address)
        print(position, name, '|', city, country, '|', geo and geo['precision'])
        entries.append(make_entry(RANKING, SUB_RANKING, category, name, url, position, website, geo))
        precision.append(geo and geo['precision'])
        sleep(1)
    geocoder.save()
    order = sorted(range(len(entries)), key=lambda i: int(entries[i]['position'].rstrip('°')))
    save_ranking(SUB_RANKING, [entries[i] for i in order], precision=[precision[i] for i in order])
