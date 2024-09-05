import requests
from geolocator import Geolocator
from bs4 import BeautifulSoup
import json


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

category = '🍰'

url = 'https://www.gamberorosso.it/pasticcerie/'
response = requests.get(url, headers=headers)
response.raise_for_status()
soup = BeautifulSoup(response.text, 'html.parser')
cards = soup.find_all('a', href=lambda href: href and href.startswith('https://www.gamberorosso.it/ristoranti/scheda-negozio/'))

json_output = { 'Tre Torte Gambero Rosso 2024': [] }

geo_locator = Geolocator()
for card in cards:
    locations_spans = card.find_all('span')
    locations_spans = locations_spans[1::]
    concat_location = ', '.join([span.text for span in locations_spans])
    if concat_location != '':
        response = requests.get(card.get('href'), headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        website = soup.find('a', id='link-1214-365586')
        
        coord = geo_locator.find_coordinates(concat_location)

        json_output['Tre Torte Gambero Rosso'].append({
            'category': category,
            'position': None,
            'name': locations_spans[0].text,
            'ref': card.get('href'),
            'address': coord[0] if coord else None,
            'coord': [[coord[1], coord[2]] if coord else None],
            'website': website.get('href') if website else None
        })


with open('treTorteGamberoRosso.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)