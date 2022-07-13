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
app.mainConsole = console.log;

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
    var app = null;
    try {
      eval(code);
    } catch (error) {
      console.log(error.stack);
    }
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

app.setupConsole = (f) => {
  // setting up console.log
  try {
    console.log = typeof f === 'function' ? f : function (...args) {
      for (let arg of args) {
        if (arg instanceof Error) {
          app.consoleContainer.innerText += arg;
        } else if (typeof arg === 'object') {
          app.consoleContainer.innerText += app.js(arg);
        } else {
          app.consoleContainer.innerText += arg;
        }
        app.consoleContainer.innerText += ' ';
      }
      app.consoleContainer.innerText = app.consoleContainer.innerText.slice(0, -1) + '\n'
    };
  } catch (error) {
    alert('Unable to setup console !!!');
  }
}

app.initializeEditor = () => {
  require(['vs/editor/editor.main'], function () {
    app.editor = monaco.editor.create(app.editorEl, {
      theme: 'vs-dark',
      value: [
        'function x() {',
        '\t/* IMPORTANT!!! Run at your own risk */',
        '\t/* CTRL+S & CTRL+R -> Run, CTRL+Q -> Clear Console */',
        '\t/* Try not to use app variable */',
        '\t/* Default console.log available at app.mainConsole */',
        '\tconsole.log("Hello world!");',
        '}',
        'x();'
      ].join('\n'),
      language: 'javascript',
      automaticLayout: true
    });

    // editor init check
    setTimeout(() => {
      if (!app.editor) {
        const status = confirm('Unable to load the editor, Reloading the page !!!');
        if (status) {
          location.reload();
        }
      }
      app.setupConsole();
      app.addEditorListener();
    }, 1000)

    // console.log(app.editor);
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

app.restricted = new Set([
  'KeyS',
  'KeyN',
  'KeyT',
  'KeyW',
  'KeyQ',
  'KeyR'
]);
app.runKeys = new Set(['KeyS', 'KeyR']);
app.consoleClearKeys = new Set(['KeyQ']);

app.addEditorListener = () => {
  app.rlBtn.disabled = false;
  app.ccBtn.disabled = false;
  app.rcBtn.disabled = false;

  app.editor.onDidPaste(app.changeEventListener)
  app.editor.onDidChangeModelContent(app.changeEventListener);

  app.editor.onKeyDown((e) => {
    if (e.ctrlKey && app.restricted.has(e.code)) {
      // console.log('Preventing CTRL +', e.code.slice(-1));
      e.preventDefault();
      if (app.runKeys.has(e.code)) {
        app.runCode();
      }
      if (app.consoleClearKeys.has(e.code)) {
        app.clearConsole();
      }
    }
  });
}
require.config({ paths: { vs: '/monaco-editor/vs' } });
