/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Row, Col, Form, Button, Image, Alert, Spinner } from "react-bootstrap";
import "animate.css";
import heic2any from "heic2any";

import { authAPI } from "../../config/ApiConfig";
import { verifyUser, userExistByEmail, getGravatar, createUsername, setAuthToken } from "../../utils/app-utils";
import { updatePageMeta, pageMetaData } from "../../utils/meta-utils";
import { initializeGoogleAuth, renderGoogleButton, handleGoogleSignIn } from "../../utils/google-auth-utils";

import IntroductionBanner from "../../components/banners/IntroductionBanner";
import AlertDialog from "../../components/dialogs/AlertDialog";
import Stepper from "../../components/stepper/Stepper";
import socialNetIllustration from "../../assets/images/undraw_social-networking_v4z1.svg";

const SignUpPage = () => {
	const [step, setStep] = useState(0);
	const [animation, setAnimation] = useState("animate__fadeInRight animate__faster");

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const steps = ["Name", "Email", "Password", "Profile Picture"];

	const [photo, setPhoto] = useState(null);
	const [photoPreview, setPhotoPreview] = useState(null);

	const [error, setError] = useState("");
	const [dialogMessage] = useState("");
	const [dialogTitle] = useState("");
	const [showDialog, setShowDialog] = useState(false);
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);

	const navigate = useNavigate();

	const nextStep = () => {
		if (step < steps.length - 1) {
			setStep(step + 1);
		}
	};

	const prevStep = () => {
		if (step > 0) {
			setStep(step - 1);
		}
	};

	const changeStep = (newStep, forward = true) => {
		setAnimation(forward ? "animate__fadeInRight animate__faster" : "animate__fadeInLeft animate__faster");
		if (forward) {
			nextStep();
		} else {
			prevStep();
		}
		setError("");
	};

	useEffect(() => {
		updatePageMeta(pageMetaData.signup);
		
		// Initialize Google Sign-In
		const initGoogle = async () => {
			try {
				await initializeGoogleAuth();
				console.log('Google Sign-In initialized successfully');
			} catch (err) {
				console.error('Failed to initialize Google Sign-In:', err);
			}
		};
		
		initGoogle();
	}, []);

	const handleGoogleCallback = async (response) => {
		try {
			setGoogleLoading(true);
			setError("");

			const result = await authAPI.googleSignup(response.credential);

			if (result.user && !result.user.hasVerifiedEmail) {
				setError("Please verify your account first to continue.");
				setGoogleLoading(false);
				return;
			}

			if (result.token) {
				setAuthToken(result.token);
				navigate("/home", { replace: true });
			} else {
				setError("Google signup failed. Please try again.");
			}
		} catch (err) {
			setError(err.message || "Google signup failed. Please try again.");
		} finally {
			setGoogleLoading(false);
		}
	};

	const handleGoogleSignUp = async () => {
		try {
			// Ensure Google is initialized first
			if (!window.google || !window.google.accounts || !window.google.accounts.id) {
				await initializeGoogleAuth();
			}
			
			// Try direct sign-in first
			await handleGoogleSignIn(handleGoogleCallback);
		} catch (err) {
			console.error('Google signup error:', err);
			// Fallback to button rendering
			const buttonElement = document.getElementById('google-signup-button');
			if (buttonElement) {
				buttonElement.style.display = 'block';
				renderGoogleButton('google-signup-button', handleGoogleCallback);
			}
		}
	};

	const handleNextEmail = async e => {
		e.preventDefault();
		try {
			setLoading(true);
			const exists = await userExistByEmail(email);
			if (exists) {
				setError("Email address already exists. Please try again.");
				return;
			}
			changeStep(3, true);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleNextPassword = e => {
		e.preventDefault();
		if (password.length < 6) {
			setError("Password must be at least 6 characters.");
			return;
		}
		changeStep(4, true);
	};

	const handlePhotoChange = async e => {
		const file = e.target.files[0];
		if (!file) return;

		try {
			let finalFile = file;

			// Handle HEIC files
			if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
				const blob = await heic2any({ blob: file, toType: "image/jpeg" });
				finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
			}

			setPhoto(finalFile);
			setPhotoPreview(URL.createObjectURL(finalFile));
		} catch (err) {
			console.error("HEIC conversion failed:", err);
			setError("Could not load selected image.");
		}
	};

	const handleSignup = async () => {
		try {
			setLoading(true);
			const displayName = `${firstName} ${lastName}`.trim();
			const photoURL = photo ? photoPreview : getGravatar(email);
			const username = await createUsername(displayName);

			const userData = {
				name: displayName,
				email,
				username,
				password,
				photoURL,
				subscription: "free"
			};

			const result = await authAPI.register(userData);

			await verifyUser(email);

			// Redirect to verification page with verification ID and email
			const verificationId = result.verificationId || 'verify';
			navigate(`/auth/verify/${verificationId}?email=${encodeURIComponent(email)}`);
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
					<h3 className="text-center mb-3">Create an Account</h3>
					<Stepper
						currentStep={step}
						steps={steps}
						className="mb-3"
					/>

					{error && (
						<Alert
							variant="danger"
							dismissible
							onClose={() => setError("")}>
							{error}
						</Alert>
					)}

					{/* STEP 1 */}
					{step === 0 && (
						<div className={`animate__animated ${animation}`}>
							<Form
								onSubmit={e => {
									e.preventDefault();
									if (!firstName || !lastName) {
										setError("Please enter your full name.");
										return;
									}
									changeStep(2, true);
								}}>
								<Form.Floating className="mb-3">
									<Form.Control
										type="text"
										value={firstName}
										onChange={e => setFirstName(e.target.value)}
										disabled={loading}
										className="shadow-none"
										required
										placeholder="First Name"
									/>
									<label>First Name</label>
								</Form.Floating>
								<Form.Floating className="mb-3">
									<Form.Control
										type="text"
										value={lastName}
										onChange={e => setLastName(e.target.value)}
										disabled={loading}
										className="shadow-none"
										required
										placeholder="Last Name"
									/>
									<label>Last Name</label>
								</Form.Floating>
								<Button
									type="submit"
									disabled={loading}
									className="w-100 d-flex align-items-center justify-content-center">
									{loading ? (
										<Spinner
											animation="border"
											size="sm"
										/>
									) : (
										"Next"
									)}
								</Button>
							</Form>
							<hr />
							{googleLoading ? (
								<Button
									variant="outline-secondary"
									size="md"
									disabled
									className="shadow-none d-flex align-items-center justify-content-center w-100 mt-2">
									<Spinner
										animation="border"
										size="sm"
										className="me-2"
									/>
									Signing up with Google...
								</Button>
							) : (
								<div>
									<div id="google-signup-button" style={{ display: 'none' }}></div>
									<Button
										variant="outline-secondary"
										onClick={handleGoogleSignUp}
										size="md"
										disabled={loading}
										className="w-100 mt-2">
										Continue with Google
									</Button>
								</div>
							)}
							<p className="text-center mt-3 mb-0">
								Already have an account? <Link to="/auth/login">Login</Link>
							</p>
						</div>
					)}

					{/* STEP 2 */}
					{step === 1 && (
						<div className={`animate__animated ${animation}`}>
							<Form onSubmit={handleNextEmail}>
								<Form.Floating className="mb-3">
									<Form.Control
										type="email"
										value={email}
										onChange={e => setEmail(e.target.value)}
										disabled={loading}
										className="shadow-none"
										required
										placeholder="Email Address"
									/>
									<label>Email Address</label>
								</Form.Floating>
								<Button
									type="submit"
									disabled={loading}
									className="w-100 mb-2">
									{loading ? (
										<Spinner
											animation="border"
											size="sm"
										/>
									) : (
										"Next"
									)}
								</Button>
								<Button
									variant="secondary"
									onClick={() => {
										prevStep();
										changeStep(1, false);
									}}
									className="w-100">
									Back
								</Button>
							</Form>
						</div>
					)}

					{/* STEP 3 */}
					{step === 2 && (
						<div className={`animate__animated ${animation}`}>
							<Form onSubmit={handleNextPassword}>
								<Form.Floating className="mb-3">
									<Form.Control
										type="password"
										value={password}
										onChange={e => setPassword(e.target.value)}
										disabled={loading}
										className="shadow-none"
										required
										placeholder="Password"
									/>
									<label>Password</label>
								</Form.Floating>
								<Button
									type="submit"
									disabled={loading}
									className="w-100 mb-2 d-flex align-items-center justify-content-center">
									{loading ? (
										<Spinner
											animation="border"
											size="sm"
										/>
									) : (
										"Next"
									)}
								</Button>
								<Button
									variant="secondary"
									onClick={() => {
										prevStep();
										changeStep(1, false);
									}}
									className="w-100">
									Back
								</Button>
							</Form>
						</div>
					)}

					{/* STEP 4 */}
					{step === 3 && (
						<div className={`animate__animated ${animation}`}>
							<Form.Group className="mb-4 text-center">
								<label
									htmlFor="profileUpload"
									style={{ cursor: "pointer" }}>
									<Image
										src={photoPreview || getGravatar(email)}
										alt="Profile Preview"
										roundedCircle
										width={150}
										height={150}
										style={{ objectFit: "cover" }}
									/>
								</label>
								<Form.Control
									id="profileUpload"
									type="file"
									accept="image/*"
									onChange={handlePhotoChange}
									disabled={loading}
									style={{ display: "none" }}
								/>
							</Form.Group>

							<Button
								onClick={handleSignup}
								disabled={loading}
								className="w-100 mb-2 d-flex align-items-center justify-content-center">
								{loading ? (
									<>
										<Spinner
											animation="border"
											size="sm"
											className="me-2"
										/>
										Creating Account...
									</>
								) : (
									"Finish & Sign Up"
								)}
							</Button>
							<Button
								variant="secondary"
								onClick={() => {
									prevStep();
									changeStep(1, false);
								}}
								className="w-100">
								Back
							</Button>
							<Button
								variant="link"
								className="w-100 text-muted mt-2 d-flex align-items-center justify-content-center"
								disabled={loading}
								onClick={handleSignup}>
								{loading ? (
									<>
										<Spinner
											animation="border"
											size="sm"
											className="me-2"
										/>
										Creating Account...
									</>
								) : (
									"Skip & Sign Up"
								)}
							</Button>
						</div>
					)}
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

export default SignUpPage;