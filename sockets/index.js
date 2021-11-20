const init = require('./initializer');
module.exports = (io) => {
  init.setIO(io);
  init.initialize();
}