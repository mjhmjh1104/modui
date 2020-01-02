var express = require('express');
var partials = require('express-partials');
var app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(partials());

app.get('/', function (req, res) {
  res.render('home');
});

app.get('*', function (req, res) {
  res.render('error', { message: '404 Not Found' });
})

app.listen(3000, function () {
  console.log('Server On');
});
