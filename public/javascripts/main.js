$(document).ready(function () {
    //$('#data-table').DataTable({
    //    data: dataSet, columns: [{title: '#'}, {title: 'Name'}, {title: 'Fast Moves'}, {title: 'Special Moves'}]
    //});
    console.log("here");
    dataTable = $('#data-table').DataTable({
        ajax: {
            url: "/data", dataSrc: function (jsonStr) {
                return CircularJSON.parse(JSON.stringify(jsonStr)).data;
            }
        },
        columns: [{title: "#", data: "number"}, {title: "Name", data: "name"},
            {title: "Fast Move", data: "fastMove.name"}, {title: "Fast Move Damage", data: "fastMove.damage"},
            {title: "Special Move", data: "specialMove.name"},
            {title: "Special Move Damage", data: "specialMove.damage"}],
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


