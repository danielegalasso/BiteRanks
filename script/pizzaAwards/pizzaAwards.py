# Pizza Awards (pizzaawards.it): classifica "Miglior pizza d'Italia", 100 pizzerie con posizione,
# nome, città e regione. Le coordinate si ricavano con PlaceGeocoder.
# Uso: dalla cartella in cui salvare il file, python path/to/pizzaAwards.py

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

YEAR = 2025
URL = f'https://www.pizzaawards.it/pizza-awards-{YEAR}-i-risultati/'
RANKING = 'Pizza Awards'
SUB_RANKING = f'Pizza Awards Italia {YEAR}'
category = '🍕'
SECTION = 'MIGLIOR PIZZA D’ITALIA'

# i nomi sono in maiuscolo: si riportano in forma leggibile mantenendo le sigle corte ("180 G", "BRO.")
SMALL_WORDS = {'di', 'da', 'del', 'della', 'dei', 'e', 'a', 'al', 'ai', 'alla', 'in', 'con'}


def pretty(name):
    words = name.lower().split()
    return ' '.join(w if (i and w in SMALL_WORDS) else w[:1].upper() + w[1:] for i, w in enumerate(words)) \
        .replace("’O", "’o").replace("'O", "'o")


def parse_ranking(html):
    soup = BeautifulSoup(html, 'html.parser')
    for t in soup(['script', 'style', 'nav', 'header', 'footer']):
        t.decompose()
    lines = soup.body.get_text('\n', strip=True).split('\n')
    i = lines.index(SECTION) + 1
    places = []
    # ogni voce: posizione / NOME / Città (PR) / Regione; la classifica finisce al titolo della sezione successiva
    while i + 3 < len(lines) and lines[i].isdigit():
        position, name, city, _region = int(lines[i]), lines[i + 1], lines[i + 2], lines[i + 3]
        city = re.sub(r'\s*\([A-Z]{2}\)$', '', city)
        places.append((position, name, city))
        i += 4
    return places


if __name__ == '__main__':
    places = parse_ranking(requests.get(URL, headers=headers, timeout=30).text)
    print(SUB_RANKING, len(places), 'pizzerie')
    geocoder = PlaceGeocoder()
    entries, precision = [], []
    for position, name, city in places:
        geo = geocoder.geocode(pretty(name), city, 'Italia')
        print(position, pretty(name), '|', city, '|', geo and geo['precision'])
        entries.append(make_entry(RANKING, SUB_RANKING, category, pretty(name), URL, position, None, geo))
        precision.append(geo and geo['precision'])
    geocoder.save()
    save_ranking(SUB_RANKING, entries, precision=precision)
