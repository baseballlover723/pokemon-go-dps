$(document).ready(function () {
    //$('#data-table').DataTable({
    //    data: dataSet, columns: [{title: '#'}, {title: 'Name'}, {title: 'Fast Moves'}, {title: 'Charge Moves'}]
    //});
    console.log("here");
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
                    // TODO wrong
                    var dps = ((2 * fm.damage * cm.energyRequired) + (fm.energyGain * cm.damage * cm.critChance) +
                        (2 * fm.energyGain * cm.damage)) /
                        (2 * (fm.energyGain * cm.duration + fm.duration * cm.energyRequired));
                    return dps.toFixed(3);
                }
            }],
        pageLength: 50,
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


