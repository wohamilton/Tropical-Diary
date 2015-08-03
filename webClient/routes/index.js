var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
  //res.send(req);
});

router.get('/hello', function(req, res) {
  res.send('this is cool');
});

router.get('/login', function(req, res, next){
  //res.send('login');
  res.render('login', {titel: 'Express'});
});


module.exports = router;
