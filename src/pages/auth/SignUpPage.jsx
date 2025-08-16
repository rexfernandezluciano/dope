
/** @format */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Form, Button, Image, Alert, Spinner } from "react-bootstrap";
import heic2any from "heic2any";

import { authAPI } from "../../config/ApiConfig";
import { verifyUser, userExistByEmail, getGravatar } from "../../utils/app-utils";

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
	const [dialogMessage, setDialogMessage] = useState("");
	const [dialogTitle, setDialogTitle] = useState("");
	const [showDialog, setShowDialog] = useState(false);
	const [loading, setLoading] = useState(false);

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

			const userData = {
				firstName,
				lastName,
				displayName,
				email,
				password,
				photoURL
			};

			await authAPI.register(userData);
			
			await verifyUser(email);
			setShowDialog(true);
			setDialogTitle("Verification Link");
			setDialogMessage("Verification link was sent to your email address.");
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignup = async () => {
		try {
			setLoading(true);
			// Google OAuth implementation would go here
			console.log("Google signup not yet implemented with custom API");
			setError("Google signup is not yet available with the custom API");
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
									className="w-100">
									Next
								</Button>
							</Form>
							<hr />
							<Button
								variant="outline-secondary"
								onClick={handleGoogleSignup}
								className="w-100 mt-2"
								disabled={loading}>
								Continue with Google
							</Button>
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
									className="w-100 mb-2">
									Next
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
								className="w-100 mb-2">
								{loading ? (
									<Spinner
										animation="border"
										size="sm"
									/>
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
								className="w-100 text-muted mt-2"
								onClick={handleSignup}>
								Skip & Sign Up
							</Button>
						</div>
					)}
				</Col>
			</Row>

			{showDialog && (
				<AlertDialog
					title={dialogTitle}
					message={dialogMessage}
					dialogButtonMessage="Okay"
					onDialogButtonClick={() => setShowDialog(false)}
					type="primary"
					show={showDialog}
					onHide={() => setShowDialog(false)}
				/>
			)}
		</div>
	);
};

export default SignUpPage;
