// var poke = new Pokemon(1, "work", null, null,  "bug", "grass");
// console.log(poke.getSTABDamage({"id":"100","name":"X-Scissor","class":"Special","damage":35,"duration":2.1,"type":{"name":"bug","weaknesses":[]}}));
// new Pokemon(poke);
$(document).ready(function () {
    dataTable = $('#data-table').DataTable({
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
        }, {title: "Move Name", data: "fastMove.name"}, {
            title: "Type", data: "fastMove.type.name", render: function (data, type, pokemon) {
                return capitalize(data);
            }
        }, {title: "Damage", data: "fastMove.damage"},
            {title: "Duration", data: "fastMove.duration"},
            {title: "Energy Gain", data: "fastMove.energyGain"}, {
                title: "DPS", data: "fastMove", render: function (data, type, pokemon) {
                    var dps = data.damage / data.duration;
                    return dps.toFixed(3);
                }
            }, {
                title: "STAB DPS", data: "fastMove", render: function (data, type, pokemon) {
                    var dps = pokemon.getSTABDamage(data) / data.duration;
                    return dps.toFixed(3);
                }
            }, {title: "Move Name", data: "chargeMove.name"}, {
                title: "Type", data: "chargeMove.type.name", render: function (data, type, pokemon) {
                    return capitalize(data);
                }
            }, {title: "Damage", data: "chargeMove.damage"},
            {title: "Duration", data: "chargeMove.duration"}, {
                title: "Energy Required",
                data: "chargeMove.energyRequired",
                render: function (data, type, pokemon) {
                    return Math.round(data * 100) / 100; // round to 2 decimal places
                }
            }, {
                title: "Crit Chance",
                data: "chargeMove.critChance",
                render: function (data, type, pokemon) {
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
                title: "DPS", data: null, render: function (data, type, pokemon) {
                    var fm = pokemon.fastMove;
                    var cm = pokemon.chargeMove;
                    var dps = ((2 * fm.damage * cm.energyRequired) + (fm.energyGain * cm.damage * cm.critChance) +
                        (2 * fm.energyGain * cm.damage)) /
                        (2 * (fm.energyGain * cm.duration + fm.duration * cm.energyRequired));
                    return dps.toFixed(3);
                }
            }, {
                title: "STAB DPS", data: null, render: function (data, type, pokemon) {
                    var fm = pokemon.fastMove;
                    var cm = pokemon.chargeMove;
                    var fmDamage = pokemon.getSTABDamage(fm);
                    var cmDamage = pokemon.getSTABDamage(cm);
                    var dps = ((2 * fmDamage * cm.energyRequired) + (fm.energyGain * cmDamage * cm.critChance) +
                        (2 * fm.energyGain * cmDamage)) /
                        (2 * (fm.energyGain * cm.duration + fm.duration * cm.energyRequired));
                    return dps.toFixed(3);
                }
            }], pageLength: 50, order: [[19, "desc"]], autoWidth: true, scrollY: '50vh', scrollCollapse: true,
        columnDefs: [
            {
                targets: 0, width: "5%"
            }, {
                targets: 2, width: "10%"
            }, {
                targets: 3, width: "10%"
            }]
    });
    dataTable.on("init", function() {
        var header = $("<tr id='top-column-header'></tr>");
        header.append("<th colspan='3'>Pokemon</th>");
        header.append("<th colspan='7'>Fast Move</th>");
        header.append("<th colspan='8'>Charge Move</th>");
        header.append("<th colspan='2'>Fast & Charge</th>");
        $('.dataTables_scrollHeadInner thead').prepend(header);
        // todo my the sections more distinct
        console.log("inited");
    });
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
                $('#alertdiv > span').text("You can now reload the sites data")
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
