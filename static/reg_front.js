function checkPassword(pass1, pass2) {
    return pass1 = pass2;
}

$(document).ready(function() {
    $("#send").click(function() {
        $('.pop').slideUp(0);
        console.log($("#pass").val());
        if (checkPassword($("#pass").val(), $("#ret-pass").val()) && checkFieldsNotEmpty($("#login").val(), $("#pass").val(), $("#ret-pass").val())) {
            formSocket.emit("reg attempt", {"login": $("#login").val(), "pass": $("#pass").val()});   
        } else if (!checkFieldsNotEmpty($("#login").val(), $("#pass").val(), $("#ret-pass").val())) {
            setErrMessage("One of the fields is empty");
            $('.pop').slideDown(500);
        } else {
            setErrMessage("One of the fields is empty");
            $('.pop').slideDown(500);
        }
    });
});