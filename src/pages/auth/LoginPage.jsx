/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Row, Col, Form, Button, Image, Alert, Spinner } from "react-bootstrap";

import { authAPI, setAuthToken } from "../../config/ApiConfig";
import { verifyUser } from "../../utils/app-utils";
import { updatePageMeta, pageMetaData } from "../../utils/meta-utils";
import {
	initializeGoogleAuth,
	renderGoogleButton,
	handleGoogleSignIn,
	handleGoogleSignInPopup
} from "../../utils/google-auth-utils";

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
	const [usePopup, setUsePopup] = useState(true);

	const navigate = useNavigate();

	useEffect(() => {
		updatePageMeta(pageMetaData.login);

		// Initialize Google Sign-In
		const initGoogle = async () => {
			try {
				await initializeGoogleAuth();
				console.log("Google Sign-In initialized successfully");
			} catch (err) {
				console.error("Failed to initialize Google Sign-In:", err);
			}
		};

		initGoogle();
	}, []);

	const handleEmailLogin = async (e) => {
		e.preventDefault();
		try {
			setLoading(true);

			const result = await authAPI.login(email, password);

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
				navigate("/home", { replace: true });
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

	const handleGoogleCallback = async (response) => {
		try {
			setGoogleLoading(true);
			setError("");

			const result = await authAPI.googleLogin(response.credential);

			if (result.user && !result.user.hasVerifiedEmail) {
				setError("Please verify your account first to continue.");
				setGoogleLoading(false);
				return;
			}

			if (result.token) {
				setAuthToken(result.token);
				navigate("/home", { replace: true });
			} else {
				setError("Google login failed. Please try again.");
			}
		} catch (err) {
			setError(err.message || "Google login failed. Please try again.");
		} finally {
			setGoogleLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		try {
			setGoogleLoading(true);
			setError("");

			// Ensure Google is initialized first
			if (
				!window.google ||
				!window.google.accounts ||
				!window.google.accounts.id
			) {
				await initializeGoogleAuth();
			}

			if (usePopup) {
				// Try popup sign-in first
				await handleGoogleSignInPopup(handleGoogleCallback);
			} else {
				// Try direct sign-in
				await handleGoogleSignIn(handleGoogleCallback);
			}
		} catch (err) {
			console.error("Google login error:", err);
			setError("Google login failed. Please try again.");
			
			// Fallback to button rendering if popup fails
			if (usePopup) {
				const buttonElement = document.getElementById("google-signin-button");
				if (buttonElement) {
					buttonElement.style.display = "block";
					renderGoogleButton("google-signin-button", handleGoogleCallback);
				}
			}
		} finally {
			setGoogleLoading(false);
		}
	};

	useEffect(() => {
		updatePageMeta(pageMetaData.login);
	}, []);

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

						<div className="mb-2">
							<div className="d-flex align-items-center justify-content-between mb-2">
								<small className="text-muted">Login Method:</small>
								<Form.Check
									type="switch"
									id="popup-switch"
									label={usePopup ? "Popup" : "Redirect"}
									checked={usePopup}
									onChange={(e) => setUsePopup(e.target.checked)}
									className="shadow-none"
								/>
							</div>
							<div className="d-grid">
								{googleLoading ? (
									<Button
										variant="outline-secondary"
										size="md"
										disabled
										className="shadow-none d-flex align-items-center justify-content-center"
									>
										<Spinner animation="border" size="sm" className="me-2" />
										Signing in with Google...
									</Button>
								) : (
									<div>
										<div
											id="google-signin-button"
											style={{ display: "none", width: "100%" }}
										></div>
										<Button
											variant="outline-secondary"
											onClick={handleGoogleLogin}
											size="md"
											disabled={loading}
											className="shadow-none w-100"
										>
											{usePopup ? "Continue with Google (Popup)" : "Continue with Google"}
										</Button>
									</div>
								)}
							</div>
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
