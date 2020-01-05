var express = require('express');
var partials = require('express-partials');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var flash = require('connect-flash');
var async = require('async');

var userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true},
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

var app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(partials());
app.use(flash());
app.use(session({ secret: 'ModuiSecret34305068336758463823817899919446' }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

var LocalStrategy = require('passport-local').Strategy;
passport.user('local-login',
  new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  }, function (req, username, password, done) {
    User.findOne({ 'username': username }, function (err, user) {
      if (err) return done(err);
      if (!user || user.password != password) {
        req.flash('username', req.body.nickname);
        return done(null, false, req.flash('loginError', 'No user found'));
      }
      return done(null, user);
    });
  })
);

app.get('/', function (req, res) {
  res.render('home');
});

app.get('/login', function (req, res) {
  if (req.body.user) res.redirect('/');
  else res.render('login/login', { username: req.flash('username')[0], loginError: req.flash('loginError')[0] });
});

app.post('/login', function (req, res, next) {
  req.flash('usrname');
  if (req.body.username.length === 0 || req.body.password.length === 0) {
    req.flash('username', req.body.email);
    req.flash('loginError', 'No user found');
    res.redirect('/login');
  } else next();
}, passport.authenticate('local-login', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
})

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
