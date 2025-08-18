/** @format */

import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react"

import AppRouter from "./router/AppRouter.jsx";

import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap/dist/css/bootstrap.min.css";

import "./config/FirebaseConfig";
import "./config/OneSignalConfig";
import { setupCSP } from "./utils/security-utils";
import "animate.css";
import "./assets/css/app.css";

// Setup Content Security Policy
setupCSP();

// Disable console in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<AppRouter />
		<Analytics />
		<SpeedInsights />
	</React.StrictMode>,
);