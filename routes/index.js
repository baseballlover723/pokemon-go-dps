var express = require('express');
var router = express.Router();
var data = require('./data');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get("/data", function(req, res, next) {
  console.log("got data");
  res.setHeader('Content-Type', 'application/json');
  res.json(data);
});
module.exports = router;
