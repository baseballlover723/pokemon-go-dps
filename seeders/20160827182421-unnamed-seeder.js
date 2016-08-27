'use strict';
var models = require('../models');

module.exports = {
    up: function (queryInterface, Sequelize) {
        /*
         Add altering commands here.
         Return a promise to correctly handle asynchronicity.

         Example:
         */
        return models.Test.create({
            firstName: 'John',
            lastName: "Doe",
            bio: "test"
        });
        // return queryInterface.insert('Tests', {
        //     firstName: 'John',
        //     lastName: "Doe",
        //     bio: "test"
        // }, {});
    },

    down: function (queryInterface, Sequelize) {
        /*
         Add reverting commands here.
         Return a promise to correctly handle asynchronicity.

         Example:
         */
        return queryInterface.bulkDelete('Tests', null, {});
    }
};
