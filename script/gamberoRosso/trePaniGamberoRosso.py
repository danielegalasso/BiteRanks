import requests
from bs4 import BeautifulSoup
from script.utils.geolocator import Geolocator
import json


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

category = '🥖'

url = 'https://www.gamberorosso.it/pane/'
response = requests.get(url, headers=headers)
response.raise_for_status()

soup = BeautifulSoup(response.text, 'html.parser')

main_div = soup.find('div', id='_dynamic_list-209-309669')
card_divs = main_div.find_all('div', {'data-id': 'div_block-210-309669'})
print(len(card_divs))

json_output = { 'Tre Pani Gambero Rosso 2024': [] }

locator = Geolocator()
for card in card_divs:
    a = card.find('a', {'data-id': 'link-217-309669'})
    spans = card.find_all('span', class_='ct-span')
    print(a.get('href'))

    response = requests.get(a.get('href'), headers=headers)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')
    
    website = soup.find('a', id='link-1214-365586')

    map_data = locator.find_coordinates(','.join([s.text for s in spans]))

    json_output['Tre Pani Gambero Rosso 2024'].append({
        'category': category,
        'position': None,
        'name': spans[-1].text,
        'ref': a.get('href'),
        'coord': [ [map_data[1], map_data[2]] if map_data else None ],
        'website': website.get('href') if website else None
    })


with open('trePaniGamberoRosso.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)