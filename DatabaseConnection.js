var mysql = require('mysql');

class DatabaseConnection {
  constructor() {
    this.con = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'tic-tac-toe'
    });
  }

  testCon() {
    let promise = new Promise((resolve, reject) => {
      this.con.connect((error) => {
        if (error) {
          reject(error);
        }
      })
    })
    let response = promise.then(() => {
      return;
    }).catch((error) => {
      return error.code;
    })
    return response;
  }
}

module.exports = DatabaseConnection
