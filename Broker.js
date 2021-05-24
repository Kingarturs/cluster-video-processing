const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const io = require("socket.io")(server);
const ss = require('socket.io-stream');
const path = require('path');
const fs = require('fs')
const ffmpeg = require('ffmpeg');
const videoshow = require('videoshow');
const naturalCompare = require("natural-compare-lite");

var processing_clients = [];

var images_array = [];

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
            
                    video.fnExtractFrameToJPG("images", {
                        frame_rate: 1,
                        number: 100,
                        file_name: "./received/video.mp4"
                    }, (error, images) => {
                        if (error) {
                            console.log("Error", error)
                        }
                        images_array = images
                        socket.emit("process", "ready")
                    })
            
                }, function (err) {
                    console.log('Error: ' + err);
                });
            } catch (e) {
                console.log("Error", e);
            }
        });
    });

    socket.on('process', (data) => {
        console.log("Iniciando proceso")
        io.of("/processing").emit("start_indicator", "Comenzando proceso")
    });

});

io.of('/processing').on('connection', (socket) => {
    processing_clients.push({id: socket.id, isProc: false});
    console.log("Servidores de procesamiento:", processing_clients);

    socket.on('disconnect', (socket) => {
        console.log(socket.id)
        processing_clients.splice(processing_clients.indexOf({id: socket.id}), 1);
        console.log(processing_clients);
    })

    socket.on('process_server', (server_id) => {
        if (images_array && images_array.length > 0) {
            const stream = ss.createStream();
            const filename = images_array.shift()

            ss(socket).emit('process', stream, {name: filename});
            fs.createReadStream(filename).pipe(stream);

            stream.on("end", () => {
                console.log(`Enviado archivo ${filename} a cliente ${server_id}`)
            });

        } else {
            io.of("/processing").to(server_id).emit("message", "Proceso terminado")

            var secondsToShowEachImage = 0.1;
            var finalVideoPath = './final_video/video_procesado.mp4';
            var image_paths = [];

            var videoOptions = {
                fps: 24,
                transition: false,
                videoBitrate: 1024,
                size: '640x360',
                videoCodec: 'libx264', 
                outputOptions: ['-pix_fmt yuv420p'],
                format: 'mp4' 
            }

            console.log("Preparando imágenes para procesar video final");
            var files = fs.readdirSync("./processed_images/")

            files.sort(function(a, b){
                return naturalCompare(a.toLowerCase(), b.toLowerCase());
            })

            console.log(files)

            files.forEach(file => {
                image_paths.push({path: `./processed_images/${file}`, loop: secondsToShowEachImage})
            });

            videoshow(image_paths, videoOptions)
            .save(finalVideoPath)
            .on('start', function (command) { 
                // console.log('encoding ' + finalVideoPath + ' with command ' + command) 
                console.log("Codificando video")
            })
            .on('error', function (err, stdout, stderr) {
                return Promise.reject(new Error(err)) 
            })
            .on('end', function (output) {
                console.log("video procesado guardado en:", output)
            })
        }
    });

    ss(socket).on('processed_image', (stream, data) => {
        var filename = "./processed_images/" + path.basename(data.name);
        stream.pipe(fs.createWriteStream(filename));
    });

})

server.listen(8000, () => {
    console.log(`Broker corriendo en: http://localhost:8000`)
})