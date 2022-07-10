var app = {};

app.socket = io();
app.editor = null;
app.path = window.location.pathname;
app.roomID = app.path.replace('/', '');
app.editorEl = document.getElementById('msg');
app.rlBtn = document.getElementById('roomLinkButton');
app.ccBtn = document.getElementById('clearConsole');
app.rcBtn = document.getElementById('runCode');
app.container = document.getElementById('container');
app.errorContainer = document.getElementById('wrong-room');
app.consoleContainer = document.getElementById('console-output');
app.time = 0;
app.isJoined = false;

app.copyRoomLink = () => {
  if (navigator && navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href);
  }
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
      const value = app.editor.getModel().getValue();
      if (this.msg !== value) {
        this.msg = value;
        var data = { roomID: app.roomID, msg: this.msg };
        if (app.isJoined) {
          app.socket.emit('msg', data);
        }
      }
    }, 500);
  }


}

app.clearConsole = () => {
  app.consoleContainer.innerText = '';
  app.consoleContainer.scrollIntoView(false);
}

app.js = JSON.stringify;

app.runCode = () => {
  const code = app.editor.getModel().getValue();
  // console.log(code);
  const runner = () => {
    const temp = console.log;
    try {
      console.log = function (...args) {
        // temp(args);
        for (let arg of args) {
          if (arg instanceof Error) {
            app.consoleContainer.innerText += arg;
          } else if (typeof arg === 'object') {
            app.consoleContainer.innerText += app.js(arg);
          } else {
            app.consoleContainer.innerText += arg;
          }
        }
        app.consoleContainer.innerText += '\n'
      };
    } catch (error) {
      alert('Unable to setup console !!!');
    }

    try {
      eval(code);
    } catch (error) {
      console.log(error.stack);
    }
    console.log = temp;
  }
  runner();
  app.consoleContainer.scrollIntoView(false);
}

app.socket.on('set-msg', (data) => {
  const { msg = '' } = data || {};
  app.editor.getModel().setValue(msg);
});

app.debouncer = new Debouncer();

app.handleTransfer = () => {
  console.log('Currently in room -', app.roomID);
  app.isJoined = true;
}

app.initializeEditor = () => {
  require(['vs/editor/editor.main'], function () {
    app.editor = monaco.editor.create(app.editorEl, {
      theme: 'vs-dark',
      value: ['function x() {','\t/* Do not use app variable */', '\tconsole.log("Hello world!");', '}'].join('\n'),
      language: 'javascript',
      automaticLayout: true
    });
    console.log(app.editor);
    app.addEditorListener();
  });
}

app.initialize = () => {
  if (app.roomID) {
    if (!/^ROOM-[\w\d]{32}$/.test(app.roomID)) {
      app.errorContainer.hidden = false;
      app.container.hidden = true;
      app.errorContainer.innerText = 'Invalid room id - ' + app.roomID;
      return;
    }
    app.socket.emit('join-room', app.roomID);
    app.socket.on('joined', () => {
      app.initializeEditor();
      app.handleTransfer();
    })
  } else {
    app.socket.emit('new-room');
    app.socket.on('room-id', (id) => {
      app.roomID = id;
      window.location.href += app.roomID;
      app.handleTransfer();
    });
  }
}

app.initialize();


app.changeEventListener = () => {
  var ct = Date.now();
  var diff = ct - app.time;
  app.time = ct;
  if (diff < 500) {
    app.debouncer.setTimer();
  }
};

app.runKeys = new Set(['KeyS', 'KeyR']);
app.addEditorListener = () => {
  app.rlBtn.disabled = false;
  app.ccBtn.disabled = false;
  app.rcBtn.disabled = false;

  app.editor.onDidPaste(app.changeEventListener)
  app.editor.onDidChangeModelContent(app.changeEventListener);

  app.editor.onKeyDown((e) => {
    const restricted = new Set([
      'KeyS',
      'KeyN',
      'KeyT',
      'KeyW',
      'KeyR'
    ]);
    if (e.ctrlKey && restricted.has(e.code)) {
      console.log('Preventing CTRL +', e.code.slice(-1));
      e.preventDefault();
      if (app.runKeys.has(e.code)) {
        app.runCode();
      }
    }
  });
}
require.config({ paths: { vs: '/monaco-editor/vs' } });
