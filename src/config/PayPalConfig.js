
/** @format */

// PayPal Configuration
export const paypalConfig = {
  // Replace with your actual PayPal Client ID
  clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID || "YOUR_PAYPAL_CLIENT_ID",
  
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

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalConfig.clientId}&vault=${paypalConfig.sdkOptions.vault}&intent=${paypalConfig.sdkOptions.intent}&components=${paypalConfig.sdkOptions.components}`;
    script.onload = () => {
      if (window.paypal) {
        resolve(window.paypal);
      } else {
        reject(new Error('PayPal SDK failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
    document.head.appendChild(script);
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
