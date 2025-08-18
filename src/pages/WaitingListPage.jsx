
/** @format */

import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Alert, Card, Image } from "react-bootstrap";
import { CheckCircleFill, People, Globe, Clock } from "react-bootstrap-icons";

import IntroductionBanner from "../components/banners/IntroductionBanner";
import socialNetIllustration from "../assets/images/undraw_social-networking_v4z1.svg";

const WaitingListPage = () => {
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!email || !name) {
			setError("Please fill in all fields");
			return;
		}

		try {
			setLoading(true);
			setError("");
			
			// Here you would typically call an API to save the waiting list entry
			// For now, we'll simulate a successful submission
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			setSubmitted(true);
		} catch (err) {
			setError("Failed to join waiting list. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (submitted) {
		return (
			<Container className="min-vh-100 d-flex align-items-center justify-content-center py-4">
				<Row className="w-100 justify-content-center">
					<Col md={8} lg={6} className="text-center">
						<div className="mb-4">
							<CheckCircleFill size={64} className="text-success mb-3" />
							<h2 className="mb-3">You're on the list!</h2>
							<p className="text-muted mb-4">
								Thanks for your interest in DOPE Network! We'll notify you at <strong>{email}</strong> when we're ready to launch.
							</p>
							<div className="d-flex justify-content-center gap-4 mb-4">
								<div className="text-center">
									<People size={24} className="text-primary mb-2" />
									<div className="small text-muted">Growing Community</div>
								</div>
								<div className="text-center">
									<Globe size={24} className="text-primary mb-2" />
									<div className="small text-muted">Global Platform</div>
								</div>
								<div className="text-center">
									<Clock size={24} className="text-primary mb-2" />
									<div className="small text-muted">Coming Soon</div>
								</div>
							</div>
							<p className="small text-muted">
								Follow us on social media for updates and sneak peeks!
							</p>
						</div>
					</Col>
				</Row>
			</Container>
		);
	}

	return (
		<Container className="min-vh-100 d-flex align-items-center justify-content-center py-4">
			<Row className="w-100 justify-content-center align-items-center">
				<Col md={6} className="text-center text-md-start mb-4 mb-md-0">
					<IntroductionBanner />
					<div className="mb-4">
						<h3 className="mb-3">Join the Waiting List</h3>
						<p className="text-muted mb-4">
							DOPE Network is currently in private beta. Join our waiting list to be among the first to experience the future of social media when we launch publicly.
						</p>
						<div className="d-flex justify-content-center justify-content-md-start gap-4 mb-4">
							<div className="text-center">
								<People size={32} className="text-primary mb-2" />
								<div className="small">Connect</div>
							</div>
							<div className="text-center">
								<Globe size={32} className="text-primary mb-2" />
								<div className="small">Discover</div>
							</div>
							<div className="text-center">
								<CheckCircleFill size={32} className="text-success mb-2" />
								<div className="small">Engage</div>
							</div>
						</div>
					</div>
				</Col>
				
				<Col md={6}>
					<Card className="shadow-sm border-0">
						<Card.Body className="p-4">
							<div className="text-center mb-4">
								<Image
									src={socialNetIllustration}
									alt="Social Networking"
									fluid
									style={{ maxHeight: "200px" }}
									className="mb-3"
								/>
								<h4>Be the First to Know</h4>
								<p className="text-muted">
									Get notified when DOPE Network opens to the public
								</p>
							</div>

							{error && (
								<Alert variant="danger" className="mb-3">
									{error}
								</Alert>
							)}

							<Form onSubmit={handleSubmit}>
								<Form.Floating className="mb-3">
									<Form.Control
										id="floatingName"
										type="text"
										placeholder="Your name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										disabled={loading}
										className="shadow-none"
										required
									/>
									<label htmlFor="floatingName">Full Name</label>
								</Form.Floating>

								<Form.Floating className="mb-4">
									<Form.Control
										id="floatingEmail"
										type="email"
										placeholder="Your email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										disabled={loading}
										className="shadow-none"
										required
									/>
									<label htmlFor="floatingEmail">Email Address</label>
								</Form.Floating>

								<Button
									type="submit"
									variant="primary"
									size="lg"
									className="w-100"
									disabled={loading}
								>
									{loading ? "Joining..." : "Join Waiting List"}
								</Button>
							</Form>

							<div className="text-center mt-4">
								<small className="text-muted">
									We respect your privacy and will never share your email.
								</small>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default WaitingListPage;
