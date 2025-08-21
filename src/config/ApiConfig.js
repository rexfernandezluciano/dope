/** @format */

import Cookies from "js-cookie";
import axios from "axios";

// Check if we're using proxy (in development)
const isUsingProxy =
	process.env.NODE_ENV === "development" &&
	(window.location.hostname.includes("replit") ||
		window.location.hostname.includes("repl.co"));

// Multiple API endpoints for failover
const API_ENDPOINTS = isUsingProxy
	? [
			"/v1", // Use proxy in development
			"https://social.dopp.eu.org/v1",
		]
	: [
			process.env.REACT_APP_API_URL || "https://api.dopp.eu.org/v1",
			"https://social.dopp.eu.org/v1",
		];

// Current active API base URL
let API_BASE_URL = API_ENDPOINTS[0];

// Validate API URL is HTTPS (skip validation for proxy URLs)
if (!API_BASE_URL.startsWith("https://") && !API_BASE_URL.startsWith("/")) {
	console.error("API URL must use HTTPS");
}

// Create axios instance with default config
const apiClient = axios.create({
	timeout: 30000,
	headers: {
		"Content-Type": "application/json; charset=UTF-8",
		Accept: "application/json",
		"User-Agent": "DOPE-Network-Client/1.0",
		"X-Requested-With": "XMLHttpRequest",
	},
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
	(config) => {
		// Get auth token from storage
		const token =
			sessionStorage.getItem("authToken") ||
			localStorage.getItem("authToken") ||
			Cookies.get("authToken");

		if (token) {
			console.log("Auth token found in storage");
			config.headers.Authorization = `Bearer ${token}`;
		} else {
			console.log("No auth token found in any storage");
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		if (error.response) {
			// Server responded with error status
			console.log("❌ HTTP Error Response:", {
				status: error.response.status,
				statusText: error.response.statusText,
				data: error.response.data,
				url: error.config.url,
			});
		} else if (error.request) {
			// Request was made but no response received
			console.log("❌ Network Error:", error.message);
		} else {
			// Something else happened
			console.log("❌ Request Error:", error.message);
		}
		return Promise.reject(error);
	}
);

// HTTP Client class using axios
class HttpClient {
	constructor() {
		this.currentEndpointIndex = 0;
	}

	async makeRequest(endpoint, options = {}) {
		const url = `${API_BASE_URL}${endpoint}`;

		try {
			console.log("🚀 Making axios request:", {
				url,
				method: options.method || "GET",
				hasData: !!options.data,
				timestamp: new Date().toISOString(),
			});

			const response = await apiClient({
				url,
				method: options.method || "GET",
				data: options.data,
				headers: options.headers,
				...options,
			});

			console.log("📥 Axios response received:", {
				status: response.status,
				statusText: response.statusText,
				url: response.config.url,
			});

			return {
				ok: response.status >= 200 && response.status < 300,
				status: response.status,
				statusText: response.statusText,
				data: response.data,
				headers: response.headers,
			};
		} catch (error) {
			console.log("💥 Axios request failed:", {
				url,
				error: error.name,
				message: error.message,
				status: error.response?.status,
				data: error.response?.data,
			});

			if (error.response) {
				// Server error
				throw new Error(
					error.response.data?.message ||
						error.response.statusText ||
						"Server error"
				);
			} else if (error.request) {
				// Network error
				throw new Error(
					"Network connectivity issue detected. Please check your internet connection and try again."
				);
			} else {
				// Other error
				throw new Error(error.message || "Request failed");
			}
		}
	}

	async requestWithFailover(endpoint, options = {}) {
		let lastError;

		for (let i = 0; i < API_ENDPOINTS.length; i++) {
			const currentEndpoint = API_ENDPOINTS[i];
			API_BASE_URL = currentEndpoint;

			console.log(`🔄 Trying endpoint: ${currentEndpoint}`);

			try {
				const response = await this.makeRequest(endpoint, options);
				this.currentEndpointIndex = i;
				return response;
			} catch (error) {
				lastError = error;
				console.log(`❌ Request failed on ${currentEndpoint}:`, error.message);

				// Continue to next endpoint
				continue;
			}
		}

		// All endpoints failed
		console.log("🚨 All API endpoints failed");
		throw lastError;
	}
}

// Create HTTP client instance
const httpClient = new HttpClient();

// Main API request function
export const apiRequest = async (endpoint, options = {}) => {
	try {
		const response = await httpClient.requestWithFailover(endpoint, options);

		if (!response.ok) {
			throw new Error(
				response.data?.message || `HTTP ${response.status}: ${response.statusText}`
			);
		}

		return response.data;
	} catch (error) {
		console.log("🚨 API request failed:", {
			endpoint,
			error: error.message,
			stack: error.stack,
		});
		throw error;
	}
};

// API methods
export const api = {
	// Authentication
	login: async (credentials) => {
		return await apiRequest("/auth/login", {
			method: "POST",
			data: credentials,
		});
	},

	register: async (userData) => {
		return await apiRequest("/auth/register", {
			method: "POST",
			data: userData,
		});
	},

	logout: async () => {
		return await apiRequest("/auth/logout", {
			method: "POST",
		});
	},

	me: async () => {
		return await apiRequest("/auth/me");
	},

	// Posts
	getPosts: async (page = 1, limit = 10) => {
		return await apiRequest(`/posts?page=${page}&limit=${limit}`);
	},

	createPost: async (postData) => {
		return await apiRequest("/posts", {
			method: "POST",
			data: postData,
		});
	},

	getPost: async (postId) => {
		return await apiRequest(`/posts/${postId}`);
	},

	updatePost: async (postId, postData) => {
		return await apiRequest(`/posts/${postId}`, {
			method: "PUT",
			data: postData,
		});
	},

	deletePost: async (postId) => {
		return await apiRequest(`/posts/${postId}`, {
			method: "DELETE",
		});
	},

	likePost: async (postId) => {
		return await apiRequest(`/posts/${postId}/like`, {
			method: "POST",
		});
	},

	// Users
	getUser: async (userId) => {
		return await apiRequest(`/users/${userId}`);
	},

	updateProfile: async (userData) => {
		return await apiRequest("/users/profile", {
			method: "PUT",
			data: userData,
		});
	},

	// Waiting list
	getWaitingList: async () => {
		return await apiRequest("/users/waiting-list");
	},

	joinWaitingList: async (userData) => {
		return await apiRequest("/users/waiting-list", {
			method: "POST",
			data: userData,
		});
	},
};

// Token management functions
export const setAuthToken = (token, rememberMe = false) => {
	if (!token) {
		console.error("Cannot set empty token");
		return;
	}

	try {
		// Always store in sessionStorage for current session
		sessionStorage.setItem("authToken", token);
		
		// Store in localStorage only if rememberMe is true
		if (rememberMe) {
			localStorage.setItem("authToken", token);
		}
		
		// Also store in cookie as fallback
		Cookies.set("authToken", token, {
			expires: rememberMe ? 30 : 1, // 30 days if remember me, 1 day otherwise
			secure: true,
			sameSite: "strict"
		});
		
		console.log("Auth token stored successfully");
	} catch (error) {
		console.error("Error storing auth token:", error);
	}
};

export const getAuthToken = () => {
	try {
		// Check sessionStorage first (most recent)
		let token = sessionStorage.getItem("authToken");
		if (token) {
			console.log("Auth token found in sessionStorage (current session)");
			return token;
		}

		// Check localStorage
		token = localStorage.getItem("authToken");
		if (token) {
			console.log("Auth token found in localStorage (persistent)");
			// Also store in sessionStorage for faster access
			sessionStorage.setItem("authToken", token);
			return token;
		}

		// Check cookies as fallback
		token = Cookies.get("authToken");
		if (token) {
			console.log("Auth token found in cookies (fallback)");
			// Store in sessionStorage for faster access
			sessionStorage.setItem("authToken", token);
			return token;
		}

		console.log("No auth token found in any storage");
		return null;
	} catch (error) {
		console.error("Error retrieving auth token:", error);
		return null;
	}
};

export const removeAuthToken = () => {
	try {
		// Remove from all storage locations
		sessionStorage.removeItem("authToken");
		localStorage.removeItem("authToken");
		Cookies.remove("authToken");
		
		console.log("Auth token removed from all storage locations");
	} catch (error) {
		console.error("Error removing auth token:", error);
	}
};

// Utility functions
export const validateEmail = (email) => {
	if (!email || typeof email !== "string") return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.toLowerCase().trim());
};

export const sanitizeInput = (input) => {
	if (typeof input !== "string") return "";
	return input.trim().replace(/[<>'"]/g, "");
};

export const testApiConnection = async () => {
	try {
		const response = await fetch(`${API_BASE_URL}/health`, {
			method: "GET",
			timeout: 5000,
		});
		return response.ok;
	} catch (error) {
		console.error("API connection test failed:", error);
		return false;
	}
};

export {
	setAuthToken,
	removeAuthToken,
	getAuthToken,
	validateEmail,
	sanitizeInput,
	testApiConnection,
};

export default apiRequest;