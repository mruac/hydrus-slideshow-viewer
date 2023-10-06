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

// app.use('/stylesheets', express.static(path.join(_dirname, 'node_modules/bootstrap/dist/css')));
// app.use('/javascripts', express.static(path.join(_dirname, 'node_modules/bootstrap/dist/js')));
// app.use('/javascripts', express.static(path.join(_dirname, 'node_modules/jquery/dist')));

app.get('/', function(req, res, next) {
  res.render('test', { title: 'Hydrus Slideshow Viewer' });
});

app.listen(3415, () => console.log(`Server listening on port: http://127.0.0.1:3415`));
