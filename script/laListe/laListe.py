# La Liste: Top 1000 ristoranti del mondo, ognuno con un punteggio su 100 (sintesi di oltre 1000 guide).
# La pagina mostra i primi ~100 e carica gli altri con "Show more": si usa il browser (Playwright).
# La posizione è ricavata dal punteggio: a pari punteggio, pari posizione (come fa La Liste).
# Uso: dalla cartella in cui salvare il file, python path/to/laListe.py
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

URL = 'https://www.laliste.com/en/restaurants/top-1000'
RANKING = 'La Liste'
category = '🍽️'


def load_all(browser):
    browser.open(URL)
    for _ in range(60):
        more = browser.page.get_by_text(re.compile(r'^Show more'))
        if not more.count() or not more.first.is_visible():
            break
        count = len(re.findall(r'\d{2}\.\d', browser.page.inner_text('body')))
        more.first.evaluate('b => b.click()')
        for _ in range(20):
            browser.page.wait_for_timeout(500)
            if len(re.findall(r'\d{2}\.\d', browser.page.inner_text('body'))) > count:
                break
        else:
            break
    return browser.page.content()


def parse_list(html):
    soup = BeautifulSoup(html, 'html.parser')
    year = re.search(r'Restaurants (20\d\d)', soup.title.get_text() if soup.title else '')
    for t in soup(['script', 'style', 'nav', 'footer']):
        t.decompose()
    lines = [l.strip() for l in soup.body.get_text('\n').split('\n') if l.strip()]
    start = lines.index('List') + 1 if 'List' in lines else 0
    rows, seen = [], set()
    k = start
    # ogni voce: punteggio / nome / bandiera / "Città, Paese"
    while k < len(lines) - 3:
        if re.fullmatch(r'\d{2}\.\d', lines[k]) and ',' in lines[k + 3]:
            score, name, place = float(lines[k]), lines[k + 1], lines[k + 3]
            if (name, place) not in seen:
                seen.add((name, place))
                city, _, country = place.partition(', ')
                rows.append((score, name, city, country))
            k += 4
        else:
            k += 1
    rows.sort(key=lambda r: -r[0])
    # a pari punteggio, pari posizione
    ranked = [(1 + sum(1 for other in rows if other[0] > row[0]),) + row for row in rows]
    return (year.group(1) if year else None), ranked


if __name__ == '__main__':
    with sync_playwright() as p:
        browser = Browser(p)
        year, rows = parse_list(load_all(browser))
        browser.close()
    sub_ranking = f'La Liste Top 1000 Restaurants {year}'
    print(sub_ranking, len(rows), 'ristoranti')
    geocoder = PlaceGeocoder()
    entries, precision = [], []
    for i, (position, score, name, city, country) in enumerate(rows):
        geo = geocoder.geocode(name, city, country)
        print(position, score, name, '|', city, country, '|', geo and geo['precision'])
        entries.append(make_entry(RANKING, sub_ranking, category, name, URL, position, None, geo))
        precision.append(geo and geo['precision'])
        if i % 50 == 0:
            geocoder.save()  # lista lunga: si salva la cache ogni tanto
    geocoder.save()
    save_ranking(sub_ranking, entries, precision=precision)
