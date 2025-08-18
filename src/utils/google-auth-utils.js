
/**
 * Google Sign-In utility functions
 */

let googleAuth = null;

/**
 * Initialize Google Sign-In
 */
export const initializeGoogleAuth = () => {
	return new Promise((resolve, reject) => {
		if (window.google) {
			window.google.accounts.id.initialize({
				client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
				callback: () => {}, // Will be set per component
				auto_select: false,
				cancel_on_tap_outside: true
			});
			resolve();
		} else {
			// Load Google Sign-In script
			const script = document.createElement('script');
			script.src = 'https://accounts.google.com/gsi/client';
			script.async = true;
			script.defer = true;
			script.onload = () => {
				window.google.accounts.id.initialize({
					client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
					callback: () => {}, // Will be set per component
					auto_select: false,
					cancel_on_tap_outside: true
				});
				resolve();
			};
			script.onerror = reject;
			document.head.appendChild(script);
		}
	});
};

/**
 * Handle Google Sign-In
 */
export const handleGoogleSignIn = (callback) => {
	return new Promise((resolve, reject) => {
		if (!window.google) {
			reject(new Error('Google Sign-In not initialized'));
			return;
		}

		window.google.accounts.id.initialize({
			client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
			callback: (response) => {
				if (response.credential) {
					resolve(response.credential);
				} else {
					reject(new Error('Google Sign-In failed'));
				}
			},
			auto_select: false,
			cancel_on_tap_outside: true
		});

		window.google.accounts.id.prompt((notification) => {
			if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
				// Fallback to popup if prompt is not displayed
				window.google.accounts.id.renderButton(
				document.getElementById('google-signin-button'), 
				{
					theme: 'outline',
					size: 'large',
					width: '100%'
				});
			}
		});
	});
};

/**
 * Render Google Sign-In button
 */
export const renderGoogleButton = (elementId, callback) => {
	if (!window.google) {
		console.error('Google Sign-In not initialized');
		return;
	}

	window.google.accounts.id.initialize({
		client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
		callback: callback,
		auto_select: false,
		cancel_on_tap_outside: true
	});

	window.google.accounts.id.renderButton(
		document.getElementById(elementId),
		{
			theme: 'outline',
			size: 'large',
			width: '100%',
			text: 'continue_with'
		}
	);
};
