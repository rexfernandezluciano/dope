
const express = require('express');
const ejs = require('ejs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API proxy
app.use('/v1', createProxyMiddleware({
  target: "https://api.dopp.eu.org/v1",
  changeOrigin: true,
  secure: true,
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Route handlers with server-side meta generation
app.get('/', (req, res) => {
  res.render('index', {
    title: "DOPE Network - Social Media Platform",
    description: "DOPE Network - A modern social media platform connecting communities worldwide.",
    keywords: "DOPE Network, social media, community",
    ogImage: "/logo512.png",
    url: req.url
  });
});

app.get('/profile/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    // Fetch user data from API
    // const userData = await fetch(`https://api.dopp.eu.org/v1/users/${username}`);
    
    res.render('index', {
      title: `${username} - DOPE Network`,
      description: `View ${username}'s profile on DOPE Network.`,
      keywords: `${username}, profile, DOPE Network`,
      ogImage: "/logo512.png", // or userData.avatar
      url: req.url
    });
  } catch (error) {
    res.render('index', {
      title: "Profile - DOPE Network",
      description: "User profile on DOPE Network",
      keywords: "profile, DOPE Network",
      ogImage: "/logo512.png",
      url: req.url
    });
  }
});

app.get('*', (req, res) => {
  res.render('index', {
    title: "DOPE Network - Social Media Platform",
    description: "DOPE Network - A modern social media platform",
    keywords: "DOPE Network, social media",
    ogImage: "/logo512.png",
    url: req.url
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PHP-style server running on port ${PORT}`);
});
