function setErrMessage(message) {
    $(".message").html(message);
}

function checkLength(str, max) {
    if (str.length >= max) {
        return true;
    } else {return false;}
}


$(document).ready(function() {
    var users;
    var socket = io.connect("http://10.42.0.138:5555", {transports: ['websocket'], secure: true});
    var name = $.cookie("name");
    var sendTo;


    socket.on("force reload", function() {
        window.location = "/";
    });
    socket.emit("ask users");
    socket.emit("handshake", name);
    socket.on("chat in", (data) => {
            $(".message-area").append("<div class=message><div class=message-in>"+data.replace(/(\n)/g, "<br>")+"</div></div>");
            $(".message-area").scrollTop($(".message-area").prop("scrollHeight")); // God bless stackoverflow!
            socket.emit("got message", {"name": name, "to": sendTo, "message":data});
        });
    
    socket.on("users change", function(list) {
        socket.emit("ask users");
    });

    socket.on("users answer", (users) => {
        $(".users-list").html("");
        $.each(users, (user) => {
            if(name !== user){
                $(".users-list").append("<li class=user>"+user+"</li>");
            }
        });
        if (sendTo == undefined) {sendTo = $(".user:first-child").html();}
        $(".user").change();
        socket.emit("get messages", sendTo);
    });

    socket.on("send messages", (messages) => {
        //console.log(messages)
        $.each(messages, (i, message) => {
            //console.log(message)
            $(".message-area").append("<div class=message><div class=message-"+message.type+">"+message.content.replace(/(\n)/g, "<br>")+"</div></div>");
        });
    });

    $(".users-container").on("click", ".user", function() {
        $(".user").css("background-color", "snow").css("color", "black");
        $(this).css("background-color", "#505050").css("color", "snow");
        sendTo = $(this).html();
        socket.emit("get messages", sendTo);
    });

    $(".users-container").on("change", ".user", function() {
        $(".user").each((user) => {
            if ($(this).html() == sendTo) {
                $(".user").css("background-color", "snow").css("color", "black");
                $(this).css("background-color", "#505050").css("color", "snow");
            }
        })
    });

    $("textarea").on("keyup", function() {
        if (checkLength($("textarea").val(), 300)) {
            setErrMessage("Maximum message length reached!\nPlease note, that everething after first 300 symbols will not be delivered!");
            $('.pop').slideDown(500);
        } else {$(".pop").slideUp(500);}
    });
    
    $("#send").click(function() {
        if ($("textarea").val()) {
            socket.emit('chat out', {"name": name, "to": sendTo, "message": $("textarea").val()});
            $(".message-area").append("<div class=message><div class=message-out>"+$("textarea").val().replace(/(\n)/g, "<br>")+"</div></div>");
            $(".message-area").scrollTop($(".message-area").prop("scrollHeight")); // God bless stackoverflow!
        }
        $("textarea").val("");
    });
    
    $("#exit").click(function() {
        $.removeCookie("key");
        $.removeCookie("name");
        location.reload(true);
    });

    $('.pop').slideUp(0);
    
    $('.close').click(function() {
       $('.pop').slideUp(500);
    });
});