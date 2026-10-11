# The Best Pizza Awards (thebestchefpizza.com): Top 100 dei pizzaioli, ognuno con la sua pizzeria e città.
# La posizione è nel nome dell'immagine della card ("1.webp", "2.webp", ...).
# Uso: dalla cartella in cui salvare il file, python path/to/bestChefPizza.py

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
EVENT_ID = 8011
URL = f'https://thebestchefpizza.com/events-results/?id={EVENT_ID}'
RANKING = 'The Best Chef'
SUB_RANKING = f'The Best Pizza Awards {YEAR}'
category = '🍕'


def parse_ranking(html):
    soup = BeautifulSoup(html, 'html.parser')
    places = []
    # solo la Top 100: "Ones to Follow" e i premi speciali sono in sezioni separate
    for card in soup.find(id='related-chefs').select('.chef-card'):
        match = re.search(r'/(\d+)\.\w+$', card.img['src']) if card.img else None
        chef = card.find('h3').get_text(strip=True)
        pizzeria = card.find(class_='pizzeria').get_text(strip=True)
        location = card.find(class_='location').get_text(strip=True)
        city, _, country = location.rpartition(', ')
        link = re.search(r"location.href='([^']+)'", card.get('onclick', ''))
        places.append((int(match.group(1)) if match else None, chef, pizzeria, city or location, country,
                       link.group(1).replace('&#038;', '&') if link else URL))
    return places


if __name__ == '__main__':
    places = parse_ranking(requests.get(URL, headers=headers, timeout=30).text)
    print(SUB_RANKING, len(places), 'pizzaioli')
    geocoder = PlaceGeocoder()
    entries, precision = [], []
    for position, chef, pizzeria, city, country, ref in sorted(places, key=lambda p: p[0] or 999):
        # alcune card indicano più locali ("TAC | Seu Pizza illuminati", "Inedito/Cascina dei Sapori"): si cerca il primo
        geo = geocoder.geocode(re.split(r'\s*[|/]\s*', pizzeria)[0], city, country) or geocoder.geocode(pizzeria, city, country)
        print(position, pizzeria, '|', city, country, '|', geo and geo['precision'])
        entries.append(make_entry(RANKING, SUB_RANKING, category, f'{pizzeria} ({chef})', ref, position, None, geo))
        precision.append(geo and geo['precision'])
    geocoder.save()
    save_ranking(SUB_RANKING, entries, precision=precision)
