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

// takes in a string and returns the 
function timestampMessage(msg, username){
    return getTimeStamp() + " " + username + ": " + msg;
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
    $('#roomHeader').append(room.substring(1));

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
    // TODO: get rid of this in favor of socket.id on disconnect
    socket.on('sidebar', function(rooms, onlineUsers){
        var sidebarUsernames = [];
        //get which index we have to index into to get our room's online users
        var index = rooms.indexOf(room);
        sidebarUsernames = onlineUsers[index];
        // TODO: append sidebarUsernames to the sidebar here

    });
});
