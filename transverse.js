var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.use(express.static('public'))
var rooms = [];
const port = 3000;
var users = [];
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
    var clients;
    var socketIds;
    socket.username = "Anonymous";
    var clientIp = socket.request.connection.remoteAddress;
    // we expect the client to send the room name that they want to connect to
    socket.on('room', function(room){
        if (!rooms.includes(room)){
            rooms.push(room);
        }
        socket.join(room);
        currentRoom = room;
        console.log("User joined room " + room);
        users = getOnlineUsers();
        socket.emit('sidebar', rooms, users);
    }); 
    // What to do when a client sends a message to their room
    socket.on('chat', function(msg){
        // send this message to all users in the room
        socket.to(currentRoom).emit('chat', msg);
        //log the message
        console.log("\""+msg +"\"" + " in room "+ currentRoom);
    });

    socket.on('nameChange', function(newName){
        // change the username serverside
        socket.username = newName;
        users = getOnlineUsers();
        socket.emit('sidebar', rooms, users);
    });

    socket.on('disconnect', function(){
        var msg  = clientIp + " ("+ socket.username +") has disconnected from room " + currentRoom;
        console.log(msg);
        //console.log(socket.id);
        // send a message to the rest wof the users online
        socket.to(currentRoom).emit('chat', msg);
        users = getOnlineUsers();
        socket.emit('sidebar', rooms, users);
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

// These should be removed eventually
// helper function for getOnlineUsers()
function updateRooms(){
    // check whether there are currently rooms defined
    if (typeof rooms != "undefined"){
        // iterate through each of the rooms
        for (var i = 0; i < rooms.length; i++){
            //get the information about this room
            clients = io.sockets.adapter.rooms[rooms[i]];
            // if the information doesn't exist:
            if (typeof clients == "undefined" || rooms[i] == "undefined"){
                // remove it from the array
                var removed = rooms.splice(i, 1);
            }
        }
    }
}
// helper function for updateRooms
function getUsernames(roomName){
    var usernames = [];
    clients = io.sockets.adapter.rooms[roomName];
    if (typeof clients != "undefined"){
        socketIds = Object.keys(clients['sockets']);
        for (i in socketIds){
            sock = io.sockets.connected[socketIds[i]];
            usernames.push(sock.username);
        }
    }
    return usernames;
}

function getOnlineUsers(){
    var onlineUsers = [];
    updateRooms();
    for(var i = 0; i < rooms.length; i++){
        onlineUsers.push(getUsernames(rooms[i]));
    }
    return onlineUsers;
}