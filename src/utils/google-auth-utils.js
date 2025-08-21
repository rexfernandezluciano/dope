/**
 * Google Sign-In utility functions using @react-oauth/google integrated with DOPE API
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
			// Decode the JWT token to get user info
			const userInfo = parseJwt(credentialResponse.credential);
			
			if (callback) {
				await callback({ 
					credential: credentialResponse.credential,
					userInfo: userInfo
				});
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

/**
 * Parse JWT token to extract user information
 */
const parseJwt = (token) => {
	try {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));
		
		return JSON.parse(jsonPayload);
	} catch (error) {
		console.error('Error parsing JWT token:', error);
		throw new Error('Invalid token format');
	}
};

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
