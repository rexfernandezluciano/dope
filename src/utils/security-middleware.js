import {
	sanitizeHTML,
	generateCSRFToken,
	ValidationPatterns,
} from "./security-utils";

/**
 * Security middleware for API requests
 */
export class SecurityMiddleware {
	static async secureApiRequest(url, options = {}) {
		try {
			// Start with basic headers
			const secureHeaders = options.headers || {};

			// Add CSRF token for state-changing requests
			if (
				["POST", "PUT", "DELETE", "PATCH"].includes(
					options.method?.toUpperCase(),
				)
			) {
				secureHeaders["X-CSRF-Token"] = generateCSRFToken();
			}

			// Add authentication headers
			const token =
				sessionStorage.getItem("authToken") ||
				localStorage.getItem("authToken");
			if (token) {
				secureHeaders["Authorization"] = `Bearer ${token}`;
			}

			return {
				...options,
				headers: {
					"Content-Type": "application/json",
					"X-Requested-With": "XMLHttpRequest", // CSRF protection
					...secureHeaders,
				},
			};
		} catch (error) {
			console.error("Security middleware error:", error);
			throw new Error("Request blocked by security policy");
		}
	}

	static getUserId() {
		try {
			const token =
				sessionStorage.getItem("authToken") ||
				localStorage.getItem("authToken");
			if (!token) return null;

			const payload = JSON.parse(atob(token.split(".")[1]));
			return payload.sub || payload.userId;
		} catch {
			return null;
		}
	}

	static validateInput(input, type) {
		if (!input || typeof input !== "string") {
			throw new Error("Invalid input");
		}

		switch (type) {
			case "email":
				if (!ValidationPatterns.EMAIL.test(input)) {
					throw new Error("Invalid email format");
				}
				break;
			case "username":
				if (!ValidationPatterns.USERNAME.test(input)) {
					throw new Error("Invalid username format");
				}
				break;
			case "password":
				if (!ValidationPatterns.PASSWORD.test(input)) {
					throw new Error("Password must be 8-128 characters");
				}
				break;
			case "url":
				if (!ValidationPatterns.URL.test(input)) {
					throw new Error("Invalid URL format");
				}
				break;
			default:
				// No validation needed for unknown types
				break;
		}

		return sanitizeHTML(input);
	}

	static sanitizeUserContent(content) {
		if (!content) return "";
		return sanitizeHTML(content);
	}
}
