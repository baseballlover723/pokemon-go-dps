'use strict';
module.exports = function(sequelize, DataTypes) {
  var Test = sequelize.define('Test', {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    bio: DataTypes.TEXT
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Test;
};