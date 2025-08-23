
/** @format */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ShieldLockFill, EyeFill, EyeSlashFill } from "react-bootstrap-icons";
import { authAPI } from "../../config/ApiConfig";
import { updatePageMeta } from "../../utils/meta-utils";

const ResetPasswordPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	
	const [formData, setFormData] = useState({
		newPassword: "",
		confirmPassword: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [validationErrors, setValidationErrors] = useState({});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [tokenValid, setTokenValid] = useState(null);

	const resetToken = searchParams.get("token");

	// Update page metadata
	useEffect(() => {
		updatePageMeta({
			title: "Reset Password - DOPE Network",
			description: "Set a new password for your DOPE Network account.",
			keywords: "reset password, new password, DOPE Network, account recovery",
		});
	}, []);

	// Validate reset token on component mount
	useEffect(() => {
		if (!resetToken) {
			setError("Invalid or missing reset token. Please request a new password reset link.");
			setTokenValid(false);
			return;
		}

		// Token is present, assume valid for now
		// The actual validation will happen when submitting
		setTokenValid(true);
	}, [resetToken]);

	const validateForm = () => {
		const errors = {};

		if (!formData.newPassword.trim()) {
			errors.newPassword = "Password is required";
		} else if (formData.newPassword.length < 8) {
			errors.newPassword = "Password must be at least 8 characters long";
		} else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
			errors.newPassword = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
		}

		if (!formData.confirmPassword.trim()) {
			errors.confirmPassword = "Please confirm your password";
		} else if (formData.newPassword !== formData.confirmPassword) {
			errors.confirmPassword = "Passwords do not match";
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!validateForm() || !resetToken) {
			return;
		}

		setLoading(true);
		setError("");

		try {
			await authAPI.resetPassword(resetToken, formData.newPassword);
			setSuccess(true);
			
			// Redirect to login after a short delay
			setTimeout(() => {
				navigate("/auth/login", { 
					state: { 
						message: "Password reset successful! Please log in with your new password." 
					}
				});
			}, 3000);
		} catch (err) {
			console.error("Reset password error:", err);
			
			// Handle specific error cases
			if (err.status === 400) {
				setError("Invalid or expired reset token. Please request a new password reset link.");
			} else if (err.status === 422) {
				setError(err.message || "Password requirements not met.");
			} else if (err.status === 429) {
				setError("Too many attempts. Please try again later.");
			} else {
				setError(err.message || "Failed to reset password. Please try again.");
			}
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (field, value) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		
		// Clear validation error when user starts typing
		if (validationErrors[field] && value.trim()) {
			setValidationErrors(prev => ({ ...prev, [field]: "" }));
		}
	};

	if (tokenValid === false) {
		return (
			<Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
				<Row className="w-100 justify-content-center">
					<Col xs={12} sm={8} md={6} lg={4}>
						<Card className="shadow-sm border-0">
							<Card.Header className="bg-danger text-white text-center py-3">
								<ShieldLockFill size={32} className="mb-2" />
								<h4 className="mb-0">Invalid Reset Link</h4>
							</Card.Header>
							<Card.Body className="p-4">
								<Alert variant="danger" className="mb-3">
									<strong>Reset link is invalid or expired</strong>
								</Alert>
								<p className="text-muted mb-4">
									The password reset link you used is either invalid or has expired. 
									Please request a new password reset link.
								</p>
								<div className="d-grid gap-2">
									<Link to="/auth/forgot-password" className="btn btn-primary">
										Request New Reset Link
									</Link>
									<Link to="/auth/login" className="btn btn-outline-secondary">
										Back to Login
									</Link>
								</div>
							</Card.Body>
						</Card>
					</Col>
				</Row>
			</Container>
		);
	}

	if (success) {
		return (
			<Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
				<Row className="w-100 justify-content-center">
					<Col xs={12} sm={8} md={6} lg={4}>
						<Card className="shadow-sm border-0">
							<Card.Header className="bg-success text-white text-center py-3">
								<ShieldLockFill size={32} className="mb-2" />
								<h4 className="mb-0">Password Reset Successful</h4>
							</Card.Header>
							<Card.Body className="p-4">
								<div className="text-center">
									<Alert variant="success" className="mb-3">
										<strong>Your password has been reset successfully!</strong>
									</Alert>
									<p className="text-muted mb-4">
										You can now log in with your new password. You will be redirected to the login page in a few seconds.
									</p>
									<div className="d-grid">
										<Link to="/auth/login" className="btn btn-primary">
											Go to Login
										</Link>
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
							<ShieldLockFill size={32} className="mb-2" />
							<h4 className="mb-0">Reset Password</h4>
							<p className="mb-0 small opacity-75">
								Enter your new password
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
									<Form.Label>New Password</Form.Label>
									<div className="position-relative">
										<Form.Control
											type={showPassword ? "text" : "password"}
											placeholder="Enter your new password"
											value={formData.newPassword}
											onChange={(e) => handleInputChange("newPassword", e.target.value)}
											isInvalid={!!validationErrors.newPassword}
											disabled={loading}
											autoFocus
										/>
										<Button
											variant="link"
											className="position-absolute end-0 top-50 translate-middle-y border-0 p-2"
											onClick={() => setShowPassword(!showPassword)}
											style={{ zIndex: 10 }}
										>
											{showPassword ? <EyeSlashFill /> : <EyeFill />}
										</Button>
									</div>
									<Form.Control.Feedback type="invalid">
										{validationErrors.newPassword}
									</Form.Control.Feedback>
									<Form.Text className="text-muted">
										Must be at least 8 characters with uppercase, lowercase, and number.
									</Form.Text>
								</Form.Group>

								<Form.Group className="mb-4">
									<Form.Label>Confirm New Password</Form.Label>
									<div className="position-relative">
										<Form.Control
											type={showConfirmPassword ? "text" : "password"}
											placeholder="Confirm your new password"
											value={formData.confirmPassword}
											onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
											isInvalid={!!validationErrors.confirmPassword}
											disabled={loading}
										/>
										<Button
											variant="link"
											className="position-absolute end-0 top-50 translate-middle-y border-0 p-2"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											style={{ zIndex: 10 }}
										>
											{showConfirmPassword ? <EyeSlashFill /> : <EyeFill />}
										</Button>
									</div>
									<Form.Control.Feedback type="invalid">
										{validationErrors.confirmPassword}
									</Form.Control.Feedback>
								</Form.Group>

								<div className="d-grid gap-2">
									<Button 
										type="submit" 
										variant="primary" 
										disabled={loading || !formData.newPassword.trim() || !formData.confirmPassword.trim()}
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
												Resetting Password...
											</>
										) : (
											<>
												<ShieldLockFill className="me-2" />
												Reset Password
											</>
										)}
									</Button>
								</div>
							</Form>

							<hr className="my-4" />

							<div className="text-center">
								<p className="text-muted mb-0">
									Remember your password?{" "}
									<Link to="/auth/login" className="text-decoration-none">
										Back to Login
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

export default ResetPasswordPage;
