from geopy.geocoders import Nominatim
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from time import sleep

# questo oggetto l'ho dovuto creare quando ho fatto i conti
# col fatto che non tutti i siti potrebbero avere riferimenti
# diretti alle coordinate di un posto. L'oggetto prima cerca
# tramite la libreria geopy utilizzando delle parole chiave.
# se la ricerca non da un risultato, si passa alle maniere forti:
# uso selenium. Ma quando si usa selenium la pagina google chiede 
# sempre il consenso dei cookie (si potrebbe evitare(?)), perciò
# va cliccato il pulsante per accettare i cookie. Per non si sa
# quale motivo, ogni volta sto pulsante cambia (una volta è un div,
# una volta è uno span, una volta è un input...). Per ora con input
# funziona bene. Un altro problema è che a un certo punto della ricerca
# in treConiGamberoRosso.py ho notato che la pagina caricava all'infinito.
# Questo si è risolto con settando options.page_load_strategy

class Geolocator:

    def __init__(self):
        self.driver = None
        self.OPS_geolocator = None
        self.selenium_url = 'https://www.google.com/maps/search/?api=1&query='
        self.consent_accepted = False
        self.__setup()

    def __setup(self):
        options = Options()
        # options.add_argument('--headless')
        options.page_load_strategy = 'eager'
        options.set_preference('general.useragent.override', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3')
        self.driver = webdriver.Firefox(options=options)
        
        self.driver.get('https://www.example.com')
        
        self.OPS_geolocator = Nominatim(user_agent="geoapiexercises")

    def find_coordinates(self, param):
        location = self.OPS_geolocator.geocode(param)
        if location:
            return [location.latitude, location.longitude]
        
        # print(f"Geocode con Nominatim fallito, utilizzo Selenium per cercare: {param}")
        
        self.driver.get(self.selenium_url + param)
        self.driver.implicitly_wait(20)
        if not self.consent_accepted:
            self.driver.find_element(By.XPATH, '//input[@value=\'Accetta tutto\']').click()
            self.consent_accepted = True

        locations = self.driver.find_elements(By.CLASS_NAME, 'hfpxzc')
        if locations:
            locations[0].click()
            sleep(4)
        
        current_url = self.driver.current_url
        if '@' not in current_url:
            return None
        
        coords = current_url.split('@')[1].split(',')[:2]
        lat, lng = coords[0], coords[1]
        return [float(lat), float(lng)]

    def quit_selenium(self):
        if self.driver:
            self.driver.quit()

