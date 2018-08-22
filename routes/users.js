var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({dest: './uploads'});
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');

var User = require('../models/user');
/* GET users listing. */
/* Ye wala " / " ka matlab he /users/*/

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register', {title : 'Register', errors: []});
});

router.get('/login', function(req, res, next) {
  res.render('login', {title : 'Login', expressFlash : req.flash('success'), failureFlash: req.flash('error')});
});

// Passport Authentication

router.post('/login',
// failureFlash has the key of 'error'
  passport.authenticate('local', {failureRedirect: '/users/login', failureFlash: 'Invalid username or password.'}),
  function(req, res) {
   req.flash('success', 'You have logged in successfully.');
   
   res.redirect('/');
  });

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
      done(err, user);
    });
  });
  

  passport.use(new LocalStrategy(function(username, password, done){
    User.getUserByUsername(username, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message: 'Unknown User'});
      }
    

    User.comparePassword(password, user.password, function(err, isMatch){
      if(err) return done(err);
      if(isMatch){
        return done(null, user);
      }
      else{
        return done(null, false, {message: 'Invalid Password'});
      }
    });
  });
}));

  

router.post('/register', upload.single('profileimage'), function(req, res, next) {
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var passsword2 = req.body.password2;

  if(req.file){
    console.log("File Uploading...");
    var profileimage = req.file.filename;
  }
  else{
    console.log("Ghanta !");
    var profileimage = 'noImage.jpg';
  }
  console.log(profileimage);



// Form Validator

req.checkBody('name', 'Name field is required').notEmpty();
req.checkBody('email', 'Email field is required').notEmpty();
req.checkBody('email', 'Email must be valid').isEmail();
req.checkBody('username', 'Username field is required').notEmpty();
req.checkBody('password', 'Password field is required').notEmpty();
req.checkBody('password2', 'Passwords do not match').equals(password);

// Check Errors
if(req.validationErrors()){
  var errors = req.validationErrors();
}
else{
  var errors =false;
}

if(errors){
  res.render('register', {
    errors: req.validationErrors(),
    title: 'Register'
    
  });
  console.log('Errors');
}else{
  var newUser = new User({
    name: name,
    email: email,
    username: username,
    password: password,
    profileimage: profileimage
  });

  User.createUser(newUser, function(err, user){
    if (err) throw err;
    console.log(user);
  });

  req.flash('success', 'You are now registered and can log in.');
  
res.location('/');
res.redirect('/');

}

router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You are now logged out.');
  
  res.redirect('/users/login');
});

});

module.exports = router;
