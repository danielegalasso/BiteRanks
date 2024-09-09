from script.utils.scraping import Crawler
from time import sleep
from bs4 import BeautifulSoup
from script.utils.geolocator import Geolocator
import json
import re
import requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

category = '🍽️'

places = [
    'Piemonte',
    'Liguria',
    'Lombardia',
    'Trentino - Alto Adige',
    'Veneto',
    'Emilia Romagna',
    'Toscana',
    'Marche',
    'Lazio',
    'Abruzzo',
    'Campania',
    'Puglia',
    'Calabria',
    'Sicilia',
    'Lussemburgo',
    'Monaco',
    'Slovenia',
    'Svizzera'
]

crawler = Crawler()
crawler.launch()

crawler.goto_url('https://lesoste.it/ristoranti')

for p in places:
    crawler.click(f'a:has-text("{p}")')
    sleep(10) # per non rompere i server

page_source = crawler.get_page_source()
crawler.close()

soup = BeautifulSoup(page_source, 'html.parser')
names = soup.find_all('h4', class_='et_pb_module_header')

script_tags = soup.find_all('script')
json_urls = '[]'
for s in script_tags:
    content = s.string
    if content and content.strip().startswith('var et_link_options_data'):
        match = re.search(r'var et_link_options_data = (\[.*?\]);', content)
        if match:
            json_urls = match.group(1)


data = json.loads(json_urls)
urls = [item['url'] for item in data if 'url' in item]

json_output = { 'Le Soste': [] }
locator = Geolocator()
for name, url in zip(names, urls):
    print(url)
    response = requests.get(url, headers=headers)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')

    location_div = soup.find('div', class_='et_pb_row et_pb_row_2 et_pb_equal_columns et_pb_gutters1')
    location = location_div.find('span')

    script_tags = soup.find_all('script')
    website = '[]'
    for s in script_tags:
        content = s.string
        if content and content.strip().startswith('var et_link_options_data'):
            match = re.search(r'var et_link_options_data = (\[.*?\]);', content)
            if match:
                website = match.group(1)
    data = json.loads(website)
    website = [item['url'] for item in data if 'url' in item]

    map_data = locator.find_coordinates(location.text)

    json_output['Le Soste'].append({
        'category': category,
        'position': None,
        'name': name.text,
        'ref': url,
        'coord': [ [map_data[1], map_data[2]] if map_data else None ],
        'website': website[0] if website else None
    })
    sleep(10) # per non rompere i server


with open('leSoste.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)
