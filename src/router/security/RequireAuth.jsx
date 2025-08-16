
/** @format */

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { getUser } from "../../utils/app-utils";
import StartPage from "../../pages/StartPage";

const RequireAuth = ({ children }) => {
	const location = useLocation();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			try {
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
		return <div>Loading...</div>; // You can replace this with a proper loading component
	}

	if (!user) {
		return <StartPage />;
	}

	return children;
};

export default RequireAuth;
