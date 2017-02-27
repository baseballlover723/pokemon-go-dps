'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('pokemon_charge_moves',            {
                "createdAt": {
                    "type": "TIMESTAMP WITH TIME ZONE",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": "TIMESTAMP WITH TIME ZONE",
                    "allowNull": false
                },
                "PokemonId": {
                    "type": "INTEGER",
                    "primaryKey": true,
                    "references": {
                        "model": "Pokemons",
                        "key": "id"
                    },
                    "onDelete": "CASCADE",
                    "onUpdate": "CASCADE"
                },
                "ChargeMoveId": {
                    "type": "INTEGER",
                    "primaryKey": true,
                    "references": {
                        "model": "ChargeMoves",
                        "key": "id"
                    },
                    "onDelete": "CASCADE",
                    "onUpdate": "CASCADE"
                }
            })
;
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('pokemon_charge_moves');
    }
};