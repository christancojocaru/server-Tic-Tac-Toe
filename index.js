var express = require('express');
var socket = require('socket.io');
const Room = require('./Room.js');
const User = require('./User.js');
var mysql = require('mysql');
var players = [];
var rooms = [];

//App setup
var app = express();
var server = app.listen(4000, function() {
    console.log("Listening to request on port 4000");
});

//Socket setup
var io = socket(server);

io.on('connection', (socket) => {
    console.log("Made socket connection", socket.id);

    socket.on('add_player', (data) => {
        console.log("on add_player");
        addPlayer(data);
        if (players.length !== 1) {
            emitPlayers();
        }
    });

    socket.on('send_connection', (data) => {
        console.log("on send_connection");
        let player_wanted = findPlayer(data.his_name);
        let self_player = findPlayer(data.my_name);
        if (self_player.socket_id === socket.id) {
            if (self_player.name !== data.my_name) {
              console.log("error on sending connection");
              console.log(player_wanted, self_player);
            }
            if (!player_wanted.active || player_wanted.in_game) {
              io.to(self_player.socket_id).emit("Not_Available", "Player ${player_wanted.name} is no longer available!");
            }
            io.to(player_wanted.socket_id).emit('send_connection', swapNames(data));
        }
    });

    socket.on('create_connection', (data) => {
        console.log("on create_connection");
        let player_1 = findPlayer(data.my_name);
        let player_2 = findPlayer(data.his_name);
        let room = new Room(data.room_id, player_1.name, player_2.name);
        rooms.push({
            socket_1_id: player_1.socket_id,
            socket_2_id: player_2.socket_id,
            room_id: room.id
        });
        room.addToDatabase();
        socket.join(room.id);

        let data_to_send = {
            socket_id: socket.id,
            room_id: room.id
        };
        io.to(player_2.socket_id).emit('join_connection', data_to_send);
      });


    socket.on("join_connection", (data) => {
        console.log("on join_connection");
        socket.join(data.room_id);
        players.forEach((player, index) => {
            if (player.socket_id === data.socket_id || player.socket_id === socket.id) {
                players[index].in_game = true;
                players[index].room_id = data.room_id;
            }
        });
        emitPlayers();
        rooms.forEach((room) => {
          if (room.room_id === data.room_id) {
            io.in(room.room_id).emit("init_game", {room_id: room.room_id});
          }
        });
    });

    socket.on("start_game", (data) => {
      console.log("on start_game");
      rooms.forEach((room) => {
        if (room.socket_1_id === socket.id || room.socket_2_id === socket.id) {
          updateGame({
            room_id: room.room_id,
            player: data.player,
            history: data.history,
            stepNumber: data.stepNumber,
            socket_1_id: socket.id,
            socket_2_id: room.socket_1_id === socket.id ? room.socket_2_id : room.socket_1_id,
          });
        }
      });
    });

    socket.on('selectedPlayer', (data) => {
        console.log("on selectedPlayer");
        socket.to(data.room_id).emit("selectedPlayer", {player: data.player});
    });

    socket.on("Incorrect_Player", (data) => {
      console.log("incorrect player");
      console.log("my name: " + data.my_name + " his name: " + data.his_name)
    });

    socket.on("select_another_player", (data) => {
      console.log("on select_another_player room ID: " + data.room_id);
      players.forEach((player, index) => {
        if (player.room_id === data.room_id) {
          players[index].in_game = false;
        }
      });
      io.in(data.room_id).emit("disconnect");
      emitPlayers();
    });

    socket.on('disconnect', () => {
        console.log("on disconnect");
        rooms.find((room) => {
            if (room.socket_1_id === socket.id || room.socket_2_id === socket.id) {
                io.in(room.room_id).emit("disconnect");
            }
        });
        removePlayer(socket.id);
        emitPlayers();
    });
});

function findPlayer(data, by = "name") {
    return players.find((player) => {
        return player[by] === data;
    });
}

function updateGame(data) {
  let who_is_next = !!(Math.round(Math.random()));
  let data_to_send = {
    [(data.socket_1_id).toString()]: {
      player: data.player,
      history: data.history,
      stepNumber: data.stepNumber,
      IamNext: who_is_next,
    },
    [(data.socket_2_id).toString()]: {
      player: data.player === "X" ? "O" : "X",
      history: data.history,
      stepNumber: data.stepNumber,
      IamNext: !who_is_next,
    }
  };
  console.log(data_to_send);
  io.in(data.room_id).emit("update_game", data_to_send);
}

function emitPlayers() {
    // console.log("Players");
    // players.forEach((player) => {console.log(player);});
    let active_players = players.filter((player) => {
        return player.active && !player.in_game;
    });
    // console.log("active Players");
    // active_players.forEach((player) => {console.log(player);});
    io.sockets.emit('receive_players', active_players);
}

function addPlayer(data) {
    players.push({
        socket_id: data.socket_id,
        room_id: null,
        name: data.name,
        active: true,
        in_game: false,
    });
    let user = new User(data.name);
    user.addToDatabase();
}

function removePlayer(socket_id) {
    players.forEach((player) => {
    if (player.socket_id === socket_id) {
        player.active = false;
    }
    });
}

function swapNames(data) {
  let w = data.my_name;
  data.my_name = data.his_name;
  data.his_name = w;
  return data;
}
