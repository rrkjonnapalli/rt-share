const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');
const server = http.createServer(app);
const io = new Server(server);
require('./sockets')(io);

server.listen(config.PORT);

server.on('error', (err) => {
  console.log(err);
});

server.on('listening', () => {
  console.info('Server listening on port', config.PORT);
});
