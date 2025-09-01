/**
 * Google Sign-In utility functions with popup OAuth flow for DOPE API
 */

// Get API base URL from your config
const getApiBaseUrl = () => {
	const isUsingProxy = process.env.NODE_ENV === "development" && 
		(window.location.hostname.includes("replit") || window.location.hostname.includes("repl.co"));

	return isUsingProxy ? "/v1" : (process.env.REACT_APP_API_URL || "https://api.dopp.eu.org/v1");
};

/**
 * Initialize Google OAuth popup flow
 */
export const initializeGoogleOAuth = (type = 'login') => {
	return new Promise((resolve, reject) => {
		const apiBaseUrl = getApiBaseUrl();
		const frontendCallbackUrl = `${window.location.origin}/auth/google/callback`;
		const authUrl = `${apiBaseUrl}/auth/google?type=${type}&redirect_uri=${encodeURIComponent(frontendCallbackUrl)}`;

		// Popup window dimensions
		const width = 500;
		const height = 600;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;

		// Open popup window
		const popup = window.open(
			authUrl,
			'googleAuth',
			`width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
		);

		if (!popup) {
			reject(new Error('Popup blocked. Please allow popups for this site.'));
			return;
		}

		// Observer to watch for popup completion
		const observer = new GoogleAuthObserver(popup, resolve, reject);
		observer.start();
	});
};

/**
 * Google Auth Observer class to monitor popup window
 */
class GoogleAuthObserver {
	constructor(popup, resolve, reject) {
		this.popup = popup;
		this.resolve = resolve;
		this.reject = reject;
		this.interval = null;
		this.timeout = null;
		this.messageListener = null;
	}

	start() {
		// Set up message listener for cross-origin communication
		this.messageListener = (event) => {
			console.log('GoogleAuthObserver: Received message:', event);
			console.log('Event origin:', event.origin);
			console.log('Event data:', event.data);
			console.log('Event data type:', event.data?.type);
			console.log('Event data result:', event.data?.result);
			
			// Verify origin for security
			const apiBaseUrl = getApiBaseUrl();
			const allowedOrigins = [
				window.location.origin,
				'https://api.dopp.eu.org',
				'https://accounts.google.com',
				apiBaseUrl.startsWith('http') ? new URL(apiBaseUrl).origin : window.location.origin
			];

			console.log('Allowed origins:', allowedOrigins);

			if (!allowedOrigins.includes(event.origin)) {
				console.warn('Message from unauthorized origin:', event.origin);
				return;
			}

			if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
				this.handleSuccess(event.data.result);
			} else if (event.data && event.data.type === 'GOOGLE_AUTH_ERROR') {
				this.handleError(new Error(event.data.error || 'Google authentication failed'));
			}
		};

		window.addEventListener('message', this.messageListener);

		// Poll for popup closure (fallback) and check URL changes
		this.interval = setInterval(() => {
			if (this.popup.closed) {
				this.handleError(new Error('Authentication cancelled'));
				return;
			}
			
			// Try to check popup URL (will fail due to CORS for external domains, but we can try)
			try {
				const popupUrl = this.popup.location.href;
				console.log('Popup URL:', popupUrl);
				
				// If popup has navigated back to our domain, handle the callback
				if (popupUrl && popupUrl.includes(window.location.origin) && popupUrl.includes('/auth/google/callback')) {
					console.log('Popup returned to our callback URL');
				}
			} catch (e) {
				// Expected for cross-origin URLs, ignore
			}
		}, 1000);

		// Set timeout
		this.timeout = setTimeout(() => {
			this.handleError(new Error('Authentication timeout'));
		}, 300000); // 5 minutes
	}

	stop() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}

		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = null;
		}

		if (this.messageListener) {
			window.removeEventListener('message', this.messageListener);
			this.messageListener = null;
		}

		if (this.popup && !this.popup.closed) {
			this.popup.close();
		}
	}

	handleSuccess(result) {
		this.stop();
		this.resolve(result);
	}

	handleError(error) {
		this.stop();
		this.reject(error);
	}
}

/**
 * Prepare Google user data for DOPE API
 */
export const prepareGoogleUserData = (userInfo) => {
	return {
		email: userInfo.email,
		name: userInfo.name,
		given_name: userInfo.given_name,
		family_name: userInfo.family_name,
		picture: userInfo.picture,
		sub: userInfo.sub, // Google user ID
		email_verified: userInfo.email_verified
	};
};