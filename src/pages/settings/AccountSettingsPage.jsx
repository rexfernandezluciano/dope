
/** @format */

import { useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { Container, Card, Form, Button, Alert, Modal } from "react-bootstrap";
import { Person, Shield, Trash } from "react-bootstrap-icons";

import { userAPI, authAPI } from "../../config/ApiConfig";
import { removeAuthToken } from "../../utils/app-utils";

const AccountSettingsPage = () => {
	const loaderData = useLoaderData() || {};
	const { user } = loaderData;
	const [settings, setSettings] = useState({
		username: "",
		email: "",
		name: ""
	});
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("success");
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	useEffect(() => {
		if (user) {
			setSettings({
				username: user.username || "",
				email: user.email || "",
				name: user.name || ""
			});
		}
	}, [user]);

	if (!user) {
		return (
			<Container className="text-center py-5">
				<div>Loading...</div>
			</Container>
		);
	}

	const checkUsernameChangeLimit = (lastChange) => {
		if (!lastChange) return false;
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		return new Date(lastChange) > thirtyDaysAgo;
	};

	const handleSaveSettings = async () => {
		try {
			setLoading(true);
			let updateData = { ...settings };

			// Check username change limit
			if (settings.username !== user.username && checkUsernameChangeLimit(user.lastUsernameChange)) {
				const daysLeft = Math.ceil((new Date(user.lastUsernameChange).getTime() + (30 * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000));
				setMessage(`You can only change your username once every 30 days. Please wait ${daysLeft} more days.`);
				setMessageType("warning");
				setLoading(false);
				return;
			}

			// Add timestamp if username was changed
			if (settings.username !== user.username) {
				updateData.lastUsernameChange = new Date().toISOString();
			}

			await userAPI.updateUser(user.username, updateData);
			setMessage("Account settings updated successfully!");
			setMessageType("success");
		} catch (err) {
			console.error('Error updating account settings:', err);
			setMessage(err.message || 'Failed to update account settings');
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteAccount = async () => {
		try {
			setLoading(true);
			// Note: This would need to be implemented in the API
			// await userAPI.deleteAccount();
			removeAuthToken();
			window.location.href = "/";
		} catch (err) {
			setMessage(err.message);
			setMessageType("danger");
		} finally {
			setLoading(false);
			setShowDeleteModal(false);
		}
	};

	return (
		<div className="py-3">
			{message && (
				<Alert
					variant={messageType}
					dismissible
					onClose={() => setMessage("")}
					className="mb-4">
					{message}
				</Alert>
			)}

			{/* Basic Account Info */}
			<Card className="mb-4">
				<Card.Header className="d-flex align-items-center gap-2">
					<Person size={20} />
					<h5 className="mb-0">Account Information</h5>
				</Card.Header>
				<Card.Body>
					<Form>
						<Form.Group className="mb-3">
							<Form.Label>Username</Form.Label>
							<Form.Control
								type="text"
								value={settings.username}
								onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
								placeholder="Your username"
							/>
							<Form.Text className="text-muted">
								You can change your username once every 30 days
							</Form.Text>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Display Name</Form.Label>
							<Form.Control
								type="text"
								value={settings.name}
								onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
								placeholder="Your display name"
							/>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Email</Form.Label>
							<div className="d-flex align-items-center gap-2">
								<Form.Control
									type="email"
									value={settings.email}
									disabled
									className="bg-light"
								/>
								{user?.hasVerifiedEmail ? (
									<span className="badge bg-success">Verified</span>
								) : (
									<span className="badge bg-warning">Unverified</span>
								)}
							</div>
							<Form.Text className="text-muted">
								Email changes require verification. Contact support to change your email.
							</Form.Text>
						</Form.Group>
					</Form>
				</Card.Body>
			</Card>

			{/* Account Status */}
			<Card className="mb-4">
				<Card.Header className="d-flex align-items-center gap-2">
					<Shield size={20} />
					<h5 className="mb-0">Account Status</h5>
				</Card.Header>
				<Card.Body>
					<div className="d-flex flex-column gap-3">
						<div className="d-flex justify-content-between align-items-center">
							<div>
								<h6 className="mb-1">Subscription</h6>
								<p className="text-muted mb-0 text-capitalize">{user?.membership?.subscription || user?.subscription || 'free'}</p>
								{user?.membership?.nextBillingDate && (
									<small className="text-muted d-block">Next billing: {user.membership.nextBillingDate}</small>
								)}
							</div>
							{user?.hasBlueCheck && (
								<span className="text-primary fs-5">✓</span>
							)}
						</div>

						<div className="d-flex justify-content-between align-items-center">
							<div>
								<h6 className="mb-1">Account Created</h6>
								<p className="text-muted mb-0">{new Date(user.createdAt).toLocaleDateString()}</p>
							</div>
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Action Buttons */}
			<div className="d-grid gap-2">
				<Button
					variant="primary"
					size="md"
					onClick={handleSaveSettings}
					disabled={loading}>
					{loading ? "Saving..." : "Save Changes"}
				</Button>

				<Button
					variant="outline-danger"
					size="md"
					onClick={() => setShowDeleteModal(true)}>
					<Trash size={16} className="me-2" />
					Delete Account
				</Button>
			</div>

			{/* Delete Account Modal */}
			<Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
				<Modal.Header closeButton>
					<Modal.Title className="text-danger">Delete Account</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>Are you sure you want to delete your account? This action cannot be undone.</p>
					<p className="text-danger">
						<strong>All your posts, comments, and data will be permanently removed.</strong>
					</p>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
						Cancel
					</Button>
					<Button variant="danger" onClick={handleDeleteAccount}>
						Delete My Account
					</Button>
				</Modal.Footer>
			</Modal>
		</div>
	);
};

export default AccountSettingsPage;
