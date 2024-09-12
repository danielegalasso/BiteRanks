import os
import json
import sys

def generate_index_json(folder_path):
    # Verifica se il percorso fornito è una cartella valida
    if not os.path.isdir(folder_path):
        print(f"Errore: {folder_path} non è una cartella valida.")
        return

    # Ottieni tutti i file nella cartella
    file_list = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]

    # Crea il percorso completo per il file index.json
    index_file_path = os.path.join(folder_path, "index.json")

    # Scrivi la lista dei file nel file index.json
    try:
        with open(index_file_path, 'w') as index_file:
            json.dump(file_list, index_file, indent=4)
        print(f"File index.json creato con successo in {folder_path}")
    except Exception as e:
        print(f"Errore durante la creazione del file index.json: {e}")

if __name__ == "__main__":
    # Verifica che l'utente abbia fornito un percorso della cartella come argomento
    if len(sys.argv) < 2:
        print("Utilizzo: python generate_index.py <path_della_cartella>")
    else:
        folder_path = sys.argv[1]
        generate_index_json(folder_path)


'''
How to use the script:

> python .\generate_index.py C:\Users\daniele\Documents\GitHub\BiteRank\vite-project\public\ranking\steakHouses

Output: File index.json creato con successo in C:\Users\daniele\Documents\GitHub\BiteRank\vite-project\public\ranking\steakHouses

'''