'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('GameMasters',            {
                "id": {
                    "type": "INTEGER",
                    "allowNull": false,
                    "primaryKey": true,
                    "autoIncrement": true
                },
                "json": {
                    "type": "JSON"
                },
                "superEffectiveModifier": {
                    "type": "DOUBLE PRECISION"
                },
                "stabModifier": {
                    "type": "DOUBLE PRECISION"
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
        return queryInterface.dropTable('GameMasters');
    }
};