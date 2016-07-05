function setErrMessage(message) {
    $(".message").html(message);
}

function checkFieldsNotEmpty(login, pass1, pass2) {
    pass2 = pass2 || "omited";
    return login != "" && pass1 != "" && pass2 != ""
}

$(document).ready(function() {
    formSocket = io.connect("http://10.42.0.138:5555", {transports: ['websocket'], secure: true});
    
    formSocket.on("logerr", function() {
            setErrMessage("Login Incorrect")
            $('.pop').slideDown(500);
        });

    formSocket.on("regerr", function() {
            setErrMessage("Username already taken")
            $('.pop').slideDown(500);
        });
    
    formSocket.on("logsuccess", function(data) {
            $.cookie("name", data.name);
            $.cookie("key", data.key);
            window.location = window.location.pathname;
        });
    
    $('.pop').slideUp(0);
    
    $('.close').click(function() {
       $('.pop').slideUp(500);
    });
});