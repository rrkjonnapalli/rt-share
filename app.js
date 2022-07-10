const express = require('express');

const app = express({});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/monaco-editor', express.static('node_modules/monaco-editor/min'));
app.use(express.static('public'));

app.get('*', (_req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

module.exports = app;