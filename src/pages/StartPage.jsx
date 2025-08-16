/** @format */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Button, Image, Container } from "react-bootstrap";

import IntroductionBanner from "../components/banners/IntroductionBanner";
import socialNetIllustration from "../assets/images/undraw_social-networking_v4z1.svg";

const StartPage = () => {
	const navigate = useNavigate();

	return (
		<Container fluid="md">
			<Row className="vh-100 py-4 align-items-center justify-content-center">
				<Col
					md={8}
					lg={6}
					className="text-center text-md-start">
					<IntroductionBanner />
				</Col>
				<Col
					md={8}
					lg={6}
					className="text-center">
					<Image
						src={socialNetIllustration}
						alt="Social Networking Illustration"
						fluid
						className="mb-4"
					/>
					<div className="d-grid gap-2">
						<Button
							variant="primary"
							size="md"
							className="shadow-none"
							onClick={() => navigate("/auth/login")}>
							Get Started
						</Button>
					</div>
				</Col>
			</Row>
		</Container>
	);
};

export default StartPage;
