
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
				const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
				if (!token || typeof token !== 'string' || token.length < 10) {
					setUser(null);
					setLoading(false);
					return;
				}

				// Validate token format (basic JWT structure check)
				const tokenParts = token.split('.');
				if (tokenParts.length !== 3) {
					localStorage.removeItem('authToken');
					sessionStorage.removeItem('authToken');
					setUser(null);
					setLoading(false);
					return;
				}

				const currentUser = await getUser();
				setUser(currentUser);
			} catch (error) {
				console.error('Auth check failed');
				// Clear potentially invalid token
				localStorage.removeItem('authToken');
				sessionStorage.removeItem('authToken');
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
