
/** @format */

import React, { useState } from "react";
import { Form, Button, Alert, Card } from "react-bootstrap";
import { Shield, Key } from "react-bootstrap-icons";
import { validateTfaCode, validateBackupCode, formatTfaCode } from "../utils/tfa-utils";

const TFAVerification = ({ 
	onVerify, 
	loading = false, 
	error = null, 
	onCancel = null 
}) => {
	const [tfaCode, setTfaCode] = useState("");
	const [useBackupCode, setUseBackupCode] = useState(false);
	const [backupCode, setBackupCode] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		
		if (useBackupCode) {
			if (validateBackupCode(backupCode)) {
				onVerify(backupCode, 'backup');
			}
		} else {
			if (validateTfaCode(tfaCode)) {
				onVerify(tfaCode, 'totp');
			}
		}
	};

	const handleTfaCodeChange = (e) => {
		const formatted = formatTfaCode(e.target.value);
		setTfaCode(formatted);
	};

	const handleBackupCodeChange = (e) => {
		const formatted = e.target.value.replace(/\D/g, '').slice(0, 8);
		setBackupCode(formatted);
	};

	return (
		<Card className="mx-auto" style={{ maxWidth: '400px' }}>
			<Card.Header className="text-center">
				<Shield size={32} className="text-primary mb-2" />
				<h5 className="mb-0">Two-Factor Authentication</h5>
			</Card.Header>
			<Card.Body>
				{error && (
					<Alert variant="danger" className="mb-3">
						{error}
					</Alert>
				)}

				<p className="text-muted text-center mb-4">
					{useBackupCode 
						? "Enter one of your 8-digit backup codes"
						: "Enter the 6-digit code from your authenticator app"
					}
				</p>

				<Form onSubmit={handleSubmit}>
					{!useBackupCode ? (
						<Form.Group className="mb-3">
							<Form.Label>Authenticator Code</Form.Label>
							<Form.Control
								type="text"
								placeholder="123456"
								value={tfaCode}
								onChange={handleTfaCodeChange}
								maxLength={6}
								className="text-center font-monospace fs-5"
								autoComplete="one-time-code"
								inputMode="numeric"
							/>
						</Form.Group>
					) : (
						<Form.Group className="mb-3">
							<Form.Label>Backup Code</Form.Label>
							<Form.Control
								type="text"
								placeholder="12345678"
								value={backupCode}
								onChange={handleBackupCodeChange}
								maxLength={8}
								className="text-center font-monospace fs-5"
								autoComplete="one-time-code"
								inputMode="numeric"
							/>
						</Form.Group>
					)}

					<div className="d-grid gap-2 mb-3">
						<Button 
							type="submit" 
							variant="primary"
							disabled={loading || (!useBackupCode && !validateTfaCode(tfaCode)) || (useBackupCode && !validateBackupCode(backupCode))}
						>
							{loading ? "Verifying..." : "Verify"}
						</Button>
					</div>

					<div className="text-center">
						<Button
							variant="link"
							size="sm"
							onClick={() => {
								setUseBackupCode(!useBackupCode);
								setTfaCode("");
								setBackupCode("");
							}}
							className="text-decoration-none"
						>
							<Key size={14} className="me-1" />
							{useBackupCode ? "Use authenticator app" : "Use backup code"}
						</Button>
					</div>

					{onCancel && (
						<div className="text-center mt-3">
							<Button
								variant="outline-secondary"
								size="sm"
								onClick={onCancel}
							>
								Cancel
							</Button>
						</div>
					)}
				</Form>
			</Card.Body>
		</Card>
	);
};

export default TFAVerification;
