import re
import requests
from bs4 import BeautifulSoup
from time import sleep
import json


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

category = '🍽️'

urls = [
    'https://www.50topitaly.it/it/i-migliori-ristoranti-italiani-2024-grandi-ristoranti/',
    'https://www.50topitaly.it/it/i-migliori-ristoranti-italiani-2024-cucina-dautore/',
    'https://www.50topitaly.it/it/50-top-trattorie-bistro-moderni-2024/',
    'https://www.50topitaly.it/it/50-top-italy-migliori-sushi-2024/',
    'https://www.50topitaly.it/it/50-top-italy-migliori-bistro-vegetali-2024/',
    'https://www.50topitaly.it/it/50-top-italy-migliori-cacio-e-pepe-2024/',
    'https://www.50topitaly.it/it/50-top-italy-migliori-panini-2024/',
    'https://www.50topitaly.it/it/50-top-italy-migliori-street-food-2024/',
    'https://www.50topitaly.it/it/50-top-italy-migliori-ristoranti-di-pesce-2024/',
    'https://www.50topitaly.it/it/i-migliori-ristoranti-italiani-nel-mondo-2024/'
]

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
    cards = soup.find_all('a', href=lambda href: href and href.startswith('https://www.50topitaly.it/it/referenza/'))

    url_to_reference[url] = []
    for card in cards:
        position = card.find('h2', class_='posizione scotchmodern rosso caps')
        position = None if not position else position.get_text(strip=True)
        place_name = card.find('h3', class_='titolo roboto nero caps')
        url_to_reference[url].append({'category': category ,'position': position, 'name': place_name.get_text(strip=True), 'ref': card.get('href'), 'address': [], 'coord': [], 'website': None})


# SECONDA PARTE: DERIVARE LA POSIZIONE
for url in url_to_reference:
    for data in url_to_reference[url]:
        print(data['ref'])
        response = requests.get(data['ref'], headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        locations = soup.find_all('a', href=lambda href: href and href.startswith('https://www.google.com/maps/dir/?api'))
        for location in locations:

            address = location.find('span')
            data['address'].append(address.get_text(strip=True))

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

for url, name in url_to_name.items():
    json_output = {}
    json_output[name] = url_to_reference[url]
    with open(f'vite-project/public/ranking/50TopItaly/{name.replace(" ", "")}.json', 'w', encoding='utf-8') as file:
        json.dump(json_output, file, ensure_ascii=False, indent=4)

'''
with open('50topitaly.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)
'''