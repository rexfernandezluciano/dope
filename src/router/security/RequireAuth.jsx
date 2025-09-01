/** @format */

import { useEffect, useState } from "react";
import { Spinner, Container } from "react-bootstrap";

import { getUser } from "../../utils/app-utils";
import { getAuthToken, removeAuthToken } from "../../config/ApiConfig";

const RequireAuth = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const token = getAuthToken();
				if (!token || typeof token !== "string" || token.length < 10) {
					setUser(null);
					setLoading(false);
					return;
				}

				// Validate token format (basic JWT structure check)
				const tokenParts = token.split(".");
				if (tokenParts.length !== 3) {
					removeAuthToken();
					setUser(null);
					setLoading(false);
					return;
				}

				// Check if token is expired
				try {
					const payload = JSON.parse(atob(tokenParts[1]));
					const currentTime = Math.floor(Date.now() / 1000);
					if (payload.exp && payload.exp < currentTime) {
						console.log("Token expired, removing from storage");
						removeAuthToken();
						setUser(null);
						setLoading(false);
						return;
					}
				} catch (tokenParseError) {
					console.error("Invalid token format:", tokenParseError);
					removeAuthToken();
					setUser(null);
					setLoading(false);
					return;
				}

				const currentUser = await getUser();
				setUser(currentUser);
			} catch (error) {
				console.error("Auth check failed:", error);
				// Check if it's a token-related error
				if (error.message?.includes("Invalid or expired token") || 
					error.message?.includes("unauthorized") ||
					error.status === 401) {
					console.log("Removing invalid token");
					removeAuthToken();
				}
				setUser(null);
			} finally {
				setLoading(false);
			}
		};

		checkAuth();
	}, []);

	if (loading) {
		return (
			<Container className="d-flex justify-content-center align-items-center vh-100">
				<div className="text-center">
					<Spinner animation="border" variant="primary" />
					<p className="mt-2">Loading...</p>
				</div>
			</Container>
		);
	}

	// Require authentication to access protected routes
	if (!user) {
		// Redirect to start page for unauthenticated users
		window.location.href = "/";
		return null;
	}

	return children;
};

export default RequireAuth;
