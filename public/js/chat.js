var socketsConnected = {};
var rounded = false;
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
    //clears the list for rewriting
    $('#users').empty();
    // write every username to the list
    for (key in socketsConnected){
        // add a new list element with the username of the socket
        $('#users').append('<li>'+ socketsConnected[key] + '</li>');    
    }
}

function getMessageColor(username) {
    rounded = false;
    lastLi = $('ul#messages > li').last()
    lastUsername = lastLi.attr('username');
    lastColor = lastLi.css('background-color');
    if(lastColor === undefined)
        lastColor = 'rgb(255, 255, 255)';
    console.log(lastColor);
    if(username === lastUsername)
        return lastColor;
    rounded = true;
    return (lastColor==='rgb(255, 255, 255)') ? 'rgb(223, 243, 245)' : 'rgb(255, 255, 255)';
}

//TODO: make sure mathjax is loaded before users can send messages
$(function () {
    // generate a new socket that connects to the server
    var socket = io.connect();
    var id;
    // TODO: Do we need to move stuff in here?
    socket.on('connect', function(){
        id = socket.id;
        // set the default username for the socket
        socket.username = "anon#" + id.substring(0,3);    
    });
    //gets the pathname, which is actually the room name
    var room  = window.location.pathname.substring(1);
    // tell the server that the client wishes to join a room
    socket.emit('room', room);

    // show the room id in the sidebar
    var inviteLink = '<a href="' + window.location.href + '">' + window.location.href + '</a>';
    $('#inviteLink').append(inviteLink);
    //$('#roomHeader').append(decodeURI(room.substring(1)));

    // TeX preview handler
    $('#m').on('input', function() {
        jaxCode = $('#m').val();
        $('#preview').text(jaxCode);
        var math = document.getElementById("preview");
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, math]);
    });

    
    // when they hit the submit button
    $('form').submit(function(e){
        e.preventDefault();

        // clear the preview text
        $('#preview').empty();

        var msg = $('#m').val();
        // check to make sure the message is not null/empty
        if (msg.trim() != '') {
            //check if the message is a command
            if (msg.startsWith('/nick ')){
                name = msg.substring(5);
                // check to make sure the name isn't empty
                if (name.trim() != ''){
                    //TODO: request first and change username after approval
                    //change the name clientside
                    socket.username = name;
                    // request for the name to be changed serverside
                    socket.emit('nameChange', socket.username); 
                }
            }
            else {
                // adding a timestamp and username to the message
                //msg = timestampMessage(msg, socket.username);
                //msg = socket.username + ": " + msg;
                // send the message over to the server
                socket.emit('chat', msg);

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
    // add the message to the chat log
    // TODO make the message contents indent
    socket.on('chat', function(msgObject) {
        newLi = $('<li>').attr('id', msgObject.id)
            .attr('username', msgObject.username)
            .text(msgObject.username + ': ' + msgObject.message)
            .css('background-color', getMessageColor(msgObject.username));
        if(rounded)
            $('ul#messages > li').last()
                .css('border-bottom-left-radius', '10px')
                .css('border-bottom-right-radius', '10px');
        $('#messages').append(newLi);
        // typeset any new math
        // TODO only typeset the new list element
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    });


    //// These handlers are for the user list that is displayed in the sidebar
    // server telling us that someone from the room has disconnected
    socket.on('sendUserDisconnect', function(id){
        // the server has sent over the id of the socket that disconnected from the room
        delete socketsConnected[id];
        displayUsers();
    });
    // the server telling us that someone has connected to the room
    socket.on('sendUserConnect', function(id){
        //TODO: remove hardcoding of default username
        // server sends the id of the new socket
        socketsConnected[id] = "anon#" + id.substring(0,3);
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
