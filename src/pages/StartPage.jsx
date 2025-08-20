/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Card, Image, Spinner } from "react-bootstrap";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import { getUser } from "../utils/auth-utils";
import socialNetIllustration from "../assets/images/undraw_social-networking_v4z1.svg";

const StartPage = () => {
	const navigate = useNavigate();
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);

	useEffect(() => {
		updatePageMeta(pageMetaData.home);
		
		const checkAuthentication = async () => {
			try {
				const user = await getUser();
				if (user) {
					// User is already authenticated, redirect to homepage
					navigate('/home');
					return;
				}
			} catch (error) {
				console.error('Error checking authentication:', error);
			} finally {
				setIsCheckingAuth(false);
			}
		};

		checkAuthentication();
	}, [navigate]);

	// Show loading spinner while checking authentication
	if (isCheckingAuth) {
		return (
			<Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
				<div className="text-center">
					<Spinner animation="border" variant="primary" />
					<p className="mt-2 text-muted">Loading...</p>
				</div>
			</Container>
		);
	}

	return (
		<Container fluid className="min-vh-100 p-0 d-flex align-items-center justify-content-center bg-white">
			<Row className="w-100 justify-content-center">
				<Col xs={12} md={8} lg={6} xl={4}>
					<Card className="shadow-none border-0">
						<Card.Body className="text-center">
							<Image
								src={socialNetIllustration}
								alt="Social Network"
								style={{ maxWidth: "300px", height: "auto" }}
								className="mb-4"
							/>
							<h1 className="display-4 fw-bold text-primary mb-3">
								Welcome to DOPE Network
							</h1>
							<p className="lead text-muted mb-4">
								Connect, share, and discover amazing content with our community
							</p>
							<div className="d-grid gap-2 d-md-flex justify-content-md-center">
								<Button
									variant="primary"
									size="md"
									onClick={() => navigate('/auth/signup')}
									className="me-md-2 px-4 py-2"
								>
									Create Account
								</Button>
								<Button
									variant="outline-primary"
									size="md"
									onClick={() => navigate('/auth/login')}
									className="px-4 py-2"
								>
									Sign In
								</Button>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default StartPage;