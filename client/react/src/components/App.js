import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import TweetFeed from "./TweetFeed";

class App extends React.Component {
	render() {
		return (
			<div className="ui container">
				<div className="introduction" />

				<h1 className="ui header">
					<div className="content">
						Real Time Tweet Feed
					</div>
				</h1>

				<div className="ui container">
					<BrowserRouter>
						<Routes>
							<Route exact={true} path="/" element={<TweetFeed/>} />
						</Routes>
					</BrowserRouter>
				</div>
			</div>
		);
	}
}

export default App;
