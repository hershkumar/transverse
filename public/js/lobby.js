$(document).ready(function() {
    var defaultRoom = 'room';

    // callback for entering a room
    $('#roomForm').submit(function() {
        roomName = $('#roomName').val();
        // default room name
        if(roomName == '')
            roomName = defaultRoom;
        // navigate to the appropriate chat room
        location.href = '/' + encodeURI(roomName);
        // prevent the form from doing anything
        return false;
    });

    // start with the room name selected
    setTimeout('$("#roomName").focus()', 50);
});

