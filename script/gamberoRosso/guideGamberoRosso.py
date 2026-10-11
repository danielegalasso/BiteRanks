# Guide Gambero Rosso nel nuovo formato (dalle edizioni 2027): la pagina della guida filtrata per punteggio
# elenca i locali premiati, ogni scheda locale ha indirizzo e coordinate (link Google Maps).
# Il sito è dietro Cloudflare: serve un vero Chrome (Playwright) e un ritmo lento tra le pagine.
# Uso: dalla cartella in cui salvare i file, python path/to/guideGamberoRosso.py [chiave ...]
#      variabile CHROME_PATH per usare il Chrome di sistema al posto di quello di Playwright.

import os
import re
import sys
from time import sleep

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'utils'))
from ranking_writer import make_entry, save_ranking
from place_geocoder import PlaceGeocoder

RANKING = 'Gambero Rosso'
BASE = 'https://www.gamberorosso.it/guide'

# sotto-classifica -> pagina della guida con il filtro sul punteggio massimo
GUIDES = {
    'gelaterie': {
        'sub_ranking': 'Tre Coni Gambero Rosso 2027', 'emoji': '🍦',
        'url': f'{BASE}/gelaterie-ditalia/2027/?type=locali&guide=gelaterie-2027&sort=ordine_negozi_coni', 'facet': 'punteggio_coni',
    },
    'bar': {
        'sub_ranking': 'I Migliori Bar Gambero Rosso 2027', 'emoji': '☕',
        'url': f'{BASE}/bar-ditalia/2027/?type=locali&guide=bar-2027', 'facet': 'punteggio_tazzine',
    },
    'pane': {
        'sub_ranking': 'Tre Pani Gambero Rosso 2027', 'emoji': '🥖',
        'url': f'{BASE}/panifici-ditalia/2027/?type=locali&guide=pane-2027', 'facet': 'punteggio_pani',
    },
}


class Browser:

    def __init__(self, playwright):
        args = ['--headless=new', '--disable-blink-features=AutomationControlled']
        self.browser = playwright.chromium.launch(headless=True, executable_path=os.environ.get('CHROME_PATH'),
                                                  ignore_default_args=['--enable-automation'], args=args)
        version = self.browser.version
        # con "HeadlessChrome" nello user agent Cloudflare blocca la pagina
        self.context = self.browser.new_context(locale='it-IT', viewport={'width': 1300, 'height': 900}, user_agent=(
            f'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36'))
        self.context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        self.page = self.context.new_page()

    def open(self, url):
        self.page.goto(url, wait_until='domcontentloaded', timeout=60000)
        for _ in range(30):  # attesa della verifica di Cloudflare ("Ci siamo quasi…")
            if 'quasi' not in self.page.title():
                break
            self.page.wait_for_timeout(1000)
        self.page.wait_for_timeout(1500)
        # il banner dei cookie copre la pagina e intercetta i click
        consent = self.page.get_by_role('button', name=re.compile(r'^accetto$', re.I))
        if consent.count() and consent.first.is_visible():
            consent.first.click()
            self.page.wait_for_timeout(500)

    def close(self):
        self.browser.close()


def wait_for_more_cards(browser, count):
    for _ in range(30):
        browser.page.wait_for_timeout(500)
        if browser.page.locator('a[href*="/luoghi/locali/"]').count() != count:
            browser.page.wait_for_timeout(1000)
            return True
    return False


def list_places(browser, url, facet):
    """Link alle schede dei locali con il punteggio massimo, nell'ordine della guida,
    cliccando "Carica altro..." finché serve."""
    browser.open(url)
    browser.page.wait_for_selector('a[href*="/luoghi/locali/"]', timeout=30000)
    # il filtro passato nell'URL si perde dopo il consenso ai cookie: si seleziona la casella "3"
    checkbox = browser.page.locator(f'.facetwp-facet-{facet} .facetwp-checkbox[data-value="3"]')
    if 'checked' not in (checkbox.first.get_attribute('class') or ''):
        count = browser.page.locator('a[href*="/luoghi/locali/"]').count()
        checkbox.first.evaluate('c => c.click()')
        wait_for_more_cards(browser, count)
    for _ in range(30):
        button = browser.page.locator('button.facetwp-load-more')
        if not button.count() or not button.first.is_visible():
            break
        count = browser.page.locator('a[href*="/luoghi/locali/"]').count()
        button.first.evaluate('b => b.click()')
        if not wait_for_more_cards(browser, count):
            break
    soup = BeautifulSoup(browser.page.content(), 'html.parser')
    # solo i risultati della ricerca, non i locali suggeriti nel resto della pagina
    results = soup.select('.facetwp-template a[href*="/luoghi/locali/"]')
    return list(dict.fromkeys(a['href'] for a in results))


def city_of(address):
    """'via L. Serra, 3, Bologna (BO)' -> 'Bologna'"""
    match = re.search(r'([^,]+?)\s*\([A-Z]{2}\)$', address or '')
    return match.group(1).strip() if match else None


def parse_place(html):
    soup = BeautifulSoup(html, 'html.parser')
    h1 = soup.find('h1')
    name = h1.get_text(strip=True) if h1 else None
    match = re.search(r'maps/dir//(-?\d+\.\d+),(-?\d+\.\d+)', html)
    coord = [round(float(match.group(1)), 7), round(float(match.group(2)), 7)] if match else None
    for t in soup(['script', 'style']):
        t.decompose()
    lines = [l for l in soup.body.get_text('\n', strip=True).split('\n')]
    address = None
    if name in lines:
        # sotto il nome: categoria e poi l'indirizzo ("via L. Serra, 3, Bologna (BO)")
        for line in lines[lines.index(name) + 1: lines.index(name) + 5]:
            if re.search(r'\([A-Z]{2}\)$', line) or (',' in line and re.search(r'\d', line)):
                address = line
                break
    return name, address, coord


if __name__ == '__main__':
    keys = sys.argv[1:] or list(GUIDES)
    geocoder = PlaceGeocoder()
    with sync_playwright() as p:
        browser = Browser(p)
        for key in keys:
            config = GUIDES[key]
            links = list_places(browser, config['url'], config['facet'])
            print(config['sub_ranking'], len(links), 'locali')
            entries, precision = [], []
            for link in links:
                browser.open(link)
                name, address, coord = parse_place(browser.page.content())
                print(name, '|', address, '|', coord)
                if coord:
                    geo = {'lat': coord[0], 'lon': coord[1], 'address': address, 'precision': 'address'}
                else:  # alcune schede non hanno la mappa: si cerca l'indirizzo
                    geo = geocoder.geocode(name, city_of(address), 'Italia', address)
                entries.append(make_entry(RANKING, config['sub_ranking'], config['emoji'], name, link, None, None, geo))
                precision.append(geo and geo['precision'])
                sleep(3)  # ritmo lento: troppe richieste ravvicinate attivano il blocco di Cloudflare
            save_ranking(config['sub_ranking'], entries, precision=precision)
        geocoder.save()
        browser.close()
