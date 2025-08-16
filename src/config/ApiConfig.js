
/** @format */

const API_BASE_URL = 'https://natasha.dopp.eu.org/api';

const apiRequest = async (endpoint, options = {}) => {
	const url = `${API_BASE_URL}${endpoint}`;
	const token = localStorage.getItem('authToken');
	
	const config = {
		headers: {
			'Content-Type': 'application/json',
			...(token && { 'Authorization': `Bearer ${token}` }),
			...options.headers,
		},
		...options,
	};

	if (config.body && typeof config.body === 'object') {
		config.body = JSON.stringify(config.body);
	}

	const response = await fetch(url, config);
	
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	
	return response.json();
};

export const authAPI = {
	login: (email, password) => 
		apiRequest('/auth/login', {
			method: 'POST',
			body: { email, password }
		}),
	
	register: (userData) => 
		apiRequest('/auth/register', {
			method: 'POST',
			body: userData
		}),
	
	googleAuth: (token) => 
		apiRequest('/auth/google', {
			method: 'POST',
			body: { token }
		}),
	
	verifyEmail: (token) => 
		apiRequest('/auth/verify-email', {
			method: 'POST',
			body: { token }
		}),
	
	resendVerification: (email) => 
		apiRequest('/auth/resend-verification', {
			method: 'POST',
			body: { email }
		}),
	
	getCurrentUser: () => 
		apiRequest('/auth/me', {
			method: 'GET'
		}),
	
	logout: () => 
		apiRequest('/auth/logout', {
			method: 'POST'
		})
};

export const userAPI = {
	getUser: (userId) => 
		apiRequest(`/users/${userId}`, {
			method: 'GET'
		}),
	
	updateUser: (userId, userData) => 
		apiRequest(`/users/${userId}`, {
			method: 'PUT',
			body: userData
		}),
	
	checkUserExists: (userId) => 
		apiRequest(`/users/${userId}/exists`, {
			method: 'GET'
		}),
	
	checkEmailExists: (email) => 
		apiRequest(`/users/check-email`, {
			method: 'POST',
			body: { email }
		}),
	
	isAdmin: (userId) => 
		apiRequest(`/users/${userId}/admin`, {
			method: 'GET'
		})
};

export default apiRequest;
