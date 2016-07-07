function setErrMessage(message) {
    $(".err-message").html(message);
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

    $("#you").html(name);


    socket.on("force reload", function() {
        window.location = "/";
    })
    socket.emit("handshake", name);
    socket.emit("get friends", name);
    socket.on("chat in", (data) => {
        if (data["from"] == sendTo) {
            $(".message-area").append("<div class=message><div class=message-in>"+data.message.replace(/(\n)/g, "<br>")+"</div></div>");
            $(".message-area").scrollTop($(".message-area").prop("scrollHeight")); // God bless stackoverflow!
        }
    });
    
    socket.on("users change", function() {
        socket.emit("get friends", name);
    })

    socket.on("get friends", (users) => {
        $(".users-list").html("");
        console.log(users)
        $.each(users, (user, st) => {
            if(name !== user){
                $(".users-list").append("<li class='user "+st+"'>"+user+"</li>");
            }
        });
        if (sendTo == undefined) {sendTo = $(".user:first-child").html();}
        $(".user").change();
        socket.emit("get messages", sendTo);
    });

    socket.on("send messages", (messages) => {
        //console.log(messages)
        $(".message-area").html("");
        $.each(messages, (i, message) => {
            //console.log(message)
            $(".message-area").append("<div class=message><div class=message-"+message.type+">"+message.content.replace(/(\n)/g, "<br>")+"</div></div>");
        });
    });

    socket.on("ask friend request", (name) => {
        lastFriendReq = name;
        setErrMessage("<p>"+name+" wants to add you to contact list. Are you agree?</p><button id=friend-yes>Yes</button><button id=friend-no>No</button>");
        $(".pop").slideDown(500);
    });

    $(".users-container").on("click", ".user", function() {
        $(".user").css("background-color", "#505050").css("color", "snow");
        $(this).css("background-color", "snow").css("color", "black");
        sendTo = $(this).html();
        console.log(sendTo)
        socket.emit("get messages", sendTo);
    });

    $(".users-container").on("change", ".user", function() {
        $(".user").each((user) => {
            if ($(this).html() == sendTo) {
                $(".user").css("background-color", "#505050").css("color", "snow");
                $(this).css("background-color", "snow").css("color", "black");
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

    $("#friend-add").click(function() {
        if ($("#friend-field").val()) {
            socket.emit("friend request", {"name": name, "to": $("#friend-field").val()});
            console.log({"name": name, "to": $("#friend-field").val()})
        }
    })

    $(".pop").on("click", "#friend-yes", function() {
        socket.emit("add friend", {"name":name, "friend": lastFriendReq});
    });
    $(".pop").on("click", "#friend-no", function() {
        $('.pop').slideUp(500);
    });
    $(".mobile").click(function() {
        $("#mobile-helper").addClass("mobile-container");
        $(".mobile-container").css("display", "block");
        $('.mobile-container').on('click', function(e) {
            if($(e.target).closest('.users-container').length == 0) { // God bless stackoverflow!
                $(".mobile-container").css("display", "none");
            }
        });
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