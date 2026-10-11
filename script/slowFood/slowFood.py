# Guide Slow Food: elenchi completi pubblicati su slowfood.it come testo "Nome – Città (PR)", divisi per regione.
# slowfood.it blocca le richieste dirette: si usa il browser (Playwright) come per Gambero Rosso.
# Uso: dalla cartella in cui salvare i file, python path/to/slowFood.py [chiave ...]

import os
import re
import sys

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'utils'))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'gamberoRosso'))
from place_geocoder import PlaceGeocoder
from ranking_writer import make_entry, save_ranking
from guideGamberoRosso import Browser

RANKING = 'Slowfood'

LISTS = {
    'osterie': {
        'sub_ranking': 'Chiocciole Osterie Italia Slowfood 2026', 'emoji': '🍝',
        'url': 'https://www.slowfood.it/tutte-le-chiocciole-di-osterie-ditalia-2026-regione-per-regione/',
    },
    'slowwine': {
        'sub_ranking': 'Slow Wine Slowfood 2027', 'emoji': '🍹',
        'url': 'https://www.slowfood.it/slowine/slow-wine-2027-ecco-tutti-i-locali-del-bere-slow/',
    },
}

# intestazioni di regione: "Piemonte | 29 Chiocciole", "Abruzzo e Molise (12)"
REGION = re.compile(r'\|\s*\d+\s+Chiocciol|\(\d+\)$')
ENTRY = re.compile(r'^(?P<body>.+?)\s*(?:\((?P<prov>[A-Z]{2})\))?$')


def parse_list(html, geocoder):
    soup = BeautifulSoup(html, 'html.parser')
    for t in soup(['script', 'style', 'nav', 'header', 'footer', 'aside']):
        t.decompose()
    lines = (soup.find('article') or soup.body).get_text('\n', strip=True).split('\n')
    start = next(i for i, l in enumerate(lines) if REGION.search(l))
    places = []
    for line in lines[start:]:
        if REGION.search(line):
            continue
        if line.startswith('Contribuisci'):
            break
        match = ENTRY.match(line)
        body, province = match.group('body'), match.group('prov')
        if ' – ' in body:
            name, city = body.rsplit(' – ', 1)
        else:
            split = geocoder.split_name_city(body, province)
            if split is None:
                print('  città non riconosciuta:', line)
                name, city = body, None
            else:
                name, city = split
        places.append((line, name.strip(), city and city.strip()))
    return places


if __name__ == '__main__':
    keys = sys.argv[1:] or list(LISTS)
    geocoder = PlaceGeocoder()
    with sync_playwright() as p:
        browser = Browser(p)
        for key in keys:
            config = LISTS[key]
            browser.open(config['url'])
            places = parse_list(browser.page.content(), geocoder)
            print(config['sub_ranking'], len(places), 'locali')
            entries, precision = [], []
            for label, name, city in places:
                geo = geocoder.geocode(name, city, 'Italia')
                print(label, '|', geo and geo['precision'])
                entries.append(make_entry(RANKING, config['sub_ranking'], config['emoji'], label, config['url'], None, None, geo))
                precision.append(geo and geo['precision'])
            geocoder.save()
            save_ranking(config['sub_ranking'], entries, precision=precision)
        browser.close()
