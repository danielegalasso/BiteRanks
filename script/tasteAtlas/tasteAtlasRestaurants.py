import requests
from bs4 import BeautifulSoup
from script.utils.geolocator import Geolocator
import json
from script.utils.scraping import Crawler


url = 'https://www.tasteatlas.com/'
cookie_accepted = False

crawler = Crawler()
crawler.launch()
crawler.goto_url(url + 'best/restaurants')

crawler.click_all('button', name='Show All')

page_source = crawler.get_page_source()
soup = BeautifulSoup(page_source, 'html.parser')

main_div = soup.find_all('div', class_='js-list-holder')
cards = main_div[0].find_all('div', class_='box-holder aligned-bottom top-row-no-margin')

category = '🍽️'
json_output = { 'Most Legendary Restaurants 23/24': [] }

locator = Geolocator()
for card in cards:

    position = card.find('div', class_='order')
    ref = card.find('a')

    crawler.goto_url(url + ref.get('href'))
    if not cookie_accepted:
        crawler.click('button:has-text("Agree and close")')
        cookie_accepted = True
    page_source = crawler.get_page_source()
    soup = BeautifulSoup(page_source, 'html.parser')

    name = soup.find('h1', class_='h1 h1--center ng-binding')
    location_div = soup.find('div', class_='card__text')
    location = location_div.find('span')

    map_data = locator.find_coordinates(location.text)

    links = soup.find('div', class_='card__links')
    website = links.find('a', href=True)

    json_output['Most Legendary Restaurants 23/24'].append({
        'category': category,
        'position': f'{position.text}°',
        'name': name.text,
        'ref': url + ref.get('href'),
        'coord': [ [map_data[1], map_data[2]] if map_data else None ],
        'website': website.get('href') if website else None
    })


with open('mostLegendaryRestaurants.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)

# --------------------------------------------------------------------------------

category = '🍰'

cards = main_div[1].find_all('div', 'div', class_='box-holder aligned-bottom top-row-no-margin')

json_output = { 'Most Legendary Dessert Places 23/24': [] }

for card in cards:

    position = card.find('div', class_='order')
    ref = card.find('a')

    crawler.goto_url(url + ref.get('href'))
    page_source = crawler.get_page_source()
    soup = BeautifulSoup(page_source, 'html.parser')

    name = soup.find('h1', class_='h1 h1--center ng-binding')
    location_div = soup.find('div', class_='card__text')
    location = location_div.find('span')

    map_data = locator.find_coordinates(location.text)

    links = soup.find('div', class_='card__links')
    website = links.find('a', href=True)

    json_output['Most Legendary Dessert Places 23/24'].append({
        'category': category,
        'position': f'{position.text}°',
        'name': name.text,
        'ref': url + ref.get('href'),
        'coord': [ [map_data[1], map_data[2]] if map_data else None ],
        'website': website.get('href') if website else None
    })


with open('mostLegendaryDessertPlaces.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)

# --------------------------------------------------------------------------------

category = '🍦'

cards = main_div[2].find_all('div', 'div', class_='box-holder aligned-bottom top-row-no-margin')

json_output = { 'Most Legendary Ice Cream Places 23/24': [] }

for card in cards:

    position = card.find('div', class_='order')
    ref = card.find('a')

    crawler.goto_url(url + ref.get('href'))
    page_source = crawler.get_page_source()
    soup = BeautifulSoup(page_source, 'html.parser')

    name = soup.find('h1', class_='h1 h1--center ng-binding')
    location_div = soup.find('div', class_='card__text')
    location = location_div.find('span')

    map_data = locator.find_coordinates(location.text)

    links = soup.find('div', class_='card__links')
    website = links.find('a', href=True)

    json_output['Most Legendary Ice Cream Places 23/24'].append({
        'category': category,
        'position': f'{position.text}°',
        'name': name.text,
        'ref': url + ref.get('href'),
        'coord': [ [map_data[1], map_data[2]] if map_data else None ],
        'website': website.get('href') if website else None
    })


with open('mostLegendaryIceCreamPlaces.json', 'w', encoding='utf-8') as file:
    json.dump(json_output, file, ensure_ascii=False, indent=4)


crawler.close()