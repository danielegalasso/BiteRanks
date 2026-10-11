# Le Soste: associazione dei grandi ristoranti italiani (e di alcuni paesi vicini).
# La pagina /ristoranti contiene nomi e link di tutti i soci; ogni scheda ha indirizzo e sito web.
# Uso: dalla cartella in cui salvare il file, python path/to/leSoste.py

import json
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

RANKING = 'Le Soste'
SUB_RANKING = 'Le Soste'
category = '🍽️'


def link_options(html):
    """Il tema Divi salva i link dei blocchi cliccabili in "var et_link_options_data = [...]"."""
    match = re.search(r'var et_link_options_data = (\[.*?\]);', html)
    return [item['url'] for item in json.loads(match.group(1)) if 'url' in item] if match else []


def members():
    html = requests.get('https://lesoste.it/ristoranti', headers=headers, timeout=30).text
    soup = BeautifulSoup(html, 'html.parser')
    names = [h.get_text(strip=True) for h in soup.find_all('h4', class_='et_pb_module_header')]
    urls = [u for u in link_options(html) if u.startswith('https://lesoste.it/')]
    return list(zip(names, urls))


def parse_member(url):
    html = requests.get(url, headers=headers, timeout=30).text
    soup = BeautifulSoup(html, 'html.parser')
    row = soup.find('div', class_='et_pb_row_2')
    # "Indirizzo | Via Roma 18 – 28018 Soriso (NO)"
    address = row.get_text(' ', strip=True).replace('Indirizzo', '', 1).strip() if row else None
    address = re.sub(r'\s+', ' ', address).replace(' ,', ',') if address else None
    city, country = None, 'Italia'
    if address:
        match = re.search(r'(?:\d{4,5}\s+)?([^–,]+?)\s*(?:\(([A-Z]{2})\))?$', address.split('–')[-1].strip())
        city = match.group(1).strip() if match else None
        if not match or not match.group(2):
            country = None  # soci all'estero (Svizzera, Slovenia, ...): il paese è nell'indirizzo
    website = next((u for u in link_options(html) if 'lesoste.it' not in u), None)
    return address, city, country, website


if __name__ == '__main__':
    geocoder = PlaceGeocoder()
    entries, precision = [], []
    for name, url in members():
        address, city, country, website = parse_member(url)
        geo = geocoder.geocode(name, city, country, address)
        print(name, '|', address, '|', geo and geo['precision'])
        entries.append(make_entry(RANKING, SUB_RANKING, category, name, url, None, website, geo))
        precision.append(geo and geo['precision'])
        sleep(2)  # per non sovraccaricare il sito
    geocoder.save()
    save_ranking(SUB_RANKING, entries, path='leSoste.json', precision=precision)
