import requests
from bs4 import BeautifulSoup
import json
from time import sleep
from script.utils.geolocator import Geolocator
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

category = '🍢'

url = 'https://www.gamberorosso.it/street-food/'
response = requests.get(url, headers=headers)
response.raise_for_status()

soup = BeautifulSoup(response.text, 'html.parser')
main_div = soup.find('div', id='_dynamic_list-209-309669')
cards = main_div.find_all('div', id=re.compile('^div_block-210-309669'))
print(len(cards))

json_output = { 'I Migliori Street Food Gambero Rosso 2024': [] }
locator = Geolocator()

for card in cards:
    name = card.find('span', id=re.compile('^span-221-309669'))
    ref = card.find('a')
    print(ref.get('href'))
    location = ','.join([
        card.find('span', id=re.compile('^span-506-309669')).text,
        card.find('span', id=re.compile('^span-504-309669')).text
    ])

    response = requests.get(ref.get('href'), headers=headers)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    website = soup.find('a', id='link-1214-365586')
    map_data = locator.find_coordinates(f'{name.text}, {location}')
    json_output['I Migliori Street Food Gambero Rosso 2024'].append({
        'category': category,
        'position': None,
        'name': name.text,
        'ref': ref.get('href'),
        'coord': [[map_data[1], map_data[2]]],
        'website': website.get('href') if website else None
    })
    sleep(1)

with open('../vite-project/public/ranking/gamberoRosso/iMiglioriStreetFoodGamberoRosso.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)
