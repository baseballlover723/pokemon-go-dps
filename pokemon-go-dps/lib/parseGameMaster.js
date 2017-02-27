var POGOProtos = require('node-pogo-protos');
var fs = require("fs");

// TODO make this more async
// TODO delete database
var promise = new Promise(function (fulfill, reject) {
  console.log("here");
  fs.readFile('./data/00000156B50BE126_GAME_MASTER', function read(err, data) {
// fs.readFile('./json/2_GAME_MASTER', function read(err, data) {
    if (err) {
      throw err;
    }
    var encoded = data;

    var decodedAgain = POGOProtos.Networking.Responses.DownloadItemTemplatesResponse.decode(encoded);
    var pokemon = [];
    var moves = {};
//console.log(decodedAgain.item_templates);
    for (var item of decodedAgain.item_templates) {
      deleteNull(item);
      if (item.pokemon_settings) {
        deleteNull(item);
        trimPokemon(item.pokemon_settings);
        pokemon.push(item.pokemon_settings);
      } else if (item.move_settings) {
        deleteNull(item);
        trimMove(item.move_settings);
        moves[parseInt(item.move_settings.movement_id)] = item.move_settings;
        // delete item.move_settings.movement_id;
      }
    }
    console.log("number of pokemon read from game master: " + pokemon.length);
    console.log(pokemon[0]);
    console.log(moves[13]);
    fs.writeFile('./data/master.json', JSON.stringify(decodedAgain), {}, function () {
      console.log("done writing master");
    });
    fs.writeFile('./data/masterPokemon.json', JSON.stringify(pokemon), {}, function () {
      console.log("done writing pokemon");
      fulfill();
    });
    fs.writeFile('./data/masterMoves.json', JSON.stringify(moves), {}, function () {
      console.log("done writing moves");
    });

    // Invoke the next step here however you like

  });

});

function deleteNull(test) {
  for (var i in test) {
    if (test[i] === null || test[i] === undefined) {
      // test[i] === undefined is probably not very useful here
      delete test[i];
    }
  }
}

function trimPokemon(p) {
  delete p.model_scale;
  delete p.camera;
  delete p.encounter;
  delete p.animation_time;
  delete p.evolution_ids;
  delete p.evolution_pips;
  delete p.rarity;
  delete p.pokedex_height_m;
  delete p.pokedex_weight_kg;
  delete p.parent_pokemon_id;
  delete p.height_std_dev;
  delete p.weight_std_dev;
  delete p.km_distance_to_hatch;
  delete p.family_id;
  delete p.candy_to_evolve;
  delete p.km_buddy_distance;
  delete p.buddy_size;
}

function trimMove(m) {
  delete m.animation_id;
  delete m.trainer_level_max;
  delete m.trainer_level_min;
}
module.exports = promise;
