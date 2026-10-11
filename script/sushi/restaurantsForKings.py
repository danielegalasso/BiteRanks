# Restaurants for Kings: Top 50 Sushi Restaurants Worldwide. Ogni voce è
# "posizione / nome / tipo · città · punteggi / recensione". Coordinate con PlaceGeocoder (nome + città).
# Uso: dalla cartella in cui salvare il file, python path/to/restaurantsForKings.py

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
URL = 'https://restaurantsforkings.com/cuisine/sushi/best-sushi-worldwide'
RANKING = 'Restaurants for Kings'
SUB_RANKING = f'Top 50 Sushi Worldwide {YEAR}'
category = '🍣'


def parse_ranking(html):
    soup = BeautifulSoup(html, 'html.parser')
    for t in soup(['script', 'style', 'nav', 'footer']):
        t.decompose()
    lines = [l.strip() for l in soup.body.get_text('\n').split('\n') if l.strip()]
    places = []
    for i in range(len(lines) - 2):
        # "Sushi Omakase · Tokyo · Food 10 / Ambience 9 / Value 6"
        if re.fullmatch(r'\d{1,2}', lines[i]) and '·' in lines[i + 2]:
            parts = [p.strip() for p in lines[i + 2].replace('\xa0', ' ').split('·')]
            city = parts[1] if len(parts) > 1 else None
            places.append((int(lines[i]), lines[i + 1], city))
    return places


if __name__ == '__main__':
    places = parse_ranking(requests.get(URL, headers=headers, timeout=30).text)
    print(SUB_RANKING, len(places), 'locali')
    geocoder = PlaceGeocoder()
    entries, precision = [], []
    for position, name, city in places:
        geo = geocoder.geocode(name, city)
        print(position, name, '|', city, '|', geo and geo['precision'])
        entries.append(make_entry(RANKING, SUB_RANKING, category, name, URL, position, None, geo))
        precision.append(geo and geo['precision'])
    geocoder.save()
    save_ranking(SUB_RANKING, entries, precision=precision)
