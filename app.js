var http = require("http");
var express = require("express");
var io = require("socket.io");
var app = express();
var messageServer = http.createServer();
var io = io.listen(messageServer);
var cookieParser = require('cookie-parser');
var bodyParser = require("body-parser");
var mongo = require('mongodb').MongoClient;
var mongoURI = process.env.MONGO_URI;
var users = {};

function addZero(x) {
  if (parseInt(x) < 10) {
    return "0" + x;
  } else {
    return x;
  }
}

function getDateString(x) {
	var date = new Date(x);
	return date.getDate()+"."+date.getMonth()+"."+date.getFullYear()+"-"+addZero(date.getHours())+":"+addZero(date.getMinutes())+":"+addZero(date.getSeconds());
}


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
									console.log(doc)
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
							user.insert({"login": login, "pass": pass, "key": newKey, "friends": []});
							users.close();
							return callback("regsuccess", login, newKey);
						} else {users.close(); return callback("regerr");}
					} else {console.log(err); users.close();}
				});
				}
			} else {console.log(err); users.close();}
		});
}

function getMessages(name, friend, callback) {
	console.log(friend)
	mongo.connect(mongoURI, (err, users) => {
		var user = users.collection("user");
		user.find({"login": name}).toArray((err, doc) => {
			//console.dir(doc)
			doc[0].friends.forEach((obj) => {
				if (obj.name == friend) {
					return callback(obj.messages);
				}
			});
		});
	});
}

function addMessage(name, friend, type, message) {
	mongo.connect(mongoURI, (err, users) => {
		var user = users.collection("user");
		var date = new Date();
		user.update(
			{
				"login" : name,
				"friends": {"$elemMatch": {"name": friend}}
			},
			{
				$push:
					{
						"friends.$.messages": {"time": date, "type": type, "content": message}
					}
			}, 
			{
				"multi" : false, 
				"upsert" : false
			}
		);
		users.close();
	});
}

app.use("/static", express.static(__dirname+"/static"));
app.set('view engine', 'pug');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));

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
	socket.on("chat out", (data) => {
		var sendName = data.to;
		var message = data.message;
		idToSend = users[sendName];
		socket.to(idToSend).emit("chat in", message);
		addMessage(data.name, sendName, "out", message);
	});
	socket.on("handshake", (data) => {
		name = data;
		users[data] = socket.id;
		io.sockets.emit("users change");
	});
	socket.on("disconnect", function() {
		delete users[name];
		io.sockets.emit("users change");
	});

	socket.on("ask users", function() {
		socket.emit("users answer", users);
	});

	socket.on("get messages", (friend) => {
		console.log(name)
		getMessages(name, friend, (messages) => {
			console.log(messages)
			socket.emit("send messages", messages);
		});
	});

	socket.on("got message", (message) => {
		addMessage(message.name, message.to, "in", message.message);
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
messageServer.listen(5555, function() {
	console.log("wow"); 
	setTimeout(function() {io.sockets.emit("force reload");}, 1500); //dirty
});
