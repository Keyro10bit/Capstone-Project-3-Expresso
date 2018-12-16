const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuitemsRouter = require('./menu-items');

//set $menuId param
menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const values = {$menuId: menuId};

  db.get(sql, values, (err, menu) => {
    if (err) {
      next(err);
    }
    else if (menu) {
      req.menu = menu;
      next();
    }
    else {
      res.sendStatus(404);
    }
  });
});

menusRouter.use('/:menuId/menu-items', menuitemsRouter);

//Gets all menus
menusRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', (err, menus) => {
    if (err) {
      next(err);
    }
    else {
      res.status(200).json({menus:menus});
    }
  });
});

//Creates new menu
menusRouter.post('/', (req, res, next) => {
  const title = req.body.menu.title;
  if (!title) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO Menu (title) VALUES ($title)';
  const values = {$title: title};

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    }
    else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
        (err, menu) => {
          res.status(201).json({menu: menu});
        });
    }
  });
});

//Gets a single menu by id
menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
  next();
});

//Updates menu
menusRouter.put('/:menuId', (req, res, next) => {
  const title = req.body.menu.title;
  if (!title) {
    return res.sendStatus(400);
  }

  const sql = 'UPDATE Menu SET title = $title WHERE Menu.id = $menuId';
  const values = {
    $title: req.body.menu.title,
    $menuId: req.params.menuId
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    }
    else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`,
        (err, menu) => {
          res.status(200).json({menu: menu});
        });
    }
  });
});

//Deletes menu
menusRouter.delete('/:menuId', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const values = {$menuId: req.params.menuId};

  db.get(sql, values, (err, items) => {
    if (err) {
      next(err);
    }
    else if (items) {
      res.sendStatus(400);
    }
    else {
      db.run(`DELETE FROM MENU WHERE Menu.id = ${req.params.menuId}`, function(err) {
        if (err) {
          next(err);
        }
        else {
          res.sendStatus(204);
        }
      });
    }
  });
});

module.exports = menusRouter;
