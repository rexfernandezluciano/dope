
/** @format */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Row, Col, Form, Button, Image, Alert, Spinner } from "react-bootstrap";

import { authAPI } from "../../config/ApiConfig";
import { verifyUser, setAuthToken } from "../../utils/app-utils";

import IntroductionBanner from "../../components/banners/IntroductionBanner";
import socialNetIllustration from "../../assets/images/undraw_social-networking_v4z1.svg";

import AlertDialog from "../../components/dialogs/AlertDialog";

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [showDialog, setShowDialog] = useState(false);
	const [dialogMessage, setDialogMessage] = useState("");
	const [dialogTitle, setDialogTitle] = useState("");
	const [loading, setLoading] = useState(false);

	const navigate = useNavigate();

	const handleEmailLogin = async e => {
		e.preventDefault();
		try {
			setLoading(true);
			const result = await authAPI.login(email, password);
			
			if (!result.hasVerifiedEmail) {
				setError(
					<>
						Please verify your account first to continue.{" "}
						<a
							href="#verify"
							role="button"
							className="fw-bold"
							onClick={() => {
								verifyUser(email).then(() => {
									setShowDialog(true);
									setDialogTitle("Verification Link");
									setDialogMessage("Verification link was sent to your email address.");
								});
							}}>
							Resend verification link.
						</a>
					</>,
				);
				return;
			}
			
			setAuthToken(result.token);
			navigate("/");
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		try {
			setLoading(true);
			// For Google OAuth, you'll need to implement Google Sign-In
			// This is a placeholder for the Google OAuth flow
			console.log("Google login not yet implemented with custom API");
			setError("Google login is not yet available with the custom API");
		} catch (err) {
			setError(err.message);
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
						<h3 className="text-center mb-3">Welcome Back</h3>
						<p className="text-center text-muted">Sign in to your account</p>

						{error && (
							<Alert
								variant="danger"
								dismissible
								onClose={() => setError("")}>
								{error}
							</Alert>
						)}

						<Form onSubmit={handleEmailLogin}>
							<Form.Floating className="mb-3">
								<Form.Control
									id="floatingInputEmail"
									type="email"
									placeholder="Enter email"
									value={email}
									onChange={e => setEmail(e.target.value)}
									disabled={loading}
									className="shadow-none"
									required
								/>
								<label htmlFor="floatingInputEmail">Email address</label>
							</Form.Floating>

							<Form.Floating className="mb-3">
								<Form.Control
									id="floatingPassword"
									type="password"
									placeholder="Enter password"
									value={password}
									onChange={e => setPassword(e.target.value)}
									disabled={loading}
									className="shadow-none"
									required
								/>
								<label htmlFor="floatingPassword">Password</label>
							</Form.Floating>

							<div className="d-grid mb-3">
								<Button
									variant="primary"
									type="submit"
									size="md"
									disabled={loading}
									className="shadow-none d-flex align-items-center justify-content-center">
									{loading ? (
										<>
											<Spinner
												animation="border"
												size="sm"
												className="me-2"
											/>
											Logging In...
										</>
									) : (
										"Log In"
									)}
								</Button>
							</div>
						</Form>

						<div className="d-flex align-items-center justify-content-center gap-2 mb-3">
							<hr className="border-1 p-1 w-100 rounded-3 bg-light" />
							<div className="text-center text-muted">OR</div>
							<hr className="border-1 p-1 w-100 rounded-3 bg-light" />
						</div>

						<div className="d-grid mb-2">
							<Button
								variant="outline-secondary"
								onClick={handleGoogleLogin}
								size="md"
								disabled={loading}
								className="shadow-none">
								Continue with Google
							</Button>
						</div>

						<p className="text-center mt-3 mb-0">
							Don't have an account yet? <Link to="/auth/signup">Sign Up</Link>
						</p>
					</div>
				</Col>
			</Row>
			{showDialog && (
				<AlertDialog
					title={dialogTitle}
					message={dialogMessage}
					dialogButtonMessage="Okay"
					onDialogButtonClick={() => setShowDialog(false)}
					type="dark"
					show={showDialog}
					onHide={() => setShowDialog(false)}
				/>
			)}
		</div>
	);
};

export default LoginPage;
