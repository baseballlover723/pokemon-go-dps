var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var parseDuration = require('parse-duration');
var async = require('async');
var CircularJSON = require('circular-json');
var moment = require('moment');

// TODO, only scrape if its been more than a day

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

var list = JSON.parse(fs.readFileSync("json/pokemon.json"));

var moveNames = JSON.parse(fs.readFileSync("json/moveNames.json"));

var types = {};
populateTypes();
fs.stat("json/cachedMoves.json", function(err, stats){
    var mtime = moment(stats.mtime);
    if (moment().subtract(1, "days").isBefore(mtime)) {
        fs.readFile("json/cachedMoves.json", function(err, jsonStr) {
            moves = CircularJSON.parse(jsonStr);
            console.log(moves);
        })
    }
    // console.log(mtime);
});

function populateTypes() {
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
}

function Move(id, name) {
    this.id = id;
    this.name = name;
    this.damage = "Loading";
    // this.prototype = {
    //     toString: function () {
    //         return this.name + " (Move Object)";
    //     }
    // }
}

function Type(name) {
    this.name = name;
    this.weaknesses = [];
    this.strengths = [];
    // this.prototype = {
    //     toString: function () {
    //         return this.name + " (Type Object)";
    //     }
    // }
}

var moves = {};

var count = 0;
var done = [];
for (var id in moveNames) {
    let idCopy = id;
    var move = new Move(idCopy, moveNames[idCopy]);
    moves[idCopy] = move;
}
var limit = 75;
console.time("request loop");
async.eachLimit(Object.keys(moveNames), limit, function(id, callback) {
    scrape(moves[id], function (move) {
        // count++;
        // done.push(move.name);
        // console.log(count + " / " + Object.keys(moveNames).length);
        // if (Object.keys(moveNames).length - count < 20) {
        //     console.log(Object.keys(moveNames).map(function (v) { return moveNames[v]; }).filter(
        //         function (x) {return done.indexOf(x) < 0}));
        // }
        callback();
    });
}, function(err) {
    console.timeEnd("request loop");
    console.time("cache write");
    fs.writeFile("json/cachedMoves.json", CircularJSON.stringify(moves), function() {
        console.timeEnd("cache write");
        console.log("done");
    });
});
// 125 / 137
//     [ 'Leaf Blade',
//     'Air Cutter',
//     'Dragon Breath
// 'Karate Chop',
//     'Peck',
//     'Lick',
//     'Razor Leaf',
//     'Pound',
//     'Metal Claw',
//     'Poison Sting'
// 'Ice Beam',
//     'Mud Bomb' ]
function scrape(move, callback = function (move) {}) {
    let url = 'http://bulbapedia.bulbagarden.net/wiki/' + convertToUrl(move);
    console.time(move.name + " request");
    request(url, function (error, response, html) {
        // console.log(move.name + ": " + url);
        if (!error) {
            // console.log(move.name + ": " + response.statusCode);
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
                // console.log(move.name + ": " + titleText + " == " + "Pokémon GO = " + (titleText == "Pokémon GO"));
                if (titleText == "Pokémon GO") {
                    parseMove($, move, data.parent());
                    console.timeEnd(move.name + " request");
                    callback(move);
                    // console.log("found pogo");
                }
            });
            if (!c.html()) {
                // $("#mw-content-text h3").filter(function() {
                //     console.log(move.name + ": error with filter, " + $(this).html());
                // });
                console.timeEnd(move.name + " request");
                fs.writeFile('json/debug.html', html);
                scrape(move, function(move) {callback(move)});
            }
        } else {
            console.log("error");
            console.log(error);
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
    move.class = isFast ? "Fast" : "Special";
    move.damage = parseDamage($(rows.get(2)));
    move.duration = parseDurationRow($(rows.get(4))); // s
    if (isFast) {
        move.energyGain = parseEnergyGain($(rows.get(3)));
    } else {
        move.energyRequired = parseEnergyRequired($(rows.get(3)));
        move.critChange = parseCritChance($(rows.get(5)));
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

function convertToUrl(move) {
    var name = move.name;
    if (move.id == 134 || move.id == 135 || move.id == 232) { // blastoise
        name = name.replaceAll(" Blastoise", "");
    } else if (move.id == 136 || move.id == 137) { // wrap
        name = name.split(" ")[0];
    }
    return name.replaceAll(" ", "_") + "_(move)";
}

// scrape(moves[214]);
var dataTable;

// $(document).ready(function () {
//     //$('#data-table').DataTable({
//     //    data: dataSet, columns: [{title: '#'}, {title: 'Name'}, {title: 'Fast Moves'}, {title: 'Special Moves'}]
//     //});
//     console.log("here");
//     dataTable = $('#data-table').DataTable({
//         data: myDataSet,
//         columns: [{title: '#'}, {title: 'Name'}, {title: 'Fast Move'}, {title: 'Fast Move Damage'}, {title:
// 'Special Move'},{title: 'Special Move Damage'}], autoWidth: true, columnDefs: [ {targets: 0, width: "5%"},{ render:
// function (data, type, row) { return data.name; }, targets: 2, width: "10%" }, { render: function (data) { return
// data.damage || "Loading"; }, targets: 3, width: "10%" }] }); });

function toProperCase(str) {
    return str.replace(/\w\S*/g, function (txt) {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

function padLeft(str, value) {
    return String(value + str).slice(-value.length);
};

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

var myDataSet = [];
//var dataSet = list.map(function (item) {
//    var data = {
//        'Num': padLeft(item.num, '000'),
//        'Name': toProperCase(item.name),
//        'Fast Moves': lookupMoves(item.fastMoves).join(', '),
//        'Special Moves': lookupMoves(item.cinematicMoves).join(', ')
//    };
//    return [data['Num'], data['Name'], data['Fast Moves'], data['Special Moves']];
//});

console.time("create data");
list.map(function (pokemon) {
    var data = {
        'Num': padLeft(pokemon.num, '000'), 'Name': toProperCase(pokemon.name),
    };
    var fastMoves = lookupMoves(pokemon.quickMoves);
    var specialMoves = lookupMoves(pokemon.cinematicMoves);
    for (var fastMove of fastMoves) {
        for (var specialMove of specialMoves) {
            myDataSet.push({number: data['Num'], name: data['Name'], fastMove: fastMove, specialMove: specialMove});
        }
    }
    // pokemon.fastMoves = fastMoves.map(function(move) {return move.id});
    // pokemon.cinematicMoves = specialMoves.map(function(move) {return move.id});
    //myDataSet.append([data['Num'], data['Name'], data['Fast Moves'], data['Special Moves']]);
});

console.timeEnd("create data");

// setTimeout(function () {
//     moves["221"].damage = 235523;
//
//     console.log("start");
//     updateMove(moves["221"]);
//     //dataTable.clear();
//     //dataTable.rows.add(myDataSet);
//     //dataTable.draw();
// }, 2000);

var exportTypes = Object.keys(types).map(function (v) { return types[v]; });
exportTypes.sort(function (a, b) {
    return a.weaknesses.length + a.strengths.length < b.weaknesses.length + b.strengths.length;
});
module.exports.getData = function () {return {data: myDataSet, types: exportTypes}};

