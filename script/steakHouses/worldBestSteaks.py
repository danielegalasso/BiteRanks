import requests
from bs4 import BeautifulSoup
import json
from time import sleep
from script.utils.geolocator import Geolocator

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

category = '🥩'

url = 'https://www.worldbeststeaks.com/the-list-1-101'
response = requests.get(url, headers=headers)
response.raise_for_status()

soup = BeautifulSoup(response.text, 'html.parser')
cards = soup.find_all('div', class_='comp-lvv7926w YzqVVZ wixui-repeater__item')

json_output = { 'World\'s 101 Best Steak Restaurants 2024': [] }
locator = Geolocator()
position = 1
for card in cards:
    print(card.find('a').get('href'))
    response = requests.get(card.find('a').get('href'), headers=headers)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    name = soup.find('h1')
    location = ','.join([
        soup.find('div', id='comp-lvwgu0lx').text,
        soup.find('div', id='comp-lvz7gr7u').text,
        soup.find('div', id='comp-lvz7gv5i').text
    ])
    website = soup.find('a', class_='uDW_Qe wixui-button PlZyDq')

    map_data = locator.find_coordinates(location)
    json_output['World\'s 101 Best Steak Restaurants 2024'].append({
        'category': category,
        'position': f'{position}°',
        'name': name.text.title(),
        'ref': 'https://www.worldbeststeaks.com',
        'coord': [[map_data[1], map_data[2]]],
        'website': website.get('href') if website else None
    })
    position += 1
    sleep(10)


with open('../vite-project/public/ranking/steakHouses/world101BestSteakRestaurants.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)