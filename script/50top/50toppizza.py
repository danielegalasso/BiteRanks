# updated script to new json v1.2

import re
import requests
from bs4 import BeautifulSoup
import json
from time import sleep
import os


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

category = '🍕'

'''
urls = [
    'https://www.50toppizza.it/50-top-pizza-italia-2024/',
    'https://www.50toppizza.it/50-top-pizza-italia-2024-pizzerie-eccellenti/',
    'https://www.50toppizza.it/50-top-pizze-in-viaggio-2024/',
    'https://www.50toppizza.it/50-top-usa-2024/',
    'https://www.50toppizza.it/50-top-usa-2024-slice/',
    'https://www.50toppizza.it/50-top-europe-2024/',
    'https://www.50toppizza.it/50-top-pizza-europa-2024-excellent-pizzerias/',
    'https://www.50toppizza.it/50-top-pizza-latin-america-2024/',
    'https://www.50toppizza.it/50-top-pizza-asia-pacific-2024/',
]
'''
urls = ['https://www.50toppizza.it/50-top-world-2024/']

def extract_name_from_url(url):
    path = url.split('/')[-2]
    name = path.replace('-', ' ').title()
    name = re.sub(r'[^\w\s]', '', name)
    return name

# PRIMA PARTE: ESTRARRE I RIFERIMENTI
url_to_name = {url: extract_name_from_url(url) for url in urls}
url_to_reference = {}

for url in urls:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    cards = soup.find_all('a', href=lambda href: href and href.startswith('https://www.50toppizza.it/referenza/'))

    url_to_reference[url] = []
    for card in cards:
        position = card.find('h2', class_='mt-2 posizione scotchmodern rosso caps')
        position = None if not position else position.get_text(strip=True)
        place_name = card.find('h3', class_='titolo roboto nero caps')
        url_to_reference[url].append({
            'ranking': '50 Top Pizza',
            'sub-ranking': extract_name_from_url(url),
            'emoji': category,
            'position': position,
            'name': place_name.get_text(strip=True),
            'ref': card.get('href'),
            'address': [],
            'coord': [],
            'website': None
        })

# SECONDA PARTE: DERIVARE LA POSIZIONE
def fetch_with_retry(url, headers, retries=3):
    for i in range(retries):
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            if i < retries - 1:
                print(f"Errore di connessione, tentativo {i + 1} di {retries}... ({e})")
                sleep(5)
            else:
                raise

for url in url_to_reference:
    for data in url_to_reference[url]:
        print(data['ref'])
        response = fetch_with_retry(data['ref'], headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        website_div = next((div for div in soup.find_all('div') if re.search(r'^sito web:.*', div.get_text(strip=True))), None)
        if website_div is not None:
            website = website_div.find('a')
            data['website'] = website.get('href')

        locations = soup.find_all('a', href=lambda href: href and href.startswith('https://www.google.com/maps/dir/?api'))
        for location in locations:

            raw_address = location.get_text(strip=True)
            try:
                raw_address = raw_address.split('indirizzo: ')[1]
            except IndexError as e:
                pass
            finally:
                address = raw_address
                data['address'].append(address)

            href = location.get('href')
            if 'destination=' in href:
                destination_params = href.split('destination=')[1]

                lat_long = destination_params.split(',')
                if len(lat_long) == 2:
                    try:
                        lat = float(lat_long[0])
                        lon = float(lat_long[1])
                        data['coord'].append([lat, lon])
                    except ValueError:
                        print(f"Errore nella conversione delle coordinate da {data['ref']}: {lat_long}")
        sleep(1)

# Salvare il file JSON nella directory corrente
for url, name in url_to_name.items():
    json_output = {}
    json_output[name] = url_to_reference[url]
    output_path = f'{name.replace(" ", "")}.json'
    with open(output_path, 'w', encoding='utf-8') as file:
        json.dump(json_output, file, ensure_ascii=False, indent=4)

'''
with open('50toppizza.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)
    
'''
