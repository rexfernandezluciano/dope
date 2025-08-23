
/** @format */

import { useState } from "react";
import { Row, Col, Form, Button, Alert, Spinner, Image } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ArrowLeft, EnvelopeFill } from "react-bootstrap-icons";
import { authAPI } from "../../config/ApiConfig";
import { validateEmail } from "../../config/ApiConfig";
import { updatePageMeta } from "../../utils/meta-utils";
import IntroductionBanner from "../../components/banners/IntroductionBanner";
import socialNetIllustration from "../../assets/images/undraw_social-networking_v4z1.svg";

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
			<div className="d-flex align-items-center justify-content-center py-4 px-md-4 min-vh-100">
				<Row className="w-100 gap-2">
					<Col className="d-none d-md-block">
						<IntroductionBanner />
						<Image
							src={socialNetIllustration}
							alt="Social Networking Illustration"
							fluid
							height={100}
							className="mt-3"
						/>
					</Col>
					<Col>
						<div className="text-center">
							<EnvelopeFill size={48} className="text-success mb-3" />
							<h3 className="mb-3">Check Your Email</h3>
							
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
					</Col>
				</Row>
			</div>
		);
	}

	return (
		<div className="d-flex align-items-center justify-content-center py-4 px-md-4 min-vh-100">
			<Row className="w-100 gap-2">
				<Col className="d-none d-md-block">
					<IntroductionBanner />
					<Image
						src={socialNetIllustration}
						alt="Social Networking Illustration"
						fluid
						height={100}
						className="mt-3"
					/>
				</Col>
				<Col>
					<div>
						<h3 className="text-center mb-3">Forgot Password</h3>
						<p className="text-center text-muted">Enter your email to reset your password</p>

						{error && (
							<Alert variant="danger" dismissible onClose={() => setError("")}>
								{error}
							</Alert>
						)}

						<Form onSubmit={handleSubmit}>
							<Form.Floating className="mb-3">
								<Form.Control
									id="floatingInputEmail"
									type="email"
									placeholder="Enter your email address"
									value={email}
									onChange={handleEmailChange}
									isInvalid={!!validationErrors.email}
									disabled={loading}
									className="shadow-none"
									autoFocus
									required
								/>
								<label htmlFor="floatingInputEmail">Email address</label>
								<Form.Control.Feedback type="invalid">
									{validationErrors.email}
								</Form.Control.Feedback>
							</Form.Floating>

							<Form.Text className="text-muted d-block mb-3">
								We'll send password reset instructions to this email address.
							</Form.Text>

							<div className="d-grid mb-3">
								<Button 
									type="submit" 
									variant="primary" 
									size="md"
									disabled={loading || !email.trim()}
									className="shadow-none d-flex align-items-center justify-content-center"
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

						<div className="text-center">
							<p className="text-muted mb-2">
								Remember your password?{" "}
								<Link to="/auth/login" className="text-decoration-none">
									Back to Login
								</Link>
							</p>
							<p className="text-muted mb-0">
								Don't have an account?{" "}
								<Link to="/auth/signup" className="text-decoration-none">
									Sign up here
								</Link>
							</p>
						</div>
					</div>
				</Col>
			</Row>
		</div>
	);
};

export default ForgotPasswordPage;
