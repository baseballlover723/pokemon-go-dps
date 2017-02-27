'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('Pokemons',            {
                "id": {
                    "type": "INTEGER",
                    "allowNull": false,
                    "primaryKey": true,
                    "autoIncrement": true
                },
                "name": {
                    "type": "VARCHAR(255)"
                },
                "stamina": {
                    "type": "INTEGER"
                },
                "attack": {
                    "type": "INTEGER"
                },
                "defense": {
                    "type": "INTEGER"
                },
                "createdAt": {
                    "type": "TIMESTAMP WITH TIME ZONE",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": "TIMESTAMP WITH TIME ZONE",
                    "allowNull": false
                }
            })
;
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('Pokemons');
    }
};