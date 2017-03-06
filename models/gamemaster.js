'use strict';
module.exports = function(sequelize, DataTypes) {
  var GameMaster = sequelize.define('GameMaster', {
    json: DataTypes.JSON,
    superEffectiveModifier: DataTypes.DOUBLE,
    stabModifier: DataTypes.DOUBLE
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return GameMaster;
};