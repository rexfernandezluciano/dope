import express from "express";
import React from "react";
import { renderToString } from "react-dom/server";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";

// Get the directory name from the file URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

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
      description: "Read our privacy policy to understand how we protect and handle your data.",
      keywords: "privacy policy, data protection, privacy, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/policies/terms": {
      title: "Terms of Service - DOPE Network",
      description: "Read our terms of service to understand the rules and guidelines for using DOPE Network.",
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
      description: "Sign in to your DOPE Network account to connect with your community.",
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
      description: "Verify your email address to complete your DOPE Network account setup.",
      keywords: "verify, email verification, account setup, DOPE Network",
      ogImage: "/logo512.png",
    },
    "/auth/callback": {
      title: "Authentication - DOPE Network",
      description: "Completing authentication process for DOPE Network.",
      keywords: "authentication, oauth, callback, DOPE Network",
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

// API proxy middleware
app.use(
  "/v1",
  createProxyMiddleware({
    target: "https://api.dopp.eu.org/v1",
    changeOrigin: true,
    secure: true,
    followRedirects: true,
    onProxyReq: (proxyReq, req, res) => {
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

// Serve static files
app.use(express.static(path.join(__dirname, "build")));

// SSR route handler
app.get("*", async (req, res) => {
  const url = req.path;
  let metaData;

  try {
    // For dynamic routes, fetch data from API
    if (url.startsWith("/")) {
      const username = url.split("/")[2];
      // Fetch user data from API for meta tags
      const userData = await fetch(
        `https://api.dopp.eu.org/v1/users/${username}`,
      );
      if (!userData?.user) {
        metaData = getMetaData("/");
      } else {
        metaData = getMetaData("/", {
          username,
          displayName: userData?.user.name,
        });
      }
    } else if (url.startsWith("/post/")) {
      const postId = url.split("/")[2];
      // Fetch post data from API for meta tags
      const postData = await fetch(
        `https://api.dopp.eu.org/v1/posts/${postId}`,
      );
      metaData = getMetaData("/post", { content: postData?.post.content });
    } else if (url.startsWith("/search")) {
      const query = req.query.q;
      metaData = getMetaData("/search", { query });
    } else if (url.startsWith("/auth")) {
      // Handle authentication routes specifically
      metaData = getMetaData(url);
    }
     else {
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