var POGOProtos = require('node-pogo-protos');
var fs = require("fs");
var sequelize = require('./database.js');
// var pg = require('pg');
//
// // create a config to configure both pooling behavior
// // and client options
// // note: all config is optional and the environment variables
// // will be read if the config is not present
// var config = {
//     host: 'localhost', // Server hosting the postgres database
//     port: 5432, //env var: PGPORT
//     max: 10, // max number of clients in the pool
//     idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
// };
//
//
// //this initializes a connection pool
// //it will keep idle connections open for a 30 seconds
// //and set a limit of maximum 10 idle clients
// var pool = new pg.Pool(config);
//
// // to run a query we can acquire a client from the pool,
// // run a query on the client, and then return the client to the pool
// pool.connect(function(err, client, done) {
//     if(err) {
//         return console.error('error fetching client from pool', err);
//     }
//     client.query('SELECT $1::int AS number', ['1'], function(err, result) {
//         //call `done(err)` to release the client back to the pool (or destroy it if there is an error)
//         done(err);
//
//         if(err) {
//             return console.error('error running query', err);
//         }
//         console.log(result.rows[0].number);
//         //output: 1
//     });
// });
//
// pool.on('error', function (err, client) {
//     // if an error is encountered by a client while it sits idle in the pool
//     // the pool itself will emit an error event with both the error and
//     // the client which emitted the original error
//     // this is a rare occurrence but can happen if there is a network partition
//     // between your application and the database, the database restarts, etc.
//     // and so you might want to handle it and at least log it out
//     console.error('idle client error', err.message, err.stack)
// });




fs.readFile('./json/00000156B50BE126_GAME_MASTER', function read(err, data) {
    if (err) {
        throw err;
    }
    var encoded = data;

    var decodedAgain = POGOProtos.Networking.Responses.DownloadItemTemplatesResponse.decode(encoded);
    var pokemon = [];
    var moves = {};
//console.log(decodedAgain.item_templates);
    for (var item of decodedAgain.item_templates) {
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
    fs.writeFile('./json/masterPokemon.json', JSON.stringify(pokemon), {}, function() {
        console.log("done writing pokemon");
    });
    fs.writeFile('./json/masterMoves.json', JSON.stringify(moves), {}, function() {
        console.log("done writing moves");
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
