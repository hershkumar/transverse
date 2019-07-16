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
// serve the chat.html file if they go to a subdomain
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
        // add the room to the rooms list if it doesnt exist already
        if (!rooms.includes(room)){
            rooms.push(room);
        }
        // add the client socket to the room
        socket.join(room);
        currentRoom = room;
        // send the newly connected user a dictionary of connected sockets with usernames
        socket.emit('sendConnected', getUsernames(currentRoom));
        var conMsg  = clientIp + " ("+ socket.username +") has connected to room " + currentRoom;
        console.log(conMsg);
        var msg = socket.username + " has connected";
        // send a message to the rest of the users online
        socket.to(currentRoom).emit('chat', msg);
        // send the socket id of the new socket to the clients
        io.in(currentRoom).emit('sendUserConnect', socket.id);
    }); 


    // What to do when a client sends a message to their room
    socket.on('chat', function(msg){
        // send this message to all users in the room
        socket.to(currentRoom).emit('chat', msg);
        //log the message
        console.log("\""+msg +"\"" + " in room "+ currentRoom);
    });
    // what to do when someone changes their name
    socket.on('nameChange', function(newName){
        // change the username serverside
        socket.username = newName;
        io.in(currentRoom).emit('sendUserChangeName', socket.id, newName);
    });
    // what to do when someone disconnects
    socket.on('disconnect', function(){
        var conMsg  = clientIp + " ("+ socket.username +") has disconnected from room " + currentRoom;
        console.log(conMsg);
        var msg = socket.username + " has disconnected";
        // send a message to the rest of the users online
        socket.to(currentRoom).emit('chat', msg);
        io.in(currentRoom).emit('sendUserDisconnect', socket.id);
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
    var returned = {};
    clients = io.sockets.adapter.rooms[roomName];
    if (typeof clients != "undefined"){
        socketIds = Object.keys(clients['sockets']);
        for (i in socketIds){
            sock = io.sockets.connected[socketIds[i]];
            returned[sock.id] = sock.username;
        }
    }
    return returned;
}
// gets an array of arrays, each internal array has a list of usernames for socketsin the rooms
function getOnlineUsers(){
    var onlineUsers = [];
    updateRooms();
    for(var i = 0; i < rooms.length; i++){
        var temp = getUsernames(room[i]);
        for (key in temp){
            onlineUsers.push(temp[key]);    
        }
        
    }
    return onlineUsers;
}