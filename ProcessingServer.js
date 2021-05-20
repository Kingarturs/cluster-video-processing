const fs = require('fs');
const io = require('socket.io-client');
const ss = require('socket.io-stream');

const socket = io.connect('http://192.168.0.5:8000/processing');