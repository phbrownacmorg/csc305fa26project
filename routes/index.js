var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.info('GET Formdata:', req.query);
  makePage(req.query, req, res, next);
});

/* POST home page */
router.post('/', function(req, res, next) {
  console.info('POST Formdata:', req.body);
  makePage(req.body, res, next);
});

function makePage(formdata, req, res, next) {
  req.app.locals.formdata = formdata;
  if (formdata.action) { // Do actions here, then continue and display the new state of affairs
    if (formdata.action == "cancel_ticket") {
      cancelTicket(formdata.ticket_ID, req.app.locals.db);
    }
  }
  if (formdata.role) {
    req.app.locals.page = formdata.role.toLowerCase();
    req.app.locals.title = formdata.role
    if (formdata.role === "Passenger" || formdata.role === "Scheduler") {
      queryFlights(formdata, req, res, next);
    }
    else {
      renderErrorPage(400, `Unknown role: ${formdata.role}`, formdata, res);
    }
  }
  else {
    req.app.locals.page = 'index';
    req.app.locals.title = 'Grasshopper Air';
    renderPage(formdata, req, res, next);
  }
}

function cancelTicket(ticket_ID, db) {
  const sql = 'delete from Ticket where TktNum = $tktnum;';
  const rowsChanged = db.prepare(sql).run({ $tktnum: ticket_ID });
  console.info(`Canceling ticket changed ${rowsChanged} rows`);
}

function queryFlights(formdata, req, res, next) {
  if (req.app.locals.db) {
    const db = req.app.locals.db;
    const sql = 'select FltNum as Flight, Origin, Dest, Departs, Arrives, ModelName as Aircraft '
                  + 'from Flight natural join ACModel order by Departs;';
    req.app.locals.flights = db.prepare(sql).all();
    console.info("Flights results", req.app.locals.flights.length);
    if (formdata.role === "Passenger") {
      queryPassengerName(formdata, req, res, next);
    }
    else {
      renderPage(formdata, req, res, next);
    }
  }
  else {
    renderErrorPage(500, "Flights query failed to find database", formdata, res);
  }
}

function queryPassengerName(formdata, req, res, next) {
  if (req.app.locals.db) {
    const db = req.app.locals.db;
    const sql = 'select FirstName, LastName from Passenger where PsgrID = $id;';
    const name = db.prepare(sql).get({ $id: formdata.ID });
    if (name) {
      req.app.locals.psgr_name = name;
      req.app.locals.title = `Welcome, ${name.FirstName} ${name.LastName}`;
      queryTickets(formdata, req, res, next);
    }
    else {
      renderErrorPage(400, `No passenger has ID ${formdata.ID}`, formdata, res);
    }
  }
  else {
      renderErrorPage(500, "Passenger-name query failed to find database", formdata, res);
  }
}

function queryTickets(formdata, req, res, next) {
  if (req.app.locals.db) {
    const db = req.app.locals.db;
    const sql = 'SELECT TktNum as Ticket, FltNum as Flight, Origin as "From", Dest as "To",'
                + ' FltDate as Date, Departs, Arrives, ModelName as Aircraft, Seat'
                + ' from Ticket natural join Flight natural join ACModel'
                + ' where PsgrID = $id;';
    const tickets = db.prepare(sql).all({ $id: formdata.ID });
    if (tickets) {
      console.info(`${tickets.length} tickets found`);
      req.app.locals.tickets = tickets;
      renderPage(formdata, req, res, next);
    }
  }
  else {
    renderErrorPage(500, "Tickets query failed to find database", formdata, res);
  }
}

function renderPage(formdata, req, res, next) {
  res.render(req.app.locals.page, { 
    title: req.app.locals.title,
    formdata: formdata,
    role: formdata.role,
    flights: req.app.locals.flights,
    tickets: req.app.locals.tickets,
    name: req.app.locals.psgr_name
  });
}

function renderErrorPage(code, msg, formdata, res) {
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
      stack: JSON.stringify(formdata)
    }
  })
}


module.exports = router;
