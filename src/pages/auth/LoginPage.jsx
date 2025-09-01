/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Row, Col, Form, Button, Image, Alert, Spinner } from "react-bootstrap";

import { authAPI, setAuthToken } from "../../config/ApiConfig";
import { verifyUser } from "../../utils/app-utils";
import { updatePageMeta, pageMetaData } from "../../utils/meta-utils";
import { initializeGoogleOAuth } from "../../utils/google-auth-utils";

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
	const [googleLoading, setGoogleLoading] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		updatePageMeta(pageMetaData.login);
	}, []);

	const handleEmailLogin = async (e) => {
		e.preventDefault();
		try {
			setLoading(true);

			const credentials = { email, password };

			const result = await authAPI.login(credentials);

			if (result.user && !result.user.hasVerifiedEmail) {
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
									setDialogMessage(
										"Verification link was sent to your email address.",
									);
								});
							}}
						>
							Resend verification link.
						</a>
					</>,
				);
				setLoading(false);
				return;
			}

			if (result.token) {
				// You can add a "Remember Me" checkbox and pass that value here
				const rememberMe = false; // Set this based on user preference
				setAuthToken(result.token, rememberMe);
				// Clear any existing errors
				setError("");
				// Use replace to prevent going back to login
				navigate("/", { replace: true });
			} else {
				setError("Login failed. Please try again.");
			}
		} catch (err) {
			setError(
				err.message === "Email not verified" ? (
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
									setDialogMessage(
										"Verification link was sent to your email address.",
									);
								});
							}}
						>
							Resend verification link.
						</a>
					</>
				) : (
					err.message || "Login failed. Please check your credentials."
				),
			);
		} finally {
			setLoading(false);
		}
	};

	// Handle popup-based Google OAuth
	const handlePopupGoogleLogin = async () => {
		try {
			setGoogleLoading(true);
			setError("");

			// Initialize popup OAuth flow
			const result = await initializeGoogleOAuth("login");

			if (result.token) {
				// Store the token with remember me option
				const rememberMe = true;
				setAuthToken(result.token, rememberMe);
				setError("");
				navigate("/", { replace: true });
			} else {
				setError("Google login failed. Please try again.");
			}
		} catch (err) {
			console.error("Popup Google login error:", err);
			setError(err.message || "Google login failed. Please try again.");
		} finally {
			setGoogleLoading(false);
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
							<Alert variant="danger" dismissible onClose={() => setError("")}>
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
									onChange={(e) => setEmail(e.target.value)}
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
									onChange={(e) => setPassword(e.target.value)}
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
									className="shadow-none d-flex align-items-center justify-content-center"
								>
									{loading ? (
										<>
											<Spinner animation="border" size="sm" className="me-2" />
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

						<div className="d-grid mb-3">
							<Button
								variant="outline-primary"
								size="md"
								onClick={handlePopupGoogleLogin}
								disabled={googleLoading}
								className="shadow-none d-flex align-items-center justify-content-center"
							>
								{googleLoading ? (
									<>
										<Spinner animation="border" size="sm" className="me-2" />
										Signing in with Google...
									</>
								) : (
									<>
										<svg
											className="me-2"
											width="18"
											height="18"
											viewBox="0 0 24 24"
										>
											<path
												fill="#4285f4"
												d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
											/>
											<path
												fill="#34a853"
												d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
											/>
											<path
												fill="#fbbc05"
												d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
											/>
											<path
												fill="#ea4335"
												d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
											/>
										</svg>
										Continue with Google
									</>
								)}
							</Button>
						</div>

						<div className="text-center">
							<p className="text-muted mb-2">
								<Link
									to="/auth/forgot-password"
									className="text-decoration-none"
								>
									Forgot your password?
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
