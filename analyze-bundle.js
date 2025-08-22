
const { execSync } = require('child_process');
const fs = require('fs');

// Install webpack-bundle-analyzer if not present
try {
  require('webpack-bundle-analyzer');
} catch (e) {
  console.log('Installing webpack-bundle-analyzer...');
  execSync('npm install --save-dev webpack-bundle-analyzer', { stdio: 'inherit' });
}

// Build the project
console.log('Building project for analysis...');
execSync('npm run build', { stdio: 'inherit' });

// Analyze the bundle
console.log('Analyzing bundle...');
execSync('npx webpack-bundle-analyzer build/static/js/*.js', { stdio: 'inherit' });
