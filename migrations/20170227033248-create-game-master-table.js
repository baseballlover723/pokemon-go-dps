'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  db.createTable('game_master', {
    id: {type: 'int', primaryKey: true},
    date: 'timestamp',
    json: 'json'
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('game_master', callback);
};

exports._meta = {
  "version": 1
};
