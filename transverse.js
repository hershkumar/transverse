var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();

app.use(express.static('public'))
var rooms = [];
const port = 3000;
var users = [];

// initialize sqlite3 database
console.log('Initializing messages database...');
var db = new sqlite3.Database('./db/messages.db');
console.log('...done.');

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
    socket.username = "anon#" + socket.id.substring(0,3);
    var clientIp = socket.request.connection.remoteAddress;
    // we expect the client to send the room name that they want to connect to
    socket.on('room', function(room){
        // initialize the table of messages for the room
        // called 'm_room' with fields id, username, message content
        console.log('Creating/accessing table m_' + room + '...');
        db.run('create table if not exists '
            + 'm_' + room + ' ('
            + 'id numeric primary key, '
            + 'username text, '
            + 'content text);');
        console.log('...done.');

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
        var connectMessage = " has connected to the room";
        // logs the message in the database and sends it to the clients
        sendAndLogChat(currentRoom, connectMessage, socket.username);
        // send the socket id of the new socket to the clients
        io.in(currentRoom).emit('sendUserConnect', socket.id);
    }); 


    // What to do when a client sends a message to their room
    socket.on('chat', function(msg){
        sendAndLogChat(currentRoom, msg, socket.username);
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
        var disconnectMessage = " has left the room";

        sendAndLogChat(currentRoom, disconnectMessage, socket.username);
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
// helper function for getOnlineUsers
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
// gets an array of arrays, each internal array has a list of usernames for sockets in the rooms
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

function sendAndLogChat(room, messageText, username){
    var lastId = 0;
    var thisId;
    // get the last message entry in the room
    db.get('select * from m_' + room + ' order by id desc limit 1;', function(err, row) {
        if(err) return console.error(err.message);
        // find the id of the last message in this room
        if(row) lastId = row.id;
        // the new message should have an incremented id
        // this will be one if the room has no messages in it yet
        let thisId = lastId + 1;
        var insertString = "insert into m_" + room + " values ("
            + thisId + ", '"
            + username + "', '"
            + messageText + "');";
        // write the new message to the database
        db.run(insertString);

        // prepare a message object to send to everyone in the room
        msgObject = {
            'id' : thisId,
            'username': username,
            'message': messageText
        };
        // send this to all users in the room
        io.in(room).emit('chat', msgObject);
    }); 
}