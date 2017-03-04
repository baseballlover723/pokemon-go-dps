'use strict';
module.exports = function (sequelize, DataTypes) {
  var Type = sequelize.define('Type', {
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function (models) {
        models.Type.belongsToMany(models.Type, {
          through: 'weaknesses',
          as: 'weaknesses'
        });
        models.Type.belongsToMany(models.Type, {
          through: 'strengths',
          as: 'strengths'
        });
      }
    }
  });
  return Type;
};