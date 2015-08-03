var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var async = require('async');

var routes = require('./routes/index');

var passport = require('passport')
var util = require('util')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var GOOGLE_CLIENT_ID = "1058269906171-gte3ag4pprk6akg536oa5dl0gl1c9t73.apps.googleusercontent.com";
var GOOGLE_CLIENT_SECRET = "B7WKX7-NxwIOBGzYWP4pHO2s";

var nano = require('nano')('https://7ab51e51-3366-4dc9-b3cb-044a29614d24-bluemix:2461ae15212a53b34b07a12661fae7dc499289a9d36452ada8166865c654913b@7ab51e51-3366-4dc9-b3cb-044a29614d24-bluemix.cloudant.com');

var db = nano.use('tropical_users');

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3002/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      db.list(function(err, body){
        if (err) {
          console.log(err);
        }else{

          var listLength = body.rows.length;

          async.each(body.rows,
          function(item, callback){

              var i = body.rows.indexOf(item);

              //console.log("item: " + item.id);

              db.get(item.id, function(err, body){
              if (!err){
                //console.log(body.googleId);
                //console.log(profile.id);
                if (profile.id == body.googleId){
                  
                  //TODO: Break out of loop when recognised user is found
                  //TODO: Direct user to sign up page if user not found
                  console.log("Recognised User: " + body.givenName);
                  
                }
                

              }else{
                 console.log(err);
              }

              callback();
              });
            },
            function(err){

            }
          );
    }//end else
  });

      //console.log(profile);
      //console.log('accessToken: ' + accessToken);
      return done(null, profile, accessToken);
    });
  }
));

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//app.use(session({ secret: 'secret' }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);


app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login']}),
  function(req, res){
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
  });

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.

app.get('/auth/google/callback',function(req, res) {
    
    passport = req._passport.instance;
    passport.authenticate('google', function(err, profile, accessToken, info) {
    
      //console.log('PROFILE: ' + profile.id);
      //console.log('TOKEN: ' + accessToken);
    
      res.writeHead(302, {
       'Location': 'http://127.0.0.1:3001/#/index?token=' + accessToken
      });

      res.end();

    })(req,res);
   
  });


app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(3002);
console.log ('Listening on 3002');


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
    console.log('not authenticated');
    res.redirect('/login');
}

module.exports = app;
