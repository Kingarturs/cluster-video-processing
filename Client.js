const fs = require('fs');
const io = require('socket.io-client');
const ss = require('socket.io-stream');
const path = require('path');

const socket = io.connect('http://localhost:8000/user');

socket.on("connect", () => {
    const stream = ss.createStream();
    const filename = './videos/trailer.mp4';
    console.log("Enviando video");
    ss(socket).emit('video', stream, {name: filename});
    fs.createReadStream(filename).pipe(stream);
})

socket.on("process", () => {
    console.log("Servidor listo")
    socket.emit("process", "Start")
    console.log("Activado procesamiento")
})