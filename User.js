const DatabaseConnection = require('./DatabaseConnection.js');

class User {
  constructor(name, age= null) {
    this.name = name;
    this.age = age;
    this.id = null;
  }

  addToDatabase() {
    let con = new DatabaseConnection().con();
    con.connect((error) => {
      if (error) throw err;
      let sql = "INSERT INTO user (name, age) VALUES ('" + this.name + "'," + this.age + ")";
      con.query(sql, (error, result) => {
        if (error) {throw error;}
        let id = result.insertId;
        this.id = id;
      });
    });
  }
}

module.exports = User
