/** @format */

import React, { useState, useEffect } from "react";
import {
	Container,
	Card,
	Form,
	Button,
	Alert,
	Modal,
	Row,
	Col,
} from "react-bootstrap";
import {
	Shield,
	Key,
	Download,
	ExclamationTriangle,
} from "react-bootstrap-icons";
import { useLoaderData } from "react-router-dom";
import { Adsense } from "@ctrl/react-adsense";

import { tfaAPI } from "../../config/ApiConfig.js";

const TFASettingsPage = () => {
	const loaderData = useLoaderData() || {};
	const { user } = loaderData;
	const [tfaStatus, setTfaStatus] = useState({
		tfaEnabled: false,
		backupCodesRemaining: 0,
	});
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("success");
	const [showSetupModal, setShowSetupModal] = useState(false);
	const [showDisableModal, setShowDisableModal] = useState(false);
	const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
	const [setupData, setSetupData] = useState(null);
	const [verificationToken, setVerificationToken] = useState("");
	const [password, setPassword] = useState("");
	const [backupCodes, setBackupCodes] = useState([]);

	useEffect(() => {
		fetchTfaStatus();
	}, []);

	const fetchTfaStatus = async () => {
		try {
			const response = await tfaAPI.getStatus();
			setTfaStatus(response);
		} catch (err) {
			console.error("Error fetching TFA status:", err);
		}
	};

	const handleSetupTFA = async () => {
		try {
			setLoading(true);
			const response = await tfaAPI.setup();
			setSetupData(response);
			setBackupCodes(response.backupCodes || []);
			setShowSetupModal(true);
		} catch (err) {
			setMessage(err.message || "Failed to setup TFA");
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
	};

	const handleVerifySetup = async () => {
		try {
			setLoading(true);
			const response = await tfaAPI.verifySetup(verificationToken);
			setBackupCodes(response.backupCodes || []);
			setShowSetupModal(false);
			setShowBackupCodesModal(true);
			setMessage("Two-factor authentication enabled successfully!");
			setMessageType("success");
			await fetchTfaStatus();
		} catch (err) {
			setMessage(err.message || "Failed to verify TFA setup");
			setMessageType("danger");
		} finally {
			setLoading(false);
			setVerificationToken("");
		}
	};

	const handleDisableTFA = async () => {
		try {
			setLoading(true);
			await tfaAPI.disable(password);
			setShowDisableModal(false);
			setMessage("Two-factor authentication disabled successfully");
			setMessageType("success");
			await fetchTfaStatus();
		} catch (err) {
			setMessage(err.message || "Failed to disable TFA");
			setMessageType("danger");
		} finally {
			setLoading(false);
			setPassword("");
		}
	};

	const handleRegenerateBackupCodes = async () => {
		try {
			setLoading(true);
			const response = await tfaAPI.regenerateBackupCodes(password);
			setBackupCodes(response.backupCodes || []);
			setPassword("");
			setShowBackupCodesModal(true);
			setMessage("Backup codes regenerated successfully");
			setMessageType("success");
			await fetchTfaStatus();
		} catch (err) {
			setMessage(err.message || "Failed to regenerate backup codes");
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
	};

	const downloadBackupCodes = () => {
		const codesText = `DOPE Network Backup Codes\n\nSave these codes in a secure place. Each code can only be used once.\n\n${backupCodes.join("\n")}\n\nGenerated on: ${new Date().toLocaleString()}`;
		const blob = new Blob([codesText], { type: "text/plain" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.style.display = "none";
		a.href = url;
		a.download = "dope-network-backup-codes.txt";
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	};

	if (!user) {
		return (
			<Container className="text-center py-5">
				<div>Loading...</div>
			</Container>
		);
	}

	return (
		<div className="py-3">
			{message && (
				<Alert
					variant={messageType}
					dismissible
					onClose={() => setMessage("")}
					className="mb-4"
				>
					{message}
				</Alert>
			)}

			{/* TFA Status */}
			<Card className="mb-4">
				<Card.Header className="d-flex align-items-center gap-2">
					<Shield size={20} />
					<h5 className="mb-0">Two-Factor Authentication</h5>
				</Card.Header>
				<Card.Body>
					<div className="mb-4">
						<div className="d-flex align-items-center gap-3 mb-3">
							<div
								className={`badge ${tfaStatus.tfaEnabled ? "bg-success" : "bg-warning"} px-3 py-2`}
							>
								{tfaStatus.tfaEnabled ? "Enabled" : "Disabled"}
							</div>
							{tfaStatus.tfaEnabled && (
								<span className="text-muted">
									{tfaStatus.backupCodesRemaining} backup codes remaining
								</span>
							)}
						</div>
						<p className="text-muted">
							Two-factor authentication adds an extra layer of security to your
							account by requiring a verification code from your authenticator
							app in addition to your password.
						</p>
						{tfaStatus.backupCodesRemaining <= 2 && tfaStatus.tfaEnabled && (
							<Alert variant="warning" className="mt-3">
								<ExclamationTriangle className="me-2" />
								You're running low on backup codes. Consider regenerating them.
							</Alert>
						)}
					</div>

					{!tfaStatus.tfaEnabled ? (
						<Button
							variant="primary"
							onClick={handleSetupTFA}
							disabled={loading}
						>
							<Shield className="me-2" />
							{loading ? "Setting up..." : "Enable Two-Factor Authentication"}
						</Button>
					) : (
						<div className="d-flex gap-2 flex-wrap">
							<Button
								variant="outline-danger"
								onClick={() => setShowDisableModal(true)}
							>
								Disable TFA
							</Button>
							<Button
								variant="outline-primary"
								onClick={() => {
									const passwordPrompt = prompt(
										"Enter your password to regenerate backup codes:",
									);
									if (passwordPrompt) {
										setPassword(passwordPrompt);
										handleRegenerateBackupCodes();
									}
								}}
							>
								<Key className="me-2" />
								Regenerate Backup Codes
							</Button>
						</div>
					)}
				</Card.Body>
			</Card>

			{/* Setup Modal */}
			<Modal
				show={showSetupModal}
				onHide={() => setShowSetupModal(false)}
				centered
				size="lg"
			>
				<Modal.Header closeButton>
					<Modal.Title>Setup Two-Factor Authentication</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{setupData && (
						<>
							<div className="text-center mb-4">
								<h6>Step 1: Scan QR Code</h6>
								<p className="text-muted">
									Use an authenticator app like Google Authenticator, Authy, or
									Microsoft Authenticator
								</p>
								<div className="d-flex justify-content-center mb-3">
									<img
										src={setupData.qrCode}
										alt="TFA QR Code"
										className="img-fluid border rounded"
										style={{ maxWidth: "250px" }}
									/>
								</div>
							</div>
							<div className="mb-4">
								<h6>Step 2: Manual Entry (Alternative)</h6>
								<p className="text-muted">
									If you can't scan the QR code, enter this secret manually:
								</p>
								<div className="input-group">
									<Form.Control
										type="text"
										value={setupData.secret}
										readOnly
										className="text-center font-monospace"
									/>
									<Button
										variant="outline-secondary"
										onClick={() =>
											navigator.clipboard.writeText(setupData.secret)
										}
									>
										Copy
									</Button>
								</div>
							</div>
							<div className="mb-3">
								<h6>Step 3: Verify</h6>
								<Form.Group>
									<Form.Label>
										Enter the 6-digit code from your authenticator app:
									</Form.Label>
									<Form.Control
										type="text"
										placeholder="123456"
										value={verificationToken}
										onChange={(e) =>
											setVerificationToken(
												e.target.value.replace(/\D/g, "").slice(0, 6),
											)
										}
										maxLength={6}
										className="text-center font-monospace fs-5"
									/>
								</Form.Group>
							</div>
						</>
					)}
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowSetupModal(false)}>
						Cancel
					</Button>
					<Button
						variant="success"
						onClick={handleVerifySetup}
						disabled={
							loading || !verificationToken || verificationToken.length !== 6
						}
					>
						{loading ? "Verifying..." : "Verify & Enable TFA"}
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Disable Modal */}
			<Modal
				show={showDisableModal}
				onHide={() => setShowDisableModal(false)}
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title>Disable Two-Factor Authentication</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Alert variant="danger">
						<ExclamationTriangle className="me-2" />
						<strong>Warning:</strong> Disabling two-factor authentication will
						make your account less secure.
					</Alert>
					<Form.Group className="mb-3">
						<Form.Label>Enter your password to confirm:</Form.Label>
						<Form.Control
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</Form.Group>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() => setShowDisableModal(false)}
					>
						Cancel
					</Button>
					<Button
						variant="danger"
						onClick={handleDisableTFA}
						disabled={loading || !password}
					>
						{loading ? "Disabling..." : "Disable TFA"}
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Backup Codes Modal */}
			<Modal
				show={showBackupCodesModal}
				onHide={() => setShowBackupCodesModal(false)}
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title>Backup Recovery Codes</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Alert variant="warning">
						<ExclamationTriangle className="me-2" />
						<strong>Important:</strong> Save these backup codes in a secure
						place. Each code can only be used once to access your account if you
						lose your authenticator device.
					</Alert>
					<div className="mb-3">
						<Row>
							{backupCodes.map((code, index) => (
								<Col xs={6} key={index} className="mb-2">
									<code className="d-block p-3 bg-light rounded text-center fs-6 fw-bold">
										{code}
									</code>
								</Col>
							))}
						</Row>
					</div>
					<div className="d-grid gap-2">
						<Button variant="outline-primary" onClick={downloadBackupCodes}>
							<Download className="me-2" />
							Download Backup Codes
						</Button>
						<Button
							variant="outline-secondary"
							onClick={() => {
								const codesText = backupCodes.join(", ");
								navigator.clipboard.writeText(codesText);
								setMessage("Backup codes copied to clipboard");
								setMessageType("info");
							}}
						>
							Copy to Clipboard
						</Button>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="primary"
						onClick={() => setShowBackupCodesModal(false)}
					>
						I've Saved These Codes Securely
					</Button>
				</Modal.Footer>
			</Modal>
			{/* <!-- banner_ad --> */}
			{user.membership?.subscription === "free" && (
				<Adsense
					client="ca-pub-1106169546112879"
					slot="2596463814"
					style={{ display: "block" }}
					format="auto"
				/>
			)}
		</div>
	);
};

export default TFASettingsPage;
