$(document).ready(function() {
    var users;
    var socket = io.connect("http://10.42.0.138:5555", {transports: ['websocket'], secure: true});
    
    socket.emit("handshake", $.cookie("name"));
    socket.on("chat message", (data) => {
            $(".container").append(data);
        });
    
    socket.on("users change", function(list) {
        $("select").html("");
        users = list;
        $.each(users, (user) => {
            if($.cookie("name") !== user){
                $("select").append("<option>"+user+"</option>");
            }
        });
    });
    
    $("button").click(function() {
        socket.emit('chat message', {to: $("select").val(), message: $("textarea").val()});
        $("textarea").val("");
    });
    
    $("#exit").click(function() {
        $.removeCookie("key");
        $.removeCookie("name");
        location.reload(true);
    });
});