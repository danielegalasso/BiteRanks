# Burger Battle: i locali selezionati sono i marker della mappa del sito (plugin WP Go Maps),
# disponibili con nome, indirizzo e coordinate dall'API del plugin.
# Uso: dalla cartella in cui salvare il file, python path/to/burgerBattle.py

import json
import os
import sys

import requests

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'utils'))
from ranking_writer import make_entry, save_ranking

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.3'
}

RANKING = 'Burger Battle'
SUB_RANKING = 'Burger Battle Italia'
category = '🍔'
URL = 'https://www.burgerbattle.it/vieni-ad-assaggiare/'
MARKERS_API = 'https://www.burgerbattle.it/wp-json/wpgmza/v1/markers'


if __name__ == '__main__':
    markers = requests.get(MARKERS_API, params={'filter': json.dumps({'map_id': '1'})}, headers=headers, timeout=30).json()
    entries = []
    for marker in markers:
        if marker.get('approved') != '1':
            continue
        geo = {'lat': float(marker['lat']), 'lon': float(marker['lng']), 'address': marker['address']}
        entries.append(make_entry(RANKING, SUB_RANKING, category, marker['title'].strip(), URL, None,
                                  marker.get('link') or None, geo))
    save_ranking(SUB_RANKING, entries)
