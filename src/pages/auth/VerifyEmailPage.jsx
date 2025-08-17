
/** @format */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Row, Col, Form, Button, Image, Alert, Spinner } from "react-bootstrap";

import { authAPI } from "../../config/ApiConfig";

import IntroductionBanner from "../../components/banners/IntroductionBanner";
import AlertDialog from "../../components/dialogs/AlertDialog";
import socialNetIllustration from "../../assets/images/undraw_social-networking_v4z1.svg";

const VerifyEmailPage = () => {
	const { verificationId } = useParams();
	const navigate = useNavigate();
	
	const [code, setCode] = useState("");
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [showDialog, setShowDialog] = useState(false);
	const [dialogMessage, setDialogMessage] = useState("");
	const [dialogTitle, setDialogTitle] = useState("");

	useEffect(() => {
		// Get email from URL params or localStorage
		const urlParams = new URLSearchParams(window.location.search);
		const emailParam = urlParams.get('email');
		if (emailParam) {
			setEmail(decodeURIComponent(emailParam));
		}
	}, []);

	const handleVerifyEmail = async (e) => {
		e.preventDefault();
		
		if (!code || code.length !== 6) {
			setError("Please enter a valid 6-digit verification code.");
			return;
		}

		if (!email) {
			setError("Email address is required. Please go back to signup.");
			return;
		}

		try {
			setLoading(true);
			await authAPI.verifyEmail(email, code, verificationId);
			
			setShowDialog(true);
			setDialogTitle("Email Verified Successfully!");
			setDialogMessage("Your email has been verified. You can now log in to your account.");
		} catch (err) {
			setError(err.message || "Verification failed. Please check your code and try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleResendCode = async () => {
		if (!email) {
			setError("Email address is required to resend verification code.");
			return;
		}

		try {
			setLoading(true);
			await authAPI.resendVerification(email);
			setError("");
			setShowDialog(true);
			setDialogTitle("Verification Code Sent");
			setDialogMessage("A new verification code has been sent to your email address.");
		} catch (err) {
			setError(err.message || "Failed to resend verification code.");
		} finally {
			setLoading(false);
		}
	};

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
						<h3 className="text-center mb-3">Verify Your Email</h3>
						<p className="text-center text-muted mb-4">
							We've sent a 6-digit verification code to {email}
						</p>

						{error && (
							<Alert
								variant="danger"
								dismissible
								onClose={() => setError("")}>
								{error}
							</Alert>
						)}

						<Form onSubmit={handleVerifyEmail}>
							<Form.Floating className="mb-3">
								<Form.Control
									type="text"
									placeholder="Enter verification code"
									value={code}
									onChange={(e) => {
										// Only allow numbers and limit to 6 digits
										const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
										setCode(value);
									}}
									disabled={loading}
									className="text-center"
									style={{ letterSpacing: '0.5rem', fontSize: '1.2rem' }}
									maxLength={6}
									required
								/>
								<label>Verification Code</label>
							</Form.Floating>

							<div className="d-grid mb-3">
								<Button
									variant="primary"
									type="submit"
									size="md"
									disabled={loading || code.length !== 6}
									className="d-flex align-items-center justify-content-center">
									{loading ? (
										<>
											<Spinner
												animation="border"
												size="sm"
												className="me-2"
											/>
											Verifying...
										</>
									) : (
										"Verify Email"
									)}
								</Button>
							</div>
						</Form>

						<div className="text-center">
							<p className="text-muted mb-2">Didn't receive the code?</p>
							<Button
								variant="link"
								onClick={handleResendCode}
								disabled={loading}
								className="p-0 text-decoration-none">
								Resend verification code
							</Button>
						</div>

						<hr className="my-4" />

						<p className="text-center mb-0">
							<Link to="/auth/login">Back to Login</Link>
						</p>
					</div>
				</Col>
			</Row>

			{showDialog && (
				<AlertDialog
					title={dialogTitle}
					message={dialogMessage}
					dialogButtonMessage="Go to Login"
					onDialogButtonClick={() => {
						setShowDialog(false);
						navigate("/auth/login");
					}}
					type="primary"
					show={showDialog}
					onHide={() => {
						setShowDialog(false);
						navigate("/auth/login");
					}}
				/>
			)}
		</div>
	);
};

export default VerifyEmailPage;
