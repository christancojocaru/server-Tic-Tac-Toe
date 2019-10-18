const DatabaseConnection = require('./DatabaseConnection.js');

class Room {
  constructor(id, player_1 = null, player_2 = null) {
    this.id = id;
    this.player_1 = player_1;
    this.player_2 = player_2;
  }

  getUser(name) {
    return "SELECT `user`.`id` FROM `user` WHERE name = '" + name + "' LIMIT 1";
  }

  addToDatabase() {
    let con = new DatabaseConnection().con
    con.connect((error) => {
      if (error) throw err;
      let sql = "INSERT INTO `game` (`room_id`, `user_1_id`, `user_2_id`, `game_active`) VALUES (" + this.id + ", (" + this.getUser(this.player_1) + "), (" + this.getUser(this.player_2) + "), 1)";

      con.query(sql, (error, result) => {
        if (error) {throw error;}
        // console.log("player " + this.player_1 + " and " + this.player_2 + " inserted into game ID: " + result.insertId);
      });
    });
  }
}

module.exports = Room
