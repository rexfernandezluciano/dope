/** @format */

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../config/FirebaseConfig";
import StartPage from "../../pages/StartPage";

const RequireAuth = ({ children }) => {
	const location = useLocation();
	const [user, setUser] = useState(null);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, currentUser => {
			setUser(currentUser);
		});
		return unsubscribe;
	}, []);

	if (!user) {
		return <StartPage />;
	}

	return children;
};

export default RequireAuth;
