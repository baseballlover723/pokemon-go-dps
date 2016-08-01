var express = require('express');
var router = express.Router();
var CircularJSON = require('circular-json');
var data = require('./data');

/* GET home page. */
router.get('/', function (req, res, next) {
    data.checkCache(function (lastUpdatedTime, nextUpdateTime) {
        console.log("last updated time: " + new Date(lastUpdatedTime));
        console.log("next updated time: " + new Date(nextUpdateTime));
        res.render('index', {title: 'Express', lastUpdatedTime: lastUpdatedTime, nextUpdateTime: nextUpdateTime});
    });
});

router.get("/data", function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send(CircularJSON.stringify(data.getData()));
});

module.exports = router;
