
var socket = io();

var path = window.location.pathname;
var roomID = path.replace('/', '');

var ec = document.getElementById('form');
var fc = document.getElementById('wrong-room');
var txt = document.getElementById('msg');
var time = 0;
var isJoined = false;
var cs = { width: '', height: '' };

function copyRoomLink() {
  if (navigator && navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href);
  }
}

function isStyleChanged(s) {
  if (!s) {
    return false;
  }
  if (cs.width !== s.width) {
    return true;
  }
  if (cs.height !== s.height) {
    return true;
  }
  return false;
}

class Debouncer {
  constructor() {
    this.timer = null;
    this.msg = '';
  }

  clear() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  setTimer() {
    this.clear();
    this.timer = setTimeout(() => {
      if (this.msg !== txt.value) {
        this.msg = txt.value;
        var data = { roomID, msg: this.msg };
        if (isStyleChanged(txt.style)) {
          cs = txt.style;
          data.style = { height: cs.height, width: cs.width }
        }
        if (isJoined) {
          socket.emit('msg', data);
        }
      }
    }, 500);
  }


}

socket.on('set-msg', (data) => {
  if (isStyleChanged(data.style)) {
    cs = data.style;
    Object.assign(txt.style, cs);
    console.log(cs);
  }
  txt.value = data.msg;
});

const debouncer = new Debouncer();

txt.onkeydown = (e) => {
  var ct = Date.now();
  var diff = ct - time;
  if (/F\d/.test(e.key) || [
    'Alt', 'AltGraph', 'CapsLock', 'Control', 'Meta', 'FnLock', 'Fn', 'Shift', 'Symbol'
  ].includes(e.key)) {
    return;
  }
  if (e.key === 'Tab') {
    e.preventDefault();
    txt.value += '  ';
  }
  time = ct;
  if (diff < 500) {
    debouncer.setTimer();
  }
}

function handleTransfer() {
  console.log('Currently in room -', roomID);
  isJoined = true;
}

function initialize() {
  if (roomID) {
    if (!/^ROOM-[\w\d]{32}$/.test(roomID)) {
      fc.hidden = true;
      ec.hidden = false;
      ec.innerText = 'Invalid room id - ' + roomID;
      return;
    }
    socket.emit('join-room', roomID);
    socket.on('joined', () => {
      handleTransfer();
    })
  } else {
    socket.emit('new-room');
    socket.on('room-id', (id) => {
      roomID = id;
      window.location.href += roomID;
      handleTransfer();
    });
  }
}

initialize();