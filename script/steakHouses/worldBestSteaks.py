# World's 101 Best Steak Restaurants: la pagina "the-list" contiene la classifica dell'anno,
# ogni ristorante ha una scheda con indirizzo, paese e sito web.
# Uso: dalla cartella in cui salvare il file, python path/to/worldBestSteaks.py

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
RANKING = '101WB Steak Houses'
SUB_RANKING = f"World's 101 Best Steak Restaurants {YEAR}"
category = '🥩'

LIST_URL = 'https://www.worldbeststeaks.com/the-list'
DETAIL_PREFIX = f'https://www.worldbeststeaks.com/{YEAR}-list-1-101/'


def lines_of(soup):
    for t in soup(['script', 'style']):
        t.decompose()
    return [line.replace('​', '').strip() for line in soup.body.get_text('\n').split('\n') if line.replace('​', '').strip()]


def parse_detail(url):
    soup = BeautifulSoup(requests.get(url, headers=headers, timeout=30).text, 'html.parser')
    website = next((a['href'] for a in soup.find_all('a', href=True)
                    if a['href'].startswith('http') and not re.search(r'worldbeststeaks|instagram|wix|facebook|google', a['href'])), None)
    lines = lines_of(soup)
    # intestazione della scheda: righe del nome, poi "CITTÀ  |  PAESE" (solo "CITTÀ" per le città-stato), poi "No.N"
    pos_index = next(i for i, l in enumerate(lines) if re.fullmatch(r'No\.\d+', l))
    position = int(lines[pos_index][3:])
    header = [l for l in lines[:pos_index] if l.lower() != 'top of page']
    location = header[-1]
    # il separatore è "|" ma in alcune schede è una "I" maiuscola: "SYDNEY  I  AUSTRALIA"
    parts = re.split(r'\s+[|I]\s+', location, maxsplit=1)
    city, country = ([p.strip().title() for p in parts] if len(parts) == 2 else [location.title(), location.title()])
    name = ' '.join(header[:-1]) or location
    address = None
    if 'ADDRESS' in lines:
        start = lines.index('ADDRESS') + 1
        end = lines.index('VISIT', start) if 'VISIT' in lines[start:] else start + 3
        address = ', '.join(lines[start:end])
    return position, name, city, country, address, website


if __name__ == '__main__':
    list_html = requests.get(LIST_URL, headers=headers, timeout=30).text
    detail_urls = list(dict.fromkeys(re.findall(re.escape(DETAIL_PREFIX) + r'[^"\s]+', list_html)))
    print(f'{len(detail_urls)} ristoranti')

    geocoder = PlaceGeocoder()
    entries, precision = [], []
    for url in detail_urls:
        position, name, city, country, address, website = parse_detail(url)
        name = name.title()
        geo = geocoder.geocode(name, city, country, address)
        print(position, name, '|', city, country, '|', geo and geo['precision'])
        entries.append(make_entry(RANKING, SUB_RANKING, category, name, url, position, website, geo))
        precision.append(geo and geo['precision'])
        sleep(1)
    geocoder.save()

    order = sorted(range(len(entries)), key=lambda i: int(entries[i]['position'].rstrip('°')) if entries[i]['position'] else 999)
    save_ranking(SUB_RANKING, [entries[i] for i in order], precision=[precision[i] for i in order])
