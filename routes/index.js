var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  req.app.locals.formdata = req.query;
  console.info('GET Formdata:', req.app.locals.formdata);
  makePage(req, res, next);
});

/* POST home page */
router.post('/', function(req, res, next) {
  req.app.locals.formdata = req.body;
  console.info('POST Formdata:', req.app.locals.formdata);
  makePage(req, res, next);
});

function makePage(req, res, next) {
  const formdata = req.app.locals.formdata;
  if (formdata.role) {
    req.app.locals.page = formdata.role.toLowerCase();
    req.app.locals.title = formdata.role
    if (formdata.role === "Passenger" || formdata.role === "Scheduler") {
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
}

function queryFlights(req, res, next) {
  if (req.app.locals.db) {
    const db = req.app.locals.db;
    const formdata = req.app.locals.formdata;
    const sql = 'select FltNum as Flight, Origin, Dest, Departs, Arrives, ModelName as Aircraft '
                  + 'from Flight natural join ACModel order by Departs;';
    req.app.locals.flights = db.prepare(sql).all();
    console.info("Flights results", req.app.locals.flights.length);
    if (formdata.role === "Passenger") {
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
    const formdata = req.app.locals.formdata;
    const sql = 'select FirstName, LastName from Passenger where PsgrID = $id;';
    const name = db.prepare(sql).get({ $id: formdata.ID });
    if (name) {
      req.app.locals.psgr_name = name;
      req.app.locals.title = `Welcome, ${name.FirstName} ${name.LastName}`;
      renderPage(req, res, next);
    }
    else {
      renderErrorPage(400, `No passenger has ID ${formdata.ID}`, res);
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
  const formdata = req.app.locals.formdata;
  res.render(req.app.locals.page, { 
    title: req.app.locals.title,
    formdata: formdata,
    role: formdata.role,
    flights: req.app.locals.flights,
    tickets: req.app.locals.tickets,
    name: req.app.locals.psgr_name
  });
}

function renderErrorPage(code, msg, res) {
  let codemsg = '500: Internal server error';
  switch (code) {
    case 400:
      codemsg = "400: Bad request";
      break;
    case 518: // Included for the humor
      codemsg = "518: I'm a teapot"; // Yes, this is a real HTTP response code
      break;
    default: // Stick with 500
      break;
  }
  res.render('error', {
    message: msg,
    error: {
      status: codemsg,
      stack: null
    }
  })
}


module.exports = router;
