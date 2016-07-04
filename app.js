var http = require("http");
var express = require("express");
var io = require("socket.io");
var app = express();
var messageServer = http.createServer();
var io = io.listen(messageServer);
var cookieParser = require('cookie-parser');
var bodyParser = require("body-parser");
var mongo = require('mongodb').MongoClient;
var mongoURI = "mongodb://asai95:19959509Ax@127.0.0.1:27017/users";

function usersChange(login, pass, mode, key, callback) {
	var mode = mode || "check";
	mongo.connect(mongoURI, (err, users) => {
			if (!err) {
				var user = users.collection("user");
				if (mode=="check") {
					if (key == undefined) {
						user.find({"login": login, "pass": pass}).toArray((err, doc) => {
							if (!err) {
								if (doc.length !== 0) {
									var newKey = new Date().valueOf() * Math.random() + '';
									user.update({"login": login, "pass": pass}, {$set: {"key": newKey}});
									users.close();
									return callback("logsuccess", login, newKey);
								} else {users.close(); return callback("logerr");}
							} else {console.log(err); users.close();}
						});
					} else {
						user.find({"login": login, "key": key}).toArray((err, doc) => {
						if (!err) {
							if (doc.length !== 0) {
								users.close();
								return callback("authsuccess")
							} else {users.close(); return callback("authexpired");} 
						} else {console.log(err); users.close();}
				});
					}
				} else if (mode=="add") {
					user.find({"login": login}).toArray((err, doc) => {
					if (!err) {
						if (doc.length === 0) {
							var newKey = new Date().valueOf() * Math.random() + '';
							user.insert({"login": login, "pass": pass, "key": newKey});
							users.close();
							return callback("regsuccess", login, newKey);
						} else {users.close(); return callback("regerr");}
					} else {console.log(err); users.close();}
				});
				}
			} else {console.log(err); users.close();}
		});
}

app.use("/static", express.static(__dirname+"/static"));
app.set('view engine', 'pug');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
var users = {};

app.get("/", (req, resp) => {
	var name = req.cookies.name;
	var key = req.cookies.key;
	if (name && key) {
		usersChange(name, "", "check", key, (status) => {
			if (status == "authsuccess") {
				resp.render("index");
			} else if (status == "authexpired") {
				resp.render("login");
			}
		});
	} else {resp.render("login");}
});

app.get("/register", (req, resp) => {
	if (req.query.regerr) {
		resp.render("register", {"error": "regerr"});
	} else {resp.render("register");}
});

io.on("connection", (socket) => {
	var name;
	socket.on("chat message", (data) => {
		var sendName = data.to[0];
		var message = data.message;
		idToSend = users[sendName];
		socket.to(idToSend).emit("chat message", message);
	});
	socket.on("handshake", (data) => {
		users[data] = socket.id;
		name = data;
		io.sockets.emit("users change", users);
	});
	socket.on("disconnect", function() {
		delete users[name];
		io.sockets.emit("users change", users);
	});
	
	socket.on("login attempt", (cred) => {
		var login = cred.login;
		var pass = cred.pass;
		usersChange(login, pass, "check", undefined, (status, login, newKey) => {
			if (status == "logsuccess") {
				socket.emit("logsuccess", {"name": login, "key": newKey});
			} else if (status == "logerr") {
				socket.emit("logerr");
			}
		});
	});

	socket.on("reg attempt", (cred) => {
		var login = cred.login;
		var pass = cred.pass;
		usersChange(login, pass, "add", undefined, (status, login, newKey) => {
			if (status == "regsuccess") {
				socket.emit("regsuccess", {"name": login, "key": newKey});
			} else if (status == "regerr") {
				socket.emit("regerr");
			}
		});
	});
});

app.listen(80);
messageServer.listen(5555);
