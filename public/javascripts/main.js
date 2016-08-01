$(document).ready(function () {
    //$('#data-table').DataTable({
    //    data: dataSet, columns: [{title: '#'}, {title: 'Name'}, {title: 'Fast Moves'}, {title: 'Charge Moves'}]
    //});
    console.log("here");
    console.log(jsVars.nextClientRefreshTime);
    dataTable = $('#data-table').DataTable({
        ajax: {
            url: "/data", dataSrc: function (jsonStr) {
                return CircularJSON.parse(JSON.stringify(jsonStr)).data;
            }
        },
        columns: [{title: "#", data: "number"}, {title: "Name", data: "name"},
            {title: "Fast Move", data: "fastMove.name"}, {
                title: "Fast Move Type", data: "fastMove.type.name", render: function (data, type, row) {
                    return data[0].toUpperCase() + data.slice(1); // capitalize first letter
                }
            }, {title: "Fast Move Damage", data: "fastMove.damage"},
            {title: "Fast Move Duration", data: "fastMove.duration"},
            {title: "Fast Move Energy Gain", data: "fastMove.energyGain"}, {
                title: "Fast Move DPS", data: "fastMove", render: function (data, type, row) {
                    var dps = data.damage / data.duration;
                    return dps.toFixed(3);
                }
            }, {title: "Charge Move", data: "specialMove.name"}, {
                title: "Charge Move Type", data: "specialMove.type.name", render: function (data, type, row) {
                    return data[0].toUpperCase() + data.slice(1); // capitalize first letter
                }
            }, {title: "Charge Move Damage", data: "specialMove.damage"},
            {title: "Charge Move Duration", data: "specialMove.duration"}, {
                title: "Charge Move Energy Required",
                data: "specialMove.energyRequired",
                render: function (data, type, row) {
                    return Math.round(data * 100) / 100; // round to 2 decimal places
                }
            }, {
                title: "Charge Move Crit Chance", data: "specialMove.critChance", render: function (data, type, row) {
                    return data * 100 + "%"; // convert to percent
                }
            }, {
                title: "Charge Move DPS", data: "specialMove", render: function (data, type, row) {
                    var dps = data.damage * (data.critChance / 2 + 1) / data.duration;
                    return dps.toFixed(3);
                }
            }, {
                title: "Total DPS", data: null, render: function (data, type, row) {
                    var fm = row.fastMove;
                    var cm = row.specialMove;
                    var dps = ((2 * fm.damage * cm.energyRequired) + (fm.energyGain * cm.damage * cm.critChance) +
                        (2 * fm.energyGain * cm.damage)) /
                        (2 * (fm.energyGain * cm.duration + fm.duration * cm.energyRequired));
                    return dps.toFixed(3);
                }
            }],
        pageLength: 50,
        order: [[15, "desc"]],
        autoWidth: true, // columnDefs: [
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
        showAlert("This site has already been updated recently, you can update it again in <span id='refresh-time'>" + timeUntilRefresh + "</span>", "alert-danger");
    } else {
        $(location).attr('href', '/refresh');
    }
});

var closeAlert;
function showAlert(message, alertType) {
    if ($('#alert-placeholder').html() == "") {
        clearTimeout(closeAlert);
        $('#alert-placeholder').append('<div id="alertdiv" class="alert ' + alertType + '"><a class="close" data-dismiss="alert">×</a><span>' + message + '</span></div>')
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
