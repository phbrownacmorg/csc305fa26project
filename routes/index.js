var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  let formdata = req.query;
  console.log('Formdata:', formdata);
  req.locals = new Object();
  if (formdata.role) {
    req.locals.page = formdata.role.toLowerCase();
    req.locals.title = formdata.role

    if (formdata.role === "Passenger") {
      req.locals.query = 'select FltNum, Origin, Dest, Departs, Arrives, ModelName as Aircraft from Flight natural join ACModel order by Departs;';
      queryFlightsPsgr(req, res, next);
    }
    else if (formdata.role === 'Dispatcher') {
      req.locals.query = 'select FltNum, Origin, Dest, Departs, Arrives, ModelName as Aircraft from Flight natural join ACModel order by Departs;';
      queryFlightsDisp(req, res, next);
    }
  }
  else {
    req.locals.page = 'index';
    req.locals.title = 'Grasshopper Air';
    renderPage(req, res, next);
  }
});

function queryFlightsPsgr(req, res, next) {
  if (req.app.locals.db) {
    let db = req.app.locals.db;
    
  }
  renderPage(req, res, next);
}

function queryFlightsDisp(req, res, next) {
  renderPage(req, res, next);
}

function renderPage(req, res, next) {
  res.render(req.locals.page, { 
    title: req.locals.title,
    formdata: req.query,
    role: req.query.role
  });
}

module.exports = router;
