# TasteAtlas "Where to eat": per ogni piatto iconico, i locali consigliati dai critici in tutto il mondo
# (posizione, nome, città, paese e via). Il sito blocca le richieste dirette: si usa il browser (Playwright).
# Uso: dalla cartella in cui salvare i file, python path/to/tasteAtlasWhereToEat.py [piatto ...]
#      variabile CHROME_PATH per usare il Chrome di sistema al posto di quello di Playwright.

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

RANKING = 'Taste Atlas'
MAX_PLACES = 30  # la pagina ne mostra 10, "LOAD MORE" aggiunge le successive

# slug del piatto su tasteatlas.com -> (nome mostrato, categoria del sito)
DISHES = {
    'kebab': ('Kebab', '🍢'),
    'ramen': ('Ramen', '🍽️'),
    'tacos-al-pastor': ('Tacos al Pastor', '🍢'),
    'pho': ('Pho', '🍽️'),
    'hamburger': ('Hamburger', '🍔'),
    'croissant': ('Croissant', '🥖'),
}


def load_all(browser, url):
    browser.open(url)
    consent = browser.page.get_by_role('button', name=re.compile(r'agree and close', re.I))
    if consent.count() and consent.first.is_visible():
        consent.first.click()
    for _ in range(MAX_PLACES // 10):
        more = browser.page.get_by_text('LOAD MORE', exact=True)
        if not more.count() or not more.first.is_visible():
            break
        more.first.evaluate('b => b.click()')
        browser.page.wait_for_timeout(2500)
    return browser.page.content()


def parse_places(html):
    soup = BeautifulSoup(html, 'html.parser')
    for t in soup(['script', 'style']):
        t.decompose()
    lines = [l.strip() for l in soup.body.get_text('\n').split('\n') if l.strip()]
    start = next(i for i, l in enumerate(lines) if l.startswith('Recommend a restaurant'))
    places, seen = [], set()
    i = start
    while i < len(lines) - 4:
        # "1 / Barbar / Beirut / , / Lebanon / El Akhtal El Saghir / Recommended by ..."
        if re.fullmatch(r'\d{1,3}', lines[i]) and lines[i + 3] == ',' and int(lines[i]) not in seen:
            position, name, city, country = int(lines[i]), lines[i + 1], lines[i + 2], lines[i + 4]
            street = lines[i + 5] if i + 5 < len(lines) and not lines[i + 5].startswith('Recommended') else None
            seen.add(position)
            places.append((position, name, city, country, street))
            i += 5
        else:
            i += 1
    return sorted(places)[:MAX_PLACES]


if __name__ == '__main__':
    dishes = sys.argv[1:] or list(DISHES)
    geocoder = PlaceGeocoder()
    with sync_playwright() as p:
        browser = Browser(p)
        for slug in dishes:
            dish, emoji = DISHES[slug]
            url = f'https://www.tasteatlas.com/{slug}/wheretoeat'
            sub_ranking = f'TasteAtlas Where to Eat {dish}'
            places = parse_places(load_all(browser, url))
            print(sub_ranking, len(places), 'locali')
            entries, precision = [], []
            for position, name, city, country, street in places:
                address = f'{street}, {city}' if street else None
                geo = geocoder.geocode(name, city, country, address)
                print(position, name, '|', city, country, '|', geo and geo['precision'])
                entries.append(make_entry(RANKING, sub_ranking, emoji, name, url, position, None, geo))
                precision.append(geo and geo['precision'])
            geocoder.save()
            save_ranking(sub_ranking, entries, precision=precision)
        browser.close()
