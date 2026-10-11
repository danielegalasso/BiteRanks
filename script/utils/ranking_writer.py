# Costruzione e salvataggio delle classifiche nel formato letto dal sito (json v1.2):
# { "<sub-ranking>": [ {ranking, sub-ranking, emoji, position, name, ref, address, coord, website}, ... ] }

import json


def make_entry(ranking, sub_ranking, emoji, name, ref, position=None, website=None, geo=None):
    """geo: risultato di PlaceGeocoder.geocode (o None se il locale non è stato trovato)."""
    return {
        'ranking': ranking,
        'sub-ranking': sub_ranking,
        'emoji': emoji,
        'position': f'{position}°' if isinstance(position, int) else position,
        'name': name,
        'ref': ref,
        'address': [geo['address']] if geo and geo.get('address') else [],
        'coord': [[round(geo['lat'], 7), round(geo['lon'], 7)]] if geo else [],
        'website': website,
    }


def save_ranking(sub_ranking, entries, path=None, precision=None):
    """Salva il file (nome = sub-ranking senza spazi) e stampa un riepilogo della qualità delle coordinate.
    precision: lista parallela a entries con la precisione di ogni coordinata (address|name|city|None)."""
    path = path or f'{sub_ranking.replace(" ", "")}.json'
    with open(path, 'w', encoding='utf-8') as file:
        json.dump({sub_ranking: entries}, file, ensure_ascii=False, indent=4)
    summary = ''
    if precision is not None:
        counts = {p: precision.count(p) for p in ('address', 'known', 'name', 'google', 'city', None)}
        summary = (f" | indirizzo {counts['address']}, già in altre classifiche {counts['known']}, nome {counts['name']}, "
                   f"Google {counts['google']}, solo città {counts['city']}, non trovati {counts[None]}")
    print(f'{path}: {len(entries)} voci{summary}')
    return path
