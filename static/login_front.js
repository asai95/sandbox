$(document).ready(function() {
    $("#send").click(function() {
        console.log(checkFieldsNotEmpty($("#login").val(), $("#pass").val()))
        if (!checkFieldsNotEmpty($("#login").val(), $("#pass").val())) {
            setErrMessage("One of the fields is empty");
            $('.pop').slideDown(500);
        } else {
            formSocket.emit("login attempt", {"login": $("#login").val(), "pass": $("#pass").val()});
        }
    });
});