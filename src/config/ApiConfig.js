/** @format */

// Secure token storage helper
// Import js-cookie for secure cookie management
import Cookies from "js-cookie";
import axios from "axios";

const API_BASE_URL =
	process.env.REACT_APP_API_URL || "https://api.dopp.eu.org/v1";

// Validate API URL is HTTPS
if (!API_BASE_URL.startsWith("https://")) {
	console.error("API URL must use HTTPS");
}

// Create axios instance
const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 60000,
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor to add security headers
apiClient.interceptors.request.use(async (config) => {
	try {
		// Import SecurityMiddleware dynamically to avoid circular imports
		const { SecurityMiddleware } = await import("../utils/security-middleware");

		// Use SecurityMiddleware to add all security headers including App Check
		const secureOptions = await SecurityMiddleware.secureApiRequest(
			config.url,
			{ headers: config.headers },
		);

		// Merge security headers
		config.headers = { ...config.headers, ...secureOptions.headers };

		// Add auth token if available
		const token = getAuthToken();
		if (token) {
			config.headers["Authorization"] = `Bearer ${token}`;
		}

		return config;
	} catch (error) {
		console.error("Request interceptor failed:", error);
		return config;
	}
});

// Response interceptor to handle errors
apiClient.interceptors.response.use(
	(response) => response.data,
	(error) => {
		console.error("API Error Details:", {
			url: error.config?.url,
			method: error.config?.method,
			baseURL: error.config?.baseURL,
			status: error.response?.status,
			statusText: error.response?.statusText,
			message: error.message,
			code: error.code,
		});

		console.error("Full Error Object:", error);

		if (error.response) {
			// Server responded with error status
			const message =
				error.response.data?.message ||
				`HTTP error! status: ${error.response.status}`;
			throw new Error(message);
		} else if (error.request) {
			// Request was made but no response received
			console.error("Network error - request details:", error.request);
			throw new Error(
				`Network error - no response received from ${API_BASE_URL}`,
			);
		} else {
			// Something else happened
			throw new Error(error.message || "Request failed");
		}
	},
);

// Test API connectivity
const testApiConnection = async () => {
	try {
		console.log("Testing API connectivity to:", API_BASE_URL);
		const response = await fetch(`${API_BASE_URL}/health`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			signal: AbortSignal.timeout(10000), // 10 second timeout
		});

		if (response.ok) {
			console.log("API connection successful");
			return true;
		} else {
			console.error(
				"API connection failed:",
				response.status,
				response.statusText,
			);
			return false;
		}
	} catch (error) {
		console.error("API connectivity test failed:", error.message);
		return false;
	}
};

const apiRequest = async (endpoint, options = {}) => {
	try {
		console.log("Making API request:", {
			url: endpoint,
			method: options.method || "GET",
			baseURL: API_BASE_URL,
		});

		const response = await apiClient({
			url: endpoint,
			method: options.method || "GET",
			data: options.body,
			...options,
		});

		return response;
	} catch (error) {
		console.error("API request failed:", error);
		throw error;
	}
};

// Secure cookie utilities using js-cookie
const setCookie = (name, value, options = {}) => {
	try {
		const isProduction = process.env.NODE_ENV === "production";
		const isHttps = window.location.protocol === "https:";
		const isReplit =
			window.location.hostname.includes("replit") ||
			window.location.hostname.includes("repl.co");

		const defaults = {
			path: "/",
			secure: isProduction && isHttps && !isReplit, // Disable secure for Replit dev
			sameSite: isReplit ? "None" : isProduction ? "Strict" : "Lax", // Use None for Replit
			expires: 1, // 1 day default
		};

		const config = { ...defaults, ...options };

		// Convert maxAge to expires (days) for js-cookie
		if (config.maxAge) {
			config.expires = config.maxAge / (24 * 60 * 60); // Convert seconds to days
			delete config.maxAge;
		}

		// For Replit development, use minimal restrictions
		if (isReplit && !isProduction) {
			delete config.secure;
			delete config.sameSite;
		}

		Cookies.set(name, value, config);
		console.log(`Cookie '${name}' set successfully with config:`, config);
		console.log(`All cookies after setting:`, document.cookie);

		// Verify cookie was set
		const verification = Cookies.get(name);
		console.log(`Cookie verification - found:`, verification ? "YES" : "NO");
	} catch (e) {
		console.error("Failed to set secure cookie:", e);
	}
};

const getCookie = (name) => {
	try {
		const value = Cookies.get(name);
		return value || null;
	} catch (e) {
		console.error("Failed to get cookie:", e);
		return null;
	}
};

const deleteCookie = (name, options = {}) => {
	try {
		const isProduction = process.env.NODE_ENV === "production";
		const isHttps = window.location.protocol === "https:";
		const isReplit =
			window.location.hostname.includes("replit") ||
			window.location.hostname.includes("repl.co");

		const config = {
			path: "/",
			secure: isProduction && isHttps && !isReplit, // Disable secure for Replit dev
			sameSite: isReplit ? "None" : isProduction ? "Strict" : "Lax", // Use None for Replit
			...options,
		};

		// For Replit development, use minimal restrictions
		if (isReplit && !isProduction) {
			delete config.secure;
			delete config.sameSite;
		}

		Cookies.remove(name, config);
		console.log(`Cookie '${name}' removed successfully`);
	} catch (e) {
		console.error("Failed to delete cookie:", e);
	}
};

const getAuthToken = () => {
	try {
		const isProduction = process.env.NODE_ENV === "production";
		const isReplit =
			window.location.hostname.includes("replit") ||
			window.location.hostname.includes("repl.co");

		// In Replit development, prioritize sessionStorage
		if (isReplit && !isProduction) {
			const sessionToken = sessionStorage.getItem("authToken");
			if (sessionToken) {
				console.log("Auth token found in sessionStorage (Replit dev)");
				return sessionToken;
			}
		} else {
			// In production, try secure cookie first
			const cookieToken = getCookie("authToken");
			if (cookieToken) {
				console.log("Auth token found in secure cookie");
				return cookieToken;
			}
		}

		// Fallback to any available storage
		const sessionToken = sessionStorage.getItem("authToken");
		const localToken = localStorage.getItem("authToken");
		const storageToken = sessionToken || localToken;

		if (storageToken) {
			console.log("Auth token found in fallback storage");
			return storageToken;
		}

		console.warn("No auth token found in any storage");
		return null;
	} catch (e) {
		console.error("Failed to get auth token:", e);
		return null;
	}
};

const setAuthToken = (token, rememberMe = false) => {
	try {
		const isProduction = process.env.NODE_ENV === "production";
		const isReplit =
			window.location.hostname.includes("replit") ||
			window.location.hostname.includes("repl.co");

		console.log("Setting auth token - environment:", {
			isProduction,
			isReplit,
		});

		// For Replit development, use sessionStorage as primary
		if (isReplit && !isProduction) {
			sessionStorage.setItem("authToken", token);
			console.log("Auth token stored in sessionStorage (Replit development)");
			return;
		}

		// Try to set secure cookie for production
		const expires = rememberMe ? 30 : 1; // 30 days or 1 day
		const cookieOptions = {
			expires,
			secure: isProduction,
			sameSite: isProduction ? "Strict" : "Lax",
		};

		setCookie("authToken", token, cookieOptions);

		// Verify cookie was set, if not use sessionStorage as fallback
		setTimeout(() => {
			const verification = getCookie("authToken");
			if (!verification) {
				console.warn("Cookie storage failed, using sessionStorage as fallback");
				sessionStorage.setItem("authToken", token);
				console.log("Auth token stored in sessionStorage (cookie fallback)");
			} else {
				console.log("Auth token stored in secure cookie successfully");
				// Clean up any existing storage tokens only if cookie worked
				sessionStorage.removeItem("authToken");
				localStorage.removeItem("authToken");
			}
		}, 100);
	} catch (e) {
		console.error("Failed to store auth token:", e);
		// Always fallback to sessionStorage
		try {
			sessionStorage.setItem("authToken", token);
			console.log("Fallback: Auth token stored in sessionStorage");
		} catch (storageError) {
			console.error("All storage methods failed:", storageError);
		}
	}
};

const removeAuthToken = () => {
	try {
		const isProduction = process.env.NODE_ENV === "production";
		const isHttps = window.location.protocol === "https:";
		const isReplit =
			window.location.hostname.includes("replit") ||
			window.location.hostname.includes("repl.co");

		// Remove secure cookie with proper options
		const deleteOptions = {
			path: "/",
			secure: isProduction && isHttps && !isReplit, // Disable secure for Replit dev
			sameSite: isReplit ? "None" : isProduction ? "Strict" : "Lax", // Use None for Replit
		};

		// For Replit development, use minimal restrictions
		if (isReplit && !isProduction) {
			delete deleteOptions.secure;
			delete deleteOptions.sameSite;
		}

		deleteCookie("authToken", deleteOptions);

		// Clean up storage as well (for backward compatibility)
		sessionStorage.removeItem("authToken");
		localStorage.removeItem("authToken");

		console.log("Auth token removed from all storage");
	} catch (e) {
		console.error("Failed to remove auth token:", e);
	}
};

// Input validation helpers
const validateEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email) && email.length <= 254;
};

const validatePassword = (password) => {
	return (
		typeof password === "string" &&
		password.length >= 8 &&
		password.length <= 128
	);
};

const sanitizeInput = (input) => {
	if (typeof input !== "string") return input;
	return input.trim().replace(/[<>]/g, "");
};

const authAPI = {
	login: async (email, password) => {
		if (!validateEmail(email)) {
			throw new Error("Invalid email format");
		}
		if (!validatePassword(password)) {
			throw new Error("Invalid password");
		}

		const response = await apiRequest("/auth/login", {
			method: "POST",
			body: {
				email: sanitizeInput(email),
				password: password, // Don't sanitize password to preserve special chars
			},
		});

		if (response.token) {
			setAuthToken(response.token);
		}

		return response;
	},

	register: (userData) => {
		// Validate required fields
		if (!validateEmail(userData.email)) {
			throw new Error("Invalid email format");
		}
		if (!validatePassword(userData.password)) {
			throw new Error("Password must be 8-128 characters");
		}
		if (
			!userData.username ||
			userData.username.length < 3 ||
			userData.username.length > 30
		) {
			throw new Error("Username must be 3-30 characters");
		}

		// Sanitize user inputs
		const sanitizedData = {
			...userData,
			email: sanitizeInput(userData.email),
			username: sanitizeInput(userData.username),
			name: sanitizeInput(userData.name),
		};

		return apiRequest("/auth/register", {
			method: "POST",
			body: sanitizedData,
		});
	},

	verifyEmail: (email, code, verificationId) => {
		if (!validateEmail(email)) {
			throw new Error("Invalid email format");
		}
		if (!code || code.length !== 6) {
			throw new Error("Invalid verification code");
		}

		return apiRequest("/auth/verify-email", {
			method: "POST",
			body: {
				email: sanitizeInput(email),
				code: sanitizeInput(code),
				verificationId: sanitizeInput(verificationId),
			},
		});
	},

	resendVerification: (email) =>
		apiRequest("/auth/resend-code", {
			method: "POST",
			body: { email },
		}),

	validateVerificationId: (verificationId) => {
		if (!verificationId || typeof verificationId !== "string") {
			throw new Error("Invalid verification ID");
		}

		return apiRequest(
			`/auth/validate-verification-id/${encodeURIComponent(verificationId)}`,
			{
				method: "GET",
			},
		);
	},

	getCurrentUser: () =>
		apiRequest("/auth/me", {
			method: "GET",
		}),

	logout: () => {
		removeAuthToken();
		return Promise.resolve();
	},

	googleLogin: async (idToken) => {
		if (!idToken || typeof idToken !== "string") {
			throw new Error("Invalid Google ID token");
		}

		const response = await apiRequest("/auth/google", {
			method: "POST",
			body: { idToken },
		});

		if (response.token) {
			setAuthToken(response.token);
		}

		return response;
	},
};

const userAPI = {
	getUsers: () =>
		apiRequest("/users", {
			method: "GET",
		}),

	getUser: (username) =>
		apiRequest(`/users/${username}`, {
			method: "GET",
		}),

	updateUser: (username, userData) =>
		apiRequest(`/users/${username}`, {
			method: "PUT",
			body: userData,
		}),

	followUser: async (username) => {
		const response = await apiClient.post(`/users/${username}/follow`);
		return response; // Returns { message: "...", following: true/false }
	},

	getFollowers: (username) =>
		apiRequest(`/users/${username}/followers`, {
			method: "GET",
		}),

	getFollowing: (username) =>
		apiRequest(`/users/${username}/following`, {
			method: "GET",
		}),

	searchUsers: (searchQuery) => {
		if (
			!searchQuery ||
			typeof searchQuery !== "string" ||
			searchQuery.length < 1
		) {
			throw new Error("Invalid search query");
		}
		const sanitizedQuery = sanitizeInput(searchQuery).substring(0, 100); // Limit length
		return apiRequest(`/users?search=${encodeURIComponent(sanitizedQuery)}`, {
			method: "GET",
		});
	},

	getUserEarnings: async () =>
		apiRequest("/users/analytics/earnings", {
			method: "GET",
		}),
};

const postAPI = {
	getPosts: (params = {}) => {
		const searchParams = new URLSearchParams();
		Object.keys(params).forEach((key) => {
			if (params[key] !== undefined && params[key] !== null) {
				searchParams.append(key, params[key]);
			}
		});
		const queryString = searchParams.toString();
		return apiRequest(`/posts${queryString ? `?${queryString}` : ""}`, {
			method: "GET",
		});
	},

	getPost: (postId) =>
		apiRequest(`/posts/${postId}`, {
			method: "GET",
		}),

	createPost: (data) => {
		// Validate required fields for live stream posts
		if (data.postType === "live_video") {
			if (!data.liveVideoUrl) {
				throw new Error("Live video URL is required for live stream posts");
			}
			if (!data.streamTitle) {
				throw new Error("Stream title is required for live stream posts");
			}
		}

		// Sanitize content if present
		if (data.content) {
			data.content = sanitizeInput(data.content);
		}
		if (data.streamTitle) {
			data.streamTitle = sanitizeInput(data.streamTitle);
		}

		return apiRequest("/posts", {
			method: "POST",
			body: data,
		});
	},
	updatePost: (id, data) =>
		apiRequest(`/posts/${id}`, {
			method: "PUT",
			body: data,
		}),
	deletePost: (id) =>
		apiRequest(`/posts/${id}`, {
			method: "DELETE",
		}),
	likePost: (id) =>
		apiRequest(`/posts/${id}/like`, {
			method: "POST",
		}),
	sharePost: (id) =>
		apiRequest(`/posts/share/${id}`, {
			method: "POST",
		}),

	trackView: (id) =>
		apiRequest(`/posts/${id}/view`, {
			method: "POST",
		}),

	deletePostWithImages: async (postId) => {
		try {
			await apiClient.delete(`/posts/${postId}/with-images`);
			return { success: true };
		} catch (error) {
			throw error;
		}
	},

	getUserPosts: (userId, params = {}) => {
		const searchParams = new URLSearchParams();
		Object.keys(params).forEach((key) => {
			if (params[key] !== undefined && params[key] !== null) {
				searchParams.append(key, params[key]);
			}
		});
		const queryString = searchParams.toString();
		return apiRequest(`/posts${queryString ? `?${queryString}` : ""}`, {
			method: "GET",
		});
	},

	getFollowingFeed: (params = {}) => {
		const searchParams = new URLSearchParams();
		Object.keys(params).forEach((key) => {
			if (params[key] !== undefined && params[key] !== null) {
				searchParams.append(key, params[key]);
			}
		});
		const queryString = searchParams.toString();
		return apiRequest(
			`/posts/feed/following${queryString ? `?${queryString}` : ""}`,
			{
				method: "GET",
			},
		);
	},

	searchPosts: (query, params = {}) => {
		const searchParams = new URLSearchParams();
		searchParams.append("q", query);
		Object.keys(params).forEach((key) => {
			if (params[key] !== undefined && params[key] !== null) {
				searchParams.append(key, params[key]);
			}
		});
		const queryString = searchParams.toString();
		return apiRequest(`/posts/search?${queryString}`, {
			method: "GET",
		});
	},

	getPostsByHashtag: (params = {}) => {
		const searchParams = new URLSearchParams();
		Object.keys(params).forEach((key) => {
			if (params[key] !== undefined && params[key] !== null) {
				searchParams.append(key, params[key]);
			}
		});
		const queryString = searchParams.toString();
		return apiRequest(`/posts/hashtag${queryString ? `?${queryString}` : ""}`, {
			method: "GET",
		});
	},

	getCurrentUserPosts: () =>
		apiRequest("/posts/user/me", {
			method: "GET",
		}),
};

// Helper function to get auth headers
const getAuthHeaders = async () => {
	const token = getAuthToken();
	const headers = {
		"Content-Type": "application/json",
	};
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}
	return headers;
};

// Helper function to handle API responses
const handleApiResponse = async (response) => {
	return response; // Axios interceptor already handles error responses
};

const commentAPI = {
	getComments: async (postId) => {
		try {
			if (!postId) {
				throw new Error("Post ID is required");
			}
			console.log("Fetching comments for post:", postId);
			const response = await apiClient.get(`/comments/post/${postId}`);

			console.log("Comments response for post", postId, ":", response);
			return response;
		} catch (error) {
			console.error("Failed to get comments for post", postId, ":", error);
			return { comments: [] }; // Return empty array on error
		}
	},

	createComment: async (postId, content) => {
		try {
			if (!postId || !content) {
				throw new Error("Post ID and content are required");
			}
			const response = await apiClient.post(`/comments/post/${postId}`, {
				content,
			});
			return response;
		} catch (error) {
			console.error("Failed to create comment:", error);
			throw error;
		}
	},

	deleteComment: async (commentId) => {
		try {
			if (!commentId) {
				throw new Error("Comment ID is required");
			}
			const response = await apiClient.delete(`/comments/${commentId}`);
			return response;
		} catch (error) {
			console.error("Failed to delete comment:", error);
			throw error;
		}
	},

	searchComments: async (query, limit = 20, cursor = null) => {
		try {
			if (!query) {
				throw new Error("Search query is required");
			}
			const params = new URLSearchParams({
				q: query,
				limit: limit.toString(),
			});

			if (cursor) {
				params.append("cursor", cursor);
			}

			const response = await apiClient.get(`/comments/search?${params}`);
			return response;
		} catch (error) {
			console.error("Failed to search comments:", error);
			return { comments: [], cursor: null }; // Return empty result on error
		}
	},
};

export {
	authAPI,
	postAPI,
	userAPI,
	commentAPI,
	setAuthToken,
	removeAuthToken,
	getAuthToken,
	validateEmail,
	sanitizeInput,
	testApiConnection,
};

export default apiRequest;
