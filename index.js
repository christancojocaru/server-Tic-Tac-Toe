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

    socket.on('connect_player', (name) => {
        console.log("on connect_player");
        let player_wanted = findPlayer("name", name);
        let self_player = findPlayer("socket_id", socket.id);

        io.to(player_wanted.socket_id).emit('connect_player', self_player.name);
    });

    socket.on('create_room', (data) => {
        console.log("on create_room");
        let player_1 = findPlayer("socket_id", socket.id);
        let player_2 = findPlayer("name", data.name);
        // console.log({"pl_1": player_1, "pl-2": player_2});
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
        socket.to(player_2.socket_id).emit('join_room', data_to_send);
  });

    socket.on("join_room", (data) => {
        console.log("on join_room");
        socket.join(data[0]);
        players.forEach((player, index) => {
            if (player.socket_id === data || player.socket_id === socket.id) {
                players[index].in_game = true;
            }
        });
        emitPlayers();
    });

    socket.on('selectedPlayer', (data) => {
        console.log("on selectedPlayer");
        socket.to(data.room_id).emit("selectedPlayer", {player: data.player});
    });

    socket.on('disconnect', () => {
        console.log("on disconnect");
        rooms.find((room) => {
            let socket_1_id = room.socket_1_id;
            let socket_2_id = room.socket_2_id;
            if (socket_1_id === socket.id) {
                socket.to(socket_2_id).emit("friend_disconnected");
            } else if (socket_2_id === socket.id) {
                socket.to(socket_1_id).emit("friend_disconnected");
            }
        });
        removePlayer(socket.id);
        emitPlayers();
    });
    // socket.broadcast.emit('typing', data);
});

function findPlayer(by, data) {
    return players.find((player) => {
        return player[by] === data;
    });
}

function emitPlayers() {
    let active_players = players.filter((player) => {
        return player.active && !player.in_game;
    });
    active_players.forEach((player) => {
    });
    io.sockets.emit('receive_players', active_players);
}

function addPlayer(data) {
    players.push({
        socket_id: data.id,
        name: data.name,
        active: true,
        in_game: false
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
