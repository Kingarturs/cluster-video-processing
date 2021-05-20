const fs = require('fs');
const io = require('socket.io-client');
const ss = require('socket.io-stream');

const socket = io.connect('http://localhost:8000/user');
const stream = ss.createStream();
const filename = './videos/trailer.mp4';

ss(socket).emit('video', stream, {name: filename});
fs.createReadStream(filename).pipe(stream);