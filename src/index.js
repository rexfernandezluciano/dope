/** @format */

import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react"

import AppRouter from "./router/AppRouter.jsx";

// Import only needed Bootstrap CSS (you can further optimize by using SCSS)
import "bootstrap/dist/css/bootstrap.min.css";
// Only import Bootstrap JS components you actually use
// import "bootstrap/js/dist/modal";
// import "bootstrap/js/dist/dropdown";
// import "bootstrap/js/dist/collapse";

import "./config/FirebaseConfig";
import "./config/OneSignalConfig";
import { setupCSP } from "./utils/security-utils";
import "animate.css";
import "./assets/css/app.css";

// Disable React error overlay completely
if (typeof window !== 'undefined') {
  // Override error overlay hooks
  window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = {
    isFiberMounted: () => false,
    onCommitFiberRoot: () => {},
    onCommitFiberUnmount: () => {},
  };

  // Suppress all error overlays and popups
  window.addEventListener('error', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    return false;
  }, true);
  
  window.addEventListener('unhandledrejection', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    return false;
  }, true);

  // Override console methods to hide warnings in development
  if (process.env.NODE_ENV === 'development') {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && (
        message.includes('Warning:') ||
        message.includes('React Error Overlay') ||
        message.includes('webpack-dev-server') ||
        message.includes('Download the React DevTools')
      )) {
        return;
      }
      originalError(...args);
    };
    
    console.warn = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && (
        message.includes('Warning:') ||
        message.includes('React Error Overlay') ||
        message.includes('validateDOMNesting')
      )) {
        return;
      }
      originalWarn(...args);
    };
  }
}

// Setup Content Security Policy
setupCSP();

// Test API connectivity on startup (only in production)
if (process.env.NODE_ENV === 'production') {
  import('./config/ApiConfig').then(({ testApiConnection }) => {
    testApiConnection().then(isConnected => {
      if (!isConnected) {
        console.warn('⚠️ API connectivity test failed. Network requests may fail.');
      } else {
        console.log('✅ API connectivity verified');
      }
    });
  });
}

// Disable console in production based on hostname
const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1' &&
                     !window.location.hostname.includes('replit.dev') &&
                     !window.location.hostname.includes('replit.co') &&
                     !window.location.hostname.includes('replit.app');

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