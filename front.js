$(document).ready(function() {
    window.setInterval(function() {
        if ($("#label").css("color") == "rgb(255, 0, 0)") {
            console.log("blue");
            $("#label").css("color", "blue");
        } else {$("#label").css("color", "red");console.log($("#label").css("color"));}
    }, 2000);
});
