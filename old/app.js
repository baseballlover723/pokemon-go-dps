require('dotenv').config();
var express = require('express');
var expstate = require('express-state');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();
expstate.extend(app);
app.set('state namespace', 'jsVars');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public/favicons', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/circular-json', express.static(__dirname + '/node_modules/circular-json/build'));
app.use('/moment', express.static(__dirname + '/node_modules/moment/min'));
app.use('/moment-timezone', express.static(__dirname + '/node_modules/moment-timezone/builds'));
app.use('/sticky-table-headers', express.static(__dirname + '/node_modules/sticky-table-headers/js'));
app.use('/class', express.static(__dirname + '/lib'));
app.use('/json', express.static(__dirname + '/json'));
app.use('/', routes);
app.expose(app.settings.env, "env");

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
