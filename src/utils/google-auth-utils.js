/**
 * Google Sign-In utility functions using @react-oauth/google
 */

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

/**
 * Get Google Client ID
 */
export const getGoogleClientId = () => {
	if (!GOOGLE_CLIENT_ID) {
		console.error('REACT_APP_GOOGLE_CLIENT_ID environment variable is not set');
		return null;
	}
	return GOOGLE_CLIENT_ID;
};

/**
 * Handle successful Google login response
 */
export const handleGoogleSuccess = async (credentialResponse, callback) => {
	try {
		if (credentialResponse.credential) {
			if (callback) {
				await callback({ credential: credentialResponse.credential });
			}
			return credentialResponse.credential;
		} else {
			throw new Error("No credential received from Google");
		}
	} catch (error) {
		console.error("Google login success handler error:", error);
		throw error;
	}
};

/**
 * Handle Google login error
 */
export const handleGoogleError = (error) => {
	console.error("Google login error:", error);
	throw new Error("Google login failed. Please try again.");
};
