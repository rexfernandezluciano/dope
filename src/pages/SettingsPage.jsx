/** @format */

import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import { Container, Card, Form, Button, Alert, Modal, Row, Col } from "react-bootstrap";
import { Shield, Bell, Eye, Globe, People, Lock, Trash } from "react-bootstrap-icons";

import { userAPI, authAPI } from "../config/ApiConfig";
import { removeAuthToken } from "../utils/app-utils";

const SettingsPage = () => {
	const { username } = useParams();
	const loaderData = useLoaderData() || {};
	const { user } = loaderData;
	const navigate = useNavigate();
	const [settings, setSettings] = useState({
		name: "",
		bio: "",
		photoURL: "",
		privacy: {
			profile: "public",
			comments: "public",
			sharing: true,
			chat: "public"
		}
	});
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("success");
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	useEffect(() => {
		if (user) {
			setSettings({
				name: user.name || "",
				bio: user.bio || "",
				photoURL: user.photoURL || "",
				privacy: user.privacy || {
					profile: "public",
					comments: "public",
					sharing: true,
					chat: "public"
				}
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

	// Check if user is trying to access their own settings
	if (user.username !== username) {
		return (
			<Container className="text-center py-5">
				<Alert variant="danger">
					You can only access your own settings.
				</Alert>
			</Container>
		);
	}

	const handleSaveSettings = async () => {
		try {
			setLoading(true);
			await userAPI.updateUser(username, settings);
			setMessage("Settings updated successfully!");
			setMessageType("success");
		} catch (err) {
			console.error('Error updating settings:', err);
			setMessage(err.message || 'Failed to update settings');
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = () => {
		authAPI.logout();
		removeAuthToken();
		navigate("/");
	};

	const handleDeleteAccount = async () => {
		// Note: This would need to be implemented in the API
		try {
			setLoading(true);
			// await userAPI.deleteAccount();
			removeAuthToken();
			navigate("/");
		} catch (err) {
			setMessage(err.message);
			setMessageType("danger");
		} finally {
			setLoading(false);
			setShowDeleteModal(false);
		}
	};

	const privacyOptions = [
		{ value: "public", label: "Public", icon: <Globe size={16} /> },
		{ value: "followers", label: "Followers only", icon: <People size={16} /> },
		{ value: "private", label: "Private", icon: <Lock size={16} /> }
	];

	return (
		<Container className="py-3 px-0 px-md-3">
			<h2 className="px-3 mb-4">Settings</h2>

			{message && (
				<Alert
					variant={messageType}
					dismissible
					onClose={() => setMessage("")}
					className="mb-4">
					{message}
				</Alert>
			)}

			{/* Profile Settings */}
			<Card className="mb-4">
				<Card.Header className="d-flex align-items-center gap-2">
					<Shield size={20} />
					<h5 className="mb-0">Profile Settings</h5>
				</Card.Header>
				<Card.Body>
					<Form>
						<Row>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Display Name</Form.Label>
									<Form.Control
										type="text"
										value={settings.name}
										onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
										placeholder="Your display name"
									/>
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Profile Picture URL</Form.Label>
									<Form.Control
										type="url"
										value={settings.photoURL}
										onChange={(e) => setSettings(prev => ({ ...prev, photoURL: e.target.value }))}
										placeholder="https://example.com/photo.jpg"
									/>
								</Form.Group>
							</Col>
						</Row>

						<Form.Group className="mb-3">
							<Form.Label>Bio</Form.Label>
							<Form.Control
								as="textarea"
								rows={3}
								value={settings.bio}
								onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
								placeholder="Tell us about yourself"
								maxLength={160}
							/>
							<Form.Text className="text-muted">
								{settings.bio.length}/160 characters
							</Form.Text>
						</Form.Group>
					</Form>
				</Card.Body>
			</Card>

			{/* Posts */}
			<Card className="mb-4">
				<Card.Header className="d-flex align-items-center gap-2">
					<h5 className="mb-0">Posts</h5>
				</Card.Header>
				<Card.Body>
					{user.posts && user.posts.length > 0 ? (
						user.posts.map(post => (
							<div key={post.id} className="mb-3 pb-3 border-bottom">
								<div className="d-flex align-items-center mb-2">
									<img
										src={post.author.photoURL}
										alt={post.author.name}
										className="rounded-circle me-2"
										style={{ width: "40px", height: "40px" }}
									/>
									<div>
										<h6 className="mb-0">{post.author.name}</h6>
										<small className="text-muted">@{post.author.username}</small>
									</div>
								</div>
								<p>{post.content}</p>
								{post.imageUrls && post.imageUrls.length > 0 && (
									<img src={post.imageUrls[0]} alt="Post image" className="img-fluid rounded mb-2" />
								)}
								{post.liveVideoUrl && (
									<div className="embed-responsive embed-responsive-16by9 mb-2">
										<iframe
											className="embed-responsive-item"
											src={post.liveVideoUrl}
											allowFullScreen
											title="Live Video"></iframe>
									</div>
								)}
								<div className="d-flex justify-content-between">
									<small className="text-muted">{new Date(post.createdAt).toLocaleString()}</small>
									<div>
										{post._count.likes} Likes {/* Placeholder for like functionality */}
										{/* Placeholder for comment count and functionality */}
									</div>
								</div>
							</div>
						))
					) : (
						<p>No posts found.</p>
					)}
				</Card.Body>
			</Card>


			{/* Privacy Settings */}
			<Card className="mb-4">
				<Card.Header className="d-flex align-items-center gap-2">
					<Eye size={20} />
					<h5 className="mb-0">Privacy Settings</h5>
				</Card.Header>
				<Card.Body>
					<Form>
						<Form.Group className="mb-3">
							<Form.Label>Profile Visibility</Form.Label>
							<Form.Select
								value={settings.privacy.profile}
								onChange={(e) => setSettings(prev => ({
									...prev,
									privacy: { ...prev.privacy, profile: e.target.value }
								}))}>
								{privacyOptions.map(option => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Form.Select>
							<Form.Text className="text-muted">
								Who can see your profile and posts
							</Form.Text>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Comment Visibility</Form.Label>
							<Form.Select
								value={settings.privacy.comments}
								onChange={(e) => setSettings(prev => ({
									...prev,
									privacy: { ...prev.privacy, comments: e.target.value }
								}))}>
								{privacyOptions.map(option => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Form.Select>
							<Form.Text className="text-muted">
								Who can comment on your posts
							</Form.Text>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Chat Visibility</Form.Label>
							<Form.Select
								value={settings.privacy.chat}
								onChange={(e) => setSettings(prev => ({
									...prev,
									privacy: { ...prev.privacy, chat: e.target.value }
								}))}>
								{privacyOptions.map(option => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Form.Select>
							<Form.Text className="text-muted">
								Who can send you direct messages
							</Form.Text>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Check
								type="checkbox"
								label="Allow others to share your posts"
								checked={settings.privacy.sharing}
								onChange={(e) => setSettings(prev => ({
									...prev,
									privacy: { ...prev.privacy, sharing: e.target.checked }
								}))}
							/>
						</Form.Group>
					</Form>
				</Card.Body>
			</Card>

			{/* Account Settings */}
			<Card className="mb-4">
				<Card.Header className="d-flex align-items-center gap-2">
					<Bell size={20} />
					<h5 className="mb-0">Account Settings</h5>
				</Card.Header>
				<Card.Body>
					<div className="d-flex flex-column gap-3">
						<div className="d-flex justify-content-between align-items-center">
							<div>
								<h6 className="mb-1">Email</h6>
								<p className="text-muted mb-0">{user?.email}</p>
							</div>
							<div>
								{user?.hasVerifiedEmail ? (
									<span className="badge bg-success">Verified</span>
								) : (
									<span className="badge bg-warning">Unverified</span>
								)}
							</div>
						</div>

						<div className="d-flex justify-content-between align-items-center">
							<div>
								<h6 className="mb-1">Username</h6>
								<p className="text-muted mb-0">@{user?.username}</p>
							</div>
						</div>

						<div className="d-flex justify-content-between align-items-center">
							<div>
								<h6 className="mb-1">Subscription</h6>
								<p className="text-muted mb-0 text-capitalize">{user?.subscription || 'free'}</p>
							</div>
							{user?.hasBlueCheck && (
								<span className="text-primary fs-5">✓</span>
							)}
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Action Buttons */}
			<div className="px-3 d-grid gap-2">
				<Button
					variant="primary"
					size="md"
					onClick={handleSaveSettings}
					disabled={loading}>
					{loading ? "Saving..." : "Save Settings"}
				</Button>

				<Button
					variant="outline-secondary"
					size="md"
					onClick={handleLogout}>
					Logout
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
		</Container>
	);
};

export default SettingsPage;