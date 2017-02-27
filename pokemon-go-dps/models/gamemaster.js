'use strict';
module.exports = function(sequelize, DataTypes) {
  var GameMaster = sequelize.define('GameMaster', {
    json: DataTypes.JSON
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return GameMaster;
};