var http = require("http");
var fs = require("fs");
var path = "index.html";
var css = "style.css";
var js = "front.js"

function loadPage(path, callback) {
	fs.readFile(path, (err, data) => {
		//console.log(data);
		return callback(data.toString());
	});
}

var server = http.createServer((req, resp) => {
	loadPage(path, (index) => {
		loadPage(css, (cssData) => {
			loadPage(js, (front) => {
				resp.end(index+"\n"+cssData+"\n<script>\n"+front+"\n</script>");
			});
		});
	});
});

server.listen(80);