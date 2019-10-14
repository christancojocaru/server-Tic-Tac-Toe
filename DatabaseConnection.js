var mysql = require('mysql');

class DatabaseConnection {
  con() {
    return mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'tic-tac-toe'
    });
  }
}

module.exports = DatabaseConnection
