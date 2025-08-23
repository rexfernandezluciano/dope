
/** @format */

import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ArrowLeft, EnvelopeFill } from "react-bootstrap-icons";
import { authAPI } from "../../config/ApiConfig";
import { validateEmail } from "../../config/ApiConfig";
import { updatePageMeta } from "../../utils/meta-utils";

const ForgotPasswordPage = () => {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [validationErrors, setValidationErrors] = useState({});

	// Update page metadata
	useState(() => {
		updatePageMeta({
			title: "Forgot Password - DOPE Network",
			description: "Reset your DOPE Network password. Enter your email address to receive password reset instructions.",
			keywords: "forgot password, password reset, DOPE Network, recover account",
		});
	}, []);

	const validateForm = () => {
		const errors = {};

		if (!email.trim()) {
			errors.email = "Email is required";
		} else if (!validateEmail(email)) {
			errors.email = "Please enter a valid email address";
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		setLoading(true);
		setError("");

		try {
			await authAPI.forgotPassword(email.trim().toLowerCase());
			setSuccess(true);
		} catch (err) {
			console.error("Forgot password error:", err);
			
			// Handle specific error cases
			if (err.status === 404) {
				setError("No account found with this email address.");
			} else if (err.status === 429) {
				setError("Too many password reset requests. Please try again later.");
			} else if (err.status === 400) {
				setError(err.message || "Invalid email address provided.");
			} else {
				setError(err.message || "Failed to send password reset email. Please try again.");
			}
		} finally {
			setLoading(false);
		}
	};

	const handleEmailChange = (e) => {
		const value = e.target.value;
		setEmail(value);
		
		// Clear validation error when user starts typing
		if (validationErrors.email && value.trim()) {
			setValidationErrors(prev => ({ ...prev, email: "" }));
		}
	};

	if (success) {
		return (
			<Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
				<Row className="w-100 justify-content-center">
					<Col xs={12} sm={8} md={6} lg={4}>
						<Card className="shadow-sm border-0">
							<Card.Header className="bg-success text-white text-center py-3">
								<EnvelopeFill size={32} className="mb-2" />
								<h4 className="mb-0">Check Your Email</h4>
							</Card.Header>
							<Card.Body className="p-4">
								<div className="text-center">
									<Alert variant="success" className="mb-3">
										<strong>Password reset email sent!</strong>
									</Alert>
									<p className="text-muted mb-4">
										We've sent password reset instructions to <strong>{email}</strong>. 
										Please check your email and follow the link to reset your password.
									</p>
									<p className="text-muted small mb-4">
										Don't see the email? Check your spam folder or try again with a different email address.
									</p>
									<div className="d-grid gap-2">
										<Link to="/auth/login" className="btn btn-primary">
											<ArrowLeft className="me-2" />
											Back to Login
										</Link>
										<Button 
											variant="outline-secondary" 
											onClick={() => {
												setSuccess(false);
												setEmail("");
												setError("");
											}}
										>
											Send Another Email
										</Button>
									</div>
								</div>
							</Card.Body>
						</Card>
					</Col>
				</Row>
			</Container>
		);
	}

	return (
		<Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
			<Row className="w-100 justify-content-center">
				<Col xs={12} sm={8} md={6} lg={4}>
					<Card className="shadow-sm border-0">
						<Card.Header className="bg-primary text-white text-center py-3">
							<EnvelopeFill size={32} className="mb-2" />
							<h4 className="mb-0">Forgot Password</h4>
							<p className="mb-0 small opacity-75">
								Enter your email to reset your password
							</p>
						</Card.Header>
						<Card.Body className="p-4">
							{error && (
								<Alert variant="danger" className="mb-3">
									{error}
								</Alert>
							)}

							<Form onSubmit={handleSubmit}>
								<Form.Group className="mb-3">
									<Form.Label>Email Address</Form.Label>
									<Form.Control
										type="email"
										placeholder="Enter your email address"
										value={email}
										onChange={handleEmailChange}
										isInvalid={!!validationErrors.email}
										disabled={loading}
										autoFocus
									/>
									<Form.Control.Feedback type="invalid">
										{validationErrors.email}
									</Form.Control.Feedback>
									<Form.Text className="text-muted">
										We'll send password reset instructions to this email address.
									</Form.Text>
								</Form.Group>

								<div className="d-grid gap-2">
									<Button 
										type="submit" 
										variant="primary" 
										disabled={loading || !email.trim()}
									>
										{loading ? (
											<>
												<Spinner
													as="span"
													animation="border"
													size="sm"
													role="status"
													aria-hidden="true"
													className="me-2"
												/>
												Sending Reset Email...
											</>
										) : (
											<>
												<EnvelopeFill className="me-2" />
												Send Reset Email
											</>
										)}
									</Button>
								</div>
							</Form>

							<hr className="my-4" />

							<div className="text-center">
								<p className="text-muted mb-2">Remember your password?</p>
								<Link to="/auth/login" className="btn btn-outline-secondary">
									<ArrowLeft className="me-2" />
									Back to Login
								</Link>
							</div>

							<div className="text-center mt-3">
								<p className="text-muted small mb-0">
									Don't have an account?{" "}
									<Link to="/auth/signup" className="text-decoration-none">
										Sign up here
									</Link>
								</p>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default ForgotPasswordPage;
