/** @format */

import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import AppRouter from "./router/AppRouter.jsx";

import "bootstrap/dist/css/bootstrap.min.css";

import "./config/FirebaseConfig.js";
import "./config/OneSignalConfig.js";
import { setupCSP } from "./utils/security-utils.js";
import { setupSW } from './utils/app-check-utils';
import { checkExternalServices } from './utils/external-api-utils';
import "animate.css";
import "./assets/css/app.css";

// Environment is automatically set by the build process

// Setup service worker and app check
setupSW();

// Check external services availability
checkExternalServices().then(services => {
  console.log('External services status:', services);
  if (!services.firebase) {
    console.warn('⚠️ Firebase services may be unavailable');
  }
  if (!services.paypal) {
    console.warn('⚠️ PayPal services may be unavailable');
  }
  if (!services.google) {
    console.warn('⚠️ Google services may be unavailable');
  }
}).catch(error => {
  console.warn('Could not check external services:', error.message);
});

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