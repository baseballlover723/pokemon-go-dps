var express = require('express');
var router = express.Router();
var CircularJSON = require('circular-json');
var moment = require('moment-timezone');
var data = require('./data');

/* GET home page. */
router.get('/', function (req, res, next) {
    data.checkCache(function (lastUpdatedTime, nextUpdateTime) {
        req.query.search = req.query.search || "";
        req.query.gym = req.query.gym || [];
        req.query.toggleOff = req.query.toggleOff || [];
        // res.expose(req.query.search || "", "search");
        res.expose(req.query, "query");
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
        res.redirect("/");
    });
});

module.exports = router;
