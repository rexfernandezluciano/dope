/** @format */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";

import WaitingListPage from "./WaitingListPage";
import { getUser } from "../utils/app-utils";

const StartPage = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const user = await getUser();
				if (user) {
					navigate("/home", { replace: true });
					return;
				}
			} catch (error) {
				console.error('Auth check failed:', error);
			} finally {
				setLoading(false);
			}
		};

		checkAuth();
	}, [navigate]);

	if (loading) {
		return (
			<Container className="d-flex justify-content-center align-items-center vh-100">
				<Spinner animation="border" variant="primary" />
			</Container>
		);
	}

	return <WaitingListPage />;
};

export default StartPage;
