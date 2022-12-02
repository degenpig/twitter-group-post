const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const cors = require("cors");
const WebSocket = require("ws");
const client = require("./twitter/client");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const corsOptions = {
	origin: "*",
	optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

let api_port = process.env.API_PORT || 3000;
const ws_port = process.env.WS_PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = http.createServer(app);

const wsServer = new WebSocket.Server({
	port: ws_port,
});

wsServer.on("listening", () => {
	console.log(`ws is listenning on ${ws_port}`);
});

let sockets = [];
wsServer.on("connection", function (socket) {
	console.log("new connection");
	console.log("socket");
	sockets.push(socket);

	client.set_sockets(sockets);
	socket.on("message", function (msg) {
		sockets.forEach((s) => s.send(msg));
	});

	socket.on("close", function () {
		sockets = sockets.filter((s) => s !== socket);
	});
});

async function get_timeline_and_listen_to_stream(user_name) {
	const user_id = await client.get_user_id_by(user_name);

	const time_line = await client.get_timeline(user_id);
	client.connect_twitter_stream(user_name);
	return time_line;
}

app.get("/rules/:user_name", async (req, res) => {
	try {
		const user_name = req.params.user_name;
		const time_line = await get_timeline_and_listen_to_stream(user_name);
		res.send(time_line);
	} catch (e) {
		console.error("error api/rules/:user_name");
		console.error(e);
		res.send(e);
	}
});

app.delete("/rules/:user_name", async (req, res) => {
	try {
		const user_name = req.params.user_name;
		await client.delete_rule(user_name);
		res.send();
	} catch (error) {
		console.error("error api/rules/:user_name");
		console.error(e);
		res.send(e);
	}
});

const listener = server.listen(api_port, () => {
	console.log(`Listening on port ${api_port}`);
});

function end() {
	for (const socket of sockets) {
		socket.close();
	}
	wsServer.close();
	listener.close(function (err) {
		if (err) {
			throw err();
		}
		console.log("Server stopped");
		/* exit gracefully */
		process.exit(0);
	});
}

/* handle SIGTERM and SIGINT (ctrl-c) nicely */
process.once("SIGTERM", end);
process.once("SIGINT", end);
