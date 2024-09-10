import requests
from bs4 import BeautifulSoup
from script.utils.geolocator import Geolocator
from script.utils.scraping import Crawler
import json


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

category = '🍔'

url = 'https://www.burgerbattle.it/vieni-ad-assaggiare/'
crawler = Crawler()
crawler.launch()
crawler.goto_url(url)
crawler.click('button:has-text("Salva le mie preferenze")')
page_source = crawler.get_page_source()

soup = BeautifulSoup(page_source, 'html.parser')
main_div = soup.find('div', id='wpsl-stores')
items = main_div.find_all('li')

json_output = { 'Burger Battle Italia': [] }

locator = Geolocator()
for item in items:
    name = item.find('strong')
    locations = item.find_all('span')
    location = ','.join([l.text for l in locations])
    map_data = locator.find_coordinates(location)

    json_output['Burger Battle Italia'].append({
        'category': category,
        'position': None,
        'name': name.text,
        'ref': url,
        'coord': [ [map_data[1], map_data[2]] if map_data else None ],
        'website': None
    })
    

with open('burgerBattle.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)