const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = require('./timesheets');

//set $employeeId param
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const values = {$employeeId: employeeId};

  db.get(sql, values, (err, employee) => {
    if (err) {
      next(err);
    }
    else if (employee) {
      req.employee = employee;
      next();
    }
    else {
      res.sendStatus(404);
    }
  });
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

//Gets all current employees
employeesRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Employee WHERE Employee.is_current_employee = 1';
  db.all(sql,(err, employees) => {
      if (err) {
        next(err);
      }
      else {
        res.status(200).json({employees: employees});
      }
    });
});

//Gets a single employee by ID
employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
  next();
});


//Creates a new employee
employeesRouter.post('/', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)';
  const values = {
    $name: name,
    $position: position,
    $wage: wage
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    }
    else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
        (err, employee) => {
          res.status(201).json({employee: employee});
        });
    }
  });
});

//Updates employee
employeesRouter.put('/:employeeId', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = 'UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE Employee.id = $employeeId';
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $employeeId: req.params.employeeId
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    }
    else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (err, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});

//Deletes employee by setting is_current_employee to 0
employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql = 'UPDATE Employee SET is_current_employee = $is_current_employee WHERE Employee.id = $employeeId';
  const values = {
    $is_current_employee: 0,
    $employeeId: req.params.employeeId
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    }
    else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (err, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});

module.exports = employeesRouter;
