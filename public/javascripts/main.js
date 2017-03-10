// I got my math equation from http://www.codecogs.com/latex/eqneditor.php with comic sans and 12pt font
// dps = \frac{\frac{cm.energy}{fm.energy} * fm.power + cm.power(1+\frac{cm.crit}{2})}{\frac{cm.energy}{fm.energy} *
// fm.duration + cm.duration + 0.5} offensive power rating at 10pt with 150 resolution OffensivePowerRating =
// OffensiveRating = \frac{(pokemon.attack + 7) * (pokemon.stamina + 7) * (pokemon.defense + 7) * stabDps}{100,000}
// AdjustedDPS = \frac{(pokemon.attack + 7) * stabDps}{2}
var dataTable;
var inited = false;
var staticPokemons = [];
var moves = {};
var queryObject = {}; // {search : "", gym: int[id], toggleComboBox: int[index]}
for (var key in jsVars.query) {
  queryObject[key] = jsVars.query[key];
}

var pokemonHeaderLength = 7;
var fastHeaderLength = 9;
var chargeHeaderLength = 9;
var totalDpsHeaderLength = 7;

var DPS_COLUMNS = []; // these are the columns that need to be recalculated after adjusting the calculating types
var CHARGE_DELAY_COLUMNS = [];

var end = pokemonHeaderLength + fastHeaderLength;
for (var i = end - 3; i < end; i++) {
  DPS_COLUMNS.push(i); // dps columns are the last 3 of fast move
}

CHARGE_DELAY_COLUMNS.push(end + 3); // duration column is 4 past the start of the charge columns
end += chargeHeaderLength;

for (var i = end - 3; i < end; i++) {
  DPS_COLUMNS.push(i); // dps columns are the last 3 of charge move
  CHARGE_DELAY_COLUMNS.push(i); // changes based on charge delay
}
// end += totalDpsHeaderLength - 1;
for (var i = end; i < end + totalDpsHeaderLength - 1; i++) {
  DPS_COLUMNS.push(i); // dps columns are all of the total columns
  CHARGE_DELAY_COLUMNS.push(i); // changes based on charge delay
}

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

var types = {};

$('a.modal-trigger').on('click', function() {
  if (typeof ga !== 'undefined') {
    ga('send', 'event', 'Modal', "Opened Modal: " + $(this).text());
  }
});

$("#refresh").on("click", function() {
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

$('#slider').on("input", function() {
  var slider = $('#slider');
  $('#slider-value').text(slider.val());
  SUPER_EFFECTIVE = slider.val();
  NOT_EFFECTIVE = 1 / SUPER_EFFECTIVE;
  calculateTypeModifiers(false);
});

$('#slider').on("change", function() {
  if (typeof ga !== 'undefined') {
    ga('send', 'event', 'Super Effective Modifier', "Changed Value to " + $('#slider').val());
  }
  calculateTypeModifiers();
});

$('#charge-delay-slider').on("input", function() {
  var slider = $('#charge-delay-slider');
  $('#charge-delay-slider-value').text(slider.val());
  CHARGE_DELAY = parseFloat(slider.val());
});

$('#charge-delay-slider').on("change", function() {
  calculateChargeDelay();
});

$('#global-defender-toggle').change(function() {
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

function loadStaticPokemonAndTypes(data) {
  // staticPokemons;
  SUPER_EFFECTIVE = data.superEffectiveModifier;
  NOT_EFFECTIVE = 1 / SUPER_EFFECTIVE;
  STAB = data.stabModifier;

  for (var type in data.types) {
    type = data.types[type];
    types[type.id] = (new Type(type.name));
  }
  for (var type in data.types) {
    type = data.types[type];
    var typeObject = types[type.id];
    for (var weakness in type.weaknesses) {
      weakness = type.weaknesses[weakness];
      typeObject.weaknesses.push(types[weakness.id]);
    }
    for (var strength in type.strengths) {
      strength = type.strengths[strength];
      typeObject.strengths.push(types[strength.id]);
    }
  }

  for (var pokemonHash in data.pokemons) {
    var pokemonHash = data.pokemons[pokemonHash];
    var pokemon = new StaticPokemon(pokemonHash);
    pokemon.type1 = types[pokemonHash.type1Id];
    pokemon.type2 = types[pokemonHash.type2Id];
    staticPokemons.push(pokemon);
  }
  for (var type in types) {
    type = types[type];
    Type.typeModifiers[type.name] = 1;
  }

  removeTempComboBox();
  loadInitialComboBoxes();
  addDefenderComboBox();
  calculateTypeModifiers();
}

// check charge moves for name execptions: Wrap Pink
// datatables has an error
// moves should be done?
function loadMoves(fastMovesData, chargeMovesData) {
  for (var fastMoveData in fastMovesData) {
    fastMoveData = fastMovesData[fastMoveData];
    var fastMove = new FastMove(fastMoveData);
    fastMove.type = types[fastMoveData.TypeId];
    moves[fastMove.id] = fastMove;
  }
  for (var chargeMoveData in chargeMovesData) {
    chargeMoveData = chargeMovesData[chargeMoveData];
    var chargeMove = new ChargeMove(chargeMoveData);
    chargeMove.type = types[chargeMoveData.TypeId];
    moves[chargeMove.id] = chargeMove;
  }
}

function calculatePokemonCombinations() {
  var pokemons = [];
  for (var staticPokemon in staticPokemons) {
    staticPokemon = staticPokemons[staticPokemon];
    for (var fastMoveId in staticPokemon.fastMoveIds) {
      fastMoveId = staticPokemon.fastMoveIds[fastMoveId];
      for (var chargeMoveId in staticPokemon.chargeMoveIds) {
        chargeMoveId = staticPokemon.chargeMoveIds[chargeMoveId];
        var pokemon = new Pokemon(staticPokemon);
        pokemon.fastMove = moves[fastMoveId];
        pokemon.chargeMove = moves[chargeMoveId];
        pokemons.push(pokemon);
      }
    }
  }
  return pokemons;
}

$(document).ready(function() {
  $('#last-update-time').text(moment.tz(jsVars.lastUpdatedTime, moment.tz.guess()).format("LLLL z"));
  $('#next-update-time').text(moment.tz(jsVars.nextUpdateTime, moment.tz.guess()).format("LLLL z"));
  $('#temp-select select').select2({
    placeholder: "Loading", allowClear: true
  });

  dataTable = $('#data-table').DataTable({
    ajax: {
      url: "/data", dataSrc: function(data) {
        loadStaticPokemonAndTypes(data);
        loadMoves(data.fastMoves, data.chargeMoves);
        var pokemons = calculatePokemonCombinations();
        return pokemons;
      }
    },
    columns: [{
      title: "#", data: "id", render: function(data, type, row) {
        if (type == "display") {
          return "#" + data;
        } else if (type == "filter") {
          return "#" + data + "#";
        } else {
          return data;
        }
      }
    }, {title: "Name", data: "name"}, {
      title: "Type(s)", data: null, render: function(data, type, pokemon) {
        if (pokemon.type2.name !== "None") {
          return capitalize(pokemon.type1.name) + " / " + capitalize(pokemon.type2.name);
        } else {
          return capitalize(pokemon.type1.name);
        }
      }
    }, {title: "Sta", data: "stamina"}, {title: "Att", data: "attack"}, {title: "Def", data: "defense"}, {
      title: "Total", data: "", render: function(data, type, pokemon) {
        return pokemon.stamina + pokemon.attack + pokemon.defense;
      }
    }, {title: "Move Name", data: "fastMove.name"}, {
      title: "Type", data: "fastMove.type.name", render: function(data, type, pokemon) {
        return capitalize(data);
      }
    }, {title: "Pow", data: "fastMove.damage"}, {title: "Duration", data: "fastMove.duration"}, {
      title: "Energy", data: "fastMove.energyGain", render: function(data, type, pokemon) {
        return data + "%";
      }
    }, {
      title: "EPS", data: "fastMove", render: function(data, type, pokemon) {
        var eps = data.energyGain / data.duration;
        return eps.toFixed(3);
      }
    }, {
      title: "DPS", data: "fastMove", render: function(data, type, pokemon) {
        var dps = pokemon.calculateFastMoveDPS({stab: false});
        return dps.toFixed(3);
      }
    }, {
      title: "STAB DPS", data: "fastMove", render: function(data, type, pokemon) {
        var dps = pokemon.calculateFastMoveDPS({stab: true});
        return dps.toFixed(3);
      }
    }, {
      title: "Adjusted DPS", data: "fastMove", render: function(data, type, pokemon) {
        var dps = pokemon.calculateFastMoveDPS({stab: true});
        dps *= (pokemon.attack + 7) / 2;
        return dps.toFixed(1);
      }
    }, {title: "Move Name", data: "chargeMove.name"}, {
      title: "Type", data: "chargeMove.type.name", render: function(data, type, pokemon) {
        return capitalize(data);
      }
    }, {title: "Pow", data: "chargeMove.damage"},
      {
        title: "Duration", data: "chargeMove.duration", render: function(data, type, pokemon) {
        var chargeDelayString = CHARGE_DELAY > 0 ? " + " + CHARGE_DELAY : "";
        return data + chargeDelayString;
      }
      }, {
        title: "Energy", data: "chargeMove.energyRequired", render: function(data, type, pokemon) {
          return Math.round(data * 100) / 100 + "%"; // round to 2 decimal places
        }
      }, {
        title: "Crit %", data: "chargeMove.critChance", render: function(data, type, pokemon) {
          return Math.round(data * 100) / 100 + "%"; // convert to percent
        }
      }, {
        title: "DPS", data: "chargeMove", render: function(data, type, pokemon) {
          var dps = pokemon.calculateChargeMoveDPS({stab: false});
          return dps.toFixed(3);
        }
      }, {
        title: "STAB DPS", data: "chargeMove", render: function(data, type, pokemon) {
          var dps = pokemon.calculateChargeMoveDPS({stab: true});
          return dps.toFixed(3);
        }
      }, {
        title: "Adjusted DPS", data: "chargeMove", render: function(data, type, pokemon) {
          var dps = pokemon.calculateChargeMoveDPS({stab: true, chargeDelay: true});
          dps *= (pokemon.attack + 7) / 2;
          return dps.toFixed(1);
        }
      }, {
        title: "DPS", data: null, render: function(data, type, pokemon) {
          return pokemon.calculateDPS({stab: false}).toFixed(3);
        }
      }, {
        title: "STAB DPS", data: null, render: function(data, type, pokemon) {
          return pokemon.calculateDPS({stab: true}).toFixed(3);
        }
      }, {
        title: "Charge Damage %", data: null, render: function(data, type, pokemon) {
          var percent = pokemon.calculateChargeMoveDamagePercent({stab: true});
          return percent.toFixed(2) + "%";
        }
      }, {
        title: "Duration", data: null, render: function(data, type, pokemon) {
          var duration = pokemon.calculateCycleDuration();
          return duration.toFixed(3);
        }
      }, {
        title: "Adjusted DPS", data: null, render: function(data, type, pokemon) {
          var dps = (pokemon.attack + 7) * pokemon.calculateDPS({stab: true}) / 2;
          return dps.toFixed(1);
        }
      }, {
        title: "STAB Offensive Rating", data: null, render: function(data, type, pokemon) {
          var dps = (pokemon.attack + 7) * (pokemon.stamina + 7) * (pokemon.defense + 7) * pokemon.calculateDPS({stab: true}) / 100 / 1000;
          return dps.toFixed(1);
        }
      }, {
        title: "Rank", data: null, orderable: false
      }],
    autoWidth: true,
    pageLength: 50,
    order: [[pokemonHeaderLength + fastHeaderLength + chargeHeaderLength + totalDpsHeaderLength - 2, "desc"]],
    buttons: [{text: "Export to Excel", extend: "excel"}, {text: "Visibility Options"}, 'columnsToggle'],
    search: {
      regex: true, smart: false, caseInsensitive: true
    }, // responsive: true, // paging: false,
    dom: "<'row'<'col-xs-12'B>><'row'<'col-xs-6'f><'col-xs-6'l>>" + "<'row'<'col-sm-12'tr>>" + "<'row'<'col-sm-5'i><'col-sm-7'p>>",
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
      className: "fast-move-highlight", targets: (function() {
        var cols = [];
        for (var i = 0; i < fastHeaderLength; i++) {
          cols.push(pokemonHeaderLength + i);
        }
        return cols;
      })()
    }, {
      className: "charge-move-highlight", targets: (function() {
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

  dataTable.on("init", function() {
    var header = $("<tr id='top-column-header'></tr>");
    header.append("<th id='pokemon-header' colspan='" + pokemonHeaderLength + "'>Pokémon</th>");
    header.append("<th id='fast-header' colspan='" + fastHeaderLength + "' class='fast-move-highlight'>Fast Move</th>");
    header.append("<th id='charge-header' colspan='" + chargeHeaderLength + "' class='charge-move-highlight'>Charge Move</th>");
    header.append("<th id='total-dps-header' colspan='" + totalDpsHeaderLength + "'>Fast & Charge</th>");
    $('#data-table thead').prepend(header);
    // dataTable.search(jsVars.search).draw();
    dataTable.search(queryObject.search).draw();
    $('#data-table').floatThead();
    inited = true;
  });

  dataTable.on('buttons-action', function(e, buttonApi, dataTable, node, config) {
    var adjustment = node.hasClass("active") ? 1 : -1;
    var col = config.columns;
    if (col !== undefined) {
      var header = getTopHeader(col);
      header.attr('colspan', parseInt(header.attr('colspan')) + adjustment);
      console.log(header.attr('colspan'));
      if (typeof ga !== 'undefined') {
        ga('send', 'event', 'Column Visibility',
          header.text() + " " + node.text() + " visibility toggled " + (node.hasClass("active") ? "off" : "on"));
      }
      $('.floatThead-container').trigger('resize'); // to make the table not have extra header dividers
    } else {
      ga('send', 'event', 'Excel Export', "Excel exported");
    }
  });

  $("#data-table_filter input").on("keypress", function(event) {
    if (event.keyCode == 124) {
      dataTable.search("").draw();
    }
  });

  $("#data-table_filter input").on("keyup", function(event) {
    var search = dataTable.search();
    queryObject.search = search;
    updateQuery();
  });

  dataTable.on('order.dt', function() {
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

  dataTable.on('order.dt search.dt', function() {
    var column = dataTable.order()[0][0];
    var desc = dataTable.order()[0][1] == "desc";
    var rows = dataTable.column(column, {order: 'applied'}).nodes();
    var numberOfColumns = dataTable.settings().columns()[0].length;
    var ranks = dataTable.column(numberOfColumns - 1).nodes();
    var isPokemon = column < pokemonHeaderLength;
    if ([0, 1, 2, 7, 8, 16, 17].indexOf(column) != -1) {
      desc = !desc;
    }
    dataTable.column(dataTable.settings().columns()[0].length - 1, {order: 'applied'}).nodes().each(function(cell, i) {
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

// call everytime the defending pokemon list is changed
function calculateTypeModifiers(draw) {
  if (draw == undefined) {
    draw = true;
  }
  // console.time("calc type mod");
  var defenders = getDefendingPokemon();
  for (var type in types) {
    type = types[type];
    type.calculateModifier(defenders);
  }
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

  if (draw) {
    if (typeof ga !== 'undefined' && defenders.length > 0) {
      ga('send', 'event', 'Gym Defender', "Calculating for: " + defenders.map(function(defender) {return defender.name}).join(", "));
    }
    console.time("update table");
    dataTable.cells(null, DPS_COLUMNS).invalidate();
    dataTable.draw();
    console.timeEnd("update table");
  }
  // console.timeEnd("calc type mod");
}

function calculateChargeDelay() {
  if (typeof ga !== 'undefined') {
    ga('send', 'event', 'Charge Delay', "Updating Charge Delay to " + CHARGE_DELAY);
  }
  console.time("update table");
  dataTable.cells(null, CHARGE_DELAY_COLUMNS).invalidate();
  dataTable.draw();
  console.timeEnd("update table");
}

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
        defendingPokemon.push(staticPokemons[comboBox.val() - 1]);
      }
    }
  }
  return defendingPokemon;
  // return [staticPokemons[5], staticPokemons[19]];
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
  Object.keys(types).forEach(function(type) {
    type = types[type];
    if (type.name == "None") {
      return;
    }
    alternator = !alternator;
    if (alternator) {
      rows.push(document.createElement('tr'));
    }
    var newRow = rows[rows.length - 1];
    var newTypeCell = document.createElement('td');
    var typeNameSpan = document.createElement('span');
    $(typeNameSpan).text(capitalize(type.name) + ': ');
    var newTypeModifier = document.createElement('span');
    $(newTypeModifier).text(type.getModifierAgainstDefenders().toFixed(3));
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
    placeholder: "Select Pokemon", allowClear: true, data: (function() {
      var dataArray = [{id: '', text: ''}];
      for (var pokemon in staticPokemons) {
        pokemon = staticPokemons[pokemon];
        dataArray.push({id: pokemon.id, text: pokemon.name});
      }
      return dataArray;
    }())
  });

  if (!$('#global-defender-toggle').prop("checked")) {
    toggleComboBox(comboBox, false);
  }

  comboBox.on("select2:selecting", function(event) {
    var id = comboBox.val();
    if (!id) { // if this was empty before, add a new comboBox
      addDefenderComboBox();
    }
  });

  comboBox.on("select2:select", function(event) {
    var toggledOff = comboBox.next().children().first().children().first().hasClass("toggled-off");
    if (!toggledOff) {
      calculateTypeModifiers();
    }
  });

  comboBox.on("select2:unselecting", function(event) {
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
  toggle.change(function() {
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
    var countdown = setInterval(function() {
      if (moment().isAfter(jsVars.nextClientRefreshTime)) {
        $('#alertdiv').removeClass(alertType);
        $('#alertdiv').addClass("alert-success");
        $('#alertdiv > span').text("You can now reload the sites data");
        clearInterval(countdown);
      } else {
        $('#refresh-time').text(moment.preciseDiff(moment(jsVars.nextClientRefreshTime), moment()));
      }
    }, 1000);
    closeAlert = setTimeout(function() { // this will automatically close the alert and remove this if the users doesnt close it in 5 secs
      $("#alertdiv").remove();
    }, 5000);
  }
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1)
}
