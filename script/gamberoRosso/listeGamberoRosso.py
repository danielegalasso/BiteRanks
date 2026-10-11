# Guide Gambero Rosso 2026 (vecchio formato, senza pagine strutturate): gli elenchi completi dei premiati
# sono pubblicati come testo ("Nome – Città [PR]") negli articoli di Gambero Rosso o di siti che li riportano.
# Le coordinate si ricavano con PlaceGeocoder (nome + città).
# Uso: dalla cartella in cui salvare i file, python path/to/listeGamberoRosso.py [chiave ...]

import os
import re
import sys

import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'utils'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from place_geocoder import PlaceGeocoder
from ranking_writer import make_entry, save_ranking
from guideGamberoRosso import Browser, RANKING

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.3'
}

# source: pagina con l'elenco; ref: articolo ufficiale Gambero Rosso; start/end: testo che delimita l'elenco
LISTS = {
    'forchette': {
        'sub_ranking': 'Tre Forchette Gambero Rosso 2026', 'emoji': '🍽️',
        'source': 'https://www.scattidigusto.it/i-migliori-ristoranti-in-italia-gambero-rosso-2026',
        'ref': 'https://www.gamberorosso.it/notizie/rubriche/migliori-ristoranti-tre-forchette-2026/',
        'start': 'con le Tre Forchette', 'end': '#',
        # righe senza separatore tra nome e città
        'fixes': {
            'Atelier Moessmer Norbert Niederkofler Brunico/Bruneck': ('Atelier Moessmer Norbert Niederkofler', 'Brunico'),
            'Idylio by Apreda del The Pantheon Iconic Rome Hotel Roma': ('Idylio by Apreda', 'Roma'),
        },
    },
    'gamberi': {
        'sub_ranking': 'Trattorie Italia Gambero Rosso 2026', 'emoji': '🍝',
        'source': 'https://www.gamberorosso.it/notizie/ristoranti/migliori-trattorie-tre-gamberi-2026/',
        'ref': 'https://www.gamberorosso.it/notizie/ristoranti/migliori-trattorie-tre-gamberi-2026/',
        'start': 'premiate con i Tre Gamberi', 'end': 'TI POTREBBE',
        'fixes': {'Villa Rosa – La casa di Lella Vico Equense': ('Villa Rosa – La casa di Lella', 'Vico Equense')},
    },
    'spicchi': {
        'sub_ranking': 'Tre Spicchi Gambero Rosso 2026', 'emoji': '🍕',
        'source': 'https://www.scattidigusto.it/3-spicchi-gambero-rosso-2026-migliori-pizzerie',
        'ref': 'https://www.gamberorosso.it/notizie/attualita/guida-pizzerie-gambero-rosso-2026/',
        'start': 'elenco completo delle pizzerie con i Tre Spicchi', 'end': 'Tre Rotelle',
    },
    'rotelle': {
        'sub_ranking': 'Tre Rotelle Gambero Rosso 2026', 'emoji': '🍕',
        'source': 'https://www.scattidigusto.it/3-spicchi-gambero-rosso-2026-migliori-pizzerie',
        'ref': 'https://www.gamberorosso.it/notizie/attualita/guida-pizzerie-gambero-rosso-2026/',
        'start': 'pizzerie al taglio che hanno conquistato', 'end': '#',
    },
}

LINE = re.compile(r'^(?P<body>.+?)\s*(?:[\[(](?P<prov>[A-Za-z]{2})[\])])?\.?$')


def page_lines(html):
    soup = BeautifulSoup(html, 'html.parser')
    for t in soup(['script', 'style', 'nav', 'header', 'footer', 'aside']):
        t.decompose()
    return [l.strip() for l in soup.body.get_text('\n', strip=True).split('\n')]


def parse_list(lines, start, end, fixes=None):
    fixes = fixes or {}
    begin = next(i for i, l in enumerate(lines) if start in l) + 1
    places = []
    for line in lines[begin:]:
        if line.startswith(end):
            break
        # punteggi ("97"), separatori ("***") e intestazioni dei gruppi ("I tre spicchi 2026 con voto 94")
        if re.fullmatch(r'[\d*#]+', line) or re.match(r'^I tre \w+ \d{4}', line):
            continue
        match = LINE.match(line)
        body, province = match.group('body'), match.group('prov')
        if body in fixes:
            places.append((*fixes[body], province.upper() if province else None))
            continue
        # la città è dopo l'ultimo separatore: "Nome – Città", "Nome -Città", "Nome, Città"
        parts = re.split(r'\s+[–-]\s*|,\s+', body)
        if len(parts) >= 2:
            name, city = ' – '.join(parts[:-1]).strip(), parts[-1].strip()
        else:
            break  # una riga senza città non è più un locale: l'elenco è finito
        places.append((name, city, province.upper() if province else None))
    return places


if __name__ == '__main__':
    keys = sys.argv[1:] or list(LISTS)
    geocoder = PlaceGeocoder()
    pages = {}
    with sync_playwright() as p:
        browser = None
        for key in keys:
            config = LISTS[key]
            source = config['source']
            if source not in pages:
                if 'gamberorosso.it' in source:  # Cloudflare: serve il browser
                    browser = browser or Browser(p)
                    browser.open(source)
                    pages[source] = browser.page.content()
                else:
                    pages[source] = requests.get(source, headers=headers, timeout=30).text
            places = parse_list(page_lines(pages[source]), config['start'], config['end'], config.get('fixes'))
            print(config['sub_ranking'], len(places), 'locali')
            entries, precision = [], []
            for name, city, province in places:
                geo = geocoder.geocode(name, city, 'Italia')
                # stesso formato delle edizioni precedenti: "Nome | Città (PR)"
                label = f'{name} | {city}' + (f' ({province})' if province else '') if city else name
                print(label, '|', geo and geo['precision'])
                entries.append(make_entry(RANKING, config['sub_ranking'], config['emoji'], label, config['ref'], None, None, geo))
                precision.append(geo and geo['precision'])
            geocoder.save()
            save_ranking(config['sub_ranking'], entries, precision=precision)
        if browser:
            browser.close()
