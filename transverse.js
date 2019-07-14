var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs')

const port = 3000;

//serve index.html
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});
// use ipv4 addresses to label client ip addresses
http.listen(port,'0.0.0.0', function(){
    console.log('listening on *:', port);
});
