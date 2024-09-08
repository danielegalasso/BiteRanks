import requests
from bs4 import BeautifulSoup
import json
from time import sleep


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

category = '🍢'

url = 'https://www.50topitaly.it/it/50-top-italy-2024-ecco-i-10-migliori-street-food-in-italia/'
response = requests.get(url, headers=headers)
response.raise_for_status()

soup = BeautifulSoup(response.text, 'html.parser')
main_div = soup.find('span', class_='contenuto-post testoarticolostile')
references = [p.find('a') for p in main_div.find_all('p') if p and p.get_text(strip=True) and p.find('a')]

json_output = {'50 Top Italy 2024 Migliori Street Food': [] }

position = 1
# skippo il primo link visto che non è un ristorante
for ref in references[1:]:

    response = requests.get(ref.get('href'), headers=headers)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')

    website_wrapper = soup.find('div', class_='col-xs-12 col-xs-offset-0 col-sm-12 col-md-8 padding-top-10 padding-bottom-30 row')
    website = website_wrapper.find('a')

    location_anchor = soup.find('a', class_='nero p-0 m-0')
    location_url = location_anchor.get('href')
    coord = location_url.split('destination=')[1].split(',')
    
    json_output['50 Top Italy 2024 Migliori Street Food'].append({
        'category': category,
        'position': f'{position}°',
        'name': ref.text,
        'ref': ref.get('href'),
        'coord': [float(coord[0]), float(coord[1])],
        'website': website.get('href') if website else None
    })
    
    position += 1
    sleep(1)


with open('50topitalyStreetFood.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)