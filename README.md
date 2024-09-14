# How run the code?

cd vite-project
npm install
npm run dev



# How add new Ranking?

Look how is organized the folder \vite-project\public\ranking, it's a sequence of folders followed by an index.json file.
Each folder will be a Tab inside the "Ranking Tab", each of those folder have sub-rankings that will appear on the legend.

Here there is how each .json must be structured:
{
    "Most Legendary Restaurants 23-24": [
        {
            "ranking": "Taste Atlas",
            "sub-ranking": "Most Legendary Restaurants 23-24",
            "emoji": "🍽️",
            "position": "1°",
            "name": "Figlmüller",
            "ref": "https://www.tasteatlas.com/Figlmuller",
            "address": null,
            "coord": [
                [
                    48.2092948,
                    16.3755253
                ]
            ],
            "website": "http://www.figlmueller.at"
        },
        ...
    ]
}


After you have create for example "Taste Atlas" folder with your sub-ranking files, you have to name the folder using '_' instead of ' '
so it will became 'Taste_Atlas'.

You must name each sub-ranking files with the same name used inside "sub-ranking" using '' instead of ' ' so it will became in this case "MostLegendaryRestaurants23-24.json"

note: don't use in any name (those are dangerous char for naming)
/ (forward slash)
\ (backslash)
: (colon)
* (asterisk)
? (question mark)
" (double quote)
< (less than)
> (greater than)
| (pipe)

pay attenction also to the category to use in the "emoji" section, there is a file containing all the category available here: "vite-project\public\food\helper.json". You can also add New Category, see sections below.


After that you have to create inside the folder \vite-project\public\ranking-icon a pefectly SQUARED image .png (you can use https://squareanimage.com/) 

Now you can run this piece of code to update indexing:
> python script\generate_index.py ..\vite-project\public\ranking

Finally you can the script to update the Foods:
> python .\generate_food.py ..\vite-project\public\ranking ..\vite-project\public\food ..\vite-project\public\food\helper.json



# How to modify a place coordinates/emoji/position/name/website?

Go to the file of the ranking of that place, search for that name and set the value of the correct coordinates.

Finally you can the script to update the Foods:
> python .\generate_food.py ..\vite-project\public\ranking ..\vite-project\public\food ..\vite-project\public\food\helper.json


# How add new Food Categories?
Fist check if there is already a category inside "vite-project\public\food\helper.json"



You have to modify the file "vite-project\public\food\helper.json" adding another category using the same type of formatting,
you have also to add an icon with the path. Here's an example:

"Street Food":{
        "emoji": "🍢",
        "icon":"../food/Street_Food.png"
}

Finally you can the script to update the Foods:
> python .\generate_food.py ..\vite-project\public\ranking ..\vite-project\public\food ..\vite-project\public\food\helper.json
