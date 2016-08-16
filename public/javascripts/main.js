// I got my math equation from http://www.codecogs.com/latex/eqneditor.php with comic sans and 12pt font
// dps = \frac{\frac{cm.energy}{fm.energy} * fm.power + cm.power(1+\frac{cm.crit}{2})}{\frac{cm.energy}{fm.energy} *
// fm.duration + cm.duration + 0.5} offensive power rating at 10pt with 150 resolution OffensivePowerRating =
// OffensiveRating = \frac{(pokemon.attack + 7) * (pokemon.stamina + 7) * (pokemon.defense + 7) * stabDps}{100,000}
// AdjustedDPS = \frac{(pokemon.attack + 7) * stabDps}{2}
var CALCULATE_CRIT = false;
0.5974
var dataTable;
var typeModifiers = {};
var inited = false;
var staticPokemon = [];
var queryObject = {}; // {search : "", gym: int[id], toggleComboBox: int[index]}
for (var key in jsVars.query) {
    queryObject[key] = jsVars.query[key];
}

var pokemonHeaderLength = 7;
var fastHeaderLength = 9;
var chargeHeaderLength = 9;
var totalDpsHeaderLength = 5;

var DPS_COLUMNS = [];
var end = pokemonHeaderLength + fastHeaderLength;
for (var i = end - 3; i < end; i++) {
    DPS_COLUMNS.push(i); // dps columns are the last 3 of fast move
}
end += chargeHeaderLength;
for (var i = end - 3; i < end; i++) {
    DPS_COLUMNS.push(i); // dps columns are the last 3 of charge move
}
end += totalDpsHeaderLength - 1;
for (var i = end - 4; i < end; i++) {
    DPS_COLUMNS.push(i); // dps columns are the first 4 of total dps
}

var types = {};

populateStaticPokemon(function () {
    // makeSelectors();\
    if (!types["dark"]) {
        types["dark"] = generateDarkType(); // no dark type pokemon in gen 1
    }
    removeTempComboBox();
    loadInitialComboBoxes();
    addDefenderComboBox();
    calculateTypeModifiers();
});

function loadInitialComboBoxes() {
    if (jsVars.query.gym == "") {
        return;
    }
    var initialPokemonIds = jsVars.query.gym.split(" ").map(function(id) {return parseInt(id)});
    var toggledOffs = jsVars.query.toggleOff == "" ? [] : jsVars.query.toggleOff.split(" ").map(function(index) {return parseInt(index)});
    if (toggledOffs.length == initialPokemonIds.length) {
        $('#global-defender-toggle').prop("checked", false);
    }

    for (var index = 0; index < initialPokemonIds.length; index++) {
        var id = initialPokemonIds[index];
        var comboBox = addDefenderComboBox();
        comboBox.val(id).trigger("change");

        var toggledOff = toggledOffs.indexOf(index) >= 0;
        if (toggledOff) {
            $('.defender-toggle:last').prop("checked", false);
            $('.select2-selection:last').addClass("toggled-off");
        }
    }
    calculateTypeModifiers();
}

function removeTempComboBox() {
    $('#temp-select').remove();
}

// I will call this function to get the list of currently toggled on pokemon objects
function getDefendingPokemon() {
    var defendingPokemon = [];
    var comboBoxes = $('.defender-combo-box');
    var toggles = $('.defender-toggle');
    for (var index = 0; index < comboBoxes.length; index++) {
        var comboBox = $(comboBoxes[index]);
        var toggle = $(toggles[index]);
        if (toggle.prop("checked")) {
            var id = comboBox.val();
            if (id) {
                defendingPokemon.push(staticPokemon[comboBox.val() - 1]);
            }
        }
    }
    return defendingPokemon;
    // return [staticPokemon[5], staticPokemon[19]];
}

function updateTypeModifierTableData() {
    var table = $('#typeModifierData');
    table.empty();
    var toggledPokemon = getDefendingPokemon();
    //alert(JSON.stringify(toggledPokemon));
    var str = "";
    if (toggledPokemon.length < 1) {
        str = 'No Pokemon Selected';
    } else {
        str = 'Calculated for: ';
        for (var i = 0; i < toggledPokemon.length - 1; i++) {
            str = str + toggledPokemon[i].name + ', '
        }
        if (toggledPokemon.length > 1) {
            str = str + 'and ';
        }
        str = str + toggledPokemon[toggledPokemon.length - 1].name;
    }
	$('#defendingPokemonListLabel').text(str);

    var rows = [];
    var alternator = false;
    Object.keys(typeModifiers).forEach(function (type) {
        alternator = !alternator;
        if (alternator) {
            rows.push(document.createElement('tr'));
        }
        var newRow = rows[rows.length - 1];
        var newTypeCell = document.createElement('td');
        var typeNameSpan = document.createElement('span');
        $(typeNameSpan).text(capitalize(type) + ': ');
        var newTypeModifier = document.createElement('span');
        $(newTypeModifier).text(parseFloat(typeModifiers[type]).toFixed(3));
        $(newTypeModifier).addClass('td-right');
        $(newTypeCell).append(typeNameSpan);
        $(newTypeCell).append(newTypeModifier);
        $(newTypeCell).addClass('typeRow');
        //$(newTypeModifier).text(typeModifiers[type]);
        $(newRow).append(newTypeCell);

        //$(newRow).append(newTypeModifier);
        //table.append(newRow);
    });
    for (var i = 0; i < rows.length; i++) {
        table.append(rows[i]);
    }
}

function addDefenderComboBox() {
    if ($('.defender-combo-box').length < 10) {
        var row = $('<div class="col-sm-2 col-md-2 col-lg-1"></div>');
        $('#defenders').append(row);
        return generateDefenderComboBox(row);
    }
}

function generateDefenderComboBox(parent) {
    var comboBox = $('<select class="defender-combo-box" style="width: 100%"></select>');
    parent.append(comboBox);
    comboBox.select2({
        placeholder: "Select Pokemon", allowClear: true, data: (function () {
            var dataArray = [{id: '', text: ''}];
            for (var pokemon in staticPokemon) {
                pokemon = staticPokemon[pokemon];
                dataArray.push({id: pokemon.id, text: pokemon.name});
            }
            return dataArray;
        }())
    });

    if (!$('#global-defender-toggle').prop("checked")) {
        toggleComboBox(comboBox, false);
    }

    comboBox.on("select2:selecting", function (event) {
        var id = comboBox.val();
        if (!id) { // if this was empty before, add a new comboBox
            addDefenderComboBox();
        }
    });

    comboBox.on("select2:select", function (event) {
        var toggledOff = comboBox.next().children().first().children().first().hasClass("toggled-off");
        if (!toggledOff) {
            calculateTypeModifiers();
        }
    });

    comboBox.on("select2:unselecting", function (event) {
        var toggledOff = comboBox.next().children().first().children().first().hasClass("toggled-off");
        comboBox.select2("destroy");
        comboBox.parent().remove();
        if (!hasEmptyComboBox()) {
            addDefenderComboBox();
        }
        if (!toggledOff) {
            calculateTypeModifiers();
        }
        event.preventDefault();
    });

    var toggle = $('<input type="checkbox" class="defender-toggle">');
    toggle.prop("checked", $('#global-defender-toggle').prop("checked"));
    toggle.change(function () {
        toggleComboBox(comboBox);
    });
    parent.append("Include in Calc? &nbsp;");
    parent.append(toggle);
    return comboBox;
}

function toggleComboBox(comboBox, triggerUpdate) {
    triggerUpdate = triggerUpdate == undefined ? true : triggerUpdate;
    var renderedComboBox = comboBox.next().children().first().children().first();
    renderedComboBox.toggleClass("toggled-off");

    if (triggerUpdate) {
        calculateTypeModifiers();
        updateGlobalToggle();
    }
}

function updateGlobalToggle() {
    var globalToggle = $('#global-defender-toggle');
    var toggles = $('.defender-toggle');
    for (var index = 0; index < toggles.length; index++) {
        var toggle = $(toggles[index]);
        if (toggle.prop("checked")) {
            globalToggle.prop("checked", true);
            return;
        }
    }
    globalToggle.prop("checked", false);
}

$('#global-defender-toggle').change(function () {
    var globalToggle = $('#global-defender-toggle');
    var renderedComboBoxes = $('.select2-selection');
    var toggles = $('.defender-toggle');
    var toggledOn = globalToggle.prop("checked");
    for (var index = 0; index < toggles.length; index++) {
        var toggle = $(toggles[index]);
        toggle.prop("checked", toggledOn);
        if (toggledOn) {
            renderedComboBoxes.removeClass("toggled-off");
        } else {
            renderedComboBoxes.addClass("toggled-off");
        }
    }
    calculateTypeModifiers();
});

function hasEmptyComboBox() {
    var comboBoxes = $('.defender-combo-box');
    for (var index = 0; index < comboBoxes.length; index++) {
        var comboBox = $(comboBoxes[index]);
        if (!comboBox.val()) {
            return true;
        }
    }
    return false;
}

// no dark type pokemon in gen 1
function generateDarkType() {
    var ghost = types["ghost"];
    for (var type in ghost.weaknesses) {
        type = ghost.weaknesses[type];
        if (type.name == "dark") {
            type.__proto__ = Type.prototype; // some hacky shit to get types functions
            return type;
        }
    }
}

function populateStaticPokemon(callback) {
    callback = callback || function () {};
    $.ajax({
        dataType: "text", url: "/json/staticPokemon.json", success: function (pokemonJson) {
            var staticPokemonJson = CircularJSON.parse(pokemonJson);
            for (var pokemon in staticPokemonJson) {
                pokemon = staticPokemonJson[pokemon];
                pokemon = new Pokemon(pokemon);
                pokemon.type1.__proto__ = Type.prototype; // some hacky shit to get types functions
                if (!types[pokemon.type1.name]) {
                    types[pokemon.type1.name] = pokemon.type1;
                }
                if (pokemon.type2) {
                    pokemon.type2.__proto__ = Type.prototype; // some hacky shit to get types functions
                    if (!types[pokemon.type2.name]) {
                        types[pokemon.type2.name] = pokemon.type2;
                    }
                }
                staticPokemon.push(new Pokemon(pokemon));
            }
            callback();
        }, error: function (xhr, status) {
            console.log("error loading counter matchups");
            console.log(status);

        }
    })
}

// call everytime the defending pokemon list is changed
function calculateTypeModifiers() {
    var typeModifiersCopy = {}; // make a copy so that you don't get any weird errors if you try and calculate dps with it in the middle
    var defenders = getDefendingPokemon();
    for (var type in types) {
        type = types[type];
        var modifier = 1;
        var count = 0;
        for (var defender in  defenders) {
            defender = defenders[defender];
            modifier *= type.getModifier(defender.type1) * 20; // to deal with integers
            count++;
            if (defender.type2) {
                modifier *= type.getModifier(defender.type2) * 20; // to deal with integers
                count++;
            }
        }
        typeModifiersCopy[type.name] = modifier / Math.pow(20, count); // correction
    }
    typeModifiers = typeModifiersCopy;
    updateTypeModifierTableData();

    // update url
    var gym = [];
    var comboBoxes = $('.defender-combo-box');
    var toggles = $('.defender-toggle');
    var toggleList = [];
    for (var index = 0; index < comboBoxes.length; index++) {
        var comboBox = $(comboBoxes[index]);
        var toggle = $(toggles[index]);
        var id = comboBox.val();
        if (id) {
            gym.push(id);
            if (!toggle.prop("checked")) {
                toggleList.push(index);
            }
        }
    }

    queryObject.gym = gym;
    queryObject.toggleOff = toggleList;
    updateQuery();

    console.time("update table");
    dataTable.cells(null, DPS_COLUMNS).invalidate();
    dataTable.draw();
    console.timeEnd("update table");
}

function getTypeModifier(move) {
    return typeModifiers[move.type.name] || 1;
}

function toProperCase(str) {
    return str.replace(/\w\S*/g, function (txt) {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function getTopHeader(index) {
    if (index < pokemonHeaderLength) {
        return $('#pokemon-header');
    } else if (index < pokemonHeaderLength + fastHeaderLength) {
        return $('#fast-header');
    } else if (index < pokemonHeaderLength + fastHeaderLength + chargeHeaderLength) {
        return $('#charge-header');
    } else {
        return $('#total-dps-header');
    }
}

function calculateDPS(pokemon, stab) {
    var fm = pokemon.fastMove;
    var cm = pokemon.chargeMove;
    var fmDamage = stab ? pokemon.getSTABDamage(fm) : fm.damage;
    fmDamage *= getTypeModifier(fm);
    var cmDamage = stab ? pokemon.getSTABDamage(cm) : cm.damage;
    cmDamage *= getTypeModifier(cm);
    var critChance = CALCULATE_CRIT ? cm.critChance : 0;
    return ((cm.energyRequired * fmDamage / fm.energyGain) + (cmDamage * (1 + critChance / 2))) /
        ((cm.energyRequired * fm.duration / fm.energyGain) + cm.duration + 0.5);
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
$(document).ready(function () {
    $('#last-update-time').text(moment.tz(jsVars.lastUpdatedTime, moment.tz.guess()).format("LLLL z"));
    $('#next-update-time').text(moment.tz(jsVars.nextUpdateTime, moment.tz.guess()).format("LLLL z"));
    $('#temp-select select').select2({
        placeholder: "Loading", allowClear: true
    });

    dataTable = $('#data-table').DataTable({
        ajax: {
            url: "/data", dataSrc: function (jsonStr) {
                var pokemons = CircularJSON.parse(JSON.stringify(jsonStr)).data;
                for (var index in pokemons) {
                    pokemons[index] = new Pokemon(pokemons[index]);
                }
                return pokemons;
            }
        },
        columns: [{
            title: "#", data: "id", render: function (data, type, row) {
                if (type == "display") {
                    return "#" + data;
                } else if (type == "filter") {
                    return "#" + data + "#";
                } else {
                    return data;
                }
            }
        }, {title: "Name", data: "name"}, {
            title: "Type(s)", data: null, render: function (data, type, pokemon) {
                if (pokemon.type2) {
                    return capitalize(pokemon.type1) + " / " + capitalize(pokemon.type2);
                } else {
                    return capitalize(pokemon.type1);
                }
            }
        }, {title: "Sta", data: "stamina"}, {title: "Att", data: "attack"}, {title: "Def", data: "defense"}, {
            title: "Total", data: "", render: function (data, type, pokemon) {
                return pokemon.stamina + pokemon.attack + pokemon.defense;
            }
        }, {title: "Move Name", data: "fastMove.name"}, {
            title: "Type", data: "fastMove.type.name", render: function (data, type, pokemon) {
                return capitalize(data);
            }
        }, {title: "Pow", data: "fastMove.damage"}, {title: "Duration", data: "fastMove.duration"}, {
            title: "Energy", data: "fastMove.energyGain", render: function (data, type, pokemon) {
                return data + "%";
            }
        }, {
            title: "EPS", data: "fastMove", render: function (data, type, pokemon) {
                var eps = data.energyGain / data.duration;
                return eps.toFixed(3);
            }
        }, {
            title: "DPS", data: "fastMove", render: function (data, type, pokemon) {
                var dps = data.damage / data.duration;
                dps *= getTypeModifier(data);
                return dps.toFixed(3);
            }
        }, {
            title: "STAB DPS", data: "fastMove", render: function (data, type, pokemon) {
                var dps = pokemon.getSTABDamage(data) / data.duration;
                dps *= getTypeModifier(data);
                return dps.toFixed(3);
            }
        }, {
            title: "Adjusted DPS", data: "fastMove", render: function (data, type, pokemon) {
                var dps = (pokemon.attack + 7) * pokemon.getSTABDamage(data) / data.duration / 2;
                dps *= getTypeModifier(data);
                return dps.toFixed(3);
            }
        }, {title: "Move Name", data: "chargeMove.name"}, {
            title: "Type", data: "chargeMove.type.name", render: function (data, type, pokemon) {
                return capitalize(data);
            }
        }, {title: "Pow", data: "chargeMove.damage"}, {title: "Duration", data: "chargeMove.duration"}, {
            title: "Energy", data: "chargeMove.energyRequired", render: function (data, type, pokemon) {
                return Math.round(data * 100) / 100 + "%"; // round to 2 decimal places
            }
        }, {
            title: "Crit %", data: "chargeMove.critChance", render: function (data, type, pokemon) {
                return data * 100 + "%"; // convert to percent
            }
        }, {
            title: "DPS", data: "chargeMove", render: function (data, type, pokemon) {
                var dps = data.damage / data.duration;
                dps *= getTypeModifier(data);
                if (CALCULATE_CRIT) {
                    dps *= (data.critChance / 2 + 1)
                }
                return dps.toFixed(3);
            }
        }, {
            title: "STAB DPS", data: "chargeMove", render: function (data, type, pokemon) {
                var dps = pokemon.getSTABDamage(data) / data.duration;
                dps *= getTypeModifier(data);
                if (CALCULATE_CRIT) {
                    dps *= (data.critChance / 2 + 1)
                }
                return dps.toFixed(3);
            }
        }, {
            title: "Adjusted DPS", data: "chargeMove", render: function (data, type, pokemon) {
                var dps = (pokemon.attack + 7) * pokemon.getSTABDamage(data) / (data.duration + 0.5) / 2;
                dps *= getTypeModifier(data);
                if (CALCULATE_CRIT) {
                    dps *= (data.critChance / 2 + 1)
                }
                return dps.toFixed(3);
            }
        }, {
            title: "DPS", data: null, render: function (data, type, pokemon) {
                return calculateDPS(pokemon, false).toFixed(3);
            }
        }, {
            title: "STAB DPS", data: null, render: function (data, type, pokemon) {
                return calculateDPS(pokemon, true).toFixed(3);
            }
        }, {
            title: "Adjusted DPS", data: null, render: function (data, type, pokemon) {
                var dps = (pokemon.attack + 7) * calculateDPS(pokemon, true) / 2;
                return dps.toFixed(3);
            }
        }, {
            title: "STAB Offensive Rating", data: null, render: function (data, type, pokemon) {
                var dps = (pokemon.attack + 7) * (pokemon.stamina + 7) * (pokemon.defense + 7) * calculateDPS(pokemon, true) / 100 / 1000;
                return dps.toFixed(1);
            }
        }, {
            title: "Rank", data: null, orderable: false
        }],
        autoWidth: true,
        pageLength: 50,
        order: [[pokemonHeaderLength + fastHeaderLength + chargeHeaderLength + totalDpsHeaderLength - 2, "desc"]],
        buttons: [{text: "Visibility Options"}, 'columnsToggle'],
        search: {
            regex: true, smart: false, caseInsensitive: true
        }, // responsive: true, // paging: false,
        dom: "<'row'<'col-sm-12'B>><'row'<'col-sm-6'f><'col-sm-6'l>>" + "<'row'<'col-sm-12'tr>>" + "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        columnDefs: [{
            //     targets: 0, width: "2%"
            // }, {
            //     targets: 1, width: "6%"
            // }, {
            // targets: [0, 3, 4, 5, 7,8,9,10,11,12,13,14,17,18,19,20,21,22,23,24,25,26,27, 15, 16, 17], width: "0"
        }, {
            targets: [2, 6, 15], width: "6%"
        }, {
            //     targets: 10, width: "7%"
            // }, {
            className: "fast-move-highlight", targets: (function () {
                var cols = [];
                for (var i = 0; i < fastHeaderLength; i++) {
                    cols.push(pokemonHeaderLength + i);
                }
                return cols;
            })()
        }, {
            className: "charge-move-highlight", targets: (function () {
                var cols = [];
                for (var i = 0; i < chargeHeaderLength; i++) {
                    cols.push(pokemonHeaderLength + fastHeaderLength + i);
                }
                return cols;
            })()
            // }, {
            //     targets: [0, 1, 3, 10, 18, 19], responsivePriority: 0
            // }, {
            //     targets: [8, 9, 16, 17], responsivePriority: 1
            // }, {
            //     targets: [2, 4, 11], responsivePriority: 2
        }]
    });

    dataTable.on("init", function () {
        var header = $("<tr id='top-column-header'></tr>");
        header.append("<th id='pokemon-header' colspan='" + pokemonHeaderLength + "'>Pokémon</th>");
        header.append("<th id='fast-header' colspan='" + fastHeaderLength + "' class='fast-move-highlight'>Fast Move</th>");
        header.append("<th id='charge-header' colspan='" + chargeHeaderLength + "' class='charge-move-highlight'>Charge Move</th>");
        header.append("<th id='total-dps-header' colspan='" + totalDpsHeaderLength + "'>Fast & Charge</th>");
        $('#data-table thead').prepend(header);
        // dataTable.search(jsVars.search).draw();
        dataTable.search(queryObject.search).draw();
        $('#data-table').stickyTableHeaders();
        inited = true;
    });

    dataTable.on('buttons-action', function (e, buttonApi, dataTable, node, config) {
        var adjustment = node.hasClass("active") ? 1 : -1;
        var col = config.columns;
        var header = getTopHeader(col);
        header.attr('colspan', parseInt(header.attr('colspan')) + adjustment);
    });

    $("#data-table_filter input").on("keypress", function (event) {
        if (event.keyCode == 124) {
            dataTable.search("").draw();
        }
    });

    $("#data-table_filter input").on("keyup", function (event) {
        var search = dataTable.search();
        queryObject.search = search;
        updateQuery();
    });

    dataTable.on('order.dt', function () {
        if (typeof ga !== 'undefined') {
            if (inited) {
                var column = dataTable.order()[0][0];
                var header = getTopHeader(column);
                var headerText = $(dataTable.column(column).header()).text();
                var sortingEvent = header.text() + " " + headerText + " " + dataTable.order()[0][1];
                ga('send', 'event', 'Sort', sortingEvent);
            }
        }
    });

    dataTable.on('order.dt search.dt', function () {
        var column = dataTable.order()[0][0];
        var desc = dataTable.order()[0][1] == "desc";
        var rows = dataTable.column(column, {order: 'applied'}).nodes();
        var numberOfColumns = dataTable.settings().columns()[0].length;
        var ranks = dataTable.column(numberOfColumns - 1).nodes();
        var isPokemon = column < pokemonHeaderLength;
        if ([0, 1, 2, 7, 8, 16, 17].indexOf(column) != -1) {
            desc = !desc;
        }
        dataTable.column(dataTable.settings().columns()[0].length - 1, {order: 'applied'}).nodes().each(function (cell, i) {
            if (i == 0 && desc) {
                cell.innerHTML = 1;
            } else {
                if (desc) {
                    if ($(rows[i - 1]).text() == $(rows[i]).text()) {
                        cell.innerHTML = $(ranks[i - 1]).text();
                    } else {
                        cell.innerHTML = i + 1;
                    }
                } else {
                    var count = 0;
                    while ($(rows[i + count]).text() == $(rows[i + count + 1]).text()) {
                        count++;
                    }
                    cell.innerHTML = rows.length - i - count;
                }
            }
        });
    }).draw();
});

$('a.modal-trigger').on('click', function () {
    if (typeof ga !== 'undefined') {
        ga('send', 'event', 'Modal', "Opened Modal: " + $(this).text());
    }
});

$("#refresh").on("click", function () {
    if (moment().isBefore(jsVars.nextClientRefreshTime)) {
        var timeUntilRefresh = moment.preciseDiff(moment(jsVars.nextClientRefreshTime), moment());
        showAlert("This site has already been updated recently, you can update it again in <span id='refresh-time'>" + timeUntilRefresh + "</span>",
            "alert-danger");
        if (typeof ga !== 'undefined') {
            ga('send', 'event', 'Reload', "Reload Client Rejected");
        }
    } else {
        if (typeof ga !== 'undefined') {
            ga('send', 'event', 'Reload', "Reload Client Accepted");
        }
        $(location).attr('href', '/refresh');
    }
});

function updateQuery() {
    var queryStr = encodeQueryData(queryObject);
    window.history.replaceState("page1", "title", "?" + queryStr);
}

function encodeQueryData(data) {
    // var ret = [];
    // for (var d in data) {
    //     if (data[d] && data[d].length > 0) {
    //         ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
    //     }
    // }
    // return ret.join("&");
    var arr = {};
    for (var i in data) {
        if (data[i] && data[i].length > 0) {
            if (Array.isArray(data[i])) {
                arr[i] = data[i].join(" ");
            } else {
                arr[i] = data[i];
            }
        }
    }
    return $.param(arr);
}

var closeAlert;
function showAlert(message, alertType) {
    if ($('#alert-placeholder').html() == "") {
        clearTimeout(closeAlert);
        $('#alert-placeholder').append(
            '<div id="alertdiv" class="alert ' + alertType + '"><a class="close" data-dismiss="alert">×</a><span>' + message + '</span></div>')
        var countdown = setInterval(function () {
            if (moment().isAfter(jsVars.nextClientRefreshTime)) {
                $('#alertdiv').removeClass(alertType);
                $('#alertdiv').addClass("alert-success");
                $('#alertdiv > span').text("You can now reload the sites data");
                clearInterval(countdown);
            } else {
                $('#refresh-time').text(moment.preciseDiff(moment(jsVars.nextClientRefreshTime), moment()));
            }
        }, 1000);
        closeAlert = setTimeout(function () { // this will automatically close the alert and remove this if the users doesnt close it in 5 secs
            $("#alertdiv").remove();
        }, 5000);
    }
}

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1)
}
