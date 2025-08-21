/**
 * Google Sign-In utility functions with popup OAuth flow for DOPE API
 */

// Get API base URL from your config
const getApiBaseUrl = () => {
	const isUsingProxy = process.env.NODE_ENV === "development" && 
		(window.location.hostname.includes("replit") || window.location.hostname.includes("repl.co"));

	return isUsingProxy ? "/v1" : (process.env.REACT_APP_API_URL || "https://social.dopp.eu.org/v1");
};

/**
 * Initialize Google OAuth popup flow
 */
export const initializeGoogleOAuth = (type = 'login') => {
	return new Promise((resolve, reject) => {
		const apiBaseUrl = getApiBaseUrl();
		const authUrl = `${apiBaseUrl}/auth/google?type=${type}`;

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
			// Verify origin for security
			const apiBaseUrl = getApiBaseUrl();
			const allowedOrigins = [
				window.location.origin,
				'https://social.dopp.eu.org',
				apiBaseUrl.startsWith('http') ? new URL(apiBaseUrl).origin : window.location.origin
			];

			if (!allowedOrigins.includes(event.origin)) {
				return;
			}

			if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
				this.handleSuccess(event.data.result);
			} else if (event.data && event.data.type === 'GOOGLE_AUTH_ERROR') {
				this.handleError(new Error(event.data.error || 'Google authentication failed'));
			}
		};

		window.addEventListener('message', this.messageListener);

		// Poll for popup closure (fallback)
		this.interval = setInterval(() => {
			if (this.popup.closed) {
				this.handleError(new Error('Authentication cancelled'));
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