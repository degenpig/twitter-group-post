const { Client } = require("twitter-api-sdk");
const OAuth = require("oauth-1.0a");
const crypto = require("crypto");
const nodefetch = (...args) =>
	import("node-fetch").then(({ default: fetch }) => fetch(...args));

const bearer_token = process.env.BEARER_TOKEN;
const twitter_client = new Client(bearer_token);

const client_id = process.env.TWITTER_API_KEY;
const client_secret = process.env.TWITTER_API_KEY_SECRET;

const oauth = new OAuth({
	consumer: {
		key: client_id,
		secret: client_secret,
	},
	signature_method: "HMAC-SHA1",
	hash_function(base_string, key) {
		return crypto.createHmac("sha1", key).update(base_string).digest("base64");
	},
});

const token = {
	key: process.env.TWITTER_ACCESS_TOKEN,
	secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
};

let sockets = [];
function set_sockets(socks) {
	sockets = socks;
}

function send_message(msg) {
	for (const s of sockets) {
		s.send(msg, (err) => {
			if (err) {
				console.error("error sendMessage");
				console.error(s);
				console.error(err);
			}
		});
	}
}

let stream = null;
let last_user_name = "";
let user_name_list = [];
async function connect_twitter_stream(user_name) {
	try {
		last_user_name = user_name;
		let user_exists = true;
		if (!user_name_list.some((u) => u === user_name)) {
			user_name_list.push(user_name);
			user_exists = false;
		}
		console.log("connect_twitter_stream");
		const current_rules = await twitter_client.tweets.getRules();
		console.log("current_rules");
		console.log(current_rules.data);
		const rule_exists = current_rules.data.some((r) =>
			r.value.includes(user_name),
		);

		console.log("rule_exists: ", rule_exists);
		if (!rule_exists) {
			const add_rules = await twitter_client.tweets.addOrDeleteRules({
				add: [
					{
						value: `from:${user_name}`,
					},
				],
			});
			console.log("addRules: ", JSON.stringify(add_rules));
		}

		async function load_stream() {
			stream = await twitter_client.tweets.searchStream({
				expansions: ["author_id"],
				"tweet.fields": ["author_id", "id"],
				"user.fields": [
					"id",
					"username",
					"created_at",
					"profile_image_url",
					"name",
				],
			});
			console.log("stream: ", JSON.stringify(stream));
		}

		if (!stream) {
			await load_stream();
		} else if (!user_exists) {
			await load_stream();
		}

		for await (const tweet of stream) {
			console.log("tweet stream");
			console.log("tweet.data");
			console.log(tweet);
			if (tweet.includes?.users?.length > 0) {
				//Add field needed for frontend.
				const tweet_data = Object.assign(tweet.data, {
					user: Object.assign(tweet.includes?.users[0], {
						screen_name: tweet.includes?.users[0].username,
					}),
				});
				console.log("data_to_send", JSON.stringify(tweet_data));
				send_message(JSON.stringify(tweet_data));
			} else {
				console.log("data_to_send", JSON.stringify(tweet.data));
				send_message(JSON.stringify(tweet.data));
			}
		}
	} catch (error) {
		console.error("error doStream: ", JSON.stringify(error));
		reconnect(stream);
	}
}

async function delete_rule(user_name) {
	try {
		console.log("delete_rule");
		const current_rules = await twitter_client.tweets.getRules();
		const deleted_rules = await twitter_client.tweets.addOrDeleteRules({
			delete: {
				ids: current_rules.data
					.filter((r) => r.value.includes(user_name))
					.map((r) => r.id),
			},
		});
		console.log("deleted_rules: ", JSON.stringify(deleted_rules));
	} catch (error) {
		console.error("delete_rule error: ", JSON.stringify(error));
	}
}

async function delete_all_rules() {
	try {
		console.log("delete_all_rules");
		const current_rules = await twitter_client.tweets.getRules();
		console.log("current_rules");
		console.log(current_rules.data);

		const deleted_rules = await twitter_client.tweets.addOrDeleteRules({
			delete: {
				ids: current_rules.data.map((r) => r.id),
			},
		});
		console.log("deleted_rules: ", JSON.stringify(deleted_rules));
	} catch (error) {
		console.error("delete_all_rules error: ", JSON.stringify(error));
	}
}

async function reconnect() {
	if (stream?.["abort"]) {
		stream.abort();
	}
	await sleep(1000 * 30);
	connect_twitter_stream(last_user_name);
}

async function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function get_user_id_by(user_name) {
	try {
		const user = await twitter_client.users.findUserByUsername(user_name);
		return user.data.id;
	} catch (error) {
		console.log("get_user_by error");
		console.error(error);
	}
}

const twitter_timeline_url =
	"https://api.twitter.com/1.1/statuses/user_timeline.json";
async function get_timeline(user_id) {
	const url = `${twitter_timeline_url}?user_id=${user_id}`;
	const request_data = {
		url: url,
		method: "GET",
	};

	const oauth_data = oauth.authorize(request_data, token);
	const oauth_header = oauth.toHeader(oauth_data);

	const resp = await nodefetch(url, {
		method: "GET",
		headers: oauth_header,
	});

	const time_line = await resp.json();
	console.log("json_resp");
	console.log(time_line);

	console.log("time_line");
	console.log(time_line);
	return time_line;
}

module.exports = {
	set_sockets,
	connect_twitter_stream,
	get_user_id_by,
	get_timeline,
	delete_rule,
	delete_all_rules,
};
