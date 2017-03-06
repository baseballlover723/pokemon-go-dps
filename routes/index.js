var express = require('express');
var router = express.Router();
var async = require('async');
var data = require('../lib/data.js');
var moment = require('moment-timezone');

var lastUpdatedTime = moment();
var nextUpdateTime = moment();
// TODO create routes to get data
// TODO hook up front end to new back end

router.get('/', function (req, res, next) {
  // data.checkCache(function (lastUpdatedTime, nextUpdateTime) {
    req.query.search = req.query.search || "";
    req.query.gym = req.query.gym || [];
    req.query.toggleOff = req.query.toggleOff || [];
    res.expose(req.query, "query");
    // res.expose(lastUpdatedTime, "lastUpdatedTime");
    // res.expose(nextUpdateTime, "nextUpdateTime");
    // res.expose(data.getNextRefreshTime(), "nextClientRefreshTime");
    res.render('index', {
      title: 'Express',
      lastUpdatedTime: lastUpdatedTime,
      nextUpdateTime: nextUpdateTime
    });
  // });
});

router.get("/data", function (req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  async.parallel({
    types: function (callback) {
      data.getTypes(callback);
    },
    fastMoves: function (callback) {
      data.getFastMoves(callback);
    },
    chargeMoves: function (callback) {
      data.getChargeMoves(callback);
    },
    pokemons: function (callback) {
      data.getPokemons(callback);
    }
  }, function (err, results) {
    if (err) {
      console.log(err);
      res.status(500);
      res.send({error: err.toString()});
    } else {
      res.send(JSON.stringify(results));
    }
  });
});

module.exports = router;
