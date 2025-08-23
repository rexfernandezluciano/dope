const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const path = require("path");

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

// Proxy ActivityPub requests
app.use(
  "/activitypub",
  createProxyMiddleware({
    target: "https://api.dopp.eu.org",
    changeOrigin: true,
    secure: true,
    followRedirects: true,
    onProxyReq: (proxyReq, req, res) => {
      // Log the proxied request
      console.log(
        `Proxying ActivityPub ${req.method} ${req.url} to https://api.dopp.eu.org${req.url}`,
      );
      // Set proper ActivityPub headers
      if (req.headers.accept && req.headers.accept.includes('application/activity+json')) {
        proxyReq.setHeader('Accept', 'application/activity+json');
      }
    },
    onError: (err, req, res) => {
      console.error("ActivityPub proxy error:", err.message);
      res.status(500).json({ error: "ActivityPub proxy error", message: err.message });
    },
  }),
);

// Proxy federated ActivityPub requests
app.use(
  "/federated",
  createProxyMiddleware({
    target: "https://example.com", // This will be dynamically replaced
    changeOrigin: true,
    secure: true,
    followRedirects: true,
    router: (req) => {
      // Extract domain from query parameter: /federated?domain=mastodon.social&path=/.well-known/webfinger
      const domain = req.query.domain;
      if (domain) {
        return `https://${domain}`;
      }
      return "https://api.dopp.eu.org"; // fallback
    },
    pathRewrite: (path, req) => {
      // Remove /federated and use the path parameter
      return req.query.path || path.replace('/federated', '');
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `Proxying federated request ${req.method} ${req.url} to https://${req.query.domain}${req.query.path}`,
      );
    },
    onError: (err, req, res) => {
      console.error("Federated proxy error:", err.message);
      res.status(500).json({ error: "Federated proxy error", message: err.message });
    },
  }),
);

// Proxy WebFinger requests (local only)
app.use(
  "/.well-known",
  createProxyMiddleware({
    target: "https://api.dopp.eu.org",
    changeOrigin: true,
    secure: true,
    followRedirects: true,
    onProxyReq: (proxyReq, req, res) => {
      // Log the proxied request
      console.log(
        `Proxying WebFinger ${req.method} ${req.url} to https://api.dopp.eu.org${req.url}`,
      );
    },
    onError: (err, req, res) => {
      console.error("WebFinger proxy error:", err.message);
      res.status(500).json({ error: "WebFinger proxy error", message: err.message });
    },
  }),
);

// Serve static files from React build
app.use(express.static(path.join(__dirname, "build")));

// Handle React routing - send all non-API requests to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`📡 Proxying /v1/* requests to https://api.dopp.eu.org/v1/*`);
});
