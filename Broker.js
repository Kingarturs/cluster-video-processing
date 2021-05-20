const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const io = require("socket.io")(server);
const ss = require('socket.io-stream');
const path = require('path');
const fs = require('fs')
const ffmpeg = require('ffmpeg');

const imageStream = ss.createStream()
var processing_clients = []

io.of('/user').on('connection', function(socket) {
    console.log("Nueva conexión")

    ss(socket).on('video', function(stream, data) {
        var filename = "./received/" + path.basename(data.name);
        stream.pipe(fs.createWriteStream(filename));

        stream.on("end", () => {
            try {
                console.log("Extrayendo imágenes del video...")
                var process = new ffmpeg("./received/" + path.basename(data.name));
                process.then(function (video) {
                    // Extracción de imagenes del video
            
                    video.fnExtractFrameToJPG("results", {
                        frame_rate: 1,
                        number: 10,
                        file_name: "./received/video.mp4"
                    }, (error, images) => {
                        console.log("Error", error)
                        console.log("Images", images)
                    })
            
                }, function (err) {
                    console.log('Error: ' + err);
                });
            } catch (e) {
                console.log("Error", e);
            }
        })
    });
});

io.of('/processing').on('connection', function(socket) {
    var server_sockets = io.of("/processing").sockets

    console.log("Sockets", Object.keys(server_sockets))
})

server.listen(8000, () => {
    console.log(`Broker corriendo en: http://localhost:8000`)
})