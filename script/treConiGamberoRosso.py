import requests
from bs4 import BeautifulSoup
import json
from geolocator import Geolocator


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

url = 'https://www.gamberorosso.it/gelaterie/'
maps_url = 'https://www.google.com/maps/search/?api=1&query='

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')
cards = soup.find_all('a', href=lambda href: href and href.startswith('https://www.gamberorosso.it/ristoranti/scheda-negozio/'))

json_output = { 'Tre Coni Gambero Rosso': [] }


geo_locator = Geolocator()
for card in cards:
    location_infos = card.find_all('span')
    location_string = ' '.join([span.text for span in location_infos])
    if location_string != '':
        coord = geo_locator.find_coordinates(location_string)
        if coord is None:
            print(f'errore per {location_infos[0].get_text()}')
            continue

        json_output['Tre Coni Gambero Rosso'].append({
            'name': location_infos[0].get_text(),
            'coord': coord
        })
        # print(f'{coord} -> {location_infos[0].get_text()}')

geo_locator.quit_selenium()

with open('treConiGamberoRosso.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)