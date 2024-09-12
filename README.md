# How run the code?

cd vite-project
npm install
npm run dev



# How add new Ranking?

Look how is organized the folder \vite-project\public\ranking, it's a sequence of folders followed by an index.json file.
Each folder will be a Tab inside the "Ranking Tab", each of those folder have sub-rankings that will appear on the legend.

Here there is how each .json must be structured:
{
    "50 Top Italy Migliori Panini 2024": [
        {
            "category": "🍽️",
            "position": "1°",
            "name": "Da Gigione Gourmand",
            "ref": "https://www.50topitaly.it/it/referenza/da-gigione-gourmand-3/",
            "address": [
                "Via Roma, 307, 80038 Pomigliano d'Arco NA"
            ],
            "coord": [
                [
                    40.91218,
                    14.3912404
                ]
            ],
            "website": null
        },
        ...
    ]
}


After you have create "Your New Ranking" folder with your sub-folders, you have to name the folder using '_' instead of ' '
so it will became 'Your_New_Ranking'.

After that you have to create inside the folder \vite-project\public\ranking-icon a pefectly SQUARED image .png (you can use https://squareanimage.com/) 

Finally you can run this piece of code to update everything:
python script\generate_index.py ..\vite-project\public\ranking


