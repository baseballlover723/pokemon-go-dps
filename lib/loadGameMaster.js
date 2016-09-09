var POGOProtos = require('node-pogo-protos');
var fs = require("fs");
fs.readFile('./json/00000156B50BE126_GAME_MASTER', function read(err, data) {
    if (err) {
        throw err;
    }
    var encoded = data;

    var decodedAgain = POGOProtos.Networking.Responses.DownloadItemTemplatesResponse.decode(encoded);
    var pokemon = [];
//console.log(decodedAgain.item_templates);
    for (var item of decodedAgain.item_templates) {
        if (item.pokemon_settings) {
            deleteNull(item);
            pokemon.push(item);
        }
    }

    console.log("number of pokemon read from game master: " + pokemon.length);
    console.log(pokemon[0]);
    fs.writeFile('./json/masterPokemon.json', JSON.stringify(pokemon), {}, function () {
        console.log("done writing");
    });

    // Invoke the next step here however you like

});

function deleteNull(test) {
    for (var i in test) {
        if (test[i] === null || test[i] === undefined) {
            // test[i] === undefined is probably not very useful here
            delete test[i];
        }
    }
}
