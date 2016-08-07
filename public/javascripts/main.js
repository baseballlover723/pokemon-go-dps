// I got my math equation from http://www.codecogs.com/latex/eqneditor.php with comic sans and 12pt font
// dps = \frac{\frac{cm.energy}{fm.energy} * fm.power + cm.power(1+\frac{cm.crit}{2})}{\frac{cm.energy}{fm.energy} *
// fm.duration + cm.duration + 0.5} offensive power rating at 10pt with 150 resolution OffensivePowerRating =
// \frac{(pokemon.attack + 7) * (pokemon.stamina + 7) * stabDps}{1000}
String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
$(document).ready(function () {
    $('#last-update-time').text(moment.tz(jsVars.lastUpdatedTime, moment.tz.guess()).format("LLLL z"));
    $('#next-update-time').text(moment.tz(jsVars.nextUpdateTime, moment.tz.guess()).format("LLLL z"));

    var dataTable = $('#data-table').DataTable({
        ajax: {
            url: "/data", dataSrc: function (jsonStr) {
                var pokemons = CircularJSON.parse(JSON.stringify(jsonStr)).data;
                for (var index in pokemons) {
                    pokemons[index] = new Pokemon(pokemons[index]);
                }
                return pokemons;
            }
        }, columns: [{
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
        }, {title: "Sta", data: "stamina"}, {title: "Att", data: "attack"}, {title: "Def", data: "defense"},
            {title: "Move Name", data: "fastMove.name"}, {
                title: "Type", data: "fastMove.type.name", render: function (data, type, pokemon) {
                    return capitalize(data);
                }
            }, {title: "Pow", data: "fastMove.damage"}, {title: "Duration", data: "fastMove.duration"},
            {title: "Energy", data: "fastMove.energyGain"}, {
                title: "DPS", data: "fastMove", render: function (data, type, pokemon) {
                    var dps = data.damage / data.duration;
                    return dps.toFixed(3);
                }
            }, {
                title: "STAB DPS", data: "fastMove", render: function (data, type, pokemon) {
                    var dps = pokemon.getSTABDamage(data) / data.duration;
                    return dps.toFixed(3);
                }
            }, {
                title: "STAB Offensive Rating", data: "fastMove", render: function (data, type, pokemon) {
                    var dps = pokemon.attack * pokemon.getSTABDamage(data) / data.duration;
                    return dps.toFixed(3);
                }
            }, {title: "Move Name", data: "chargeMove.name"}, {
                title: "Type", data: "chargeMove.type.name", render: function (data, type, pokemon) {
                    return capitalize(data);
                }
            }, {title: "Pow", data: "chargeMove.damage"}, {title: "Duration", data: "chargeMove.duration"}, {
                title: "Energy", data: "chargeMove.energyRequired", render: function (data, type, pokemon) {
                    return Math.round(data * 100) / 100; // round to 2 decimal places
                }
            }, {
                title: "Crit %", data: "chargeMove.critChance", render: function (data, type, pokemon) {
                    return data * 100 + "%"; // convert to percent
                }
            }, {
                title: "DPS", data: "chargeMove", render: function (data, type, pokemon) {
                    var dps = data.damage * (data.critChance / 2 + 1) / data.duration;
                    return dps.toFixed(3);
                }
            }, {
                title: "STAB DPS", data: "chargeMove", render: function (data, type, pokemon) {
                    var dps = pokemon.getSTABDamage(data) * (data.critChance / 2 + 1) / data.duration;
                    return dps.toFixed(3);
                }
            }, {
                title: "STAB Offensive Rating", data: "chargeMove", render: function (data, type, pokemon) {
                    var dps = pokemon.attack * pokemon.getSTABDamage(data) * (data.critChance / 2 + 1) /
                        (data.duration + 0.5);
                    return dps.toFixed(3);
                }
            }, {
                title: "DPS", data: null, render: function (data, type, pokemon) {
                    var fm = pokemon.fastMove;
                    var cm = pokemon.chargeMove;
                    var dps = ((cm.energyRequired * fm.damage / fm.energyGain) +
                        (cm.damage * (1 + cm.critChance / 2))) /
                        ((cm.energyRequired * fm.duration / fm.energyGain) + cm.duration + 0.5);
                    return dps.toFixed(3);
                }
            }, {
                title: "STAB DPS", data: null, render: function (data, type, pokemon) {
                    var fm = pokemon.fastMove;
                    var cm = pokemon.chargeMove;
                    var fmDamage = pokemon.getSTABDamage(fm);
                    var cmDamage = pokemon.getSTABDamage(cm);
                    var dps = ((cm.energyRequired * fmDamage / fm.energyGain) + (cmDamage * (1 + cm.critChance / 2))) /
                        ((cm.energyRequired * fm.duration / fm.energyGain) + cm.duration + 0.5);
                    return dps.toFixed(3);
                }
            }, {
                title: "STAB Offensive Rating", data: null, render: function (data, type, pokemon) {
                    var fm = pokemon.fastMove;
                    var cm = pokemon.chargeMove;
                    var fmDamage = pokemon.getSTABDamage(fm);
                    var cmDamage = pokemon.getSTABDamage(cm);
                    var dps = (pokemon.attack + 7) * (pokemon.stamina + 7) *
                        ((cm.energyRequired * fmDamage / fm.energyGain) + (cmDamage * (1 + cm.critChance / 2))) /
                        ((cm.energyRequired * fm.duration / fm.energyGain) + cm.duration + 0.5) / 1000;
                    return dps.toFixed(1);
                }
            }, {
                title: "Rank", data: null
            }], buttons: [{text: "Visibility Options"}, {
            action: function (e, dt, node, config) {
                console.log(e);
                console.log(dt);
                console.log(node);
                console.log(config);
                alert('Activated!');
                // this.disable(); // disable button
            }, extend: 'columnsToggle'
        }], autoWidth: true, pageLength: 50, order: [[25, "desc"]], search: {
            regex: true, smart: false, caseInsensitive: true
        }, // responsive: true, // paging: false,
        dom: "<'row'<'col-sm-12'B>><'row'<'col-sm-6'f><'col-sm-6'l>>" + "<'row'<'col-sm-12'tr>>" +
        "<'row'<'col-sm-5'i><'col-sm-7'p>>", columnDefs: [{
            //     targets: 0, width: "2%"
            // }, {
            //     targets: 1, width: "6%"
            // }, {
            targets: [0, 5, 6, 7, 13, 14, 15, 16], width: "0"
        }, {
            targets: [2, 6, 14], width: "6%"
        }, {
            //     targets: 10, width: "7%"
            // }, {
            targets: [6, 7, 8, 9, 10, 11, 12, 13], className: "fast-move-highlight"
        }, {
            targets: [14, 15, 16, 17, 18, 19, 20, 21, 22], className: "charge-move-highlight"
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
        header.append("<th id='pokemon-header' colspan='6'>Pokemon</th>");
        header.append("<th id='fast-header' colspan='8' class='fast-move-highlight'>Fast Move</th>");
        header.append("<th id='charge-header' colspan='9' class='charge-move-highlight'>Charge Move</th>");
        header.append("<th id='total-dps-header' colspan='4'>Fast & Charge</th>");
        $('#data-table thead').prepend(header);
        dataTable.search(jsVars.search).draw();
        $('#data-table').stickyTableHeaders();
    });

    dataTable.on('buttons-action', function (e, buttonApi, dataTable, node, config) {
        var adjustment = node.hasClass("active") ? 1 : -1;
        var col = config.columns;
        if (col < 6) {
            $('#pokemon-header').attr("colspan", parseInt($("#pokemon-header").attr("colspan")) + adjustment);
        } else if (col < 14) {
            $('#fast-header').attr("colspan", parseInt($("#fast-header").attr("colspan")) + adjustment);
        } else if (col < 23) {
            $('#charge-header').attr("colspan", parseInt($("#charge-header").attr("colspan")) + adjustment);
        } else {
            $('#total-dps-header').attr("colspan", parseInt($("#total-dps-header").attr("colspan")) + adjustment);
        }
    });

    $("#data-table_filter input").on("keypress", function (event) {
        if (event.keyCode == 124) {
            dataTable.search("").draw();
        }
    });

    $("#data-table_filter input").on("keyup", function (event) {
        var search = dataTable.search();
        window.history.replaceState("page1", "title", "?search=" + search.replaceAll("#", "%23"));
    });

    dataTable.on('order.dt search.dt', function () {
        var column = dataTable.order()[0][0];
        var desc = dataTable.order()[0][1] == "desc";
        var rows = dataTable.column(column, {order: 'applied'}).nodes();
        var ranks = dataTable.column(26).nodes();
        if ([0, 1, 2, 6, 7, 14, 15].indexOf(column) != -1) {
            desc = !desc;
        }
        dataTable.column(26, {order: 'applied'}).nodes().each(function (cell, i) {
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
    // dataTable.on("responsive-resize", function (e, datatable, columns) {
    //     var pokemonStart = 0;
    //     var fastHeader = 3;
    //     var chargeHeader = 10;
    //     var totalDpsHeader = 18;
    //
    //     var pokemon = 0;
    //     var fast = 0;
    //     var charge = 0;
    //     var total = 0;
    //     for (var i in columns) {
    //         if (i >= pokemonStart && i < fastHeader) {
    //             if (columns[i]) {
    //                 pokemon++;
    //             }
    //         } else if (i >= fastHeader && i < chargeHeader) {
    //             if (columns[i]) {
    //                 fast++;
    //             }
    //         } else if (i >= chargeHeader && i < totalDpsHeader) {
    //             if (columns[i]) {
    //                 charge++;
    //             }
    //         } else {
    //             if (columns[i]) {
    //                 total++;
    //             }
    //         }
    //     }
    //     $('#pokemon-header').attr("colspan", pokemon);
    //     $('#fast-header').attr("colspan", fast);
    //     $('#charge-header').attr("colspan", charge);
    //     $('#total-dps-header').attr("colspan", total);
    //     console.log([pokemon, fast, charge, total]);
    //     console.log($('#charge-header').attr("colspan"));
    //     console.log($('#total-dps-header').attr("colspan"));
    //     console.log("resize");
    // });
});

$("#refresh").on("click", function () {
    console.log("clicked");
    if (moment().isBefore(jsVars.nextClientRefreshTime)) {
        var timeUntilRefresh = moment.preciseDiff(moment(jsVars.nextClientRefreshTime), moment());
        showAlert("This site has already been updated recently, you can update it again in <span id='refresh-time'>" +
            timeUntilRefresh + "</span>", "alert-danger");
    } else {
        $(location).attr('href', '/refresh');
    }
});

var closeAlert;
function showAlert(message, alertType) {
    if ($('#alert-placeholder').html() == "") {
        clearTimeout(closeAlert);
        $('#alert-placeholder').append(
            '<div id="alertdiv" class="alert ' + alertType + '"><a class="close" data-dismiss="alert">×</a><span>' +
            message + '</span></div>')
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
