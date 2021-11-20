const {customAlphabet } = require('nanoid');
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890', 32);

module.exports.getID = () => {
  return Promise.resolve('ROOM-' + nanoid());
}


module.exports.validateRoomID = (roomID) => {
  return /^ROOM-[\w\d]{32}$/.test(roomID);
}