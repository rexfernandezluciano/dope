/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	Container,
	Row,
	Col,
	Card,
	Button,
	Alert,
	Badge,
	Spinner,
} from "react-bootstrap";
import { Shield, CheckCircle, XCircle } from "react-bootstrap-icons";
import { oauthAPI, authAPI } from "../../config/ApiConfig";
import { updatePageMeta } from "../../utils/meta-utils";

const OAuthAuthorizePage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [authorizing, setAuthorizing] = useState(false);
	const [error, setError] = useState("");
	const [appInfo, setAppInfo] = useState(null);
	const [user, setUser] = useState(null);
	const [selectedScopes, setSelectedScopes] = useState([]);

	// OAuth parameters from URL
	const clientId = searchParams.get("client_id");
	const redirectUri = searchParams.get("redirect_uri");
	const scope = searchParams.get("scope") || "read";
	const state = searchParams.get("state");
	const responseType = searchParams.get("response_type");
	const codeChallenge = searchParams.get("code_challenge");
	const codeChallengeMethod = searchParams.get("code_challenge_method");

	useEffect(() => {
		updatePageMeta({
			title: "Authorize Application - DOPE Network",
			description: "Authorize third-party application access",
		});

		loadAuthorizationData();
	}, []);

	const loadAuthorizationData = async () => {
		try {
			setLoading(true);
			setError("");

			// Validate required OAuth parameters
			if (!clientId || !redirectUri || !responseType) {
				setError("Invalid authorization request. Missing required parameters.");
				return;
			}

			if (responseType !== "code") {
				setError("Unsupported response type. Only 'code' is supported.");
				return;
			}

			// Load current user info
			const userResponse = await authAPI.getCurrentUser();
			setUser(userResponse.user);

			// Load app information
			const appResponse = await oauthAPI.getAppInfo(clientId);
			setAppInfo(appResponse.application || appResponse.app);

			// Initialize selected scopes with requested scopes
			const requestedScopes = scope.split(" ").filter(s => s);
			setSelectedScopes(requestedScopes);

		} catch (err) {
			console.error("Failed to load authorization data:", err);
			setError("Failed to load authorization information. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleAuthorize = async () => {
		try {
			setAuthorizing(true);
			setError("");

			const authorizationData = {
				client_id: clientId,
				redirect_uri: redirectUri,
				scope: selectedScopes.join(" "),
				state: state,
				response_type: responseType,
				code_challenge: codeChallenge,
				code_challenge_method: codeChallengeMethod,
			};

			// Request authorization (this will need backend implementation)
			const response = await oauthAPI.authorize(authorizationData);

			if (response.authorization_code) {
				// Redirect back to the application with authorization code
				const redirectUrl = new URL(redirectUri);
				redirectUrl.searchParams.set("code", response.authorization_code);
				if (state) {
					redirectUrl.searchParams.set("state", state);
				}

				window.location.href = redirectUrl.toString();
			} else {
				setError("Authorization failed. Please try again.");
			}

		} catch (err) {
			console.error("Authorization failed:", err);
			setError(err.message || "Authorization failed. Please try again.");
		} finally {
			setAuthorizing(false);
		}
	};

	const handleReject = () => {
		// Redirect back to the application with error
		const redirectUrl = new URL(redirectUri);
		redirectUrl.searchParams.set("error", "access_denied");
		redirectUrl.searchParams.set("error_description", "User denied authorization");
		if (state) {
			redirectUrl.searchParams.set("state", state);
		}

		window.location.href = redirectUrl.toString();
	};

	const getScopeDescription = (scopeName) => {
		const descriptions = {
			read: "Read your posts, profile, and followers",
			write: "Create and edit posts on your behalf",
			follow: "Follow and unfollow users on your behalf",
			admin: "Full admin access to your account",
		};
		return descriptions[scopeName] || scopeName;
	};

	const getScopeIcon = (scopeName) => {
		const icons = {
			read: "👁️",
			write: "✏️",
			follow: "👥",
			admin: "⚡",
		};
		return icons[scopeName] || "🔑";
	};

	if (loading) {
		return (
			<Container className="py-4">
				<Row className="justify-content-center">
					<Col md={6}>
						<div className="text-center">
							<Spinner animation="border" />
							<p className="mt-2">Loading authorization request...</p>
						</div>
					</Col>
				</Row>
			</Container>
		);
	}

	if (error && !appInfo) {
		return (
			<Container className="py-4">
				<Row className="justify-content-center">
					<Col md={6}>
						<Alert variant="danger">
							<XCircle className="me-2" />
							{error}
						</Alert>
						<div className="text-center">
							<Button variant="secondary" onClick={() => navigate("/home")}>
								Return to Home
							</Button>
						</div>
					</Col>
				</Row>
			</Container>
		);
	}

	return (
		<Container className="py-4">
			<Row className="justify-content-center">
				<Col md={8} lg={6}>
					<Card className="shadow">
						<Card.Header className="bg-primary text-white text-center">
							<Shield size={24} className="me-2" />
							<h5 className="mb-0">Authorize Application</h5>
						</Card.Header>
						<Card.Body className="p-4">
							{error && (
								<Alert variant="danger" className="mb-3">
									{error}
								</Alert>
							)}

							{appInfo && user && (
								<>
									<div className="text-center mb-4">
										<h4 className="text-primary">{appInfo.name}</h4>
										{appInfo.description && (
											<p className="text-muted">{appInfo.description}</p>
										)}
										{appInfo.website && (
											<p className="small">
												<a
													href={appInfo.website}
													target="_blank"
													rel="noopener noreferrer"
													className="text-decoration-none"
												>
													{appInfo.website}
												</a>
											</p>
										)}
									</div>

									<Alert variant="info" className="mb-4">
										<div className="d-flex align-items-center">
											<CheckCircle className="me-2" />
											<div>
												<strong>{appInfo.name}</strong> wants to access your{" "}
												<strong>@{user.username}</strong> account
											</div>
										</div>
									</Alert>

									<div className="mb-4">
										<h6 className="mb-3">This application will be able to:</h6>
										<div className="list-group list-group-flush">
											{selectedScopes.map((scopeName) => (
												<div
													key={scopeName}
													className="list-group-item border-0 px-0"
												>
													<div className="d-flex align-items-center">
														<span className="me-3" style={{ fontSize: "1.2em" }}>
															{getScopeIcon(scopeName)}
														</span>
														<div>
															<Badge bg="secondary" className="me-2">
																{scopeName}
															</Badge>
															<span className="text-muted">
																{getScopeDescription(scopeName)}
															</span>
														</div>
													</div>
												</div>
											))}
										</div>
									</div>

									<Alert variant="warning" className="mb-4">
										<small>
											<strong>Important:</strong> Only authorize applications you
											trust. You can revoke access at any time from your account
											settings.
										</small>
									</Alert>

									<div className="d-grid gap-2">
										<Button
											variant="success"
											size="lg"
											onClick={handleAuthorize}
											disabled={authorizing}
											className="d-flex align-items-center justify-content-center"
										>
											{authorizing ? (
												<>
													<Spinner animation="border" size="sm" className="me-2" />
													Authorizing...
												</>
											) : (
												<>
													<CheckCircle className="me-2" />
													Authorize {appInfo.name}
												</>
											)}
										</Button>
										<Button
											variant="outline-danger"
											size="lg"
											onClick={handleReject}
											disabled={authorizing}
											className="d-flex align-items-center justify-content-center"
										>
											<XCircle className="me-2" />
											Deny Access
										</Button>
									</div>

									<div className="text-center mt-3">
										<small className="text-muted">
											By authorizing, you agree to share the requested
											information with {appInfo.name}
										</small>
									</div>
								</>
							)}
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default OAuthAuthorizePage;