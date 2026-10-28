var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const formdata = req.query;
  console.log('Formdata:', formdata);
  if (formdata.role) {
    req.app.locals.page = formdata.role.toLowerCase();
    req.app.locals.title = formdata.role
    if (formdata.role === "Passenger" || formdata.role === "Dispatcher") {
      queryFlights(req, res, next);
    }
    else {
      renderPage('error', {
        message: `Unknown role: ${formdata.role}`,
        error: {
          status: 400,
          stack: null
        }
      });
    }
  }
  else {
    req.app.locals.page = 'index';
    req.app.locals.title = 'Grasshopper Air';
    renderPage(req, res, next);
  }
});

function queryFlights(req, res, next) {
  if (req.app.locals.db) {
    const db = req.app.locals.db;
    const query = 'select FltNum as Flight, Origin, Dest, Departs, Arrives, ModelName as Aircraft '
                  + 'from Flight natural join ACModel order by Departs;';
    const statement = db.prepare(query);
    req.app.locals.flights = statement.all();
    //statement.close();
    console.info("Flights results", req.app.locals.flights.length);
    renderPage(req, res, next);  
  }
  else {
      renderPage('error', {
        message: "Flights query failed to find database",
        error: {
          status: 500,
          stack: null
        }
      });  
  }
}

function queryFlightsDisp(req, res, next) {
  renderPage(req, res, next);
}

function renderPage(req, res, next) {
  res.render(req.app.locals.page, { 
    title: req.app.locals.title,
    formdata: req.query,
    role: req.query.role,
    flights: req.app.locals.flights
  });
}

module.exports = router;
