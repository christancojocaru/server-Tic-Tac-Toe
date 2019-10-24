const express = require('express');
const socket = require('socket.io')
const fetch = require("node-fetch");
const URL = require('./url.js');
const app = express();
const ticTacToePort = 4000;
var players = []; // name     /// socket_id
var rooms = [];   // room_id  /// player_1_socket_id  /// player_2_socket_id

// console.log(io.sockets.adapter.rooms);
//if you want to send to other player from room
// socket.to(room_id)
// if you want to send to all from rooom
// io.to(room_id)

const server = app.listen(ticTacToePort, () => {
  console.log("Listening to request on port " + ticTacToePort);
});

//Socket setup
const io = socket(server);

io.on('connection', (socket) => {
  console.log("Made socket connection", socket.id);

  socket.on('add_player', async (data) => {// socket_id and name
    await addPlayer(data);
    emitPlayers();
  });

  socket.on('send_connection', async (data) => {// my_name and his_name
    console.log("on send_connection");
    let url = new URL("user/read");
    let player_wanted = await postData(url.getUrl(), {name: data.his_name});

    if (player_wanted !== null) {
      // i put second elem of array because api return an array with count an player
      let is_active = player_wanted[1].active == "1" ? true : false;
      let is_in_game = player_wanted[1].in_game == "1" ? true : false;

      if (!is_active || is_in_game) {
        io.to(socket.id).emit("not_available");
      } else {
        console.log("AVAILABLE");
        io.to(player_wanted[1].socket_id).emit('send_connection', swapNames(data));
      }
    }
  });

  socket.on('create_connection', async (data) => {// my_name  // his_name //  room_id
    console.log("on create_connection");

    let url = new URL("user/read");
    let self_player = await postData(url.getUrl(), {name: data.my_name});
    let other_player = await postData(url.getUrl(), {name: data.his_name});

    if (self_player !== null && other_player !== null) {
      // i put second elem of array because api return an array with count an player
      self_player = self_player[1];
      other_player = other_player[1];

      rooms.push({
        socket_1_id: self_player.socket_id,
        socket_2_id: other_player.socket_id,
        room_id: data.room_id
      });

      url = new URL("game/create");
      await postData(url.getUrl(), {
        room_id: data.room_id,
        user_1_id: self_player.id,
        user_2_id: other_player.id
      });

      url = new URL("user/status");
      postData(url.getUrl(), {
        id: self_player.id,
        active: true,
        in_game: true
      })
      await postData(url.getUrl(), {
        id: other_player.id,
        active: true,
        in_game: true
      });

      socket.join(data.room_id);

      io.to(other_player.socket_id).emit('join_connection', {room_id: data.room_id});
    }
  });

  socket.on("join_connection", (data) => {// room_id
    console.log("on join_connection");
    socket.join(data.room_id);
    emitPlayers();
    io.in(data.room_id).emit("init_game", {room_id: data.room_id});
  });

  socket.on("start_game", (data) => {//player // history // hovered // stepNumber // room_id
    console.log("on start_game");

    rooms.forEach((room) => {
      if (room.room_id === data.room_id) {
        data.socket_1_id = room.socket_1_id;
        data.socket_2_id = room.socket_2_id;
        updateGame(data);
      }
    });
  });

  socket.on("update_game", (data) => {
    console.log("on update_game");
    rooms.forEach((room) => {
      if (room.socket_1_id === socket.id || room.socket_2_id === socket.id) {
        updateGame({
          room_id: room.room_id,
          player: data.player,
          history: data.history,
          stepNumber: data.stepNumber,
          IamNext: data.IamNext,
          socket_1_id: socket.id,
          socket_2_id: room.socket_1_id === socket.id ? room.socket_2_id : room.socket_1_id,
        });
      }
    });
  });

  socket.on("hovered", (data) => {
    console.log("on hovered");
    rooms.forEach((room) => {
      if (room.socket_1_id === socket.id || room.socket_2_id === socket.id) {
        let other_socket_id = room.socket_1_id === socket.id ? room.socket_2_id : room.socket_1_id;
        io.to(other_socket_id).emit("update_game_with_hovered", {hovered: data.hovered});
      }
    });
  });


  // solve them with socket.to instead of io.to
  socket.on("questionRewindMove", (data) => {
    console.log("on questionRewindMove");
    rooms.forEach((room) => {
      if (room.socket_1_id === socket.id || room.socket_2_id === socket.id) {
        let other_socket_id = room.socket_1_id === socket.id ? room.socket_2_id : room.socket_1_id;
        io.to(other_socket_id).emit("questionRewindMove", data);
      }
    });
  });

  socket.on("answearRewindMove", (data) => {
    console.log("on answearRewindMove");
    rooms.forEach((room) => {
      if (room.socket_1_id === socket.id || room.socket_2_id === socket.id) {
        io.in(room.room_id).emit("answearRewindMove", data);
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
      if (room.socket_1_id == socket.id) {
        outOfGame(room.socket_2_id);
      } else {
        outOfGame(room.socket_1_id);
      }
    });
    removePlayer(socket.id);
    emitPlayers();
  });
});

async function addPlayer(data) {
  players.push(data);// data has socket_id and name
  let url = new URL("user/create");
  await postData(url.getUrl(), data);
}

function removePlayer(socket_id) {

  players.forEach((player) => {
    if (player.socket_id === socket_id) {
      player.active = false;
      player.in_game = false;
      let data_to_send = {
        name: player.name,
        active: false,
        in_game: false
      };
      let url = new URL("user/status");
      postData(url.getUrl(), data_to_send);
    }
  });
}

async function emitPlayers() {//name and socket_id
  if (players.length > 1) {
    let url = new URL("user/read_active");
    let active_players = await getData(url.getUrl());
    if (active_players !== null) {
      io.sockets.emit('receive_players', active_players);
    }
  }
}

function updateGame(data) {
  let who_is_next;
  if (data.IamNext == undefined) {
    who_is_next = !!(Math.round(Math.random()));
  } else {
    who_is_next = data.IamNext;
  }

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
  io.in(data.room_id).emit("update_game", data_to_send);

  let url = new URL("game/update");
  postData(url.getUrl(), {
    player: data.player,
    history: data.history,
    room_id: data.room_id
  })
}

function swapNames(data) {
  let w = data.my_name;
  data.my_name = data.his_name;
  data.his_name = w;
  return data;
}

function findPlayer(data, by = "name") {
  return players.find((player) => {
    return player[by] === data;
  });
}

function outOfGame(socket_id) {
  players.forEach((player) => {
    if (player.socket_id === socket_id) {
      player.in_game = false;
    }
  })
}

const postData = async (url, data) => {
  try {
    const response  = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    const json = await response.json();
    if (json.message === undefined) {
      return json;
    } else {
      console.log("SUCCESS " + json.message);
      return null;
    }
  } catch (e) {
    console.log("ERROR " + e.message);

    //handle errors
  }
};

const getData = async (url) => {
  try {
    const response  = await fetch(url);
    const json = await response.json();
    if (json.message === undefined) {
      return json;
    } else {
      console.log("SUCCESS " + json.message);
      return null;
    }
  } catch (e) {
    console.log("ERROR " + e.message);
    // handle errors
  }
};

module.exports = app;
