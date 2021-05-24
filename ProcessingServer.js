const fs = require('fs');
const io = require('socket.io-client');
const ss = require('socket.io-stream');
const path = require('path');
const jimp = require('jimp');

const socket = io.connect('http://localhost:8000/processing');
var id;

socket.on("connect", () => {
    id = socket.id
    console.log("Conectado al Broker con id:", socket.id)
})

socket.on("message", (data) => {
    console.log(data)
})

socket.on("start_indicator", (data) => {
    console.log(data)
    socket.emit("process_server", id);
})

ss(socket).on("process", (stream, data) => {
    var filename = "./images_to_process/" + path.basename(data.name);
    stream.pipe(fs.createWriteStream(filename));

    stream.on("end", () => {
        jimp.read(filename, (err, image) => {

            if (err) console.log(err);

            // image.greyscale().write(filename);
            image.grayscale().writeAsync(filename).then(() => {
                console.log("Imagen modificada con exito!");
    
                const processed_stream = ss.createStream();
                ss(socket).emit('processed_image', processed_stream, {name: filename});
                fs.createReadStream(filename).pipe(processed_stream);
    
                processed_stream.on("end", () => {
                    console.log("Imagen enviada de nuevo al servidor");
                    socket.emit("process_server", id);
                });
            })
        })
    })
})