var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

var list = JSON.parse(fs.readFileSync("json/pokemon.json"));

var moveNames = JSON.parse(fs.readFileSync("json/moveNames.json"));

var types = {};

populateTypes();

function populateTypes() {
    var json = fs.readFileSync('json/types.json');
    var typeStrs = JSON.parse(json);
    for (var typeName in typeStrs) {
        types[typeName]  =  new Type(typeName);
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
}

function Type(name) {
    this.name = name;
    this.weaknesses = [];
    this.strengths = [];
}

var moves = {};

var count = 0;
for (var id in moveNames) {
    count++;
    let idCopy = id;
    var move = new Move(idCopy, moveNames[idCopy]);
    moves[idCopy] = move;
    // scrape(move);
}

function scrape(move) {
    let url = 'http://bulbapedia.bulbagarden.net/wiki/' + convertToUrl(move);
    var found = false;
    console.time(move.name + " request");
    request(url, function (error, response, html) {
        console.log(move.name + ": " + url);
        if (!error) {
            var $ = cheerio.load(html);
            $('#mw-content-text h3').filter(function () {
                var data = $(this);
                var titleText = data.text();
                if (titleText == "Pokémon GO") {
                    found = true;
                    parseMove($, move, data);
                    // console.log("found pogo");
                }
            });
            setTimeout(function () {
                if (!found) {
                    console.log(move.name + " was not found at " + url);
                    console.timeEnd(move.name + " request");
                    console.log("");
                }
            }, 3000);
        } else {
            console.log("error");
            console.log(error);
        }
    });
}

function parseMove($, move, data) {
    data = data.next();
    // console.log(data.next().html());
    var moveName = data.children().first().children().first().text();
    console.log(moveName);
    if (!moveName.includes(move.name)) {
        console.log("this isn't the right move page, saw " + moveName + " looking for move: " + move.name);
        console.timeEnd(move.name + " request");
        return;
    }
    var table = data.children().first().next().children().first().children().first();
    var rows = table.children();
    var isFast = $(rows.get(0)).text().includes("Fast");
    console.log("isFast: " + isFast);

    parseType($(rows.get(1)).children().last().text());
    //     .each(function(i, element) {
    //     console.log($(element).html());
    //     console.log(i);
    //     console.log("i'm here");
    //
    // });
    // for (var row of data.children()) {
    //     console.log(row);
    // }
    // console.log(data.html());

    console.timeEnd(move.name + " request");
}

function parseType(typeText) {
    if (!types[typeText]) {
        return new Type(typeText)
    }
    return types[typeText];
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

scrape(moves[100]);
var dataTable;

// $(document).ready(function () {
//     //$('#data-table').DataTable({
//     //    data: dataSet, columns: [{title: '#'}, {title: 'Name'}, {title: 'Quick Moves'}, {title: 'Special Moves'}]
//     //});
//     console.log("here");
//     dataTable = $('#data-table').DataTable({
//         data: myDataSet,
//         columns: [{title: '#'}, {title: 'Name'}, {title: 'Quick Move'}, {title: 'Quick Move Damage'}, {title:
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
//        'Quick Moves': lookupMoves(item.quickMoves).join(', '),
//        'Special Moves': lookupMoves(item.cinematicMoves).join(', ')
//    };
//    return [data['Num'], data['Name'], data['Quick Moves'], data['Special Moves']];
//});

console.time("create data");
list.map(function (pokemon) {
    var data = {
        'Num': padLeft(pokemon.num, '000'), 'Name': toProperCase(pokemon.name),
    };
    var quickMoves = lookupMoves(pokemon.quickMoves);
    var specialMoves = lookupMoves(pokemon.cinematicMoves);
    for (var quickMove of quickMoves) {
        for (var specialMove of specialMoves) {
            myDataSet.push({number: data['Num'], name: data['Name'], quickMove: quickMove, specialMove: specialMove});
        }
    }
    // pokemon.quickMoves = quickMoves.map(function(move) {return move.id});
    // pokemon.cinematicMoves = specialMoves.map(function(move) {return move.id});
    //myDataSet.append([data['Num'], data['Name'], data['Quick Moves'], data['Special Moves']]);
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

module.exports.data = myDataSet;

