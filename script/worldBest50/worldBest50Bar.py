import requests
from bs4 import BeautifulSoup
from script.utils.geolocator import Geolocator
import json


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

category = '🍹'

url = 'https://www.theworlds50best.com'
response = requests.get(url + '/bars/list/1-50', headers=headers)
response.raise_for_status()

soup = BeautifulSoup(response.text, 'html.parser')

main_div = soup.find('div', class_='row list visible-list')
cards = [a.get('href') for a in main_div.find_all('a', class_='item')]

json_output = { 'The World\'s 50 Best Bars': [] }

# per semplicità uso un counter visto che non ci sono parimeriti
position = 1

locator = Geolocator()
for ref in cards:
    print(ref)

    response = requests.get(url + ref, headers=headers)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')

    name = soup.find('h1')
    location = soup.find('p', class_='location')
    website = soup.find('a', class_='website restaurant-bar-link')

    map_data = locator.find_coordinates(location.text)

    json_output['The World\'s 50 Best Bars'].append({
        'category': category,
        'position': position,
        'name': name.text,
        'ref': url + ref,
        'coord': [ [map_data[1], map_data[2]] if map_data else None ],
        'website': website.get('href') if website else None
    })

    position += 1


with open('worldBest50Bar.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)