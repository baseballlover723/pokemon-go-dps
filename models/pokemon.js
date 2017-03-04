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
        models.Pokemon.belongsTo(models.Type, {
          as: 'type1'
        });
        models.Pokemon.belongsTo(models.Type, {
          as: 'type2'
        });
        models.Pokemon.belongsToMany(models.FastMove, {
          through: 'pokemon_fast_moves',
          as: 'fastMoves'
        });
        models.Pokemon.belongsToMany(models.ChargeMove, {
          through: 'pokemon_charge_moves',
          as: 'chargeMoves'
        });

      }
    }
  });
  return Pokemon;
};