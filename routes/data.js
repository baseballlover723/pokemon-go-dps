var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var parseDuration = require('parse-duration');
var async = require('async');
var CircularJSON = require('circular-json');
var moment = require('moment-timezone');
var Pokemon = require('./../lib/pokemon');
var Move = require('./../lib/move');
var Type = require('./../lib/type');

var LIMIT_VALUE = 24;
var LIMIT_UNITS = "hours";
var CLIENT_REFRESH_VALUE = 1;
var CLIENT_REFRESH_UNITS = "hour";

var scrapping = false;
var lastClientRefresh = false;

// should probably clean up the globals
String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

var data = [];
var list = JSON.parse(fs.readFileSync("json/pokemon.json"));
var pokemonWithTypesStats = JSON.parse(fs.readFileSync("json/pokemonTypeStats.json"));
var moveNames = JSON.parse(fs.readFileSync("json/moveNames.json"));

// populatePokemonTypes();
var types = populateTypes();
// populateBaseStats();
var moves = {};

for (var id in moveNames) {
    let idCopy = id;
    var move = new Move(idCopy, moveNames[idCopy]);
    moves[idCopy] = move;
}

isCachedValid(true, function (movesCopy, isValid) {
    for (var id in movesCopy) {
        if (moves[id] == undefined) {
            moves[id] = movesCopy[id];
        } else {
            moves[id].load(movesCopy[id]);
        }
    }
    if (isValid) {
        fixLoadingMoves(moves);
        console.log("cached valid");
    } else {
        refreshCache(false);
    }
});

console.time("create data");
list.map(function (pokemonNameHash) {
    var num = pokemonNameHash.num;
    var name = toProperCase(pokemonNameHash.name);
    var fastMoves = lookupMoves(pokemonNameHash.quickMoves);
    var chargeMoves = lookupMoves(pokemonNameHash.cinematicMoves);
    for (var fastMove of fastMoves) {
        for (var chargeMove of chargeMoves) {
            var pokemonHash = pokemonWithTypesStats[num - 1];
            if (pokemonHash.type2) {
                data.push(
                    new Pokemon(num, name, fastMove, chargeMove, pokemonHash.stamina, pokemonHash.attack, pokemonHash.defense, pokemonHash.type1, pokemonHash.type2));
            } else {
                data.push(
                    new Pokemon(num, name, fastMove, chargeMove, pokemonHash.stamina, pokemonHash.attack, pokemonHash.defense, pokemonHash.type1));
            }
            // data.push({number: num, name: name, fastMove: fastMove, chargeMove: chargeMove});
        }
    }
    // pokemon.fastMoves = fastMoves.map(function(move) {return move.id});
    // pokemon.cinematicMoves = chargeMoves.map(function(move) {return move.id});
    //myDataSet.append([data['Num'], data['Name'], data['Fast Moves'], data['Charge Moves']]);
});
console.timeEnd("create data");

// generateStaticPokemon();

var exportTypes = Object.keys(types).map(function (v) { return types[v]; });
exportTypes.sort(function (a, b) {
    return a.weaknesses.length + a.strengths.length < b.weaknesses.length + b.strengths.length;
});
module.exports.getData = function () {return {data: data, types: exportTypes}};
module.exports.checkCache = checkCache;
module.exports.refreshCache = function (callback = function (isRefreshing, nextRefreshTime) {}) {
    refreshCache(true, function (isRefreshing, nextRefreshTime) {
        callback(isRefreshing, nextRefreshTime);
    });
};
module.exports.getNextRefreshTime = function () {
    if (!lastClientRefresh) {
        return moment();
    }
    return moment(lastClientRefresh).add(CLIENT_REFRESH_VALUE, CLIENT_REFRESH_UNITS)
};
console.log("exported");

function generateStaticPokemon() {
    staticPokemon = [];
    console.time("generating static pokemon");
    list.map(function (pokemonNameHash) {
        var num = pokemonNameHash.num;
        var name = toProperCase(pokemonNameHash.name);
        var pokemonHash = pokemonWithTypesStats[num - 1];
        if (pokemonHash.type2) {
            staticPokemon.push(
                new Pokemon(num, name, undefined, undefined, pokemonHash.stamina, pokemonHash.attack, pokemonHash.defense, types[pokemonHash.type1], types[pokemonHash.type2]));
        } else {
            staticPokemon.push(new Pokemon(num, name, undefined, undefined, pokemonHash.stamina, pokemonHash.attack, pokemonHash.defense, types[pokemonHash.type1]));
        }
    });
    fs.writeFile("json/staticPokemon.json", CircularJSON.stringify(staticPokemon), function() {
        console.timeEnd("generating static pokemon");
    });
}

function populateBaseStats() {
    let url = 'http://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_base_stats_(Generation_VI-present)';
    console.time("base stats request");
    request({url: url, timeout: parseDuration("30 seconds")}, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            if ($('.noarticletext').html()) {
                console.log("base stats was not found at " + url);
                console.timeEnd("base stats request");
                console.log("");
                return;
            }
            var first = true;
            var c = $("table.sortable tr");
            c.filter(function () {
                if (first) {
                    first = false;
                    return;
                }
                // parse the page
                var data = $(this);
                data = data.children().first();
                var number = data.text();
                if (number.includes("M")) {
                    return;
                }
                number = parseInt(number);
                if (number > 151) {
                    return;
                }
                data = data.next().next();
                var name = data.text().trim();

                data = data.next();
                var hp = parseInt(data.text());

                data = data.next();
                var attack = parseInt(data.text());

                data = data.next();
                var defense = parseInt(data.text());

                data = data.next();
                var spAttack = parseInt(data.text());

                data = data.next();
                var spDefense = parseInt(data.text());

                data = data.next();
                var speed = parseInt(data.text());

                console.log([number, name, hp, attack, defense, spAttack, spDefense, speed]);
                var pokemon = pokemonWithTypesStats[number - 1];
                pokemon.stamina = calculateStamina(hp);
                pokemon.attack = calculateAttack(attack, spAttack, speed);
                pokemon.defense = calculateDefense(defense, spDefense, speed);
                // var titleText = data.text();
                // if (titleText == "Pokémon GO") {
                //     parseMove($, move, data.parent());
                //     console.timeEnd(move.name + " request");
                //     callback(move);
                // }
            });
            fs.writeFile("json/pokemonTypeStats.json", JSON.stringify(pokemonWithTypesStats), function () {
                console.log("wrote file");
            });
            if (!c.html()) {
                console.timeEnd("base stats request");
                console.log("didn't get all the page");
                fs.writeFile("json/debug.html", c.html())
            }
        } else {
            if (error.Error == "ESOCKETTIMEDOUT") {
                console.log("base stats request: timed out");
            } else {
                console.log("error scraping base stats");
                console.log(error);
            }
        }
    });
}

function calculateStamina(hp) {
    return hp * 2;
}

function calculateAttack(attack, spAttack, speed) {
    return 2 * Math.round(Math.sqrt(attack) * Math.sqrt(spAttack) + Math.sqrt(speed));
}

function calculateDefense(defense, spDefense, speed) {
    return 2 * Math.round(Math.sqrt(defense) * Math.sqrt(spDefense) + Math.sqrt(speed));
}

function populatePokemonTypes(callback = function () {}) {
    var limit = 10;
    console.time("type loop");
    async.eachLimit(list, limit, function (pokemon, callback) {
        let url = 'http://pokeapi.co/api/v2/pokemon/' + pokemon.num;
        console.time(pokemon.name + ": " + pokemon.num + " request");
        request({url: url, json: true, timeout: parseDuration("2 minutes")}, function (error, response, json) {
            if (!error) {
                var types = json.types;
                for (var type of types) {
                    if (type.slot == 1) {
                        pokemon.type1 = type.type.name;
                    } else {
                        pokemon.type2 = type.type.name;
                    }
                }
                console.timeEnd(pokemon.name + ": " + pokemon.num + " request");
            } else {
                console.timeEnd(pokemon.name + ": " + pokemon.num + " request");
                console.log("with error ^ ");
            }
            callback();
        });
    }, function (err) {
        console.timeEnd("type loop");
        fs.writeFile("json/pokemonTypes.json", JSON.stringify(list), function () {
            console.log("done with write");
            callback();
        })
    });
}

function refreshCache(fromClient, callback = function (isRefreshing, nextRefreshTime) {}) {
    if (!scrapping || moment().subtract(5, "minutes").isAfter(scrapping) || fromClient) {
        var refresh = false;
        if (fromClient) {
            if (!lastClientRefresh || moment().subtract(CLIENT_REFRESH_VALUE, CLIENT_REFRESH_UNITS).isAfter(lastClientRefresh)) {
                console.log("Client forced cache refresh: " + moment().tz('America/Los_Angeles').format("LLLL z"));
                lastClientRefresh = moment();
                refresh = true;
            } else {
                console.log("rejected client refresh");
            }
        } else {
            refresh = true;
            console.log("cached expired, scrapping wiki");
        }
        if (refresh) {
            scrapping = moment();
            scrapeMoves(function (movesCopy) {
                for (var id in movesCopy) {
                    moves[id].load(movesCopy[id]);
                }
                writeCachedMoves(moves, function () {
                    scrapping = false;
                });
            });
            if (!lastClientRefresh) {
                fs.stat("json/cachedMoves.json", function (err, stats) {
                    lastClientRefresh = err ? moment().subtract(7, "days") : moment(stats.mtime);
                    callback(true, moment(lastClientRefresh).add(CLIENT_REFRESH_VALUE, CLIENT_REFRESH_UNITS));
                });
            } else {
                callback(true, moment(lastClientRefresh).add(CLIENT_REFRESH_VALUE, CLIENT_REFRESH_UNITS));
            }
        } else {
            callback(false, moment(lastClientRefresh).add(CLIENT_REFRESH_VALUE, CLIENT_REFRESH_UNITS));
        }
    } else {
        console.log("already scrapping");
        callback(false, moment(lastClientRefresh).add(CLIENT_REFRESH_VALUE, CLIENT_REFRESH_UNITS));
    }
}

function isCachedValid(readCache, callback = function (movesCopy, isValid) {}) {
    async.parallel([function (callback) {
        if (readCache) {
            fs.readFile("json/cachedMoves.json", function (err, jsonStr) {
                if (err) {
                    callback(null, false);
                } else {
                    var movesCopy = CircularJSON.parse(jsonStr);
                    console.log("read cached moves");
                    callback(null, movesCopy);
                }
            });
        } else {
            callback(null, moves);
        }
    }, function (callback) {
        fs.stat("json/cachedMoves.json", function (err, stats) {
            if (err) {
                callback(null, {isValid: false, lastUpdatedTime: moment().subtract(7, "days"), nextUpdateTime: moment()});
            } else {
                var mtime = moment(stats.mtime);
                callback(null, {
                    isValid: moment().subtract(LIMIT_VALUE, LIMIT_UNITS).isBefore(mtime),
                    lastUpdatedTime: mtime,
                    nextUpdateTime: moment(mtime).add(LIMIT_VALUE, LIMIT_UNITS)
                });
            }
        });
    }], function (err, results) {
        callback(results[0], results[1].isValid, results[1].lastUpdatedTime, results[1].nextUpdateTime);
    });
}

function populateTypes() {
    var types = {};
    var json = fs.readFileSync('json/types.json');
    var typeStrs = JSON.parse(json);
    for (var typeName in typeStrs) {
        types[typeName] = new Type(typeName);
    }
    for (var typeName in types) {
        var type = types[typeName];
        for (var weaknessStr of typeStrs[typeName].weaknesses) {
            type.weaknesses.push(types[weaknessStr]);
        }
        for (var strengthStr of typeStrs[typeName].strengths) {
            type.strengths.push(types[strengthStr]);
        }
    }
    return types;
}

function scrapeMoves(callback = function (moves) {}) {
    var limit = 5;
    var count = 0;
    var done = [];
    console.time("request loop");
    async.eachLimit(Object.keys(moveNames), limit, function (id, callback) {
        process.nextTick(function () {
            scrape(new Move(id, moveNames[id]), function (move) {
                moves[id].load(move);
                count++;
                done.push(move.name);
                console.log(count + " / " + Object.keys(moveNames).length);
                if (Object.keys(moveNames).length - count < 5) {
                    console.log(Object.keys(moveNames).map(function (v) { return moveNames[v]; }).filter(function (x) {return done.indexOf(x) < 0}));
                }
                callback();
            });
        });
    }, function (err) {
        console.timeEnd("request loop");
        callback(moves);
    });
}

function writeCachedMoves(moves, callback = function () {}) {
    console.time("cache write");
    fs.writeFile("json/cachedMoves.json", CircularJSON.stringify(moves), function () {
        console.timeEnd("cache write");
    });
}

function fixLoadingMoves(moves) {
    var loadingMoves = [];
    for (var id in moveNames) {
        var move = moves[id];
        if (move == undefined || move.hasAnyLoading()) {
            loadingMoves.push(move);
        }
    }
    if (loadingMoves.length > 0) {
        var limit = 5;
        console.log("reloading these moves: " + loadingMoves.map(function (move) {return move.name}));
        console.time("reloading loop");
        async.eachLimit(loadingMoves, limit, function (move, callback) {
            scrape(move, function (newMove) {
                move.load(newMove);
                callback();
            });
        }, function (err) {
            console.timeEnd("reloading loop");
        });
    } else {
        console.log("no moves are loading");
    }
}

function scrape(move, callback = function (move) {}, firstTime = true) {
    let url = 'http://bulbapedia.bulbagarden.net/wiki/' + convertToUrl(move);
    console.time(move.name + " request");
    request({url: url, timeout: parseDuration("30 seconds")}, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            if ($('.noarticletext').html()) {
                console.log(move.name + " was not found at " + url);
                console.timeEnd(move.name + " request");
                console.log("");
                return;
            }
            var c = $("#mw-content-text h3 #Pok\\.C3\\.A9mon_GO");
            c.filter(function () {
                var data = $(this);
                var titleText = data.text();
                if (titleText == "Pokémon GO") {
                    parseMove($, move, data.parent());
                    console.timeEnd(move.name + " request");
                    callback(move);
                }
            });
            if (!c.html()) {
                console.timeEnd(move.name + " request");
                // fs.writeFile('json/debug.html', html);
                scrape(move, function (move) {callback(move)}, false);
            }
        } else {
            if (error.Error == "ESOCKETTIMEDOUT") {
                console.log(move.name + ": timed out");
            } else {
                console.log("error scraping: " + move.name);
                console.log(error);
            }
            if (firstTime) {
                console.log("trying again");
                scrape(move, callback, false);
            } else {
                console.log("not trying again, url: " + url);
                callback(move);
            }
        }
    });
}

function parseMove($, move, data) {
    data = data.next();
    var moveName = data.children().first().children().first().text().trim();
    if (!move.name.includes(moveName)) {
        console.log("this isn't the right move page, saw " + moveName + " looking for move: " + move.name);
        console.timeEnd(move.name + " request");
        return;
    }
    var table = data.children().first().next().children().first().children().first();
    var rows = table.children();
    var isFast = $(rows.get(0)).text().includes("Fast"); // move class
    move.class = isFast ? "Fast" : "Charge";
    move.damage = parseDamage($(rows.get(2)));
    move.duration = parseDurationRow($(rows.get(4))); // s
    if (isFast) {
        move.energyGain = parseEnergyGain($(rows.get(3)));
    } else {
        move.energyRequired = parseEnergyRequired($(rows.get(3)));
        move.critChance = parseCritChance($(rows.get(5)));
    }
    move.type = parseType($(rows.get(1)));
}

function parseType(row) {
    var typeText = row.children().last().text();
    return types[typeText.toLowerCase().trim()];
}

function parseDamage(row) {
    return parseInt(row.children().last().text());
}

function parseEnergyGain(row) {
    return parseInt(row.children().last().text());
}

function parseEnergyRequired(row) {
    var img = row.children().last().children().first().children().first();
    var bars = parseInt(img.attr("alt"));
    return 100 / bars;
}

// returns in s
function parseDurationRow(row) {
    return parseDuration(row.children().last().text()) / 1000;
}

function parseCritChance(row) {
    return parseInt(row.children().last().text()) / 100;
}
// "134": "Scald Blastoise",
// "135": "Hydro Pump Blastoise",
// "232": "Water Gun Blastoise",
// "136": "Wrap Green",
// "137": "Wrap Pink",
// "233": "Mud Slap", -> Mud-Slap

// before 200 is Legacy quick moves
// before 13 is Legacy charge moves

function convertToUrl(move) {
    var name = move.name;

    // legacy moves
    if (move.id < 13 || (move.id < 200 && move.id > 137)) {
        console.log("replaced name " + move.name);
        name = name.replace(" (Legacy)", "");
        console.log(name);
    }

    if (move.id == 134 || move.id == 135 || move.id == 232) { // blastoise
        name = name.replaceAll(" Blastoise", "");
    } else if (move.id == 136 || move.id == 137) { // wrap
        name = name.split(" ")[0];
    } else if (move.id == 233 || move.id == 196) {
        name = name.replace(" ", "-");
    }
    return name.replaceAll(" ", "_") + "_(move)";
}

var dataTable;

// $(document).ready(function () {
//     //$('#data-table').DataTable({
//     //    data: dataSet, columns: [{title: '#'}, {title: 'Name'}, {title: 'Fast Moves'}, {title: 'Charge Moves'}]
//     //});
//     console.log("here");
//     dataTable = $('#data-table').DataTable({
//         data: myDataSet,
//         columns: [{title: '#'}, {title: 'Name'}, {title: 'Fast Move'}, {title: 'Fast Move Damage'}, {title:
// 'Charge Move'},{title: 'Charge Move Damage'}], autoWidth: true, columnDefs: [ {targets: 0, width: "5%"},{ render:
// function (data, type, row) { return data.name; }, targets: 2, width: "10%" }, { render: function (data) { return
// data.damage || "Loading"; }, targets: 3, width: "10%" }] }); });

function toProperCase(str) {
    return str.replace(/\w\S*/g, function (txt) {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function padLeft(str, value) {
    return String(value + str).slice(-value.length);
}

function mapIds(hash) {
    return hash.match(/.{1,2}/g).filter(function (m) {return m !== '01'}).map(function (m) {
        return padLeft(parseInt(m, 16), '000')
    });
}

function lookupMoves(hash) {
    return mapIds(hash).map(function (id) {
        return moves[id];
    });
}

function updateMove(move, fast) {
    console.time("update data");
    var cells = dataTable.rows(function (index, data, node) {
        return move.name == data[2].name;
    }, fast ? 3 : 5).invalidate();
    console.timeEnd("update data");
    //dataTable.rows().invalidate();

    //dataTable.search(name).selected().invalidate();
}

function checkCache(callback = function (lastUpdatedTime, nextUpdateTime) {}) {
    isCachedValid(false, function (movesCopy, isValid, lastUpdatedTime, nextUpdatedTime) {
        if (!isValid) {
            refreshCache(false);
        }
        callback(lastUpdatedTime, nextUpdatedTime)
    });
}

//var dataSet = list.map(function (item) {
//    var data = {
//        'Num': padLeft(item.num, '000'),
//        'Name': toProperCase(item.name),
//        'Fast Moves': lookupMoves(item.fastMoves).join(', '),
//        'Charge Moves': lookupMoves(item.cinematicMoves).join(', ')
//    };
//    return [data['Num'], data['Name'], data['Fast Moves'], data['Charge Moves']];
//});

// setTimeout(function () {
//     moves["221"].damage = 235523;
//
//     console.log("start");
//     updateMove(moves["221"]);
//     //dataTable.clear();
//     //dataTable.rows.add(myDataSet);
//     //dataTable.draw();
// }, 2000);

