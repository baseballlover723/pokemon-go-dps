'use strict';
//////////////////////////////////
// How to use?
// 1. Create `sequelize-schema-file-generator.js` in your app root
// 2. Make sure you've ran the `sequelize init` before (It should create `config`,`seeders`,`migrations` folders).
// 3. Update `DATABASE_DSN` below to match your connection string (works with any database adapter that Sequelize supports)
// 4. Run it with `node sequelize-schema-file-generator.js`
// 5. Review the generated migrations inside of the `migrations` folder.
//////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// CHANGE THIS /////////////////////////////////////////////
// const DATABASE_DSN = 'mysql://root@localhost/testing';
///////////////////////////////// END CHANGES /////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

/* jscs:disable */
var models = require('./models').sequelize.models;
var Sequelize = models.Sequelize;
var fs = require('fs');

delete models.default;

const sequelize = models.sequelize;

for(let model in models) {

  let attributes = models[model].attributes;

  for(let column in attributes) {
    delete attributes[column].Model;
    delete attributes[column].fieldName;
    delete attributes[column].field;
    for(let property in attributes[column]) {
      if(property.startsWith('_')) {
        delete attributes[column][property];
      }
    }

    if(typeof attributes[column]['type'] !== 'undefined') {

      if(typeof attributes[column]['type']['options'] !== 'undefined' && typeof attributes[column]['type']['options'].toString === 'function') {
        attributes[column]['type']['options'] = attributes[column]['type']['options'].toString(sequelize);
      }

      if(typeof attributes[column]['type'].toString === 'function') {
        attributes[column]['type'] = attributes[column]['type'].toString(sequelize);
      }

    }

  }

  let schema = JSON.stringify(attributes, null, 4);
  let tableName = models[model].tableName;
  let indexes = ['\n'];

  if(models[model].options.indexes.length) {

    models[model].options.indexes.forEach((obj) => {

      indexes.push('        .then(() => {');
    indexes.push('            return queryInterface.addIndex(');
    indexes.push(`                '${tableName}',`);
    indexes.push(`                ['${obj.fields.join("','")}']`);

    let opts = {};
    if(obj.name) {
      opts.indexName = obj.name;
    }
    if(obj.unique === true) {
      opts.indicesType = 'UNIQUE';
    }
    if(obj.method === true) {
      opts.indexType = obj.method;
    }
    if(Object.keys(opts).length) {
      indexes.push(`                , ${JSON.stringify(opts)}`)
    }

    indexes.push('            )');
    indexes.push('        })');

  });

  }

  schema = schema.split('\n').map((line) => '            ' + line).join('\n');

  let template = `'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('${tableName}',${schema})${indexes.join('\n')};
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('${tableName}');
    }
};`

  let d = new Date();
  let mod = 0;
  // do the migrations in the right order
  if (model == 'Type') {
    mod += 1;
  }
  if (model == 'strengths' || model == 'weaknesses') {
    mod += 2;
  }
  if (model == 'ChargeMove' || model == 'FastMove') {
    mod += 3;
  }
  if (model == 'Pokemon') {
    mod += 4;
  }
  if (model == 'pokemon_charge_moves' || model == 'pokemon_fast_moves') {
    mod += 5;
  }
  let filename = [d.getFullYear(), d.getMonth()+1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()]
      .map((num) => num <= 60 && (num + 100 + mod).toString().substring(1) || num)
.join('') + `-${models[model].tableName}`;

  fs.writeFileSync(`./migrations/${filename}.js`, template);

};