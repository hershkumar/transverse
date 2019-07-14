var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs')

const port = 3000;

//serve index.html
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/:room', function(req, res){
    console.log(req.params.room);
    res.sendFile(__dirname + '/chat.html');
});


// use ipv4 addresses to label client ip addresses
http.listen(port,'0.0.0.0', function(){
    console.log('listening on *:', port);
});

// what to do when a client connects to the server
io.sockets.on('connection', function(socket){
    // we expect the client to send the room name that they want to connect to
    socket.on('room', function(room){
        socket.join(room);
    });

    // What to do when a client sends a message to their room
    socket.on('chat', function(msg){

    });

    // What to do when a client sends a command to their room
    socket.on('command', function(command){

    });

    socket.on('disconnect', function(){
        console.log("user has disconnected");
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
