$(document).ready(function() {
    var socket = io.connect("http://10.42.0.138:5555", {transports: ['websocket'], secure: true});
    
    socket.on("logerr", function() {
            $('.pop').slideDown();
        });
    
    socket.on("logsuccess", function(data) {
            $.cookie("name", data.name);
            $.cookie("key", data.key);
            window.location = window.location.pathname;
        });
    
    $('.pop').slideUp(0);
    
    $('.close').click(function() {
       $('.pop').slideUp(1000);
    });
    
    $("#send").click(function() {
        socket.emit("login attempt", {"login": $("#login").val(), "pass": $("#pass").val()});    
    });
});