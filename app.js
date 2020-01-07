var express = require('express');
var partials = require('express-partials');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var flash = require('connect-flash');
var async = require('async');
var bodyParser = require('body-parser');

mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MODUI_DB);
var db = mongoose.connection;

db.once('open', function () {
  console.log('DB connected');
});

db.on('error', function (err) {
  console.log('DB error: ', err);
})

var userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true},
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
var User = mongoose.model('user', userSchema);

var app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(partials());
app.use(flash());
app.use(session({ secret: process.env.MODUI_SECRET, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

var LocalStrategy = require('passport-local').Strategy;
passport.use('local-login',
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
  else res.render('users/login', { username: req.flash('username')[0], loginError: req.flash('loginError') });
});

app.post('/login', function (req, res, next) {
  req.flash('username');
  if (req.body.username.length === 0 || req.body.password.length === 0) {
    req.flash('username', req.body.username);
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
});

/*app.get('/users/new', function (req, res) {
  res.render('users/new', {
    formData: req.flash('formData')[0],
    loginError: req.flash('loginError')[0]
  });
});*/

app.post('/users', checkUserRegValidation, function (req, res, next) {
  User.create(req.body.user), function (err, user) {
    if (err) return res.json({ success: false, message: err });
    res.redirect('/login');
  }
});

app.get('/users/:id', function (req, res) {
  User.findById(req.params.id, function (err, user) {
    if (err) return res.json({ success: false, message: err });
    res.render('users/show', { user: user });
  });
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

function checkUserRegValidation(req, res, next) {
  var isValid = true;
  async.waterfall([function (callback) {
    User.findOne({ username: req.body.user.username, _id: { $ne: mongoose.Types.ObjectId(req.params.id) } }, function (err, user) {
      if (user) {
        isValid = false;
        req.flash('registerError', 'Someone is already using the username');
      }
      callback(null, isValid);
    });
  }, function (isValid, callback) {
    User.findOne({ email: req.body.user.email, _id: { $ne: mongoose.Types.ObjectId(req.params.id) } }, function (err, user) {
      if (user) {
        isValid = false;
        req.flash('registerError', 'Someone is already using the email');
      }
      callback(null, isValid);
    });
  }], function (err, isValid) {
    if (err) return res.json({ success: 'false', message: err });
    if (isValid) return next();
    else {
      req.flahs('formData', req.body.user);
      res.redirect('back');
    }
  });
};
