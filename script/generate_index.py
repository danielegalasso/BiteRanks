import os
import json
import sys

def generate_index_json(folder_path):
    # Verifica se il percorso fornito è una cartella valida
    if not os.path.isdir(folder_path):
        print(f"Errore: {folder_path} non è una cartella valida.")
        return

    # Ottieni tutte le sub-cartelle nella cartella principale
    subfolders = [f for f in os.listdir(folder_path) if os.path.isdir(os.path.join(folder_path, f))]
    
    # Crea il percorso completo per il file index.json nella cartella principale
    main_index_file_path = os.path.join(folder_path, "index.json")

    # Scrivi la lista delle sub-cartelle nel file index.json principale
    try:
        with open(main_index_file_path, 'w') as main_index_file:
            json.dump(subfolders, main_index_file, indent=4)
        print(f"File index.json creato con successo in {folder_path}")
    except Exception as e:
        print(f"Errore durante la creazione del file index.json: {e}")

    # Per ogni sub-cartella, crea un file index.json che contiene i file .json
    for subfolder in subfolders:
        subfolder_path = os.path.join(folder_path, subfolder)
        json_files = [f for f in os.listdir(subfolder_path) if f.endswith('.json') and f != "index.json"]

        # Crea il percorso completo per il file index.json nella sub-cartella
        subfolder_index_file_path = os.path.join(subfolder_path, "index.json")

        # Scrivi la lista dei file .json nella sub-cartella
        try:
            with open(subfolder_index_file_path, 'w') as subfolder_index_file:
                json.dump(json_files, subfolder_index_file, indent=4)
            print(f"File index.json creato con successo in {subfolder_path}")
        except Exception as e:
            print(f"Errore durante la creazione del file index.json in {subfolder_path}: {e}")

if __name__ == "__main__":
    # Verifica che l'utente abbia fornito un percorso della cartella come argomento
    if len(sys.argv) < 2:
        print("Utilizzo: python generate_index.py <path_della_cartella>")
    else:
        folder_path = sys.argv[1]
        generate_index_json(folder_path)


# what it does:
# I run my script by passing a folder as a parameter. That folder contains several subfolders. 
# Inside this main folder, I would like the script to create an index.json file that contains
# a list of all the subfolders. Each subfolder contains some .json files, and for each of these, 
# I would like the script to create an index.json file that contains a list of all the .json files

# how to use it:
# python .\generate_index.py ..\vite-project\public\ranking