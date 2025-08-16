
/** @format */

import { useEffect, useState } from "react";
import { Spinner, Container } from "react-bootstrap";

import { getUser } from "../../utils/app-utils";
import StartPage from "../../pages/StartPage";

const RequireAuth = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const token = localStorage.getItem('authToken');
				if (!token) {
					setUser(null);
					setLoading(false);
					return;
				}

				const currentUser = await getUser();
				setUser(currentUser);
			} catch (error) {
				console.error('Auth check failed:', error);
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

	if (!user) {
		return <StartPage />;
	}

	return children;
};

export default RequireAuth;
