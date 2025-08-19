
/** @format */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";

const StartPage = () => {
	const navigate = useNavigate();

	React.useEffect(() => {
		updatePageMeta(pageMetaData.home);
	}, []);

	const handleGetStarted = () => {
		navigate("/home");
	};

	return (
		<Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
			<Row className="w-100 justify-content-center">
				<Col xs={12} md={8} lg={6} xl={4}>
					<Card className="shadow-lg border-0">
						<Card.Body className="p-5 text-center">
							<div className="mb-4">
								<img 
									src="/logo192.png" 
									alt="DOPE Network" 
									width="80" 
									height="80"
									className="mb-3"
								/>
								<h1 className="h2 fw-bold text-primary mb-3">
									Welcome to DOPE Network
								</h1>
								<p className="text-muted lead mb-4">
									Connect, share, and discover amazing content with our community. 
									Start your journey today!
								</p>
							</div>

							<div className="d-grid gap-3">
								<Button 
									variant="primary" 
									size="lg" 
									className="fw-bold py-3"
									onClick={handleGetStarted}
								>
									Get Started
								</Button>
								
								<div className="text-center">
									<small className="text-muted">
										Join thousands of users sharing their stories
									</small>
								</div>
							</div>

							<div className="mt-4 pt-4 border-top">
								<Row className="text-center">
									<Col xs={4}>
										<div className="fw-bold text-primary">1M+</div>
										<small className="text-muted">Posts</small>
									</Col>
									<Col xs={4}>
										<div className="fw-bold text-primary">50K+</div>
										<small className="text-muted">Users</small>
									</Col>
									<Col xs={4}>
										<div className="fw-bold text-primary">24/7</div>
										<small className="text-muted">Active</small>
									</Col>
								</Row>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default StartPage;
