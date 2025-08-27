/** @format */

import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import AppRouter from "./router/AppRouter.jsx";

// Import only needed Bootstrap CSS (you can further optimize by using SCSS)
import "bootstrap/dist/css/bootstrap.min.css";

import "./config/FirebaseConfig.js";
import "./config/OneSignalConfig.js";
import { setupCSP } from "./utils/security-utils.js";
import "animate.css";
import "./assets/css/app.css";

process.env.NODE_ENV =  window.location.hostname === "localhost" ? "development" : window.location.hostname.contains(".replit.dev") ? "development" : "production";

// Setup Content Security Policy
setupCSP();

// Test API connectivity on startup (only in production and only once)
if (
  process.env.NODE_ENV === "production" &&
  typeof window !== "undefined" &&
  !window.__API_TESTED__
) {
  window.__API_TESTED__ = true;
  import("./config/ApiConfig.js").then(({ testApiConnection }) => {
    testApiConnection().then((isConnected) => {
      if (!isConnected) {
        console.warn(
          "⚠️ API connectivity test failed. Network requests may fail.",
        );
      } else {
        console.log("✅ API connectivity verified");
      }
    });
  });
}

// Disable console in production
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
  console.debug = () => {};
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppRouter />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>,
);
