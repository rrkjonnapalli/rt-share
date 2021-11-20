module.exports = {
  __io: null,
  getIO: () => {
    return this.__io;
  },
  setIO: (io) => {
    this.__io = io;
  },
  initialize() {
    require('./connection');
  }
}