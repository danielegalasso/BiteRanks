# The World's 50 Best (Bars e Restaurants), classifica completa 1-100.
# La pagina della lista viene generata con JavaScript, quindi si usa il browser (Playwright);
# le posizioni 1-50 hanno una scheda con indirizzo e sito web, le 51-100 solo nome e città.
# Uso: dalla cartella in cui salvare i file, python path/to/worldBest50.py [bars|restaurants ...]

import json
import os
import re
import sys
import unicodedata
from time import sleep

import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'utils'))
from place_geocoder import PlaceGeocoder
from ranking_writer import make_entry, save_ranking

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.3'
}
BASE = 'https://www.theworlds50best.com'

# chiave -> pagina della classifica ("restaurants/best-in-the-world") e titolo; le liste regionali
# hanno lo stesso formato di quella mondiale
LISTS = {
    'bars': {'path': 'bars/best-in-the-world', 'title': "The World's 50 Best Bars", 'emoji': '🍹'},
    'restaurants': {'path': 'restaurants/best-in-the-world', 'title': "The World's 50 Best Restaurants", 'emoji': '🍽️'},
    'asia-restaurants': {'path': 'restaurants/best-in-asia', 'title': "Asia's 50 Best Restaurants", 'emoji': '🍽️'},
    'latam-restaurants': {'path': 'restaurants/best-in-latin-america', 'title': "Latin America's 50 Best Restaurants", 'emoji': '🍽️'},
    'asia-bars': {'path': 'bars/best-in-asia', 'title': "Asia's 50 Best Bars", 'emoji': '🍹'},
    'northamerica-bars': {'path': 'bars/best-in-north-america', 'title': "North America's 50 Best Bars", 'emoji': '🍹'},
}
RANKING = 'TW50B'


def render_list(path):
    with sync_playwright() as p:
        # CHROME_PATH: browser alternativo se quello scaricato da Playwright non è disponibile
        browser = p.chromium.launch(headless=True, executable_path=os.environ.get('CHROME_PATH'))
        page = browser.new_page()
        page.goto(f'{BASE}/{path}/list/1-50', wait_until='networkidle')
        page.wait_for_timeout(3000)
        html = page.content()
        browser.close()
    return BeautifulSoup(html, 'html.parser')


def parse_list(soup):
    """Restituisce l'anno dell'edizione e {posizione: (nome, città, url scheda o None)}."""
    links = {}
    for a in soup.find_all('a', href=True):
        if '/the-list/' in a['href']:
            label = a.get_text(' ', strip=True)
            if label:
                links[label] = BASE + a['href'] if a['href'].startswith('/') else a['href']
    for t in soup(['script', 'style']):
        t.decompose()
    lines = soup.body.get_text('\n', strip=True).split('\n')
    year = next((m.group(1) for l in lines for m in [re.search(r"50 Best \w+ (20\d\d)$", l)] if m), None)
    ranks = {}
    # ogni voce è "posizione / nome / città" su tre righe
    for i in range(len(lines) - 2):
        if re.fullmatch(r'\d{1,3}', lines[i]) and not lines[i + 1].isdigit() and not lines[i + 2].isdigit():
            rank = int(lines[i])
            if 1 <= rank <= 100 and rank not in ranks:
                ranks[rank] = (lines[i + 1], lines[i + 2], links.get(lines[i + 1]))
    return year, ranks


def slugify(name):
    text = unicodedata.normalize('NFD', name)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', text.lower().replace('&', 'and')).strip('-')


def guess_detail_url(path, name):
    """Le schede delle posizioni 51-100 non sono linkate dalla lista, ma spesso esistono."""
    url = f'{BASE}/{path}/the-list/{slugify(name)}.html'
    try:
        return url if requests.head(url, headers=headers, timeout=20, allow_redirects=True).status_code == 200 else None
    except requests.RequestException:
        return None


def parse_detail(url):
    soup = BeautifulSoup(requests.get(url, headers=headers, timeout=30).text, 'html.parser')
    address, website = None, None
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string or '', strict=False)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict) and 'address' in data:
            address = data['address'].get('streetAddress')
            website = data.get('url')
    if not address:
        # i dati strutturati di alcune schede non sono JSON valido: si usa l'indirizzo visibile
        location = soup.find(class_='location')
        address = location.get_text(' ', strip=True) if location else None
    if not website:
        link = soup.find('a', class_='website')
        website = link.get('href') if link else None
    return address, website


def country_of(address):
    """Ultima parte dell'indirizzo se è un paese ("..., Lima, Peru" -> "Peru"), altrimenti None."""
    last = address.split(',')[-1].strip() if address else ''
    return last if last and not re.search(r'\d', last) and len(last) > 2 else None


if __name__ == '__main__':
    kinds = sys.argv[1:] or list(LISTS)
    geocoder = PlaceGeocoder()
    for kind in kinds:
        config = LISTS[kind]
        year, ranks = parse_list(render_list(config['path']))
        sub_ranking = f"{config['title']} {year}"
        print(sub_ranking, len(ranks), 'posizioni')
        entries, precision = [], []
        for rank in sorted(ranks):
            name, city, url = ranks[rank]
            url = url or guess_detail_url(config['path'], name)
            address, website = parse_detail(url) if url else (None, None)
            geo = geocoder.geocode(name, city, country_of(address), address)
            print(rank, name, '|', city, '|', geo and geo['precision'])
            entries.append(make_entry(RANKING, sub_ranking, config['emoji'], name,
                                      url or f"{BASE}/{config['path']}/list/51-100", rank, website, geo))
            precision.append(geo and geo['precision'])
            if url:
                sleep(1)
        geocoder.save()
        save_ranking(sub_ranking, entries, precision=precision)
