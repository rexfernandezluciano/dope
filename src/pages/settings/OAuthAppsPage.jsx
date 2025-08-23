
/** @format */

import { useState, useEffect } from "react";
import {
	Container,
	Row,
	Col,
	Card,
	Button,
	Table,
	Modal,
	Form,
	Alert,
	Badge,
	Spinner,
} from "react-bootstrap";
import {
	Plus,
	Trash,
	Eye,
	EyeSlash,
	Key,
	Globe,
	Lock,
} from "react-bootstrap-icons";
import { oauthAPI } from "../../config/ApiConfig";

const OAuthAppsPage = () => {
	const [apps, setApps] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [selectedApp, setSelectedApp] = useState(null);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		website: "",
		redirectUris: "",
		scopes: ["read"],
		confidential: true,
	});

	const [showSecret, setShowSecret] = useState({});

	useEffect(() => {
		loadApps();
	}, []);

	const loadApps = async () => {
		try {
			setLoading(true);
			const response = await oauthAPI.getApps();
			setApps(response.apps || []);
		} catch (error) {
			setError("Failed to load OAuth apps");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateApp = async (e) => {
		e.preventDefault();
		try {
			setError("");
			setSuccess("");

			const appData = {
				...formData,
				redirectUris: formData.redirectUris
					.split("\n")
					.map((uri) => uri.trim())
					.filter((uri) => uri),
			};

			const response = await oauthAPI.createApp(appData);
			setSuccess("OAuth app created successfully");
			setShowCreateModal(false);
			setFormData({
				name: "",
				description: "",
				website: "",
				redirectUris: "",
				scopes: ["read"],
				confidential: true,
			});
			loadApps();
		} catch (error) {
			setError(error.message || "Failed to create OAuth app");
		}
	};

	const handleDeleteApp = async (appId) => {
		if (!window.confirm("Are you sure you want to delete this OAuth app?")) {
			return;
		}

		try {
			await oauthAPI.deleteApp(appId);
			setSuccess("OAuth app deleted successfully");
			loadApps();
		} catch (error) {
			setError("Failed to delete OAuth app");
		}
	};

	const handleRegenerateSecret = async (appId) => {
		if (
			!window.confirm(
				"Are you sure you want to regenerate the client secret? This will invalidate the current secret."
			)
		) {
			return;
		}

		try {
			const response = await oauthAPI.regenerateSecret(appId);
			setSuccess("Client secret regenerated successfully");
			loadApps();
		} catch (error) {
			setError("Failed to regenerate client secret");
		}
	};

	const toggleSecretVisibility = (appId) => {
		setShowSecret((prev) => ({
			...prev,
			[appId]: !prev[appId],
		}));
	};

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		setSuccess("Copied to clipboard");
	};

	const getStatusBadge = (status) => {
		const variants = {
			active: "success",
			pending: "warning",
			suspended: "danger",
		};
		return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
	};

	if (loading) {
		return (
			<Container className="py-4">
				<div className="text-center">
					<Spinner animation="border" />
					<p className="mt-2">Loading OAuth apps...</p>
				</div>
			</Container>
		);
	}

	return (
		<Container className="py-4">
			<Row>
				<Col>
					<div className="d-flex justify-content-between align-items-center mb-4">
						<div>
							<h3>OAuth Applications</h3>
							<p className="text-muted">
								Manage your OAuth applications and API access
							</p>
						</div>
						<Button
							variant="primary"
							onClick={() => setShowCreateModal(true)}
						>
							<Plus className="me-2" />
							New App
						</Button>
					</div>

					{error && <Alert variant="danger">{error}</Alert>}
					{success && <Alert variant="success">{success}</Alert>}

					{apps.length === 0 ? (
						<Card className="text-center py-5">
							<Card.Body>
								<h5>No OAuth Apps</h5>
								<p className="text-muted">
									Create your first OAuth application to get started with the API
								</p>
								<Button
									variant="primary"
									onClick={() => setShowCreateModal(true)}
								>
									Create App
								</Button>
							</Card.Body>
						</Card>
					) : (
						<Card>
							<Card.Body>
								<Table responsive>
									<thead>
										<tr>
											<th>Application</th>
											<th>Client ID</th>
											<th>Status</th>
											<th>Created</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										{apps.map((app) => (
											<tr key={app.id}>
												<td>
													<div>
														<strong>{app.name}</strong>
														{app.website && (
															<div>
																<small className="text-muted">
																	<Globe className="me-1" size={12} />
																	{app.website}
																</small>
															</div>
														)}
													</div>
												</td>
												<td>
													<code className="small">{app.clientId}</code>
													<Button
														variant="link"
														size="sm"
														onClick={() => copyToClipboard(app.clientId)}
													>
														Copy
													</Button>
												</td>
												<td>{getStatusBadge(app.status)}</td>
												<td>
													<small className="text-muted">
														{new Date(app.createdAt).toLocaleDateString()}
													</small>
												</td>
												<td>
													<Button
														variant="outline-primary"
														size="sm"
														className="me-2"
														onClick={() => {
															setSelectedApp(app);
															setShowDetailsModal(true);
														}}
													>
														View
													</Button>
													<Button
														variant="outline-danger"
														size="sm"
														onClick={() => handleDeleteApp(app.id)}
													>
														<Trash size={14} />
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</Table>
							</Card.Body>
						</Card>
					)}
				</Col>
			</Row>

			{/* Create App Modal */}
			<Modal
				show={showCreateModal}
				onHide={() => setShowCreateModal(false)}
				size="lg"
			>
				<Modal.Header closeButton>
					<Modal.Title>Create OAuth Application</Modal.Title>
				</Modal.Header>
				<Form onSubmit={handleCreateApp}>
					<Modal.Body>
						<Row>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Application Name *</Form.Label>
									<Form.Control
										type="text"
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										required
									/>
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Website</Form.Label>
									<Form.Control
										type="url"
										value={formData.website}
										onChange={(e) =>
											setFormData({ ...formData, website: e.target.value })
										}
									/>
								</Form.Group>
							</Col>
						</Row>

						<Form.Group className="mb-3">
							<Form.Label>Description</Form.Label>
							<Form.Control
								as="textarea"
								rows={3}
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
							/>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Redirect URIs *</Form.Label>
							<Form.Control
								as="textarea"
								rows={3}
								value={formData.redirectUris}
								onChange={(e) =>
									setFormData({ ...formData, redirectUris: e.target.value })
								}
								placeholder="https://yourapp.com/callback&#10;https://yourapp.com/oauth/callback"
								required
							/>
							<Form.Text className="text-muted">
								One URI per line. Must be HTTPS for production apps.
							</Form.Text>
						</Form.Group>

						<Row>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Scopes</Form.Label>
									<Form.Select
										multiple
										value={formData.scopes}
										onChange={(e) =>
											setFormData({
												...formData,
												scopes: Array.from(
													e.target.selectedOptions,
													(option) => option.value
												),
											})
										}
									>
										<option value="read">Read</option>
										<option value="write">Write</option>
										<option value="follow">Follow</option>
										<option value="admin">Admin</option>
									</Form.Select>
									<Form.Text className="text-muted">
										Hold Ctrl/Cmd to select multiple scopes
									</Form.Text>
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Client Type</Form.Label>
									<Form.Select
										value={formData.confidential ? "confidential" : "public"}
										onChange={(e) =>
											setFormData({
												...formData,
												confidential: e.target.value === "confidential",
											})
										}
									>
										<option value="confidential">
											Confidential (Server-side apps)
										</option>
										<option value="public">Public (Mobile/SPA apps)</option>
									</Form.Select>
								</Form.Group>
							</Col>
						</Row>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => setShowCreateModal(false)}>
							Cancel
						</Button>
						<Button type="submit" variant="primary">
							Create Application
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>

			{/* App Details Modal */}
			<Modal
				show={showDetailsModal}
				onHide={() => setShowDetailsModal(false)}
				size="lg"
			>
				<Modal.Header closeButton>
					<Modal.Title>
						{selectedApp?.name} - Application Details
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{selectedApp && (
						<div>
							<Row className="mb-3">
								<Col md={6}>
									<strong>Client ID:</strong>
									<div className="d-flex align-items-center">
										<code className="me-2">{selectedApp.clientId}</code>
										<Button
											variant="outline-secondary"
											size="sm"
											onClick={() => copyToClipboard(selectedApp.clientId)}
										>
											Copy
										</Button>
									</div>
								</Col>
								<Col md={6}>
									<strong>Status:</strong>
									<div>{getStatusBadge(selectedApp.status)}</div>
								</Col>
							</Row>

							{selectedApp.confidential && (
								<Row className="mb-3">
									<Col>
										<strong>Client Secret:</strong>
										<div className="d-flex align-items-center">
											<code className="me-2">
												{showSecret[selectedApp.id]
													? selectedApp.clientSecret
													: "••••••••••••••••"}
											</code>
											<Button
												variant="outline-secondary"
												size="sm"
												className="me-2"
												onClick={() => toggleSecretVisibility(selectedApp.id)}
											>
												{showSecret[selectedApp.id] ? (
													<EyeSlash size={14} />
												) : (
													<Eye size={14} />
												)}
											</Button>
											<Button
												variant="outline-secondary"
												size="sm"
												className="me-2"
												onClick={() =>
													copyToClipboard(selectedApp.clientSecret)
												}
											>
												Copy
											</Button>
											<Button
												variant="outline-warning"
												size="sm"
												onClick={() => handleRegenerateSecret(selectedApp.id)}
											>
												<Key size={14} className="me-1" />
												Regenerate
											</Button>
										</div>
									</Col>
								</Row>
							)}

							<Row className="mb-3">
								<Col>
									<strong>Redirect URIs:</strong>
									<ul className="list-unstyled mt-1">
										{selectedApp.redirectUris?.map((uri, index) => (
											<li key={index}>
												<code>{uri}</code>
											</li>
										))}
									</ul>
								</Col>
							</Row>

							<Row className="mb-3">
								<Col md={6}>
									<strong>Scopes:</strong>
									<div>
										{selectedApp.scopes?.map((scope) => (
											<Badge key={scope} bg="secondary" className="me-1">
												{scope}
											</Badge>
										))}
									</div>
								</Col>
								<Col md={6}>
									<strong>Client Type:</strong>
									<div>
										{selectedApp.confidential ? (
											<Badge bg="info">
												<Lock className="me-1" size={12} />
												Confidential
											</Badge>
										) : (
											<Badge bg="warning">
												<Globe className="me-1" size={12} />
												Public
											</Badge>
										)}
									</div>
								</Col>
							</Row>

							{selectedApp.description && (
								<Row className="mb-3">
									<Col>
										<strong>Description:</strong>
										<p className="mt-1">{selectedApp.description}</p>
									</Col>
								</Row>
							)}

							<Row>
								<Col>
									<strong>Created:</strong>
									<div>{new Date(selectedApp.createdAt).toLocaleString()}</div>
								</Col>
							</Row>
						</div>
					)}
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() => setShowDetailsModal(false)}
					>
						Close
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
};

export default OAuthAppsPage;
