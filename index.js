var express = require('express');
var socket = require('socket.io');
var players = [{socket_id: null, name: null, active: null}];
var connection_interval_id;

//App setup
var app = express();
var server = app.listen(4000, function() {
  console.log("Listening to request on port 4000");
});

//Socket setup
var io = socket(server);

io.on('connection', (socket) => {
  console.log("Made socket connection", socket.id);

  socket.on('addPlayer', (data) => {
    addPlayer(data);
    io.sockets.emit('receivePlayers', players);
  });

  socket.on('test', (data) => {
    // socket.broadcast.emit('typing', data);
  });
});

function addPlayer(data) {
  players.push({socket_id: data.id, name: data.name, active: true});
}
function removePlayer(socket_id) {
  console.log("Socket " + socket_id + " disconnected!");
  players.socket_id = false;
  clearInterval(connection_interval_id);
}
