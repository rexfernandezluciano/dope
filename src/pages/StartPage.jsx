/** @format */

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
import { Container, Row, Col, Button, Card, Image } from "react-bootstrap";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import HomePage from "./HomePage";
import NavigationView from "../components/navs/NavigationView";
import socialNetIllustration from "../assets/images/undraw_social-networking_v4z1.svg";

const StartPage = () => {
	const navigate = useNavigate();
	const { user, error } = useLoaderData();

	useEffect(() => {
		updatePageMeta(pageMetaData.home);
	}, []);

	if (error) {
		return (
			<Container className="min-vh-100 d-flex align-items-center justify-content-center">
				<div className="w-100">
					<h1 className="display-4 fw-bold mb-3">Something went wrong</h1>
					<p className="fw-light mb-3">{error}</p>
				</div>
			</Container>
		);
	}

	if (user) {
		return (
			<NavigationView>
				<HomePage />
			</NavigationView>
		);
	}

	return (
		<Container
			fluid
			className="min-vh-100 p-0 d-flex align-items-center justify-content-center bg-white"
		>
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
									onClick={() => navigate("/auth/signup")}
									className="me-md-2 px-4 py-2"
								>
									Create Account
								</Button>
								<Button
									variant="outline-primary"
									size="md"
									onClick={() => navigate("/auth/login")}
									className="px-4 py-2"
								>
									Sign In
								</Button>
							</div>

							{/* Privacy Policy and Terms of Service Links */}
							<div className="text-center mt-4 pt-3 border-top">
								<small className="text-muted">
									By continuing, you agree to our{" "}
									<a
										href="/policies/terms"
										className="text-primary text-decoration-none"
										onClick={(e) => {
											e.preventDefault();
											navigate("/policies/terms");
										}}
									>
										Terms of Service
									</a>{" "}
									and{" "}
									<a
										href="/policies/privacy"
										className="text-primary text-decoration-none"
										onClick={(e) => {
											e.preventDefault();
											navigate("/policies/privacy");
										}}
									>
										Privacy Policy
									</a>
								</small>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default StartPage;
