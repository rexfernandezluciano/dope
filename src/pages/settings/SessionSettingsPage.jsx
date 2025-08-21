/** @format */

import { useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { Container, Card, Button, Alert, Modal, Badge, Table } from "react-bootstrap";
import { Globe, Phone, Laptop, Tablet, Trash, Shield } from "react-bootstrap-icons";

import { userAPI } from "../../config/ApiConfig";

const SessionSettingsPage = () => {
	const loaderData = useLoaderData() || {};
	const { user } = loaderData;
	const [sessions, setSessions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("success");
	const [showRevokeModal, setShowRevokeModal] = useState(false);
	const [showRevokeAllModal, setShowRevokeAllModal] = useState(false);
	const [selectedSession, setSelectedSession] = useState(null);

	useEffect(() => {
		loadSessions();
	}, []);

	const loadSessions = async () => {
		try {
			setLoading(true);
			const response = await userAPI.getSessions();
			setSessions(response.sessions || []);
		} catch (err) {
			console.error('Error loading sessions:', err);
			setMessage(err.message || 'Failed to load sessions');
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
	};

	const handleRevokeSession = async (sessionId) => {
		try {
			setLoading(true);
			await userAPI.revokeSession(sessionId);
			await loadSessions(); // Reload sessions
			setMessage("Session revoked successfully!");
			setMessageType("success");
		} catch (err) {
			console.error('Error revoking session:', err);
			setMessage(err.message || 'Failed to revoke session');
			setMessageType("danger");
		} finally {
			setLoading(false);
			setShowRevokeModal(false);
			setSelectedSession(null);
		}
	};

	const handleRevokeAllSessions = async () => {
		try {
			setLoading(true);
			await userAPI.revokeAllSessions();
			await loadSessions(); // Reload sessions
			setMessage("All sessions revoked successfully! You will need to log in again on other devices.");
			setMessageType("success");
		} catch (err) {
			console.error('Error revoking all sessions:', err);
			setMessage(err.message || 'Failed to revoke all sessions');
			setMessageType("danger");
		} finally {
			setLoading(false);
			setShowRevokeAllModal(false);
		}
	};

	const getDeviceIcon = (deviceType) => {
		switch (deviceType?.toLowerCase()) {
			case 'mobile':
				return <Phone size={18} />;
			case 'tablet':
				return <Tablet size={18} />;
			case 'desktop':
				return <Laptop size={18} />;
			default:
				return <Globe size={18} />;
		}
	};

	const formatLastActivity = (timestamp) => {
		if (!timestamp) return 'Unknown';
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now - date;
		const diffMins = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} minutes ago`;
		if (diffHours < 24) return `${diffHours} hours ago`;
		if (diffDays < 7) return `${diffDays} days ago`;
		return date.toLocaleDateString();
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
					className="mb-4">
					{message}
				</Alert>
			)}

			{/* Active Sessions */}
			<Card className="mb-4">
				<Card.Header className="d-flex align-items-center justify-content-between">
					<div className="d-flex align-items-center gap-2">
						<Shield size={20} />
						<h5 className="mb-0">Active Sessions</h5>
					</div>
					<Badge bg="secondary">{sessions.length} active</Badge>
				</Card.Header>
				<Card.Body>
					{loading && sessions.length === 0 ? (
						<div className="text-center py-3">
							<div className="spinner-border spinner-border-sm me-2" />
							Loading sessions...
						</div>
					) : sessions.length === 0 ? (
						<div className="text-center py-3 text-muted">
							No active sessions found
						</div>
					) : (
						<div className="table-responsive">
							<Table hover className="mb-0">
								<thead>
									<tr>
										<th>Device</th>
										<th>Location</th>
										<th>IP Address</th>
										<th>Last Activity</th>
										<th>Status</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{sessions.map((session) => (
										<tr key={session.id}>
											<td>
												<div className="d-flex align-items-center gap-2">
													{getDeviceIcon(session.deviceType)}
													<div>
														<div className="fw-medium">
															{session.deviceName || session.userAgent || 'Unknown Device'}
														</div>
														<small className="text-muted">
															{session.browser} on {session.os}
														</small>
													</div>
												</div>
											</td>
											<td>
												<div>
													{session.location ? (
														<div>{session.location}</div>
													) : (
														<span className="text-muted">Unknown</span>
													)}
												</div>
											</td>
											<td>
												<code className="small">{session.ipAddress || 'Unknown'}</code>
											</td>
											<td>
												<div>{formatLastActivity(session.lastActivity)}</div>
												<small className="text-muted">
													Created: {new Date(session.createdAt).toLocaleDateString()}
												</small>
											</td>
											<td>
												{session.isCurrent ? (
													<Badge bg="success">Current Session</Badge>
												) : (
													<Badge bg="secondary">Active</Badge>
												)}
											</td>
											<td>
												{!session.isCurrent && (
													<Button
														variant="outline-danger"
														size="sm"
														onClick={() => {
															setSelectedSession(session);
															setShowRevokeModal(true);
														}}
														disabled={loading}
													>
														<Trash size={14} className="me-1" />
														Revoke
													</Button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</Table>
						</div>
					)}
				</Card.Body>
			</Card>

			{/* Security Actions */}
			<Card>
				<Card.Header>
					<h5 className="mb-0">Security Actions</h5>
				</Card.Header>
				<Card.Body>
					<div className="d-grid gap-2">
						<div className="d-flex justify-content-between align-items-center p-3 border rounded">
							<div>
								<h6 className="mb-1">Revoke All Other Sessions</h6>
								<p className="text-muted mb-0 small">
									Sign out from all devices except this one. You'll need to log in again on other devices.
								</p>
							</div>
							<Button
								variant="outline-danger"
								onClick={() => setShowRevokeAllModal(true)}
								disabled={loading || sessions.filter(s => !s.isCurrent).length === 0}
							>
								Revoke All
							</Button>
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Revoke Single Session Modal */}
			<Modal show={showRevokeModal} onHide={() => setShowRevokeModal(false)} centered>
				<Modal.Header closeButton>
					<Modal.Title>Revoke Session</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{selectedSession && (
						<div>
							<p>Are you sure you want to revoke this session?</p>
							<div className="bg-light p-3 rounded">
								<div className="d-flex align-items-center gap-2 mb-2">
									{getDeviceIcon(selectedSession.deviceType)}
									<strong>{selectedSession.deviceName || 'Unknown Device'}</strong>
								</div>
								<div className="small text-muted">
									<div>IP: {selectedSession.ipAddress}</div>
									<div>Last active: {formatLastActivity(selectedSession.lastActivity)}</div>
								</div>
							</div>
							<p className="mt-3 mb-0">
								<strong>This action cannot be undone.</strong> The user will be signed out from this device.
							</p>
						</div>
					)}
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowRevokeModal(false)}>
						Cancel
					</Button>
					<Button
						variant="danger"
						onClick={() => handleRevokeSession(selectedSession?.id)}
						disabled={loading}
					>
						{loading ? 'Revoking...' : 'Revoke Session'}
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Revoke All Sessions Modal */}
			<Modal show={showRevokeAllModal} onHide={() => setShowRevokeAllModal(false)} centered>
				<Modal.Header closeButton>
					<Modal.Title className="text-danger">Revoke All Sessions</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>Are you sure you want to revoke all other sessions?</p>
					<p className="text-warning">
						<strong>This will sign you out from all devices except this one.</strong>
						You'll need to log in again on other devices.
					</p>
					<p className="mb-0">
						Sessions to be revoked: <strong>{sessions.filter(s => !s.isCurrent).length}</strong>
					</p>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowRevokeAllModal(false)}>
						Cancel
					</Button>
					<Button
						variant="danger"
						onClick={handleRevokeAllSessions}
						disabled={loading}
					>
						{loading ? 'Revoking...' : 'Revoke All Sessions'}
					</Button>
				</Modal.Footer>
			</Modal>
		</div>
	);
};

export default SessionSettingsPage;