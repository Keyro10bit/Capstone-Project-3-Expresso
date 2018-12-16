const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//set $timesheetId param
timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const values = {$timesheetId: timesheetId};

  db.get(sql, values, (err, timesheet) => {
    if (err) {
      next(err);
    }
    else if (timesheet) {
      req.timesheet = timesheet;
      next();
    }
    else {
      res.sendStatus(404);
    }
  });
});

//Gets all timesheets
timesheetsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId';
  const values = {$employeeId: req.params.employeeId};

  db.all(sql, values, (err, timesheets) => {
    if (err) {
      next(err);
    }
    else {
      res.status(200).json({timesheets: timesheets});
    }
  });
});

//Creats new timesheet
timesheetsRouter.post('/', (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date;
  if (!hours || !rate || !date) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)';
  const values = {
    $hours: hours,
    $rate: rate,
    $date: date,
    $employeeId: req.params.employeeId
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    }
    else {
      db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`,
        (err, timesheet) => {
          res.status(201).json({timesheet: timesheet});
        });
    }
  });
});

//Updates timesheet
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date;
  if (!hours || !rate || !date) {
    return res.sendStatus(400);
  }

  const sql = 'UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE Timesheet.id = $timesheetId';
  const values = {
    $hours: hours,
    $rate: rate,
    $date: date,
    $timesheetId: req.params.timesheetId
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    }
    else {
      db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`,
        (err, timesheet) => {
          res.status(200).json({timesheet: timesheet});
        });
    }
  });
});

//Deletes timesheet
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  db.run(`DELETE FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`, function(err) {
    if (err) {
      next(err);
    }
    else {
      res.sendStatus(204);
    }
  });
});

module.exports = timesheetsRouter;
