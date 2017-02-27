'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('type1',            {
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
                "TypeId": {
                    "type": "INTEGER",
                    "primaryKey": true,
                    "references": {
                        "model": "Types",
                        "key": "id"
                    },
                    "onDelete": "CASCADE",
                    "onUpdate": "CASCADE"
                }
            })
;
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('type1');
    }
};