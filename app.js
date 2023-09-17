var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/')));

app.get('/', function(req, res, next) {
  res.render('index', { title: 'Hydrus Slideshow Viewer' });
});

app.listen(3415, () => console.log(`Server listening on port: 3415`));
