
/**
 * Google Sign-In utility functions
 */

/**
 * Initialize Google Sign-In
 */
export const initializeGoogleAuth = () => {
	return new Promise((resolve, reject) => {
		if (window.google && window.google.accounts && window.google.accounts.id) {
			// Google is already loaded
			resolve();
			return;
		}

		// Load Google Sign-In script
		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.defer = true;
		
		script.onload = () => {
			// Wait a bit for the script to fully initialize
			setTimeout(() => {
				if (window.google && window.google.accounts && window.google.accounts.id) {
					resolve();
				} else {
					reject(new Error('Google Sign-In failed to load properly'));
				}
			}, 100);
		};
		
		script.onerror = (error) => {
			reject(new Error('Failed to load Google Sign-In script'));
		};
		
		document.head.appendChild(script);
	});
};

/**
 * Handle Google Sign-In
 */
export const handleGoogleSignIn = (callback) => {
	return new Promise((resolve, reject) => {
		if (!window.google || !window.google.accounts || !window.google.accounts.id) {
			reject(new Error('Google Sign-In not initialized'));
			return;
		}

		const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "171033182022-n0bjlqf0i7eao67miq6mrgtjcbid3obc.apps.googleusercontent.com";

		window.google.accounts.id.initialize({
			client_id: clientId,
			callback: (response) => {
				if (response.credential) {
					if (callback) callback(response);
					resolve(response.credential);
				} else {
					reject(new Error('Google Sign-In failed'));
				}
			},
			auto_select: false,
			cancel_on_tap_outside: true
		});

		// Try to show the prompt
		window.google.accounts.id.prompt((notification) => {
			if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
				// Fallback: user needs to click a button
				console.log('Google prompt not displayed, fallback to button required');
			}
		});
	});
};

/**
 * Render Google Sign-In button
 */
export const renderGoogleButton = (elementId, callback) => {
	if (!window.google || !window.google.accounts || !window.google.accounts.id) {
		console.error('Google Sign-In not initialized');
		return;
	}

	const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "171033182022-q5s7u27t4s7idqq7mepqkcp3jjsev8pb.apps.googleusercontent.com";
	const element = document.getElementById(elementId);
	
	if (!element) {
		console.error(`Element with id ${elementId} not found`);
		return;
	}

	window.google.accounts.id.initialize({
		client_id: clientId,
		callback: callback,
		auto_select: false,
		cancel_on_tap_outside: true
	});

	window.google.accounts.id.renderButton(element, {
		theme: 'outline',
		size: 'large',
		width: '100%',
		text: 'continue_with'
	});
};
