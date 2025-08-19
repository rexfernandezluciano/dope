/** @format */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Card, Image } from "react-bootstrap";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import socialNetIllustration from "../assets/img/social-net-illustration.svg";

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
						<Card.Body className="text-center p-5">
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
							<p className="text-success mb-4">
								<strong>Open to Everyone!</strong> Join our growing community today.
							</p>
							<div className="d-grid gap-2 d-md-flex justify-content-md-center">
								<Button
									variant="primary"
									size="lg"
									onClick={() => navigate('/auth/signup')}
									className="me-md-2 px-4 py-2"
								>
									Create Account
								</Button>
								<Button
									variant="outline-primary"
									size="lg"
									onClick={() => navigate('/auth/login')}
									className="px-4 py-2"
								>
									Sign In
								</Button>
							</div>
							<p className="text-muted mt-3 small">
								Registration is free and open to all users
							</p>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default StartPage;