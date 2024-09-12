import requests
from bs4 import BeautifulSoup
from script.utils.geolocator import Geolocator
import json


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

category = '🍣'

url = 'https://www.gamberorosso.it/ristoranti/#1628168924279-a32c338c-f55a'
response = requests.get(url, headers=headers)
response.raise_for_status()

soup = BeautifulSoup(response.text, 'html.parser')
main_div = soup.find('div', id='1628168924279-a32c338c-f55a')

references = [a.get('href') for a in main_div.find_all('a', class_='_self cvplbd')]

json_output = { 'Tre Bacchette Gambero Rosso 2024': [] }

locator = Geolocator()
for ref in references:
    print(ref)

    response = requests.get(ref, headers=headers)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    name = soup.find('span', id='span-946-365586')
    location = soup.find('span', id='span-2718-420208')
    website = soup.find('a', id='link-1214-365586')

    map_data = locator.find_coordinates(','.join([name.text + ' sushi', location.text, 'Italia']))
    print(map_data)

    json_output['Tre Bacchette Gambero Rosso 2024'].append({
        'category': category,
        'position': None,
        'name': name.text,
        'ref': ref,
        'coord': [ [map_data[1], map_data[2]] if map_data else None ],
        'website': website.get('href') if website else None
    })


with open('treBacchetteGamberoRosso.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)