const fs = require('fs');
const io = require('socket.io-client');
const ss = require('socket.io-stream');

const socket = io.connect('http://localhost:8000/processing');