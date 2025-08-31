
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
    intent: "subscription",
    components: "buttons,payment-methods"
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
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalConfig.clientId}&vault=${paypalConfig.sdkOptions.vault}&intent=${paypalConfig.sdkOptions.intent}&components=${paypalConfig.sdkOptions.components}`;
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

// PayPal payment method creation helper
export const createPayPalPaymentMethod = (containerId) => {
  return new Promise((resolve, reject) => {
    if (!window.paypal) {
      reject(new Error("PayPal SDK not loaded"));
      return;
    }

    try {
      // Check if container exists
      const container = document.querySelector(containerId);
      if (!container) {
        reject(new Error(`Container ${containerId} not found`));
        return;
      }

      // Clear any existing content
      container.innerHTML = '';

      const paymentMethod = window.paypal.PaymentMethod({
        style: paypalConfig.buttonStyle,
        createPaymentMethod: {
          flow: 'vault'
        },
        onApprove: async (data) => {
          try {
            if (data && data.paymentMethodID) {
              resolve(data.paymentMethodID);
            } else {
              reject(new Error('No payment method ID received from PayPal'));
            }
          } catch (error) {
            console.error('PayPal approval error:', error);
            reject(new Error('Failed to process PayPal approval'));
          }
        },
        onError: (err) => {
          console.error('PayPal Error:', err);
          const errorMessage = err && err.message ? err.message : 'PayPal payment setup failed';
          reject(new Error(`PayPal error: ${errorMessage}`));
        },
        onCancel: () => {
          reject(new Error('PayPal payment setup was cancelled by user'));
        }
      });

      if (paymentMethod && typeof paymentMethod.render === 'function') {
        paymentMethod.render(containerId).catch((renderError) => {
          console.error('PayPal render error:', renderError);
          reject(new Error('Failed to render PayPal payment method'));
        });
      } else {
        reject(new Error('PayPal PaymentMethod is not available or invalid'));
      }
    } catch (error) {
      console.error('PayPal setup error:', error);
      reject(new Error(`PayPal setup failed: ${error.message}`));
    }
  });
};
