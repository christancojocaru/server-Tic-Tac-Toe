const express = require('express');
const routes = require('./routes');

const app = express();

// app.use('/api', apiRoute);
app.use('/', routes);

// function outOfGame(socket_id) {
//   players.forEach((player) => {
//     if (player.socket_id === socket_id) {
//       player.in_game = false;
//     }
//   })
// }
//
// function findPlayer(data, by = "name") {
//   return players.find((player) => {
//     return player[by] === data;
//   });
// }
//
// function updateGame(data) {
//   let who_is_next;
//   if (data.IamNext == undefined) {
//     who_is_next = !!(Math.round(Math.random()));
//   } else {
//     who_is_next = data.IamNext;
//   }
//   let data_to_send = {
//     [(data.socket_1_id).toString()]: {
//       player: data.player,
//       history: data.history,
//       stepNumber: data.stepNumber,
//       IamNext: who_is_next,
//     },
//     [(data.socket_2_id).toString()]: {
//       player: data.player === "X" ? "O" : "X",
//       history: data.history,
//       stepNumber: data.stepNumber,
//       IamNext: !who_is_next,
//     }
//   };
//   io.in(data.room_id).emit("update_game", data_to_send);
//   let data_to_database = {
//     player: data.player,
//     history: JSON.stringify(data.history),
//     room_id: data.room_id
//   };
//   updateGameOnDatabase(data_to_database);
// }
//
// function emitPlayers() {
//   let active_players = players.filter((player) => {
//     return player.active && !player.in_game;
//   });
//   io.sockets.emit('receive_players', active_players);
// }
//
// function addPlayer(data) {
//   players.push({
//     socket_id: data.socket_id,
//     room_id: null,
//     name: data.name,
//     active: true,
//     in_game: false,
//   });
//   let user = new User(data.name);
//   user.addToDatabase();
// }
//
// function removePlayer(socket_id) {
//   players.forEach((player) => {
//     if (player.socket_id === socket_id) {
//       player.active = false;
//       player.in_game = false;
//       setUnactive(player);
//     }
//   });
// }
//
// function updateGameOnDatabase(data) {
//   let con = new DatabaseConnection().con;
//   con.connect((error) => {
//     if (error) throw err;
//     let sql = "UPDATE `user` INNER JOIN `game` ON `user`.`id` IN (`game`.`user_1_id`, `game`.`user_2_id`) SET `game`.`player`= ?, `game`.`history`= ?, `user`.`in_game`=1, `game`.`disconnected`=null WHERE room_id = ?";
//     let args = [data.player, data.history, data.room_id];
//     con.query(sql, args, (error) => {
//       if (error) {throw error;}
//       console.log("Game Updated Successfully in database.");
//     });
//   });
// }
//
// function setUnactive(player) {
//   let con = new DatabaseConnection().con;
//   con.connect((error) => {
//     if (error) throw err;
//     let sql = "UPDATE `user` SET `active`= ?, `in_game`= ? WHERE name = ?";
//     let args = [0, 0, player.name];
//     con.query(sql, args, (error) => {
//       if (error) {throw error}
//       console.log("Player " + player.name + " set unactive successfully in database.");
//     });
//   });
// }
//
// function setOutOfGame(room_id) {
//   let con = new DatabaseConnection().con;
//   con.connect((error) => {
//     if (error) throw err;
//     let sql = "UPDATE `game` INNER JOIN `user` ON `user`.`id` IN (`game`.`user_1_id`, `game`.`user_2_id`)  SET `user`.`in_game`=0, `game`.`game_active`= ?, `game`.`disconnected`= ? WHERE room_id = ?";
//     let args = [0, getMyDate(), room_id];
//     con.query(sql, args, (error) => {
//       if (error) {throw error}
//       console.log("Game: " + room_id + " finished in database.");
//     });
//   });
// }
//
// function swapNames(data) {
//   let w = data.my_name;
//   data.my_name = data.his_name;
//   data.his_name = w;
//   return data;
// }
//
// function getMyDate() {
//   let date = new Date();
//   return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
// }
