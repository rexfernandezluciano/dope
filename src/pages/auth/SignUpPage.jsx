/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Row, Col, Form, Button, Image, Alert, Spinner } from "react-bootstrap";
import "animate.css";
import heic2any from "heic2any";

import { authAPI, imageAPI } from "../../config/ApiConfig";
import { getGravatar, createUsername } from "../../utils/app-utils";
import { setAuthToken } from "../../config/ApiConfig";
import { updatePageMeta, pageMetaData } from "../../utils/meta-utils";
import { initializeGoogleOAuth } from "../../utils/google-auth-utils";

import IntroductionBanner from "../../components/banners/IntroductionBanner";
import AlertDialog from "../../components/dialogs/AlertDialog";
import Stepper from "../../components/stepper/Stepper";
import socialNetIllustration from "../../assets/images/undraw_social-networking_v4z1.svg";

const SignUpPage = () => {
	const [step, setStep] = useState(0);
	const [animation, setAnimation] = useState(
		"animate__fadeInRight animate__faster",
	);

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
		setAnimation(
			forward
				? "animate__fadeInRight animate__faster"
				: "animate__fadeInLeft animate__faster",
		);
		if (forward) {
			nextStep();
		} else {
			prevStep();
		}
		setError("");
	};

	useEffect(() => {
		updatePageMeta(pageMetaData.signup);
	}, []);

	// Handle popup-based Google OAuth signup
	const handlePopupGoogleSignup = async () => {
		try {
			setGoogleLoading(true);
			setError("");

			// Initialize popup OAuth flow for signup
			const result = await initializeGoogleOAuth("signup");

			if (result.user && !result.user.hasVerifiedEmail) {
				setError(
					"Please verify your account first to continue. Check your email for the verification link.",
				);
				setGoogleLoading(false);
				return;
			}

			if (result.token) {
				// Store the token with remember me option
				const rememberMe = true;
				setAuthToken(result.token, rememberMe);
				setError("");
				navigate("/home", { replace: true });
			} else {
				setError("Google signup failed. Please try again.");
			}
		} catch (err) {
			console.error("Popup Google signup error:", err);
			setError(err.message || "Google signup failed. Please try again.");
		} finally {
			setGoogleLoading(false);
		}
	};

	const handleNextEmail = async (e) => {
		e.preventDefault();
		try {
			setLoading(true);
			changeStep(2, true);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleNextPassword = (e) => {
		e.preventDefault();
		if (password.length < 6) {
			setError("Password must be at least 6 characters.");
			return;
		}
		changeStep(3, true);
	};

	const handlePhotoChange = async (e) => {
		const file = e.target.files[0];
		if (!file) {
			// If no file selected, clear the preview and photo
			setPhoto(null);
			if (
				photoPreview &&
				!photoPreview.includes("gravatar") &&
				!photoPreview.includes("pravatar")
			) {
				URL.revokeObjectURL(photoPreview);
			}
			setPhotoPreview(null);
			return;
		}

		try {
			setError(""); // Clear any previous errors
			let finalFile = file;

			// Validate file type
			if (
				!file.type.startsWith("image/") &&
				!file.name.toLowerCase().endsWith(".heic")
			) {
				setError("Please select a valid image file.");
				return;
			}

			// Validate file size (5MB limit)
			if (file.size > 5 * 1024 * 1024) {
				setError("Image size must be less than 5MB.");
				return;
			}

			// Handle HEIC files
			if (
				file.type === "image/heic" ||
				file.name.toLowerCase().endsWith(".heic")
			) {
				const blob = await heic2any({ blob: file, toType: "image/jpeg" });
				finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
					type: "image/jpeg",
				});
			}

			// Clean up previous preview URL to prevent memory leaks
			if (
				photoPreview &&
				!photoPreview.includes("gravatar") &&
				!photoPreview.includes("pravatar")
			) {
				URL.revokeObjectURL(photoPreview);
			}

			// Set the photo and create preview
			setPhoto(finalFile);
			try {
				const previewUrl = URL.createObjectURL(finalFile);
				if (previewUrl && typeof previewUrl === 'string' && previewUrl.startsWith('blob:')) {
					setPhotoPreview(previewUrl);
				} else {
					throw new Error('Invalid blob URL generated');
				}
			} catch (urlError) {
				console.error('Failed to create preview URL:', urlError);
				setError('Failed to preview image. Please try again.');
				setPhoto(null);
				setPhotoPreview(null);
			}
		} catch (err) {
			console.error("Image processing failed:", err);
			setError(
				"Could not process selected image. Please try a different image.",
			);
			// Reset to default on error
			setPhoto(null);
			setPhotoPreview(null);
		}
	};

	const handleSignup = async () => {
		try {
			setLoading(true);
			const displayName = `${firstName} ${lastName}`.trim();
			let photoURL = getGravatar(email); // Default to Gravatar
			const username = await createUsername(displayName);

			// If user selected a custom photo, upload it using the API
			if (photo) {
				try {
					const uploadResult = await imageAPI.uploadImages([photo]);
					if (
						uploadResult &&
						uploadResult.imageUrls &&
						uploadResult.imageUrls.length > 0 &&
						typeof uploadResult.imageUrls[0] === 'string' &&
						uploadResult.imageUrls[0].startsWith('http')
					) {
						photoURL = uploadResult.imageUrls[0];
					} else {
						console.warn("Invalid upload result, using Gravatar:", uploadResult);
					}
				} catch (uploadErr) {
					console.error("Photo upload failed:", uploadErr);
					// Continue with Gravatar if upload fails
				}
			}

			const userData = {
				name: displayName,
				email,
				username,
				password,
				photoURL,
				subscription: "free",
			};

			const result = await authAPI.register(userData);

			// Clean up preview URL
			if (photoPreview && !photoPreview.includes("gravatar")) {
				URL.revokeObjectURL(photoPreview);
			}

			// Redirect to verification page with verification ID and email
			const verificationId = result.verificationId || "verify";
			navigate(
				`/auth/verify/${verificationId}?email=${encodeURIComponent(email)}`,
			);
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
					<Stepper currentStep={step} steps={steps} className="mb-3" />

					{error && (
						<Alert variant="danger" dismissible onClose={() => setError("")}>
							{error}
						</Alert>
					)}

					{/* STEP 1 */}
					{step === 0 && (
						<div className={`animate__animated ${animation}`}>
							<Form
								onSubmit={(e) => {
									e.preventDefault();
									if (!firstName || !lastName) {
										setError("Please enter your full name.");
										return;
									}
									changeStep(1, true);
								}}
							>
								<Form.Floating className="mb-3">
									<Form.Control
										type="text"
										value={firstName}
										onChange={(e) => setFirstName(e.target.value)}
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
										onChange={(e) => setLastName(e.target.value)}
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
									className="w-100 mb-3 d-flex align-items-center justify-content-center"
								>
									{loading ? <Spinner animation="border" size="sm" /> : "Next"}
								</Button>
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
									onClick={handlePopupGoogleSignup}
									disabled={googleLoading}
									className="shadow-none d-flex align-items-center justify-content-center w-100"
								>
									{googleLoading ? (
										<>
											<Spinner animation="border" size="sm" className="me-2" />
											Signing up with Google...
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
											Sign up with Google
										</>
									)}
								</Button>
							</div>
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
										onChange={(e) => setEmail(e.target.value)}
										disabled={loading}
										className="shadow-none"
										required
										placeholder="Email Address"
									/>
									<label>Email Address</label>
								</Form.Floating>
								<Button type="submit" disabled={loading} className="w-100 mb-2">
									{loading ? <Spinner animation="border" size="sm" /> : "Next"}
								</Button>
								<Button
									variant="secondary"
									onClick={() => changeStep(0, false)}
									className="w-100"
								>
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
										onChange={(e) => setPassword(e.target.value)}
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
									className="w-100 mb-2 d-flex align-items-center justify-content-center"
								>
									{loading ? <Spinner animation="border" size="sm" /> : "Next"}
								</Button>
								<Button
									variant="secondary"
									onClick={() => changeStep(1, false)}
									className="w-100"
								>
									Back
								</Button>
							</Form>
						</div>
					)}

					{/* STEP 4 */}
					{step === 3 && (
						<div className={`animate__animated ${animation}`}>
							<Form.Group className="mb-4 text-center">
								<label htmlFor="profileUpload" style={{ cursor: "pointer" }}>
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
									accept="image/*,.heic"
									onChange={handlePhotoChange}
									disabled={loading}
									style={{ display: "none" }}
								/>
							</Form.Group>

							<Button
								onClick={handleSignup}
								disabled={loading}
								className="w-100 mb-2 d-flex align-items-center justify-content-center"
							>
								{loading ? (
									<>
										<Spinner animation="border" size="sm" className="me-2" />
										Creating Account...
									</>
								) : (
									"Finish & Sign Up"
								)}
							</Button>
							<Button
								variant="secondary"
								onClick={() => changeStep(2, false)}
								className="w-100"
							>
								Back
							</Button>
							<Button
								variant="link"
								className="w-100 text-muted mt-2 d-flex align-items-center justify-content-center"
								disabled={loading}
								onClick={handleSignup}
							>
								{loading ? (
									<>
										<Spinner animation="border" size="sm" className="me-2" />
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
