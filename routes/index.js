const express = require('express');
const app = express();

const TicTacToeRoute = require('./tic-tac-toe/index');

app.use('/tic-tac-toe', TicTacToeRoute);

app.get('/', (req, res) => {
  //homepage with all pages in my website
  res.json({item: 'Welcome in server/routes/index.js'})
});

module.exports = app;
