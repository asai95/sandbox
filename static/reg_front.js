$(document).ready(function() {
var socket = io.connect("http://10.42.0.138:5555", {transports: ['websocket'], secure: true});
    
    socket.on("regerr", function() {
            $('.pop').slideDown(1000);
        });
    
    socket.on("regsuccess", function(data) {
            $.cookie("name", data.name);
            $.cookie("key", data.key);
            window.location = "/";
        });
    
    $('.pop').slideUp(0);
    
    $('.close').click(function() {
       $('.pop').slideUp(1000);
    });
    
    $("#send").click(function() {
        socket.emit("reg attempt", {"login": $("#login").val(), "pass": $("#pass").val()});    
    });
});