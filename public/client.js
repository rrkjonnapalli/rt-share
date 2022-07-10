
var socket = io();
var editor = null;
var path = window.location.pathname;
var roomID = path.replace('/', '');
var el = document.getElementById('msg');
var btn = document.getElementById('roomLinkButton');
var fc = document.getElementById('container');
var errorContainer = document.getElementById('wrong-room');
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
      const value = editor.getModel().getValue();
      if (this.msg !== value) {
        this.msg = value;
        var data = { roomID, msg: this.msg };
        if (isJoined) {
          socket.emit('msg', data);
        }
      }
    }, 500);
  }


}

socket.on('set-msg', (data) => {
  const { msg = '' } = data || {};
  editor.getModel().setValue(msg);
});

const debouncer = new Debouncer();

function handleTransfer() {
  console.log('Currently in room -', roomID);
  isJoined = true;
}

function initializeEditor() {
  require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(el, {
      theme: 'vs-dark',
      value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n'),
      language: 'javascript',
      automaticLayout: true
    });
    addEditorListener();
  });
}

function initialize() {
  if (roomID) {
    if (!/^ROOM-[\w\d]{32}$/.test(roomID)) {
      errorContainer.hidden = false;
      fc.hidden = true;
      errorContainer.innerText = 'Invalid room id - ' + roomID;
      return;
    }
    socket.emit('join-room', roomID);
    socket.on('joined', () => {
      initializeEditor();
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


const addEditorListener = () => {
  btn.disabled = false;
  editor.onDidChangeModelContent(() => {
    var ct = Date.now();
    var diff = ct - time;
    time = ct;
    if (diff < 500) {
      debouncer.setTimer();
    }
  });
  editor.onKeyDown((e) => {
    const restricted = new Set([
      'KeyS',
      'KeyN',
      'KeyT',
      'KeyW'
    ]);
    if (e.ctrlKey && restricted.has(e.code)) {
      console.log('Preventing CTRL +', e.code.slice(-1));
      e.preventDefault();
    }
  });
}
require.config({ paths: { vs: '/monaco-editor/vs' } });