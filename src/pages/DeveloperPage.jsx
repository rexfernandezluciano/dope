
/** @format */

import { useState, useEffect } from "react";
import {
	Container,
	Row,
	Col,
	Card,
	Nav,
	Tab,
	Button,
	Alert,
	Badge,
	Table,
	Form,
	Modal,
} from "react-bootstrap";
import {
	Code,
	Gear,
	Key,
	BarChart,
	Book,
	Globe,
	Shield,
	Plus,
} from "react-bootstrap-icons";
import { updatePageMeta } from "../utils/meta-utils";
import { oauthAPI, businessAPI } from "../config/ApiConfig";
import OAuthAppsPage from "./settings/OAuthAppsPage";
import OAuthConsentPage from "./settings/OAuthConsentPage";

const DeveloperPage = () => {
	const [activeTab, setActiveTab] = useState("overview");
	const [stats, setStats] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showApiKeyModal, setShowApiKeyModal] = useState(false);
	const [apiKeys, setApiKeys] = useState([]);

	useEffect(() => {
		updatePageMeta({
			title: "Developer Dashboard - DOPE Network",
			description: "Manage your OAuth apps, API keys, and developer settings",
		});
		loadDeveloperStats();
		loadApiKeys();
	}, []);

	const loadDeveloperStats = async () => {
		try {
			setLoading(true);
			const response = await businessAPI.getDashboard();
			setStats(response.developer || {});
		} catch (error) {
			setError("Failed to load developer stats");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const loadApiKeys = async () => {
		try {
			const response = await oauthAPI.getApiKeys();
			setApiKeys(response.apiKeys || []);
		} catch (error) {
			console.error("Failed to load API keys:", error);
		}
	};

	const generateApiKey = async (keyData) => {
		try {
			await oauthAPI.generateApiKey(keyData);
			setShowApiKeyModal(false);
			loadApiKeys();
		} catch (error) {
			setError("Failed to generate API key");
		}
	};

	return (
		<Container fluid className="py-4">
			<Row>
				<Col>
					<div className="d-flex align-items-center mb-4">
						<Code size={32} className="me-3 text-primary" />
						<div>
							<h2>Developer Dashboard</h2>
							<p className="text-muted mb-0">
								Build amazing apps with the DOPE Network API
							</p>
						</div>
					</div>

					{error && <Alert variant="danger">{error}</Alert>}

					<Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
						<Nav variant="pills" className="mb-4">
							<Nav.Item>
								<Nav.Link eventKey="overview">
									<BarChart className="me-2" size={16} />
									Overview
								</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="oauth-apps">
									<Globe className="me-2" size={16} />
									OAuth Apps
								</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="authorizations">
									<Shield className="me-2" size={16} />
									Authorizations
								</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="api-keys">
									<Key className="me-2" size={16} />
									API Keys
								</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="documentation">
									<Book className="me-2" size={16} />
									Documentation
								</Nav.Link>
							</Nav.Item>
						</Nav>

						<Tab.Content>
							<Tab.Pane eventKey="overview">
								<Row>
									<Col lg={8}>
										<Card className="mb-4">
											<Card.Header>
												<h5 className="mb-0">API Usage Overview</h5>
											</Card.Header>
											<Card.Body>
												<Row>
													<Col md={3}>
														<div className="text-center">
															<h3 className="text-primary">
																{stats.totalApps || 0}
															</h3>
															<p className="text-muted mb-0">OAuth Apps</p>
														</div>
													</Col>
													<Col md={3}>
														<div className="text-center">
															<h3 className="text-success">
																{stats.totalRequests || 0}
															</h3>
															<p className="text-muted mb-0">API Requests</p>
														</div>
													</Col>
													<Col md={3}>
														<div className="text-center">
															<h3 className="text-info">
																{stats.totalUsers || 0}
															</h3>
															<p className="text-muted mb-0">App Users</p>
														</div>
													</Col>
													<Col md={3}>
														<div className="text-center">
															<h3 className="text-warning">
																{stats.rateLimitHits || 0}
															</h3>
															<p className="text-muted mb-0">Rate Limit Hits</p>
														</div>
													</Col>
												</Row>
											</Card.Body>
										</Card>

										<Card>
											<Card.Header>
												<h5 className="mb-0">Quick Actions</h5>
											</Card.Header>
											<Card.Body>
												<Row>
													<Col md={6} className="mb-3">
														<Card className="h-100 border-0 bg-light">
															<Card.Body className="text-center">
																<Globe size={32} className="text-primary mb-2" />
																<h6>Create OAuth App</h6>
																<p className="text-muted small">
																	Build integrations with OAuth 2.0
																</p>
																<Button
																	variant="primary"
																	size="sm"
																	onClick={() => setActiveTab("oauth-apps")}
																>
																	Get Started
																</Button>
															</Card.Body>
														</Card>
													</Col>
													<Col md={6} className="mb-3">
														<Card className="h-100 border-0 bg-light">
															<Card.Body className="text-center">
																<Key size={32} className="text-success mb-2" />
																<h6>Generate API Key</h6>
																<p className="text-muted small">
																	Direct API access for server apps
																</p>
																<Button
																	variant="success"
																	size="sm"
																	onClick={() => setShowApiKeyModal(true)}
																>
																	Generate
																</Button>
															</Card.Body>
														</Card>
													</Col>
												</Row>
											</Card.Body>
										</Card>
									</Col>

									<Col lg={4}>
										<Card className="mb-4">
											<Card.Header>
												<h6 className="mb-0">Rate Limits</h6>
											</Card.Header>
											<Card.Body>
												<div className="mb-3">
													<div className="d-flex justify-content-between">
														<span>Authentication</span>
														<Badge bg="info">5/min</Badge>
													</div>
												</div>
												<div className="mb-3">
													<div className="d-flex justify-content-between">
														<span>General API</span>
														<Badge bg="info">100/min</Badge>
													</div>
												</div>
												<div className="mb-3">
													<div className="d-flex justify-content-between">
														<span>File Upload</span>
														<Badge bg="info">10/min</Badge>
													</div>
												</div>
												<div>
													<div className="d-flex justify-content-between">
														<span>Content Moderation</span>
														<Badge bg="info">50/min</Badge>
													</div>
												</div>
											</Card.Body>
										</Card>

										<Card>
											<Card.Header>
												<h6 className="mb-0">API Status</h6>
											</Card.Header>
											<Card.Body>
												<div className="d-flex align-items-center mb-2">
													<div
														className="bg-success rounded-circle me-2"
														style={{ width: 8, height: 8 }}
													></div>
													<span>All systems operational</span>
												</div>
												<small className="text-muted">
													Last updated: {new Date().toLocaleTimeString()}
												</small>
											</Card.Body>
										</Card>
									</Col>
								</Row>
							</Tab.Pane>

							<Tab.Pane eventKey="oauth-apps">
								<OAuthAppsPage />
							</Tab.Pane>

							<Tab.Pane eventKey="authorizations">
								<OAuthConsentPage />
							</Tab.Pane>

							<Tab.Pane eventKey="api-keys">
								<Row>
									<Col>
										<div className="d-flex justify-content-between align-items-center mb-4">
											<div>
												<h4>API Keys</h4>
												<p className="text-muted">
													Manage your API keys for server-to-server authentication
												</p>
											</div>
											<Button
												variant="primary"
												onClick={() => setShowApiKeyModal(true)}
											>
												<Plus className="me-2" />
												Generate Key
											</Button>
										</div>

										{apiKeys.length === 0 ? (
											<Card className="text-center py-5">
												<Card.Body>
													<Key size={48} className="text-muted mb-3" />
													<h5>No API Keys</h5>
													<p className="text-muted">
														Generate your first API key to get started
													</p>
													<Button
														variant="primary"
														onClick={() => setShowApiKeyModal(true)}
													>
														Generate API Key
													</Button>
												</Card.Body>
											</Card>
										) : (
											<Card>
												<Card.Body>
													<Table responsive>
														<thead>
															<tr>
																<th>Name</th>
																<th>Key</th>
																<th>Scopes</th>
																<th>Created</th>
																<th>Last Used</th>
																<th>Actions</th>
															</tr>
														</thead>
														<tbody>
															{apiKeys.map((key) => (
																<tr key={key.id}>
																	<td>{key.name}</td>
																	<td>
																		<code>•••••••{key.key.slice(-8)}</code>
																	</td>
																	<td>
																		{key.scopes.map((scope) => (
																			<Badge
																				key={scope}
																				bg="secondary"
																				className="me-1"
																			>
																				{scope}
																			</Badge>
																		))}
																	</td>
																	<td>
																		{new Date(key.createdAt).toLocaleDateString()}
																	</td>
																	<td>
																		{key.lastUsedAt
																			? new Date(
																					key.lastUsedAt
																			  ).toLocaleDateString()
																			: "Never"}
																	</td>
																	<td>
																		<Button variant="outline-danger" size="sm">
																			Revoke
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
							</Tab.Pane>

							<Tab.Pane eventKey="documentation">
								<Row>
									<Col lg={8}>
										<Card>
											<Card.Header>
												<h5 className="mb-0">API Documentation</h5>
											</Card.Header>
											<Card.Body>
												<h6>Getting Started</h6>
												<p>
													The DOPE Network API uses REST principles and supports
													both OAuth 2.0 and API key authentication.
												</p>

												<h6>Base URL</h6>
												<code>https://api.dopp.eu.org/v1</code>

												<h6 className="mt-4">Authentication</h6>
												<p>Include your token in the Authorization header:</p>
												<pre className="bg-light p-3 rounded">
													<code>Authorization: Bearer YOUR_TOKEN</code>
												</pre>

												<h6 className="mt-4">Example Request</h6>
												<pre className="bg-light p-3 rounded">
													<code>
														{`curl -H "Authorization: Bearer YOUR_TOKEN" \\
  https://api.dopp.eu.org/v1/auth/me`}
													</code>
												</pre>

												<Alert variant="info" className="mt-4">
													<strong>Need more details?</strong> Check out our full
													API documentation for complete endpoint references,
													examples, and SDKs.
												</Alert>
											</Card.Body>
										</Card>
									</Col>

									<Col lg={4}>
										<Card>
											<Card.Header>
												<h6 className="mb-0">Resources</h6>
											</Card.Header>
											<Card.Body>
												<div className="d-grid gap-2">
													<Button variant="outline-primary" href="#" target="_blank">
														<Book className="me-2" size={16} />
														Full API Docs
													</Button>
													<Button variant="outline-secondary" href="#" target="_blank">
														<Code className="me-2" size={16} />
														SDKs & Libraries
													</Button>
													<Button variant="outline-info" href="#" target="_blank">
														<Gear className="me-2" size={16} />
														API Status
													</Button>
												</div>
											</Card.Body>
										</Card>
									</Col>
								</Row>
							</Tab.Pane>
						</Tab.Content>
					</Tab.Container>
				</Col>
			</Row>

			{/* API Key Generation Modal */}
			<Modal show={showApiKeyModal} onHide={() => setShowApiKeyModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Generate API Key</Modal.Title>
				</Modal.Header>
				<Form
					onSubmit={(e) => {
						e.preventDefault();
						const formData = new FormData(e.target);
						generateApiKey({
							name: formData.get("name"),
							scopes: formData.getAll("scopes"),
						});
					}}
				>
					<Modal.Body>
						<Form.Group className="mb-3">
							<Form.Label>Key Name</Form.Label>
							<Form.Control
								type="text"
								name="name"
								placeholder="My Server App"
								required
							/>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Scopes</Form.Label>
							<div>
								<Form.Check
									type="checkbox"
									name="scopes"
									value="read"
									label="Read (access public data)"
									defaultChecked
								/>
								<Form.Check
									type="checkbox"
									name="scopes"
									value="write"
									label="Write (create and edit content)"
								/>
								<Form.Check
									type="checkbox"
									name="scopes"
									value="follow"
									label="Follow (manage follows)"
								/>
							</div>
						</Form.Group>

						<Alert variant="warning">
							<small>
								<strong>Important:</strong> Store your API key securely. It will
								only be shown once after generation.
							</small>
						</Alert>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => setShowApiKeyModal(false)}>
							Cancel
						</Button>
						<Button type="submit" variant="primary">
							Generate Key
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>
		</Container>
	);
};

export default DeveloperPage;
