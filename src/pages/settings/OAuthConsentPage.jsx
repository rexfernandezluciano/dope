/** @format */

import { useState, useEffect } from "react";
import {
	Container,
	Row,
	Col,
	Card,
	Button,
	Table,
	Alert,
	Badge,
	Spinner,
	Modal,
} from "react-bootstrap";
import { Check, X, Eye, Clock } from "react-bootstrap-icons";
import { useLoaderData } from "react-router-dom";
import { Adsense } from "@ctrl/react-adsense";
import { oauthAPI } from "../../config/ApiConfig";

const OAuthConsentPage = () => {
	const { user } = useLoaderData();
	const [authorizations, setAuthorizations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [selectedAuth, setSelectedAuth] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);

	useEffect(() => {
		loadAuthorizations();
	}, []);

	const loadAuthorizations = async () => {
		try {
			setLoading(true);
			const response = await oauthAPI.getAuthorizations();
			setAuthorizations(response.authorizations || []);
		} catch (error) {
			setError("Failed to load OAuth authorizations");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const handleRevokeAuthorization = async (authId) => {
		if (
			!window.confirm(
				"Are you sure you want to revoke this authorization? The application will lose access to your account.",
			)
		) {
			return;
		}

		try {
			await oauthAPI.revokeAuthorization(authId);
			setSuccess("Authorization revoked successfully");
			loadAuthorizations();
		} catch (error) {
			setError("Failed to revoke authorization");
		}
	};

	const getStatusBadge = (status) => {
		const variants = {
			active: "success",
			revoked: "danger",
			expired: "warning",
		};
		const icons = {
			active: <Check size={12} className="me-1" />,
			revoked: <X size={12} className="me-1" />,
			expired: <Clock size={12} className="me-1" />,
		};

		return (
			<Badge bg={variants[status] || "secondary"}>
				{icons[status]}
				{status}
			</Badge>
		);
	};

	const getScopeDescription = (scope) => {
		const descriptions = {
			read: "Read your posts, profile, and followers",
			write: "Create and edit posts on your behalf",
			follow: "Follow and unfollow users on your behalf",
			admin: "Full admin access to your account",
		};
		return descriptions[scope] || scope;
	};

	if (loading) {
		return (
			<Container className="py-4">
				<div className="text-center">
					<Spinner animation="border" />
					<p className="mt-2">Loading OAuth authorizations...</p>
				</div>
			</Container>
		);
	}

	return (
		<Container className="py-4">
			<Row>
				<Col>
					<div className="mb-4">
						<h3>OAuth Authorizations</h3>
						<p className="text-muted">
							Manage applications that have access to your account
						</p>
					</div>

					{error && <Alert variant="danger">{error}</Alert>}
					{success && <Alert variant="success">{success}</Alert>}

					{authorizations.length === 0 ? (
						<Card className="text-center py-5">
							<Card.Body>
								<h5>No OAuth Authorizations</h5>
								<p className="text-muted">
									No applications have been granted access to your account yet
								</p>
							</Card.Body>
						</Card>
					) : (
						<Card>
							<Card.Body>
								<Table responsive>
									<thead>
										<tr>
											<th>Application</th>
											<th>Scopes</th>
											<th>Status</th>
											<th>Authorized</th>
											<th>Last Used</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										{authorizations.map((auth) => (
											<tr key={auth.id}>
												<td>
													<div>
														<strong>{auth.application.name}</strong>
														{auth.application.website && (
															<div>
																<small className="text-muted">
																	{auth.application.website}
																</small>
															</div>
														)}
													</div>
												</td>
												<td>
													<div>
														{auth.scope.split(" ").map((scope) => (
															<Badge
																key={scope}
																bg="light"
																text="dark"
																className="me-1 mb-1"
															>
																{scope}
															</Badge>
														))}
													</div>
												</td>
												<td>{getStatusBadge(auth.status)}</td>
												<td>
													<small className="text-muted">
														{new Date(auth.createdAt).toLocaleDateString()}
													</small>
												</td>
												<td>
													<small className="text-muted">
														{auth.lastUsedAt
															? new Date(auth.lastUsedAt).toLocaleDateString()
															: "Never"}
													</small>
												</td>
												<td>
													<Button
														variant="outline-primary"
														size="sm"
														className="me-2"
														onClick={() => {
															setSelectedAuth(auth);
															setShowDetailsModal(true);
														}}
													>
														<Eye size={14} />
													</Button>
													{auth.status === "active" && (
														<Button
															variant="outline-danger"
															size="sm"
															onClick={() => handleRevokeAuthorization(auth.id)}
														>
															Revoke
														</Button>
													)}
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

			{/* Authorization Details Modal */}
			<Modal
				show={showDetailsModal}
				onHide={() => setShowDetailsModal(false)}
				size="lg"
			>
				<Modal.Header closeButton>
					<Modal.Title>Authorization Details</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{selectedAuth && (
						<div>
							<Row className="mb-3">
								<Col>
									<h5>{selectedAuth.application.name}</h5>
									{selectedAuth.application.description && (
										<p className="text-muted">
											{selectedAuth.application.description}
										</p>
									)}
									{selectedAuth.application.website && (
										<p>
											<strong>Website:</strong>{" "}
											<a
												href={selectedAuth.application.website}
												target="_blank"
												rel="noopener noreferrer"
											>
												{selectedAuth.application.website}
											</a>
										</p>
									)}
								</Col>
							</Row>

							<Row className="mb-3">
								<Col>
									<strong>Status:</strong>
									<div className="mt-1">
										{getStatusBadge(selectedAuth.status)}
									</div>
								</Col>
							</Row>

							<Row className="mb-3">
								<Col>
									<strong>Granted Permissions:</strong>
									<div className="mt-2">
										{selectedAuth.scope.split(" ").map((scope) => (
											<div key={scope} className="mb-2">
												<Badge bg="primary" className="me-2">
													{scope}
												</Badge>
												<span className="text-muted">
													{getScopeDescription(scope)}
												</span>
											</div>
										))}
									</div>
								</Col>
							</Row>

							<Row className="mb-3">
								<Col md={6}>
									<strong>Authorized:</strong>
									<div>{new Date(selectedAuth.createdAt).toLocaleString()}</div>
								</Col>
								<Col md={6}>
									<strong>Last Used:</strong>
									<div>
										{selectedAuth.lastUsedAt
											? new Date(selectedAuth.lastUsedAt).toLocaleString()
											: "Never"}
									</div>
								</Col>
							</Row>

							{selectedAuth.expiresAt && (
								<Row className="mb-3">
									<Col>
										<strong>Expires:</strong>
										<div>
											{new Date(selectedAuth.expiresAt).toLocaleString()}
										</div>
									</Col>
								</Row>
							)}

							<Alert variant="info">
								<small>
									<strong>Note:</strong> This application can access your
									account with the permissions shown above. You can revoke
									access at any time, which will immediately prevent the
									application from accessing your account.
								</small>
							</Alert>
						</div>
					)}
				</Modal.Body>
				<Modal.Footer>
					{selectedAuth?.status === "active" && (
						<Button
							variant="danger"
							onClick={() => {
								handleRevokeAuthorization(selectedAuth.id);
								setShowDetailsModal(false);
							}}
						>
							Revoke Access
						</Button>
					)}
					<Button
						variant="secondary"
						onClick={() => setShowDetailsModal(false)}
					>
						Close
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
		</Container>
	);
};

export default OAuthConsentPage;
