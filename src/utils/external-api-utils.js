
/**
 * Utility functions for handling external API calls in Replit environment
 */

// Check if we're in Replit environment
export const isReplitEnvironment = () => {
  return window.location.hostname.includes('replit.dev') || 
         window.location.hostname.includes('replit.co') || 
         window.location.hostname.includes('replit.app');
};

// Generic external API call handler
export const callExternalAPI = async (url, options = {}) => {
  try {
    // Add CORS headers for external APIs
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'omit', // Don't send credentials for external APIs
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`External API call failed: ${error.message}`);
    
    // If it's a CORS error, provide helpful message
    if (error.message.includes('CORS') || error.message.includes('blocked')) {
      throw new Error('External API blocked by CORS policy. This is common in development environments.');
    }
    
    throw error;
  }
};

// Safe wrapper for Firebase operations
export const safeFirebaseOperation = async (operation, fallback = null) => {
  try {
    return await operation();
  } catch (error) {
    console.warn('Firebase operation failed:', error.message);
    if (typeof fallback === 'function') {
      return fallback();
    }
    return fallback;
  }
};

// Safe wrapper for PayPal operations
export const safePayPalOperation = async (operation, fallback = null) => {
  try {
    return await operation();
  } catch (error) {
    console.warn('PayPal operation failed:', error.message);
    if (typeof fallback === 'function') {
      return fallback();
    }
    return fallback;
  }
};

// Check if external services are available
export const checkExternalServices = async () => {
  const services = {
    firebase: false,
    paypal: false,
    google: false
  };

  // Check Firebase
  try {
    await fetch('https://www.gstatic.com/firebasejs/favicon.ico', { 
      method: 'HEAD', 
      mode: 'no-cors' 
    });
    services.firebase = true;
  } catch (error) {
    console.warn('Firebase services may be blocked');
  }

  // Check PayPal
  try {
    await fetch('https://www.paypal.com/favicon.ico', { 
      method: 'HEAD', 
      mode: 'no-cors' 
    });
    services.paypal = true;
  } catch (error) {
    console.warn('PayPal services may be blocked');
  }

  // Check Google
  try {
    await fetch('https://www.google.com/favicon.ico', { 
      method: 'HEAD', 
      mode: 'no-cors' 
    });
    services.google = true;
  } catch (error) {
    console.warn('Google services may be blocked');
  }

  return services;
};
