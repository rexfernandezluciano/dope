import express from "express";
import React from "react";
import { renderToString } from "react-dom/server";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

// Get the directory name from the file URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force production mode for SSR
process.env.NODE_ENV = "production";

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "Pragma",
  ],
  headers: ["Server: DOPE Network SSR"],
};

app.use(cors(corsOptions));

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
  res.header("Server", "DOPE Network");
  res.sendStatus(200);
});

// Load the HTML template
const template = fs.readFileSync(path.resolve("./build/index.html"), "utf-8");

// Meta data for different routes
const getMetaData = (url, params = {}) => {
  const isProfilePage =
    params.username && params.displayName
      ? {
          title: `${params.displayName || params.username} (@${params.username}) - DOPE Network`,
          description: `View ${params.displayName || params.username}'s profile on DOPE Network. See their posts, followers, and more.`,
          keywords: `${params.username}, ${params.displayName}, profile, DOPE Network, social media`,
          ogImage: params.avatar || "/logo512.png",
        }
      : {
          title: "DOPE Network - Social Media Platform",
          description:
            "DOPE Network - A modern social media platform connecting communities worldwide. Share, discover, and engage with friends and communities.",
          keywords:
            "DOPE Network, social media, community, social networking, microblogging, posts, friends",
          ogImage: "/logo512.png",
        };

  const routes = {
    "/": isProfilePage,
    "/post": {
      title: `Post - DOPE Network`,
      description: params.content
        ? `${params.content.substring(0, 160)}...`
        : "View post on DOPE Network",
      keywords: "post, content, DOPE Network, social media",
      ogImage: params.image || "/logo512.png",
    },
    "/search": {
      title: params.query
        ? `Search: ${params.query} - DOPE Network`
        : "Search - DOPE Network",
      description: params.query
        ? `Search results for "${params.query}" on DOPE Network.`
        : "Search for posts and people on DOPE Network.",
      keywords: `search, ${params.query || "posts, people"}, DOPE Network`,
      ogImage: "/logo512.png",
    },
    "/analytics": {
      title: "Analytics - DOPE Network",
      description:
        "View your profile analytics, engagement metrics, and growth insights.",
      keywords: "analytics, insights, metrics, engagement, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/subscription": {
      title: "Subscription - DOPE Network",
      description:
        "Manage your DOPE Network subscription and premium features.",
      keywords: "subscription, premium, features, billing, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/livestream": {
      title: "Live Stream - DOPE Network",
      description:
        "Join live streams and connect with your community in real-time.",
      keywords: "livestream, live, streaming, community, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/waitinglist": {
      title: "Join Waiting List - DOPE Network",
      description:
        "Join the waiting list to get early access to DOPE Network features.",
      keywords: "waiting list, early access, beta, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/network-test": {
      title: "Network Diagnostics - DOPE Network",
      description:
        "Test your network connectivity and API endpoints for optimal performance.",
      keywords: "network test, diagnostics, connectivity, API, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/policies/privacy": {
      title: "Privacy Policy - DOPE Network",
      description:
        "Read our privacy policy to understand how we protect and handle your data.",
      keywords: "privacy policy, data protection, privacy, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/policies/terms": {
      title: "Terms of Service - DOPE Network",
      description:
        "Read our terms of service to understand the rules and guidelines for using DOPE Network.",
      keywords: "terms of service, terms, conditions, guidelines, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/settings": {
      title: "Settings - DOPE Network",
      description: "Manage your account settings on DOPE Network",
      keywords: "settings, account, DOPE Network, social media",
      ogImage: "/logo512.png",
    },
    "/auth/login": {
      title: "Sign In - DOPE Network",
      description:
        "Sign in to your DOPE Network account to connect with your community.",
      keywords: "login, sign in, authentication, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/auth/signup": {
      title: "Sign Up - DOPE Network",
      description: "Create a new DOPE Network account to join the community.",
      keywords: "signup, register, create account, join, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/auth/verify": {
      title: "Verify Email - DOPE Network",
      description:
        "Verify your email address to complete your DOPE Network account setup.",
      keywords: "verify, email verification, account setup, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/auth/google/callback": {
      title: "Authentication - DOPE Network",
      description: "Completing authentication process for DOPE Network.",
      keywords: "authentication, oauth, callback, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/auth/forgot-password": {
      title: "Forgot Password - DOPE Network",
      description: "Reset your DOPE Network password. Enter your email to receive reset instructions.",
      keywords: "forgot password, password reset, recover account, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/auth/reset-password": {
      title: "Reset Password - DOPE Network",
      description: "Set a new password for your DOPE Network account.",
      keywords: "reset password, new password, account recovery, DOPE Network",
      ogImage: "/logo512.png",
    },
  };

  return routes[url] || routes["/"];
};

// Function to inject meta tags into HTML template
const injectMetaTags = (html, metaData, url) => {
  const { title, description, keywords, ogImage } = metaData;

  let updatedHtml = html.replace(
    /<title>.*?<\/title>/,
    `<title>${title}</title>`,
  );

  // Remove existing meta tags and inject new ones
  updatedHtml = updatedHtml.replace(
    /<meta name="description".*?>/,
    `<meta name="description" content="${description}">`,
  );

  // Add meta tags after the title
  const metaTags = `
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:url" content="${process.env.FRONTEND_URL || "https://www.dopp.eu.org"}${url}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImage}">
  `;

  updatedHtml = updatedHtml.replace(/<\/title>/, `</title>${metaTags}`);

  return updatedHtml;
};

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "dope-network-ssr",
    version: "1.0.0",
    uptime: process.uptime(),
  });
});

// API proxy middleware
app.use(
  "/v1",
  createProxyMiddleware({
    target: "https://api.dopp.eu.org/v1",
    changeOrigin: true,
    secure: true,
    followRedirects: true,
    pathRewrite: {
      "^/v1": "/v1", // Keep the /v1 prefix
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `Proxying ${req.method} ${req.url} to https://api.dopp.eu.org${req.url}`,
      );
    },
    onError: (err, req, res) => {
      console.error("Proxy error:", err.message);
      res.status(500).json({ error: "Proxy error", message: err.message });
    },
  }),
);

// ActivityPub proxy middleware
app.use(
  "/activitypub",
  createProxyMiddleware({
    target: "https://api.dopp.eu.org",
    changeOrigin: true,
    secure: true,
    followRedirects: true,
    onProxyReq: (proxyReq, req, res) => {
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

// WebFinger proxy middleware (local only)
app.use(
  "/.well-known",
  createProxyMiddleware({
    target: "https://api.dopp.eu.org",
    changeOrigin: true,
    secure: true,
    followRedirects: true,
    onProxyReq: (proxyReq, req, res) => {
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

// Serve static files
app.use(express.static(path.join(__dirname, "build")));

// SSR route handler
app.get("*", async (req, res) => {
  const url = req.path;
  let metaData;

  try {
    // Handle dynamic routes with proper error handling
    if (
      url.startsWith("/") &&
      url.length > 1 &&
      !url.startsWith("/auth") &&
      !url.startsWith("/post") &&
      !url.startsWith("/search")
    ) {
      const username = url.split("/")[1];
      if (username && username.length > 0) {
        try {
          // Use the proxy endpoint instead of direct API call
          const response = await fetch(
            `http://localhost:${PORT}/v1/users/${username}`,
          );
          if (response.ok) {
            const userData = await response.json();
            if (userData?.user) {
              metaData = getMetaData("/", {
                username,
                displayName: userData.user.name,
                avatar: userData.user.avatar,
                federatedDiscoverable: userData.user.federatedDiscoverable,
              });
            } else {
              metaData = getMetaData("/");
            }
          } else {
            metaData = getMetaData("/");
          }
        } catch (error) {
          console.error("Error fetching user data for SSR:", error.message);
          metaData = getMetaData("/");
        }
      } else {
        metaData = getMetaData("/");
      }
    } else if (url.startsWith("/post/")) {
      const postId = url.split("/")[2];
      if (postId && postId.length > 0) {
        try {
          // Use the proxy endpoint instead of direct API call
          const response = await fetch(
            `http://localhost:${PORT}/v1/posts/${postId}`,
          );
          if (response.ok) {
            const postData = await response.json();
            if (postData?.post) {
              metaData = getMetaData("/post", {
                content: postData.post.content,
                image: postData.post.image,
              });
            } else {
              metaData = getMetaData("/post");
            }
          } else {
            metaData = getMetaData("/post");
          }
        } catch (error) {
          console.error("Error fetching post data for SSR:", error.message);
          metaData = getMetaData("/post");
        }
      } else {
        metaData = getMetaData("/post");
      }
    } else if (url.startsWith("/search")) {
      const query = req.query.q;
      metaData = getMetaData("/search", { query });
    } else if (url.startsWith("/auth")) {
      // Handle authentication routes specifically
      metaData = getMetaData(url);
    } else {
      metaData = getMetaData(url);
    }

    const htmlWithMeta = injectMetaTags(template, metaData, url);
    res.send(htmlWithMeta);
  } catch (error) {
    console.error("SSR Error:", error);
    res.send(template);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 SSR server running on port ${PORT}`);
});
