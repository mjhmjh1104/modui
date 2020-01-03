var express = require('express');
var partials = require('express-partials');
var app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(partials());

app.get('/', function (req, res) {
  res.render('home');
});

app.get('/supports', function (req, res) {
  res.render('supports');
});

app.get('*', function (req, res) {
  res.render('error', { message: '404 Not Found' });
});

var port = process.env.PORT || 3000
app.listen(port, function () {
  console.log('Server On');
});
