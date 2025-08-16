/** @format */

import React from "react";
import ReactDOM from "react-dom/client";

import AppRouter from "./router/AppRouter.jsx";

import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap/dist/css/bootstrap.min.css";

import "./config/FirebaseConfig";
import "animate.css";
import "./assets/css/app.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<AppRouter />
	</React.StrictMode>,
);
