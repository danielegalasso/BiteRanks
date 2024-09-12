from geopy.geocoders import Nominatim
import requests


# geolocalizzatore personalizzato. Funziona combinando openStreetMap
# e google maps. Per limitare le chiamate all'api di google maps,
# la funzione find_coordinates (prende in input il nome di un posto):
#   1. controlla su openStreetMap che sia presente.
#   2. se non si hanno risultati, si fa una chiamata all'api di maps.

class Geolocator:

    def __init__(self):
        self.__mapkey = self.__read_mapkey()
        self.OPS_geolocator = Nominatim(user_agent='geoapiexercises')
        self.googleMapsURL = 'https://maps.googleapis.com/maps/api/geocode/json'
        self.params = {'address': None, 'key': self.__mapkey}

    def __read_mapkey(self):
        try:
            with open('script/data/mapkey.txt', 'r') as file:
                return file.read().strip()
        except RuntimeError as e:
            print(f'Error reading mapkey: {e}')
            return ''

    def find_coordinates(self, to_geocode, search_address=False):
        location = self.OPS_geolocator.geocode(to_geocode, timeout=None)
        if location:
            print("nominatim")
            return [location.address if search_address else None, location.latitude, location.longitude]
        
        self.params['address'] = to_geocode
        response = requests.get(self.googleMapsURL, params=self.params)
        response.raise_for_status()
        data = response.json()
        if data['results']:
            location = data['results'][0]['geometry']['location']
            latitude = location['lat']
            longitude = location['lng']
            formatted_address = data['results'][0]['formatted_address']
            print("maps")
            return [formatted_address if search_address else None, latitude, longitude]
        
        return None
