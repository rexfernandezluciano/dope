const express = import("express");
const { createProxyMiddleware } = import("http-proxy-middleware");
const cors = import("cors");
const path = import("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-CSRF-Token",
    ],
  }),
);

// Handle preflight requests
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400");
  res.header("Vary", "Origin");
  res.sendStatus(200);
});

// Proxy API requests to the backend
app.use(
  "/v1",
  createProxyMiddleware({
    target: "https://api.dopp.eu.org/v1",
    changeOrigin: true,
    secure: true,
    followRedirects: true,
    onProxyReq: (proxyReq, req, res) => {
      // Log the proxied request
      console.log(
        `Proxying ${req.method} ${req.url} to https://api.dopp.eu.org/v1${req.url}`,
      );
    },
    onError: (err, req, res) => {
      console.error("Proxy error:", err.message);
      res.status(500).json({ error: "Proxy error", message: err.message });
    },
  }),
);

// Serve static files from React build
app.use(express.static(path.join(__dirname, "build")));

// Handle React routing - send all non-API requests to index.html
app.get("*", (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  } catch (error) {
    res.status(404).body("Not Found");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
});
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'DOPE Network Proxy' 
  });
});

// Proxy middleware for API requests
const apiProxy = createProxyMiddleware({
  target: 'https://api.dopp.eu.org',
  changeOrigin: true,
  secure: true,
  pathRewrite: {
    '^/v1': '/v1', // Keep the /v1 prefix
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Proxy error occurred',
        message: err.message,
        details: 'Unable to connect to API server'
      });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to target`);
  }
});

// Apply proxy to /v1/* routes
app.use('/v1', apiProxy);

// Serve static files for the React app
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all handler for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`📡 Proxying /v1/* requests to https://api.dopp.eu.org/v1/*`);
});
