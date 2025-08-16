
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
		const errorData = await response.json().catch(() => ({ message: 'Network error' }));
		throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
	}
	
	return response.json();
};

export const authAPI = {
	login: async (email, password) => {
		const response = await apiRequest('/auth/login', {
			method: 'POST',
			body: { email, password }
		});
		return response;
	},
	
	register: (userData) => 
		apiRequest('/auth/register', {
			method: 'POST',
			body: userData
		}),
	
	verifyEmail: (email, code, verificationId) => 
		apiRequest('/auth/verify-email', {
			method: 'POST',
			body: { email, code, verificationId }
		}),
	
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
		localStorage.removeItem('authToken');
		return Promise.resolve();
	}
};

export const userAPI = {
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
		})
};

export const postAPI = {
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
	
	likePost: (postId) => 
		apiRequest(`/posts/${postId}/like`, {
			method: 'POST'
		})
};

export const commentAPI = {
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

export default apiRequest;
