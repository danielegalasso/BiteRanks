import os
import json

def estrai_cibi(input_path, output_path, classifiche_file):
    # Carica il file delle classifiche da estrarre
    with open(classifiche_file, 'r', encoding='utf-8') as f:
        classifiche_data = json.load(f)

    # Ottieni tutte le sottocartelle (classifiche) dall'index.json nel percorso di input
    with open(os.path.join(input_path, 'index.json'), 'r', encoding='utf-8') as f:
        classifiche = json.load(f)

    # Crea un dizionario per le categorie
    categorie = {k: [] for k in classifiche_data.keys()}

    # Itera su ciascuna cartella (classifica)
    for classifica in classifiche:
        classifica_path = os.path.join(input_path, classifica)
        with open(os.path.join(classifica_path, 'index.json'), 'r', encoding='utf-8') as f:
            sub_classifiche = json.load(f)

        # Itera su ciascuna sub-classifica
        for sub_classifica_file in sub_classifiche:
            sub_classifica_path = os.path.join(classifica_path, sub_classifica_file)
            with open(sub_classifica_path, 'r', encoding='utf-8') as f:
                sub_classifica_data = json.load(f)

            # Estrarre il nome della sub-classifica
            sub_classifica_name = list(sub_classifica_data.keys())[0]

            # Itera su ciascun locale nella sub-classifica
            for locale in sub_classifica_data[sub_classifica_name]:
                category = locale.get("emoji")
                # Trova la categoria corrispondente nel file classifiche da estrarre
                for nome_categoria, info_categoria in classifiche_data.items():
                    if category == info_categoria["emoji"]:
                        item = {
                            "ranking": locale.get("ranking"),
                            "sub-ranking": locale.get("sub-ranking"),
                            "emoji": category,
                            "position": locale.get("position"),
                            "name": locale.get("name"),
                            "ref": locale.get("ref"),
                            "address": locale.get("address"),
                            "coord": locale.get("coord"),
                            "website": locale.get("website")
                        }
                        categorie[nome_categoria].append(item)

    # Salva ogni categoria nel percorso di output
    os.makedirs(output_path, exist_ok=True)
    categorie_files = []
    for categoria, items in categorie.items():
        output_file_path = os.path.join(output_path, f"{categoria}.json")
        categorie_files.append(f"{categoria}.json")
        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump({categoria: items}, f, ensure_ascii=False, indent=4)

    # Crea l'indice.json in formato lista
    with open(os.path.join(output_path, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(categorie_files, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    # Esempio di utilizzo: passare i parametri da linea di comando
    import sys
    if len(sys.argv) != 4:
        print("Utilizzo: python script.py <input_path> <output_path> <classifiche_file>")
    else:
        estrai_cibi(sys.argv[1], sys.argv[2], sys.argv[3])

# How to use it:
# python script.py "path_da_cui_estrarre_cibi" "path_dove_salvare_file" "file_helper.json"
# python .\generate_food.py ..\vite-project\public\ranking ..\vite-project\public\food ..\vite-project\public\food\helper.json