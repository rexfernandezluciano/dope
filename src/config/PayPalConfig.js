
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

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalConfig.clientId}&vault=${paypalConfig.sdkOptions.vault}&intent=${paypalConfig.sdkOptions.intent}&components=${paypalConfig.sdkOptions.components}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Wait a bit for PayPal to initialize
      setTimeout(() => {
        if (window.paypal) {
          resolve(window.paypal);
        } else {
          reject(new Error('PayPal SDK loaded but not available'));
        }
      }, 100);
    };
    
    script.onerror = (error) => {
      console.error('PayPal SDK loading error:', error);
      reject(new Error('Failed to load PayPal SDK - network or CORS issue'));
    };
    
    script.ontimeout = () => {
      reject(new Error('PayPal SDK loading timed out'));
    };
    
    try {
      document.head.appendChild(script);
    } catch (error) {
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

    window.paypal.PaymentMethod({
      style: paypalConfig.buttonStyle,
      createPaymentMethod: {
        flow: 'vault'
      },
      onApprove: async (data) => {
        try {
          resolve(data.paymentMethodID);
        } catch (error) {
          reject(error);
        }
      },
      onError: (err) => {
        console.error('PayPal Error:', err);
        reject(new Error('PayPal payment setup failed'));
      },
      onCancel: () => {
        reject(new Error('PayPal payment setup was cancelled'));
      }
    }).render(containerId);
  });
};
