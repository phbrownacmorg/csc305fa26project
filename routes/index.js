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
      renderErrorPage(400, `Unknown role: ${formdata.role}`, res);
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
    req.app.locals.flights = db.prepare(query).all();
    console.info("Flights results", req.app.locals.flights.length);
    if (req.query.role === "Passenger") {
      queryPassengerName(req, res, next);
    }
    else {
      renderPage(req, res, next);
    }
  }
  else {
    renderErrorPage(500, "Flights query failed to find database", res);
  }
}

function queryPassengerName(req, res, next) {
  if (req.app.locals.db) {
    const db = req.app.locals.db;
    const query = 'select FirstName, LastName from Passenger where PsgrID = $id;';
    req.app.locals.psgr_name = db.prepare(query).get({ $id: req.query.ID });
    if (req.app.locals.psgr_name) {
      const name = req.app.locals.psgr_name;
      req.app.locals.title = `Welcome, ${name.FirstName} ${name.LastName}`;
      renderPage(req, res, next);
    }
    else {
      renderErrorPage(400, `No passenger with ID ${req.query.ID}`, res);
    }
  }
  else {
      renderErrorPage(500, "Tickets query failed to find database", res);
  }
}

// SELECT TktNum as Ticket, FltNum as Flight, Origin as "From", Dest as "To", FltDate as Date, Departs, Arrives, ModelName as Aircraft, Seat
// from Ticket natural join Flight natural join ACModel
// where PsgrID = 875;



function queryFlightsDisp(req, res, next) {
  renderPage(req, res, next);
}

function renderPage(req, res, next) {
  res.render(req.app.locals.page, { 
    title: req.app.locals.title,
    formdata: req.query,
    role: req.query.role,
    flights: req.app.locals.flights,
    tickets: req.app.locals.tickets,
    name: req.app.locals.psgr_name
  });
}

function renderErrorPage(code, msg, res) {
  res.render('error', {
    message: msg,
    error: {
      status: code,
      stack: null
    }
  })
}


module.exports = router;
