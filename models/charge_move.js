'use strict';
module.exports = function(sequelize, DataTypes) {
  var ChargeMove = sequelize.define('ChargeMove', {
    name: DataTypes.STRING,
    damage: DataTypes.INTEGER,
    duration: DataTypes.INTEGER,
    energyRequired: DataTypes.DOUBLE,
    critChance: DataTypes.DOUBLE
  }, {
    classMethods: {
      associate: function(models) {
        models.ChargeMove.belongsTo(models.Type);
      }
    }
  });
  return ChargeMove;
};