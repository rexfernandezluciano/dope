
/** @format */

// PayPal Configuration
export const paypalConfig = {
  // Replace with your actual PayPal Client ID
  clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID || "AYv5Ao5cq7A49Hd19TSrw59YEiPboazIE7WXrmLkpklVCmsgQmartssMsFap9XI7lM6LOnjMHgux2nJR",
  
  // PayPal environment (sandbox for testing, production for live)
  environment: process.env.REACT_APP_PAYPAL_ENVIRONMENT || "sandbox",
  
  // PayPal SDK options
  sdkOptions: {
    vault: true,
    intent: "authorize",
    components: "buttons"
  },
  
  // PayPal button styling
  buttonStyle: {
    layout: 'horizontal',
    color: 'blue',
    shape: 'rect',
    label: 'pay'
  }
};

// Helper function to load PayPal SDK dynamically
export const loadPayPalSDK = () => {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal);
      return;
    }

    // Check if we're in a supported environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('PayPal SDK requires browser environment'));
      return;
    }

    // Check if we're in Replit environment and warn about limitations
    const isReplit = window.location.hostname.includes('replit.dev') || 
                     window.location.hostname.includes('replit.co') || 
                     window.location.hostname.includes('replit.app');
    
    if (isReplit) {
      console.warn('PayPal SDK may have limitations in Replit environment due to CORS restrictions');
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalConfig.clientId}&vault=${paypalConfig.sdkOptions.vault}&intent=${paypalConfig.sdkOptions.intent}&components=${paypalConfig.sdkOptions.components}&currency=USD`;
    script.async = true;
    script.defer = true;
    script.timeout = 10000; // 10 second timeout
    
    const cleanup = () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
    
    script.onload = () => {
      // Wait a bit for PayPal to initialize
      setTimeout(() => {
        if (window.paypal) {
          resolve(window.paypal);
        } else {
          cleanup();
          reject(new Error('PayPal SDK loaded but not available - may be blocked by environment'));
        }
      }, 500);
    };
    
    script.onerror = (error) => {
      console.error('PayPal SDK loading error:', error);
      cleanup();
      if (isReplit) {
        reject(new Error('PayPal SDK blocked in Replit environment. External payment services may be restricted.'));
      } else {
        reject(new Error('Failed to load PayPal SDK - network or CORS issue'));
      }
    };
    
    script.ontimeout = () => {
      cleanup();
      reject(new Error('PayPal SDK loading timed out - network may be slow or blocked'));
    };
    
    // Set up timeout manually since script.timeout isn't widely supported
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('PayPal SDK loading timed out'));
    }, 10000);
    
    script.onload = () => {
      clearTimeout(timeoutId);
      setTimeout(() => {
        if (window.paypal) {
          resolve(window.paypal);
        } else {
          reject(new Error('PayPal SDK loaded but not available'));
        }
      }, 500);
    };
    
    try {
      document.head.appendChild(script);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(new Error('Failed to append PayPal script to document'));
    }
  });
};

// Generate PayPal authorization URL for wallet linking
export const generatePayPalAuthUrl = (returnUrl, cancelUrl) => {
  const baseUrl = paypalConfig.environment === 'sandbox' 
    ? 'https://www.sandbox.paypal.com/connect'
    : 'https://www.paypal.com/connect';
  
  const params = new URLSearchParams({
    client_id: paypalConfig.clientId,
    response_type: 'code',
    scope: 'openid email',
    redirect_uri: returnUrl,
    cancel_uri: cancelUrl || returnUrl,
    flowEntry: 'static'
  });
  
  return `${baseUrl}?${params.toString()}`;
};

// PayPal payment method creation helper using redirect approach
export const createPayPalPaymentMethod = (type = 'card') => {
  return new Promise((resolve, reject) => {
    try {
      const currentUrl = window.location.origin + window.location.pathname;
      const returnUrl = `${currentUrl}?paypal_return=true&type=${type}`;
      const cancelUrl = `${currentUrl}?paypal_cancel=true`;

      if (type === 'wallet') {
        // For wallet linking, redirect to PayPal authorization
        const authUrl = generatePayPalAuthUrl(returnUrl, cancelUrl);
        window.location.href = authUrl;
      } else {
        // For card linking, use the vault flow
        const params = new URLSearchParams({
          client_id: paypalConfig.clientId,
          response_type: 'code',
          scope: 'https://uri.paypal.com/services/payments/payment',
          redirect_uri: returnUrl,
          cancel_uri: cancelUrl,
          vault: 'true',
          intent: 'authorize'
        });
        
        const vaultUrl = paypalConfig.environment === 'sandbox'
          ? `https://www.sandbox.paypal.com/agreements/approve?${params.toString()}`
          : `https://www.paypal.com/agreements/approve?${params.toString()}`;
        
        window.location.href = vaultUrl;
        resolve({ type: 'redirect', url: vaultUrl })
      }
    } catch (error) {
      console.error('PayPal redirect setup error:', error);
      reject(new Error(`PayPal setup failed: ${error.message}`));
    }
  });
};
