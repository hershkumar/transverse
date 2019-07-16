var socketsConnected = {};
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

// takes in a string and returns the timestamped message
function timestampMessage(msg, username){
    return getTimeStamp() + " " + username + ": " + msg;
}
// updates the sidebar element that lists all the users in the room (#users)
function displayUsers(){
    $('#users').empty();
    for (key in socketsConnected){
        console.log("appending " + socketsConnected[key]);
        $('#users').append('<li>'+ socketsConnected[key] + '</li>');    
    }
}

$(function () {
    // generate a new socket that connects to the server
    var socket = io.connect();
    //gets the pathname, which is actually the room name
    var room  = window.location.pathname;
    // tell the server that the client wishes to join a room
    socket.emit('room', room);
    // set the default username for the socket
    socket.username = "Anonymous";
    // store the id of this socket for later use
    var id = socket.id;
    // show the room id on the page
    $('#roomHeader').append(room.substring(1));
    // when they hit the submit button
    $('form').submit(function(e){
        e.preventDefault();
        var msg = $('#m').val();
        // check to make sure the message is not null/empty
        if (msg.trim() != '') {
            //check if the message is a command
            if (msg.startsWith('/nick ')){
                name = msg.substring(5);
                // check to make sure the name isn't empty
                if (name.trim() != ''){
                    //change the name clientside
                    socket.username = name;
                    // request for the name to be changed serverside
                    socket.emit('nameChange', socket.username); 
                }
            }
            else {
                // adding a timestamp and username to the message
                //msg = timestampMessage(msg, socket.username);
                msg = socket.username + ": " + msg;
                // send the message over to the server
                socket.emit('chat', msg);

                // append it to the local message board
                $('#messages').append($('<li>').text(msg));

                // check whether the user is scrolled to the bottom
                // the 35 error seems to be padding or something
                // code taken from dotnetCarpenter at
                // https://stackoverflow.com/questions/18614301/keep-overflow-div-scrolled-to-bottom-unless-user-scrolls-up
                // TODO: When entering full math mode stuff ($$blah$$), the scrolling
                // doesn't scroll all the way down to the end of the MathJax render
                chatPane = document.getElementById('messages');
                isScrolledToBottom = chatPane.scrollHeight - chatPane.clientHeight <= chatPane.scrollTop + 35;
                if(isScrolledToBottom)
                    chatPane.scrollTop = chatPane.scrollHeight - chatPane.clientHeight;
            }

            // clear the text input bar
            $('#m').val('');
            // typeset any new math
            // TODO only typeset the new list element
            MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
        }
        
    });
    // when the server tells the client that there has been a message sent
    socket.on('chat',function(msg){
        $('#messages').append($('<li>').text(msg));
        // typeset any new math
        // TODO only typeset the new list element
        MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
    });

    // server telling us that someone from the room has disconnected
    socket.on('sendUserDisconnect', function(id){
        // the server has sent over the id of the socket that disconnected from the room
        delete socketsConnected[id];
        displayUsers();
    });
    // the server telling us that someone has connected to the room
    socket.on('sendUserConnect', function(id){
        // server sends the id of the new socket
        socketsConnected[id] = "Anonymous";
        displayUsers();
    });
    // the server telling us that someone in the room has changed their name
    socket.on('sendUserChangeName', function(id, newName){
        socketsConnected[id] = newName;
        displayUsers();
    });
    // the server sending a list of people who are in the room already
    socket.on('sendConnected', function(sockets){
        // give the client the list of already connected clients
        socketsConnected = sockets;
        displayUsers();
    });
});
