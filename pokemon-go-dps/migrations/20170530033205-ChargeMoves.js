'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('ChargeMoves',            {
                "id": {
                    "type": "INTEGER",
                    "allowNull": false,
                    "primaryKey": true,
                    "autoIncrement": true
                },
                "name": {
                    "type": "VARCHAR(255)"
                },
                "damage": {
                    "type": "INTEGER"
                },
                "duration": {
                    "type": "INTEGER"
                },
                "energyRequired": {
                    "type": "DOUBLE PRECISION"
                },
                "critChance": {
                    "type": "DOUBLE PRECISION"
                },
                "createdAt": {
                    "type": "TIMESTAMP WITH TIME ZONE",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": "TIMESTAMP WITH TIME ZONE",
                    "allowNull": false
                },
                "TypeId": {
                    "type": "INTEGER",
                    "allowNull": true,
                    "references": {
                        "model": "Types",
                        "key": "id"
                    },
                    "onDelete": "SET NULL",
                    "onUpdate": "CASCADE"
                }
            })
;
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('ChargeMoves');
    }
};