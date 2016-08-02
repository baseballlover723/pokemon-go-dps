var express = require('express');
var router = express.Router();
var CircularJSON = require('circular-json');
var data = require('./data');

/* GET home page. */
router.get('/', function (req, res, next) {
    data.checkCache(function (lastUpdatedTime, nextUpdateTime) {
        res.expose(lastUpdatedTime, "lastUpdatedTime");
        res.expose(nextUpdateTime, "nextUpdateTime");
        res.expose(data.getNextRefreshTime(), "nextClientRefreshTime");
        res.render('index', {
            title: 'Express',
            lastUpdatedTime: lastUpdatedTime,
            nextUpdateTime: nextUpdateTime
        });
    });
});

router.get("/data", function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send(CircularJSON.stringify(data.getData()));
});

router.get("/refresh", function (req, res, next) {
    data.refreshCache(function (isRefreshing, nextRefreshTime) {
        console.log("isRefreshing: " + isRefreshing);
        console.log("nextRefreshTime: " + nextRefreshTime);
        res.redirect("/");
    });
});

module.exports = router;
