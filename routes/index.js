var express = require('express');
var router = express.Router();
var CircularJSON = require('circular-json');
var data = require('./data');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get("/data", function(req, res, next) {
  console.log("got data");
  console.log(data.getData().data[0]);
  res.setHeader('Content-Type', 'application/json');
  res.send(CircularJSON.stringify(data.getData()));
});


module.exports = router;
