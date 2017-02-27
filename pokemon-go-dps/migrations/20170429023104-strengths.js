'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('strengths',            {
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
                    "primaryKey": true,
                    "references": {
                        "model": "Types",
                        "key": "id"
                    },
                    "onDelete": "CASCADE",
                    "onUpdate": "CASCADE"
                },
                "strengthId": {
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
        return queryInterface.dropTable('strengths');
    }
};