
/**
 * Google Sign-In utility functions
 */

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "171033182022-n0bjlqf0i7eao67miq6mrgtjcbid3obc.apps.googleusercontent.com";

/**
 * Initialize Google Sign-In
 */
export const initializeGoogleAuth = () => {
	return new Promise((resolve, reject) => {
		if (window.google && window.google.accounts && window.google.accounts.id) {
			// Google is already loaded, initialize it
			try {
				window.google.accounts.id.initialize({
					client_id: GOOGLE_CLIENT_ID,
					auto_select: false,
					cancel_on_tap_outside: true
				});
				resolve();
			} catch (error) {
				reject(new Error('Failed to initialize Google Sign-In: ' + error.message));
			}
			return;
		}

		// Load Google Sign-In script
		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.defer = true;
		
		script.onload = () => {
			// Wait for the script to fully initialize
			const checkGoogle = (attempts = 0) => {
				if (window.google && window.google.accounts && window.google.accounts.id) {
					try {
						window.google.accounts.id.initialize({
							client_id: GOOGLE_CLIENT_ID,
							auto_select: false,
							cancel_on_tap_outside: true
						});
						resolve();
					} catch (error) {
						reject(new Error('Failed to initialize Google Sign-In: ' + error.message));
					}
				} else if (attempts < 50) { // Try for 5 seconds
					setTimeout(() => checkGoogle(attempts + 1), 100);
				} else {
					reject(new Error('Google Sign-In failed to load properly'));
				}
			};
			checkGoogle();
		};
		
		script.onerror = (error) => {
			reject(new Error('Failed to load Google Sign-In script'));
		};
		
		document.head.appendChild(script);
	});
};

/**
 * Handle Google Sign-In with popup
 */
export const handleGoogleSignInPopup = (callback) => {
	return new Promise((resolve, reject) => {
		if (!window.google || !window.google.accounts || !window.google.accounts.id) {
			reject(new Error('Google Sign-In not initialized'));
			return;
		}

		try {
			// Initialize with callback
			window.google.accounts.id.initialize({
				client_id: GOOGLE_CLIENT_ID,
				callback: (response) => {
					if (response.credential) {
						if (callback) callback(response);
						resolve(response.credential);
					} else {
						reject(new Error('Google Sign-In failed - no credential received'));
					}
				},
				auto_select: false,
				cancel_on_tap_outside: true,
				ux_mode: 'popup'
			});

			// Show the popup immediately
			window.google.accounts.id.prompt((notification) => {
				if (notification.isNotDisplayed()) {
					console.log('Google popup blocked or not displayed');
					reject(new Error('Google popup was blocked or could not be displayed. Please allow popups or try the redirect method.'));
				} else if (notification.isSkippedMoment()) {
					console.log('Google popup was skipped');
					reject(new Error('Google popup was skipped by user'));
				} else if (notification.isDismissedMoment()) {
					console.log('Google popup was dismissed');
					reject(new Error('Google sign-in was dismissed'));
				}
			});
		} catch (error) {
			reject(new Error('Failed to show Google Sign-In popup: ' + error.message));
		}
	});
};

/**
 * Handle Google Sign-In with redirect (original method)
 */
export const handleGoogleSignIn = (callback) => {
	return new Promise((resolve, reject) => {
		if (!window.google || !window.google.accounts || !window.google.accounts.id) {
			reject(new Error('Google Sign-In not initialized'));
			return;
		}

		try {
			window.google.accounts.id.initialize({
				client_id: GOOGLE_CLIENT_ID,
				callback: (response) => {
					if (response.credential) {
						if (callback) callback(response);
						resolve(response.credential);
					} else {
						reject(new Error('Google Sign-In failed - no credential received'));
					}
				},
				auto_select: false,
				cancel_on_tap_outside: true
			});

			// Try to show the prompt
			window.google.accounts.id.prompt((notification) => {
				if (notification.isNotDisplayed()) {
					reject(new Error('Google sign-in prompt could not be displayed. Please try using the button method.'));
				} else if (notification.isSkippedMoment()) {
					reject(new Error('Google sign-in was skipped. Please try using the button method.'));
				} else if (notification.isDismissedMoment()) {
					reject(new Error('Google sign-in was dismissed'));
				}
			});
		} catch (error) {
			reject(new Error('Failed to show Google Sign-In: ' + error.message));
		}
	});
};

/**
 * Render Google Sign-In button
 */
export const renderGoogleButton = (elementId, callback) => {
	if (!window.google || !window.google.accounts || !window.google.accounts.id) {
		console.error('Google Sign-In not initialized');
		return false;
	}

	const element = document.getElementById(elementId);
	
	if (!element) {
		console.error(`Element with id ${elementId} not found`);
		return false;
	}

	try {
		// Clear any existing content
		element.innerHTML = '';
		
		window.google.accounts.id.initialize({
			client_id: GOOGLE_CLIENT_ID,
			callback: callback,
			auto_select: false,
			cancel_on_tap_outside: true
		});

		window.google.accounts.id.renderButton(element, {
			theme: 'outline',
			size: 'large',
			width: element.offsetWidth || 300,
			text: 'continue_with',
			logo_alignment: 'left'
		});
		
		return true;
	} catch (error) {
		console.error('Failed to render Google button:', error);
		return false;
	}
};
