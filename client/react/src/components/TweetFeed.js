import React, { useEffect, useReducer } from "react";
import { ToastContainer, toast } from 'react-toast'
import CustomTweet from "./Tweet";
import ErrorMessage from "./ErrorMessage";
import Spinner from "./Spinner";

const reducer = (state, action) => {
	switch (action.type) {
		case "add_tweet":
			return {
				...state,
				tweets: [action.payload, ...state.tweets],
				error: null,
				isWaiting: false,
				errors: [],
			};
		case "is_waiting":
			return {
				...state,
				isWaiting: action.isWaiting,
			};
		case "user_name":
			return {
				...state,
				user_name: action.user_name,
			};
		case "show_error":
			return { ...state, error: action.payload, isWaiting: false };
		case "add_errors":
			return { ...state, errors: action.payload, isWaiting: false };
		case "update_waiting":
			return { ...state, error: null, isWaiting: true };
		default:
			return state;
	}
};

const TweetFeed = () => {
	const initialState = {
		tweets: [],
		user_name: "",
		error: {},
		isWaiting: true,
		ws: null,
	};

	const [state, dispatch] = useReducer(reducer, initialState);
	const { user_name, tweets, error, isWaiting } = state;

	useEffect(()=>{
		console.log('connect')
		initialState.ws = new WebSocket(process.env.REACT_APP_WS);
	},[]);



	useEffect(() => {
		console.log('streamTweets');
		streamTweets();
	},[]);

	const streamTweets = () => {
		state.ws.onopen = function (event) {
			console.log("onopen", event);
			dispatch({ type: "is_waiting", isWaiting: false });
		};
		state.ws.onmessage = function (event) {
			console.log("onmessage", event);
			if (event) {
				const data = JSON.parse(event.data);
				dispatch({ type: "add_tweet", payload: data });
			}
		};
		state.ws.onerror = function (event) {
			console.log("onerror", event);
			if (event) {
				const data = JSON.parse(event.data);
				dispatch({ type: "show_error", payload: data });
			}
		};
	};

	const reconnectMessage = () => {
		const message = {
			title: "Reconnecting",
			detail: "Please wait while we reconnect to the stream.",
		};

		if (error?.detail) {
			return (
				<div>
					<ErrorMessage key={error.title} error={error} styleType="warning" />
					<ErrorMessage
						key={message.title}
						error={message}
						styleType="success"
					/>
					<Spinner />
				</div>
			);
		}
	};

	const errorMessage = () => {
		const { errors } = state;

		if (errors && errors.length > 0) {
			return errors.map((error) => (
				<ErrorMessage key={error.title} error={error} styleType="negative" />
			));
		}
	};

	const waitingMessage = () => {
		const message = {
			title: "Loading",
			detail: "Waiting for server to connect",
		};

		if (isWaiting) {
			return (
				<React.Fragment>
					<div>
						<ErrorMessage
							key={message.title}
							error={message}
							styleType="success"
						/>
					</div>
					<Spinner />
				</React.Fragment>
			);
		}
	};

	const showTweets = () => {
		if (tweets.length > 0) {
			return (
				<React.Fragment>
					{tweets
						.sort((a, b) => {
							return b.id - a.id;
						})
						.map((tweet) => (
							<CustomTweet key={tweet.id} tweet={tweet} />
						))}
				</React.Fragment>
			);
		}
	};

	const feedTweetList = async () => {
		try {
			const url = `${process.env.REACT_APP_API}/rules/${user_name}`;

			const response = await fetch(url, {
				method: "GET",
			});
			const time_line = await response.json();
			for (const t of time_line) {
				dispatch({ type: "add_tweet", payload: t });
			}
		} catch (error) {
			console.error(error);
		}
	};
	const handleChange = (event) => {
		dispatch({ type: "user_name", user_name: event.target.value });
	};

	const showInputText = () => {
		return (
			<React.Fragment>
				<div>
					<label>input twitter account without @: Example LskTranscribe </label>
					<input type="text" value={user_name} onChange={handleChange} />
					<button onClick={feedTweetList}>Feed</button>
					<button onClick={deleteRule}>Delete Rule</button>
				</div>
			</React.Fragment>
		);
	};

	const deleteRule = async () => {
		try {
			const url = `${process.env.REACT_APP_API}/rules/${user_name}`;

			await fetch(url, {
				method: "DELETE",
			});
			toast.success('Deleted rule');
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div>
			{reconnectMessage()}
			{errorMessage()}
			{waitingMessage()}
			{showInputText()}
			{showTweets()}
			<ToastContainer/>
		</div>
	);
};

export default TweetFeed;
