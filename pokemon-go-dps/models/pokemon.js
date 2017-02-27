'use strict';
module.exports = function(sequelize, DataTypes) {
  var Pokemon = sequelize.define('Pokemon', {
    name: DataTypes.STRING,
    stamina: DataTypes.INTEGER,
    attack: DataTypes.INTEGER,
    defense: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        models.Pokemon.belongsToMany(models.Type, {
          through: 'type1',
          as: 'type1'
        });
        models.Pokemon.belongsToMany(models.Type, {
          through: 'type2',
          as: 'type2'
        });
        models.Pokemon.belongsToMany(models.FastMove, {
          through: 'pokemon_fast_moves',
          as: 'fast_moves'
        });
        models.Pokemon.belongsToMany(models.ChargeMove, {
          through: 'pokemon_charge_moves',
          as: 'charge_moves'
        });

      }
    }
  });
  return Pokemon;
};