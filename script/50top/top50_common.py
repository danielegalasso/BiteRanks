# Scraper comune per i siti 50 Top (50toppizza.it, 50topitaly.it): stessa piattaforma,
# stesse card nelle pagine delle classifiche e stesse schede "referenza" con indirizzi e coordinate.

import re
import json
from time import sleep

import requests
from bs4 import BeautifulSoup


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}


def extract_name_from_url(url):
    path = url.rstrip('/').split('/')[-1]
    name = path.replace('-', ' ').title()
    name = re.sub(r'[^\w\s]', '', name)
    return name


def fetch_with_retry(url, retries=3):
    for i in range(retries):
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            if i < retries - 1:
                print(f"Errore di connessione, tentativo {i + 1} di {retries}... ({e})")
                sleep(5)
            else:
                raise


# PRIMA PARTE: ESTRARRE I RIFERIMENTI
def extract_cards(url, ranking, emoji, reference_prefix):
    soup = BeautifulSoup(fetch_with_retry(url).text, 'html.parser')
    cards = soup.find_all('a', href=lambda href: href and href.startswith(reference_prefix))

    entries = []
    seen_refs = set()
    for card in cards:
        # la stessa pizzeria/ristorante può comparire più volte (una card per città) con la stessa referenza
        if card.get('href') in seen_refs:
            continue
        seen_refs.add(card.get('href'))
        # l'ordine delle classi cambia tra le pagine, si cerca la singola classe
        position = card.find(class_='posizione')
        position = None if not position else (position.get_text(strip=True) or None)
        place_name = card.find(class_='titolo')
        if place_name is None:
            continue
        entries.append({
            'ranking': ranking,
            'sub-ranking': extract_name_from_url(url),
            'emoji': emoji,
            'position': position,
            'name': ' '.join(place_name.get_text(strip=True).split()),
            'ref': card.get('href'),
            'address': [],
            'coord': [],
            'website': None
        })
    return entries


# SECONDA PARTE: SITO WEB, INDIRIZZI E COORDINATE DALLA SCHEDA
def extract_details(ref):
    details = {'address': [], 'coord': [], 'website': None}
    soup = BeautifulSoup(fetch_with_retry(ref).text, 'html.parser')

    website_div = next((div for div in soup.find_all('div') if re.search(r'^sito web:.*', div.get_text(strip=True))), None)
    if website_div is not None:
        website = website_div.find('a')
        if website is not None:
            details['website'] = website.get('href')

    locations = soup.find_all('a', href=lambda href: href and href.startswith('https://www.google.com/maps/dir/?api'))
    for location in locations:
        href = location.get('href')
        if 'destination=' not in href:
            continue
        lat_long = href.split('destination=')[1].split(',')
        if len(lat_long) != 2:
            continue
        try:
            coord = [float(lat_long[0]), float(lat_long[1])]
        except ValueError:
            print(f"Errore nella conversione delle coordinate da {ref}: {lat_long}")
            continue
        # indirizzo e coordinate restano allineati: si salva l'indirizzo solo se le coordinate sono valide
        address = location.get_text(strip=True).split('indirizzo: ')[-1].replace('localizzatore', '').strip()
        details['address'].append(address)
        details['coord'].append(coord)
    sleep(1)
    return details


def scrape(urls, ranking, reference_prefix, emoji_for_url):
    """Scarica le classifiche e salva un file JSON per ciascuna nella directory corrente."""
    url_to_entries = {url: extract_cards(url, ranking, emoji_for_url(url), reference_prefix) for url in urls}

    # molti locali compaiono in più classifiche: ogni scheda viene scaricata una sola volta
    ref_cache = {}
    for url, entries in url_to_entries.items():
        for data in entries:
            print(data['ref'])
            if data['ref'] not in ref_cache:
                ref_cache[data['ref']] = extract_details(data['ref'])
            details = ref_cache[data['ref']]
            data['address'] = list(details['address'])
            data['coord'] = [list(c) for c in details['coord']]
            data['website'] = details['website']

    # Salvare il file JSON nella directory corrente
    for url, entries in url_to_entries.items():
        name = extract_name_from_url(url)
        output_path = f'{name.replace(" ", "")}.json'
        with open(output_path, 'w', encoding='utf-8') as file:
            json.dump({name: entries}, file, ensure_ascii=False, indent=4)
        print(f'{output_path}: {len(entries)} voci, {sum(1 for e in entries if not e["coord"])} senza coordinate')
