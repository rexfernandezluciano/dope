
const express = require('express');
const React = require('react');
const { renderToString } = require('react-dom/server');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Load the HTML template
const template = fs.readFileSync(path.resolve('./build/index.html'), 'utf-8');

// Meta data for different routes
const getMetaData = (url, params = {}) => {
  const routes = {
    '/': {
      title: "DOPE Network - Social Media Platform",
      description: "DOPE Network - A modern social media platform connecting communities worldwide. Share, discover, and engage with friends and communities.",
      keywords: "DOPE Network, social media, community, social networking, microblogging, posts, friends",
      ogImage: "/logo512.png"
    },
    '/profile': {
      title: `${params.displayName || params.username} (@${params.username}) - DOPE Network`,
      description: `View ${params.displayName || params.username}'s profile on DOPE Network. See their posts, followers, and more.`,
      keywords: `${params.username}, ${params.displayName}, profile, DOPE Network, social media`,
      ogImage: params.avatar || "/logo512.png"
    },
    '/post': {
      title: `Post - DOPE Network`,
      description: params.content ? `${params.content.substring(0, 160)}...` : "View post on DOPE Network",
      keywords: "post, content, DOPE Network, social media",
      ogImage: params.image || "/logo512.png"
    },
    '/search': {
      title: params.query ? `Search: ${params.query} - DOPE Network` : "Search - DOPE Network",
      description: params.query ? `Search results for "${params.query}" on DOPE Network.` : "Search for posts and people on DOPE Network.",
      keywords: `search, ${params.query || "posts, people"}, DOPE Network`
    }
  };

  return routes[url] || routes['/'];
};

// Function to inject meta tags into HTML template
const injectMetaTags = (html, metaData, url) => {
  const { title, description, keywords, ogImage } = metaData;
  
  let updatedHtml = html.replace(
    /<title>.*?<\/title>/,
    `<title>${title}</title>`
  );

  // Remove existing meta tags and inject new ones
  updatedHtml = updatedHtml.replace(
    /<meta name="description".*?>/,
    `<meta name="description" content="${description}">`
  );

  // Add meta tags after the title
  const metaTags = `
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:url" content="${process.env.FRONTEND_URL || 'https://www.dopp.eu.org'}${url}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImage}">
  `;

  updatedHtml = updatedHtml.replace(
    /<\/title>/,
    `</title>${metaTags}`
  );

  return updatedHtml;
};

// API proxy middleware
app.use('/v1', createProxyMiddleware({
  target: "https://api.dopp.eu.org/v1",
  changeOrigin: true,
  secure: true,
  followRedirects: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to https://api.dopp.eu.org/v1${req.url}`);
  },
  onError: (err, req, res) => {
    console.error("Proxy error:", err.message);
    res.status(500).json({ error: "Proxy error", message: err.message });
  },
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// SSR route handler
app.get('*', async (req, res) => {
  const url = req.path;
  let metaData;

  try {
    // For dynamic routes, fetch data from API
    if (url.startsWith('/profile/')) {
      const username = url.split('/')[2];
      // Fetch user data from API for meta tags
      // const userData = await fetch(`https://api.dopp.eu.org/v1/users/${username}`);
      metaData = getMetaData('/profile', { username, displayName: username });
    } else if (url.startsWith('/post/')) {
      const postId = url.split('/')[2];
      // Fetch post data from API for meta tags
      // const postData = await fetch(`https://api.dopp.eu.org/v1/posts/${postId}`);
      metaData = getMetaData('/post', { content: "Post content..." });
    } else if (url.startsWith('/search')) {
      const query = req.query.q;
      metaData = getMetaData('/search', { query });
    } else {
      metaData = getMetaData(url);
    }

    const htmlWithMeta = injectMetaTags(template, metaData, url);
    res.send(htmlWithMeta);

  } catch (error) {
    console.error('SSR Error:', error);
    res.send(template);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SSR server running on port ${PORT}`);
});
