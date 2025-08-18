/** @format */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://natasha.dopp.eu.org/api';

// Validate API URL is HTTPS
if (!API_BASE_URL.startsWith('https://')) {
	console.error('API URL must use HTTPS');
}

// Placeholder for Firebase App Check functionality
// In a real scenario, you would import and initialize Firebase,
// and get the App Check token here.
// For example:
// import { initializeApp } from 'firebase/app';
// import { getAppCheck, getToken } from 'firebase/app-check';
//
// const firebaseApp = initializeApp({ /* Your Firebase config */ });
// const appCheck = getAppCheck(firebaseApp);
//
// const addAppCheckHeaders = async (headers) => {
// 	try {
// 		const appCheckTokenResponse = await getToken(appCheck, true); // true for optional refresh
// 		return {
// 			...headers,
// 			'X-Firebase-AppCheck': appCheckTokenResponse.token,
// 		};
// 	} catch (error) {
// 		console.error('Error getting App Check token:', error);
// 		// Decide how to handle errors: throw, return headers without token, etc.
// 		return headers;
// 	}
// };

// Mock implementation for demonstration purposes:
const addAppCheckHeaders = async (headers) => {
	console.log('Adding mock App Check headers');
	return {
		...headers,
		// 'X-Firebase-AppCheck': 'mock-app-check-token', // Replace with actual token
	};
};


const apiRequest = async (endpoint, options = {}) => {
	const url = `${API_BASE_URL}${endpoint}`;
	const token = getAuthToken();

	const defaultHeaders = {
		'Content-Type': 'application/json',
		...(token && { 'Authorization': `Bearer ${token}` })
	};

	// Add App Check token to headers
	const headersWithAppCheck = await addAppCheckHeaders({ ...defaultHeaders, ...options.headers });

	const config = {
		method: 'GET',
		headers: headersWithAppCheck,
		...options
	};

	if (config.body && typeof config.body === 'object') {
		config.body = JSON.stringify(config.body);
	}

	try {
		const response = await fetch(url, config);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error('API request failed:', error);
		throw error;
	}
};

// Secure token storage helper
const getAuthToken = () => {
	try {
		return sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
	} catch (e) {
		console.error('Failed to retrieve auth token');
		return null;
	}
};

const setAuthToken = (token) => {
	try {
		// Prefer sessionStorage for better security
		sessionStorage.setItem('authToken', token);
		// Keep localStorage as fallback for "remember me" functionality
		localStorage.setItem('authToken', token);
	} catch (e) {
		console.error('Failed to store auth token');
	}
};

const removeAuthToken = () => {
	try {
		sessionStorage.removeItem('authToken');
		localStorage.removeItem('authToken');
	} catch (e) {
		console.error('Failed to remove auth token');
	}
};

// Input validation helpers
const validateEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email) && email.length <= 254;
};

const validatePassword = (password) => {
	return typeof password === 'string' && password.length >= 8 && password.length <= 128;
};

const sanitizeInput = (input) => {
	if (typeof input !== 'string') return input;
	return input.trim().replace(/[<>]/g, '');
};

const authAPI = {
	login: async (email, password) => {
		if (!validateEmail(email)) {
			throw new Error('Invalid email format');
		}
		if (!validatePassword(password)) {
			throw new Error('Invalid password');
		}

		const response = await apiRequest('/auth/login', {
			method: 'POST',
			body: { 
				email: sanitizeInput(email), 
				password: password // Don't sanitize password to preserve special chars
			}
		});

		if (response.token) {
			setAuthToken(response.token);
		}

		return response;
	},

	register: (userData) => {
		// Validate required fields
		if (!validateEmail(userData.email)) {
			throw new Error('Invalid email format');
		}
		if (!validatePassword(userData.password)) {
			throw new Error('Password must be 8-128 characters');
		}
		if (!userData.username || userData.username.length < 3 || userData.username.length > 30) {
			throw new Error('Username must be 3-30 characters');
		}

		// Sanitize user inputs
		const sanitizedData = {
			...userData,
			email: sanitizeInput(userData.email),
			username: sanitizeInput(userData.username),
			name: sanitizeInput(userData.name)
		};

		return apiRequest('/auth/register', {
			method: 'POST',
			body: sanitizedData
		});
	},

	verifyEmail: (email, code, verificationId) => {
		if (!validateEmail(email)) {
			throw new Error('Invalid email format');
		}
		if (!code || code.length !== 6) {
			throw new Error('Invalid verification code');
		}

		return apiRequest('/auth/verify-email', {
			method: 'POST',
			body: { 
				email: sanitizeInput(email), 
				code: sanitizeInput(code), 
				verificationId: sanitizeInput(verificationId) 
			}
		});
	},

	resendVerification: (email) =>
		apiRequest('/auth/resend-code', {
			method: 'POST',
			body: { email }
		}),

	getCurrentUser: () =>
		apiRequest('/auth/me', {
			method: 'GET'
		}),

	logout: () => {
		removeAuthToken();
		return Promise.resolve();
	}
};

const userAPI = {
	getUsers: () =>
		apiRequest('/users', {
			method: 'GET'
		}),

	getUser: (username) =>
		apiRequest(`/users/${username}`, {
			method: 'GET'
		}),

	updateUser: (username, userData) =>
		apiRequest(`/users/${username}`, {
			method: 'PUT',
			body: userData
		}),

	followUser: (username) =>
		apiRequest(`/users/${username}/follow`, {
			method: 'POST'
		}),

	getFollowers: (username) =>
		apiRequest(`/users/${username}/followers`, {
			method: 'GET'
		}),

	getFollowing: (username) =>
		apiRequest(`/users/${username}/following`, {
			method: 'GET'
		}),

	searchUsers: (searchQuery) => {
		if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.length < 1) {
			throw new Error('Invalid search query');
		}
		const sanitizedQuery = sanitizeInput(searchQuery).substring(0, 100); // Limit length
		return apiRequest(`/users?search=${encodeURIComponent(sanitizedQuery)}`, {
			method: 'GET'
		});
	}
};

const postAPI = {
	getPosts: (params = {}) => {
		const searchParams = new URLSearchParams();
		Object.keys(params).forEach(key => {
			if (params[key] !== undefined && params[key] !== null) {
				searchParams.append(key, params[key]);
			}
		});
		const queryString = searchParams.toString();
		return apiRequest(`/posts${queryString ? `?${queryString}` : ''}`, {
			method: 'GET'
		});
	},

	getPost: (postId) =>
		apiRequest(`/posts/${postId}`, {
			method: 'GET'
		}),

	createPost: (postData) =>
		apiRequest('/posts', {
			method: 'POST',
			body: postData
		}),

	updatePost: (postId, postData) =>
		apiRequest(`/posts/${postId}`, {
			method: 'PUT',
			body: postData
		}),

	deletePost: (postId) =>
		apiRequest(`/posts/${postId}`, {
			method: 'DELETE'
		}),

	deletePostWithImages: async (postId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${API_BASE_URL}/posts/${postId}/with-images`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete post with images');
			}

			return { success: true };
		} catch (error) {
			throw error;
		}
	},


	likePost: (postId) =>
		apiRequest(`/posts/${postId}/like`, {
			method: 'POST'
		}),

	getUserPosts: (userId, params = {}) => {
		const searchParams = new URLSearchParams();
		Object.keys(params).forEach(key => {
			if (params[key] !== undefined && params[key] !== null) {
				searchParams.append(key, params[key]);
			}
		});
		const queryString = searchParams.toString();
		return apiRequest(`/posts${queryString ? `?${queryString}` : ''}`, {
			method: 'GET'
		});
	}
};

const commentAPI = {
	getComments: (postId, params = {}) => {
		const searchParams = new URLSearchParams();
		Object.keys(params).forEach(key => {
			if (params[key] !== undefined && params[key] !== null) {
				searchParams.append(key, params[key]);
			}
		});
		const queryString = searchParams.toString();
		return apiRequest(`/comments/post/${postId}${queryString ? `?${queryString}` : ''}`, {
			method: 'GET'
		});
	},

	createComment: (postId, content) =>
		apiRequest(`/comments/post/${postId}`, {
			method: 'POST',
			body: { content }
		}),

	updateComment: (commentId, content) =>
		apiRequest(`/comments/${commentId}`, {
			method: 'PUT',
			body: { content }
		}),

	deleteComment: (commentId) =>
		apiRequest(`/comments/${commentId}`, {
			method: 'DELETE'
		})
};

export { authAPI, postAPI, userAPI, commentAPI, setAuthToken, removeAuthToken, validateEmail, sanitizeInput };

export default apiRequest;