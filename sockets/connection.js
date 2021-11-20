const io = require('./initializer').getIO();
const utils = require('../utils');

io.on('connection', (socket) => {

  socket.on('new-room', () => {
    utils.getID().then((roomID) => {
      socket.emit('room-id', roomID);
    });
  });

  socket.on('join-room', (id) => {
    if (utils.validateRoomID(id)) {
      socket.join(id);
    }
    socket.emit('joined');
  });

  socket.on('msg', (e) => {
    if (utils.validateRoomID(e.roomID)) {
      socket.to(e.roomID).emit('set-msg', e);
    }
  });

  socket.on('disconnect', () => {
  });
});