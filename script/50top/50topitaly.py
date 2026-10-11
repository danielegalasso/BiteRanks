# updated script to new json v1.2
# Uso: dalla cartella in cui salvare i file, python path/to/50topitaly.py

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from top50_common import scrape


# ultima edizione disponibile di ogni classifica (le serie non più pubblicate restano all'ultima edizione)
urls = [
    'https://www.50topitaly.it/it/i-migliori-ristoranti-italiani-2026-trattorie-e-bistro-moderni/',
    'https://www.50topitaly.it/it/i-migliori-ristoranti-italiani-2026-grandi-ristoranti/',
    'https://www.50topitaly.it/it/i-migliori-ristoranti-italiani-2026-luxury/',
    'https://www.50topitaly.it/it/i-migliori-ristoranti-italiani-nel-mondo-2026/',
    'https://www.50topitaly.it/it/i-migliori-bistro-vegetali-2026-damico-award/',
    'https://www.50topitaly.it/it/i-migliori-ristoranti-sotto-i-100e-2026-il-fritturista-oleificio-zucchi-award/',
    'https://www.50topitaly.it/it/i-migliori-ristoranti-di-pesce-2025-latteria-sorrentina-award/',
    'https://www.50topitaly.it/it/i-migliori-panini-2025-mulino-caputo-award/',
    'https://www.50topitaly.it/it/i-migliori-street-food-2025-il-fritturista-oleificio-zucchi-award/',
    'https://www.50topitaly.it/it/le-migliori-amatriciane-2025-ferrarelle-award/',
]


def emoji_for_url(url):
    if 'vegetali' in url:
        return '🌱'
    if 'panini' in url:
        return '🍔'
    if 'street-food' in url:
        return '🍢'
    if 'amatriciane' in url:
        return '🍝'
    if 'sushi' in url:
        return '🍣'
    return '🍽️'


if __name__ == '__main__':
    scrape(urls, '50 Top Italy', 'https://www.50topitaly.it/it/referenza/', emoji_for_url)
