// var poke = new Pokemon(1, "work", null, null,  "bug", "grass");
// console.log(poke.getSTABDamage({"id":"100","name":"X-Scissor","class":"Special","damage":35,"duration":2.1,"type":{"name":"bug","weaknesses":[]}}));
// new Pokemon(poke);
$(document).ready(function () {
    //$('#data-table').DataTable({
    //    data: dataSet, columns: [{title: '#'}, {title: 'Name'}, {title: 'Fast Moves'}, {title: 'Charge Moves'}]
    //});
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
        }, {title: "Fast Move", data: "fastMove.name"}, {
            title: "Fast Move Type", data: "fastMove.type.name", render: function (data, type, pokemon) {
                return capitalize(data);
            }
        }, {title: "Fast Move Damage", data: "fastMove.damage"},
            {title: "Fast Move Duration", data: "fastMove.duration"},
            {title: "Fast Move Energy Gain", data: "fastMove.energyGain"}, {
                title: "Fast Move DPS", data: "fastMove", render: function (data, type, pokemon) {
                    var dps = data.damage / data.duration;
                    return dps.toFixed(3);
                }
            }, {
                title: "Fast Move STAB DPS", data: "fastMove", render: function (data, type, pokemon) {
                    var dps = pokemon.getSTABDamage(data) / data.duration;
                    return dps.toFixed(3);
                }
            }, {title: "Charge Move", data: "chargeMove.name"}, {
                title: "Charge Move Type", data: "chargeMove.type.name", render: function (data, type, pokemon) {
                    return capitalize(data);
                }
            }, {title: "Charge Move Damage", data: "chargeMove.damage"},
            {title: "Charge Move Duration", data: "chargeMove.duration"}, {
                title: "Charge Move Energy Required",
                data: "chargeMove.energyRequired",
                render: function (data, type, pokemon) {
                    return Math.round(data * 100) / 100; // round to 2 decimal places
                }
            }, {
                title: "Charge Move Crit Chance", data: "chargeMove.critChance", render: function (data, type, pokemon) {
                    return data * 100 + "%"; // convert to percent
                }
            }, {
                title: "Charge Move DPS", data: "chargeMove", render: function (data, type, pokemon) {
                    var dps = data.damage * (data.critChance / 2 + 1) / data.duration;
                    return dps.toFixed(3);
                }
            }, {
                title: "Charge Move STAB DPS", data: "chargeMove", render: function (data, type, pokemon) {
                    var dps = pokemon.getSTABDamage(data) * (data.critChance / 2 + 1) / data.duration;
                    return dps.toFixed(3);
                }
            }, {
                title: "Total DPS", data: null, render: function (data, type, pokemon) {
                    var fm = pokemon.fastMove;
                    var cm = pokemon.chargeMove;
                    var dps = ((2 * fm.damage * cm.energyRequired) + (fm.energyGain * cm.damage * cm.critChance) +
                        (2 * fm.energyGain * cm.damage)) /
                        (2 * (fm.energyGain * cm.duration + fm.duration * cm.energyRequired));
                    return dps.toFixed(3);
                }
            },{
                title: "Total STAB DPS", data: null, render: function (data, type, pokemon) {
                    var fm = pokemon.fastMove;
                    var cm = pokemon.chargeMove;
                    var fmDamage = pokemon.getSTABDamage(fm);
                    var cmDamage = pokemon.getSTABDamage(cm);
                    var dps = ((2 * fmDamage * cm.energyRequired) + (fm.energyGain * cmDamage * cm.critChance) +
                        (2 * fm.energyGain * cmDamage)) /
                        (2 * (fm.energyGain * cm.duration + fm.duration * cm.energyRequired));
                    return dps.toFixed(3);
                }
            }], pageLength: 50, order: [[19, "desc"]], autoWidth: true, // columnDefs: [
        //     {targets: 0, width: "5%"},{
        //     render: function (data, type, row) {
        //         return data.name;
        //     }, targets: 2, width: "10%"
        // }, {
        //     render: function (data) {
        //         return data.damage || "Loading";
        //     }, targets: 3, width: "10%"
        // }]
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
