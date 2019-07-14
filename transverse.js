var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.use(express.static('public'))

const port = 3000;

//serve index.html
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/:room', function(req, res){
    res.sendFile(__dirname + '/chat.html');
});


// use ipv4 addresses to label client ip addresses
http.listen(port,'0.0.0.0', function(){
    console.log('listening on *:', port);
});

// what to do when a client connects to the server
io.sockets.on('connection', function(socket){
    var currentRoom;
    // we expect the client to send the room name that they want to connect to
    socket.on('room', function(room){
        socket.join(room);
        currentRoom = room
        console.log("User joined room " + room)
    });

    // What to do when a client sends a message to their room
    socket.on('chat', function(msg){
        socket.to(currentRoom).emit('chat', msg);
    });

    // What to do when a client sends a command to their room
    socket.on('command', function(command){

    });

    socket.on('disconnect', function(){
        console.log("user has disconnected from room " + currentRoom);
    });

});







// gets the timestamp in date time format
function getTimeStamp() {
    var now = new Date();
    return ((now.getMonth() + 1) + '/' +
        (now.getDate()) + '/' +
        now.getFullYear() + " " +
        now.getHours() + ':' +
        ((now.getMinutes() < 10)
            ? ("0" + now.getMinutes())
            : (now.getMinutes())) + ':' +
        ((now.getSeconds() < 10)
            ? ("0" + now.getSeconds())
            : (now.getSeconds())));
}
