import os
import json

def update_rankings(base_path):
    # Leggere il file index.json nella cartella principale
    with open(os.path.join(base_path, 'index.json'), 'r', encoding='utf-8') as f:
        rankings = json.load(f)

    # Loop attraverso ogni classifica (sottocartella)
    for ranking in rankings:
        ranking_path = os.path.join(base_path, ranking)
        
        # Leggere il file index.json nella sottocartella della classifica
        with open(os.path.join(ranking_path, 'index.json'), 'r', encoding='utf-8') as f:
            sub_rankings = json.load(f)
        
        # Loop attraverso ogni file di sub-classifica
        for sub_ranking_file in sub_rankings:
            sub_ranking_path = os.path.join(ranking_path, sub_ranking_file)
            
            # Leggere il contenuto del file sub-classifica
            with open(sub_ranking_path, 'r', encoding='utf-8') as f:
                sub_ranking_data = json.load(f)
            
            # Estrarre il nome della sub-classifica dal file
            sub_ranking_name = list(sub_ranking_data.keys())[0]
            items = sub_ranking_data[sub_ranking_name]

            # Modificare ogni voce del locale come richiesto
            updated_items = []
            for item in items:
                updated_item = {
                    "ranking": ranking.replace("_", " "),
                    "sub-ranking": sub_ranking_name,
                    "emoji": item.get("category"),
                    "position": item.get("position"),
                    "name": item.get("name"),
                    "ref": item.get("ref"),
                    "address": item.get("address"),
                    "coord": item.get("coord"),
                    "website": item.get("website"),
                }
                updated_items.append(updated_item)
            
            # Creare il nuovo contenuto del file sub-classifica
            updated_sub_ranking_data = {sub_ranking_name: updated_items}

            # Salvare le modifiche nel file sub-classifica
            with open(sub_ranking_path, 'w', encoding='utf-8') as f:
                json.dump(updated_sub_ranking_data, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    # Percorso di base fornito come input dall'utente
    base_path = input("Inserisci il path da cui estrarre le classifiche: ")
    update_rankings(base_path)
