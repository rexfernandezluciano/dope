
/** @format */

import { useEffect, useState } from "react";
import { Spinner, Container } from "react-bootstrap";

import { getUser } from "../../utils/app-utils";

const RequireAuth = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				// Import token utilities from app-utils
				const { getAuthToken, removeAuthToken } = await import('../../utils/app-utils');
				
				const token = getAuthToken();
				if (!token || typeof token !== 'string' || token.length < 10) {
					setUser(null);
					setLoading(false);
					return;
				}

				// Validate token format (basic JWT structure check)
				const tokenParts = token.split('.');
				if (tokenParts.length !== 3) {
					removeAuthToken();
					setUser(null);
					setLoading(false);
					return;
				}

				const currentUser = await getUser();
				setUser(currentUser);
			} catch (error) {
				console.error('Auth check failed');
				// Clear potentially invalid token using secure method
				const { removeAuthToken } = await import('../../utils/app-utils');
				removeAuthToken();
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
		window.location.href = '/';
		return null;
	}

	return children;
};

export default RequireAuth;
