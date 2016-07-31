$(document).ready(function () {
    //$('#data-table').DataTable({
    //    data: dataSet, columns: [{title: '#'}, {title: 'Name'}, {title: 'Quick Moves'}, {title: 'Special Moves'}]
    //});
    console.log("here");
    dataTable = $('#data-table').DataTable({
        ajax: {
            url: "/data", dataSrc: "data"
        },
        columns: [{title: "#", data: "number"}, {title: "Name", data: "name"},
            {title: "Quick Move", data: "quickMove.name"}, {title: "Quick Move Damage", data: "quickMove.damage"},
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


