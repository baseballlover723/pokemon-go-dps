var POGOProtos = require('node-pogo-protos');
var fs = require("fs");
var async = require('async');
var models = require("../models");
var sequelize = models.sequelize;
var Type = models.Type;
var FastMove = models.FastMove;
var ChargeMove = models.ChargeMove;
var Pokemon = models.Pokemon;
var GameMaster = models.GameMaster;

// DONE with database population
String.prototype.capitalize = function () {
  return this.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

String.prototype.replaceAll = function (search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

var promise = new Promise(function (fulfill, reject) {
  try {
    deleteAll().then(function () {
      console.log("after delete");
      // populateTypes().then(function () {
      // Type.findAll({include: [{all: true}]}).then(function (types) {
      // Type.findAll({attributes: ['name'], include: [{model: Type, as: 'weaknesses', attributes: ['name']},{model: Type, as: 'strengths', attributes: ['name']}]}).then(function (types) {
      console.log("after populate");
      parseGameMaster().then(function () {
        fulfill()
      }, function (e) {
        reject(e);
      });
      // });
    });
  } catch (e) {
    reject(e);
  }

});

function parseGameMaster() {
  return new Promise(function (fulfill, reject) {
    try {
      fs.readFile('./data/00000156B50BE126_GAME_MASTER', function read(err, data) {
// fs.readFile('./json/2_GAME_MASTER', function read(err, data) {
        if (err) {
          reject(err);
        }
        var encoded = data;
        var decodedAgain = POGOProtos.Networking.Responses.DownloadItemTemplatesResponse.decode(encoded);
        var pokemon = [];
        var moves = {};
        var types = [];
//console.log(decodedAgain.item_templates);
        for (var item of decodedAgain.item_templates) {
          deleteNull(item);
          if (item.pokemon_settings) {
            deleteNull(item);
            trimPokemon(item.pokemon_settings);
            item.pokemon_settings.name = item.template_id.split("_POKEMON_")[1].replaceAll("_", " ").capitalize();
            pokemon.push(item.pokemon_settings);
          } else if (item.move_settings) {
            deleteNull(item);
            trimMove(item.move_settings);
            moves[parseInt(item.move_settings.movement_id)] = item.move_settings;
            // delete item.move_settings.movement_id;
          } else if (item.type_effective) {
            deleteNull(item);
            item.type_effective.name = item.template_id.replace("POKEMON_TYPE_", "").capitalize();
            types.push(item.type_effective);
          }
        }
        // fs.writeFile('./data/master.json', JSON.stringify(decodedAgain), {}, function () {
        //   console.log("done writing master");
        // });
        // fs.writeFile('./data/masterPokemon.json', JSON.stringify(pokemon), {}, function () {
        //   console.log("done writing pokemon");
        //   fulfill();
        // });
        // fs.writeFile('./data/masterMoves.json', JSON.stringify(moves), {}, function () {
        //   console.log("done writing moves");
        // });
        addGameMasterToDatabase(decodedAgain).then(function () {
          console.log("finsihed adding GameMaster to databases");
          addTypesToDatabase(types).then(function () {
            console.log("finished adding types to database");
            addMovesToDatabase(moves).then(function () {
              console.log("finished adding moves to database");
              addPokemonToDatabase(pokemon).then(function () {
                console.log("finished adding pokemons to database");
                fulfill();
              });
            });
          });
        });
      });
    } catch (e) {
      reject(e);
    }
  });
}

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

function addGameMasterToDatabase(json) {
  return new Promise(function (fulfill, reject) {
    console.log("started adding GameMaster to database");
    try {
      GameMaster.create({json: json}).then(function () {
        fulfill();
      });
    } catch (e) {
      reject(e);
    }
  });
}

function addTypesToDatabase(types) {
  return new Promise(function (fulfill, reject) {
    console.log("started adding types to database");
    try {
      var typeHashes = [];
      for (var type in types) {
        type = types[type];
        typeHashes.push({name: type.name, id: type.attack_type})
      }
      typeHashes.push({name: 'None', id: -1}); // can't create with id: 0 for some dumb reason
      Type.bulkCreate(typeHashes).then(function () {
        return Type.findAll({order: [['id', 'ASC']]});
      }).then(function (dbTypes) {
        // super effectiveness
        async.forEach(types, function (type, cb) {
          var dbType = dbTypes[type.attack_type];
          var weaknesses = [];
          var strengths = [];
          for (var index in type.attack_scalar) {
            index = parseInt(index);
            var effectiveness = type.attack_scalar[index];
            if (effectiveness > 1) {
              strengths.push(dbTypes[index + 1]);
            } else if (effectiveness < 1) {
              weaknesses.push(dbTypes[index + 1]);
            }
          }
          dbType.setWeaknesses(weaknesses).then(function (weaks) {
            dbType.setStrengths(strengths).then(function (strengths) {
              cb();
            })
          });
        }, function (err) {
          Type.update({id: 0}, {where: {id: -1}}).then(function () {
            sequelize.sync().then(function () {
              console.log("done adding types to database");
              fulfill();
            });
          });
        });
      });
    } catch (e) {
      reject(e);
    }
  });
}

function addMovesToDatabase(moves) {
  return new Promise(function (fulfill, reject) {
    console.log("started adding moves to database ");
    try {
      async.each(moves, function (move, cb) {
        try {
          if (move.energy_delta > 0) {
            FastMove.create({
              id: move.movement_id,
              name: move.vfx_name,
              damage: move.power,
              duration: move.duration_ms,
              energyGain: move.energy_delta,
              TypeId: move.pokemon_type
            }).then(function (dbMove) {
              cb();
            });
          } else {
            ChargeMove.create({
              id: move.movement_id,
              name: move.vfx_name,
              damage: move.power,
              duration: move.duration_ms,
              energyRequired: move.energy_delta * -1,
              critChance: move.critical_chance,
              TypeId: move.pokemon_type
            }).then(function (dbMove) {
              cb();
            });
          }
        } catch (e) {
          cb(e);
        }
      }, function (err) {
        err ? reject(err) : fulfill();
      });

    } catch (e) {
      reject(e);
    }
  });
}

function addPokemonToDatabase(pokemons) {
  return new Promise(function (fulfill, reject) {
    console.log("started adding pokemons to database ");
    try {
      async.each(pokemons, function (pokemon, cb) {
        try {
          Pokemon.create({
            id: pokemon.pokemon_id,
            name: pokemon.name,
            stamina: pokemon.stats.base_stamina,
            attack: pokemon.stats.base_attack,
            defense: pokemon.stats.base_defense,
            type1Id: pokemon.type,
            type2Id: pokemon.type_2
          }).then(function (dbPokemon) {
            dbPokemon.setChargeMoves(pokemon.cinematic_moves).then(function () {
              dbPokemon.setFastMoves(pokemon.quick_moves).then(function () {
                cb();
              });
            });
          });
        } catch (e) {
          cb(e);
        }
      }, function (err) {
        err ? reject(err) : fulfill();
      });

    } catch (e) {
      reject(e);
    }
  });
}

function deleteAll() {
  return sequelize.sync({force: true});
}

function populateTypes() {
  return new Promise(function (fulfill, reject) {
    var json = fs.readFileSync('data/types.json');
    var typesJson = JSON.parse(json);
    var typeHashes = [];
    for (var name in typesJson) {
      typeHashes.push({name: name});
    }
    Type.bulkCreate(typeHashes).then(function () {
      return Type.findAll();
    }).then(function (dbTypes) {
      types = {};
      for (var type in dbTypes) {
        type = dbTypes[type];
        types[type.dataValues.name] = type;
      }
      async.forEachOf(typesJson, function (type, name, cb) {
        type = types[name];
        var weaknesses = [];
        var strengths = [];
        for (var weakness in typesJson[name].weaknesses) {
          weakness = typesJson[name].weaknesses[weakness];
          weaknesses.push(types[weakness]);
        }
        for (var strength in typesJson[name].strengths) {
          strength = typesJson[name].strengths[strength];
          strengths.push(types[strength]);
        }
        // console.log(type);
        type.setWeaknesses(weaknesses).then(function (weaks) {
          type.setStrengths(strengths).then(function (strengths) {
            cb();
          })
        });
      }, function (err) {
        sequelize.sync().then(function () {
          console.log("done");
          fulfill();
        });
      });
    })
  });
}

module.exports = promise;
