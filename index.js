const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js');

// const PORT = 5000;
const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "https://chatsecret.netlify.app",
    // origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(router);

io.on('connection', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if(error) return callback(error);

    socket.join(user.room);

    socket.emit('message', { user: 'Admin', text: `Hi ${user.name.toUpperCase()} 
    Welcome to room ${user.room.toUpperCase()} 
    This Chat Application is design for security purpose to chat top secret message with top secret friends/associations and would last for as long as you don't refresh 
    Enjoy`});
    socket.broadcast.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', { user: user.name, text: message });

    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name}s has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)}); 
    }
  })
});

server.listen(process.env.PORT, () => console.log(`Server is running on port: ${process.env.PORT} `));
// server.listen(PORT, () => console.log(`Server is running on port: ${PORT} `));