'use strict';
module.exports = function(sequelize, DataTypes) {
  var FastMove = sequelize.define('FastMove', {
    name: DataTypes.STRING,
    damage: DataTypes.INTEGER,
    duration: DataTypes.INTEGER,
    energyGain: DataTypes.DOUBLE,
  }, {
    classMethods: {
      associate: function(models) {
        models.FastMove.belongsTo(models.Type);
      }
    }
  });
  return FastMove;
};