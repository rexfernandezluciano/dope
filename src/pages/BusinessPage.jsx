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
	ProgressBar,
} from "react-bootstrap";
import {
	BarChart,
	Plus,
	Eye,
	Bullseye,
	CurrencyDollar,
	Wallet,
	ArrowUpCircle,
} from "react-bootstrap-icons";
import { updatePageMeta } from "../utils/meta-utils";
import { businessAPI, postAPI, authAPI } from "../config/ApiConfig";

const BusinessPage = () => {
	const [activeTab, setActiveTab] = useState("overview");
	const [dashboard, setDashboard] = useState({});
	const [campaigns, setCampaigns] = useState([]);
	const [credits, setCredits] = useState({ credits: 0, creditsDisplay: 0 });
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showCreditsModal, setShowCreditsModal] = useState(false);
	const [paymentMethodId, setPaymentMethodId] = useState("");
	const [selectedPackage, setSelectedPackage] = useState(null);
	const [creditsPackages, setCreditsPackages] = useState([]);
	const [paymentMethods, setPaymentMethods] = useState([]);
	const [modalError, setModalError] = useState("");
	const [modalSuccess, setModalSuccess] = useState("");
	const [purchaseLoading, setPurchaseLoading] = useState(false);
	const [campaignForm, setCampaignForm] = useState({
		title: "",
		description: "",
		targetType: "post",
		targetId: "",
		budget: "",
		duration: 7,
		adType: "promotion",
		targetAudience: {
			age: [18, 65],
			interests: [],
		},
	});
	const [availablePosts, setAvailablePosts] = useState([]);
	const [availableProfiles, setAvailableProfiles] = useState([]);
	const [loadingTargets, setLoadingTargets] = useState(false);

	const [hasInitialized, setHasInitialized] = useState(false);

	useEffect(() => {
		if (!hasInitialized) {
			updatePageMeta({
				title: "Business Dashboard - DOPE Network",
				description: "Manage your ad campaigns and business analytics",
			});
			
			// Prevent multiple calls by batching them
			const initializeData = async () => {
				try {
					await Promise.all([
						loadBusinessData(),
						loadCredits(),
						loadPaymentMethods(),
						loadCreditsPackages()
					]);
				} catch (error) {
					console.error('Failed to initialize business data:', error);
				}
			};
			
			initializeData();
			setHasInitialized(true);

			// Check for PayPal payment completion
			const urlParams = new URLSearchParams(window.location.search);
			const paymentStatus = urlParams.get("payment");
			const paymentId = urlParams.get("paymentId");

			if (paymentStatus === "success" && paymentId) {
				setSuccess(
					"Payment completed successfully! Your credits have been added to your account.",
				);
				// Reload credits after successful payment
				setTimeout(() => loadCredits(), 1000);

				// Clean up URL parameters
				const newUrl = window.location.pathname;
				window.history.replaceState({}, "", newUrl);
			} else if (paymentStatus === "cancelled") {
				setError("Payment was cancelled. Your credits were not purchased.");

				// Clean up URL parameters
				const newUrl = window.location.pathname;
				window.history.replaceState({}, "", newUrl);
			} else if (paymentStatus === "failed") {
				setError("Payment failed. Please try again or contact support.");

				// Clean up URL parameters
				const newUrl = window.location.pathname;
				window.history.replaceState({}, "", newUrl);
			}
		}
	}, [hasInitialized]);

	const loadBusinessData = async () => {
		try {
			const [dashboardResponse, campaignsResponse] = await Promise.all([
				businessAPI.getDashboard(),
				businessAPI.getCampaigns(),
			]);
			setDashboard(dashboardResponse);
			setCampaigns(campaignsResponse.campaigns || []);
		} catch (error) {
			setError("Failed to load business data");
			console.error(error);
		}
	};

	const loadCredits = async () => {
		try {
			const creditsResponse = await businessAPI.getCredits();
			setCredits(creditsResponse);
		} catch (error) {
			setError("Failed to load credits");
			console.error(error);
		}
	};

	const loadPaymentMethods = async () => {
		try {
			const response = await businessAPI.getPaymentMethods();
			setPaymentMethods(response.paymentMethods || []);
			// Set default payment method if available
			if (response.paymentMethods && response.paymentMethods.length > 0) {
				const defaultMethod = response.paymentMethods.find(
					(method) => method.isDefault,
				);
				if (defaultMethod) {
					setPaymentMethodId(defaultMethod.id);
				} else {
					setPaymentMethodId(response.paymentMethods[0].id);
				}
			}
		} catch (error) {
			console.error("Failed to load payment methods:", error);
			// Don't show error for missing payment methods as user might not have any yet
		}
	};

	const loadCreditsPackages = async () => {
		try {
			const response = await businessAPI.getCreditsPackages();
			setCreditsPackages(response.packages || []);
		} catch (error) {
			console.error("Failed to load credits packages:", error);
		}
	};

	const loadPosts = async () => {
		try {
			setLoadingTargets(true);
			const response = await postAPI.getPosts(1, 50, { sortBy: "recent" });
			setAvailablePosts(response.posts || []);
		} catch (error) {
			console.error("Failed to load posts:", error);
		} finally {
			setLoadingTargets(false);
		}
	};

	const loadProfiles = async () => {
		try {
			setLoadingTargets(true);
			// Get current user's profile only
			const response = await authAPI.me();
			if (response) {
				setAvailableProfiles([response]);
			} else {
				setAvailableProfiles([]);
			}
		} catch (error) {
			console.error("Failed to load user profile:", error);
			setAvailableProfiles([]);
		} finally {
			setLoadingTargets(false);
		}
	};

	const handleTargetTypeChange = (targetType) => {
		setCampaignForm({
			...campaignForm,
			targetType,
			targetId: "", // Reset target ID when type changes
		});

		// Load appropriate data based on target type
		if (targetType === "post" && availablePosts.length === 0) {
			loadPosts();
		} else if (targetType === "profile" && availableProfiles.length === 0) {
			loadProfiles();
		}
	};

	const handlePurchaseCredits = async (e) => {
		e.preventDefault();
		try {
			setPurchaseLoading(true);
			setModalError("");
			setModalSuccess("");

			// Send the purchase request
			const response = await businessAPI.purchaseCredits({
				amount: selectedPackage.credits,
				paymentMethodId: paymentMethodId,
			});

			// Check if response contains approveUrl for PayPal approval
			if (response.approveUrl) {
				setModalSuccess("Redirecting to PayPal for payment approval...");

				// Redirect to PayPal approval URL
				setTimeout(() => {
					window.location.href = response.approveUrl;
				}, 1500);
			} else {
				// Payment was processed immediately (shouldn't happen with PayPal but just in case)
				setModalSuccess(
					`Credits purchased successfully! You received ${selectedPackage.totalCredits} credits (${selectedPackage.credits} base + ${selectedPackage.bonus} bonus).`,
				);
				setTimeout(() => {
					setShowCreditsModal(false);
					setPaymentMethodId("");
					setSelectedPackage(null);
					setModalError("");
					setModalSuccess("");
					loadCredits(); // Reload credits after purchase
				}, 2000);
			}
		} catch (error) {
			setModalError(error.message || "Failed to purchase credits");
		} finally {
			setPurchaseLoading(false);
		}
	};

	const handleCreateCampaign = async (e) => {
		e.preventDefault();
		try {
			setError("");
			setSuccess("");

			await businessAPI.createCampaign({
				...campaignForm,
				budget: parseFloat(campaignForm.budget),
			});

			setSuccess("Campaign created successfully");
			setShowCreateModal(false);
			setCampaignForm({
				title: "",
				description: "",
				targetType: "post",
				targetId: "",
				budget: "",
				duration: 7,
				adType: "promotion",
				targetAudience: {
					age: [18, 65],
					interests: [],
				},
			});
			// Clear loaded data when closing
			setAvailablePosts([]);
			setAvailableProfiles([]);
			loadBusinessData();
		} catch (error) {
			setError(error.message || "Failed to create campaign");
		}
	};

	const getStatusBadge = (status) => {
		const variants = {
			active: "success",
			pending: "warning",
			completed: "info",
			paused: "secondary",
			cancelled: "danger",
		};
		return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
	};

	const overview = dashboard.overview || {};
	const analytics = dashboard.analytics || {};

	return (
		<Container fluid className="py-4">
			<Row>
				<Col>
					<div className="d-flex align-items-center px-4 mb-4">
						<Bullseye size={32} className="me-3 text-primary" />
						<div>
							<h2>Business Dashboard</h2>
							<p className="text-muted mb-0">
								Grow your reach with targeted advertising
							</p>
						</div>
					</div>

					{error && <Alert variant="danger">{error}</Alert>}
					{success && <Alert variant="success">{success}</Alert>}

					<Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
						<Nav variant="pills" className="mb-4">
							<Nav.Item>
								<Nav.Link eventKey="overview">
									<BarChart className="me-2" size={16} />
									Overview
								</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="campaigns">
									<Bullseye className="me-2" size={16} />
									Campaigns
								</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="analytics">
									<Bullseye className="me-2" size={16} />
									Analytics
								</Nav.Link>
							</Nav.Item>
						</Nav>

						<Tab.Content>
							<Tab.Pane eventKey="overview">
								<Row className="mb-4">
									<Col md={3}>
										<Card className="border-0 bg-primary text-white">
											<Card.Body className="text-center">
												<Bullseye size={24} className="mb-2" />
												<h4>{overview.totalCampaigns || 0}</h4>
												<small>Total Campaigns</small>
											</Card.Body>
										</Card>
									</Col>
									<Col md={3}>
										<Card className="border-0 bg-success text-white">
											<Card.Body className="text-center">
												<CurrencyDollar size={24} className="mb-2" />
												<h4>{overview.totalSpent || 0}</h4>
												<small>Total Spent</small>
											</Card.Body>
										</Card>
									</Col>
									<Col md={3}>
										<Card className="border-0 bg-info text-white">
											<Card.Body className="text-center">
												<Eye size={24} className="mb-2" />
												<h4>{analytics.totalImpressions || 0}</h4>
												<small>Impressions</small>
											</Card.Body>
										</Card>
									</Col>
									<Col md={3}>
										<Card
											className="border-0 bg-gradient text-black position-relative cursor-pointer"
											style={{
												background:
													"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
												cursor: "pointer",
											}}
											onClick={() => setShowCreditsModal(true)}
										>
											<Card.Body className="text-center">
												<div className="d-flex align-items-center justify-content-center mb-2">
													<Wallet size={24} className="me-2" />
													<ArrowUpCircle size={16} className="opacity-75" />
												</div>
												<h4 className="mb-0">{credits.credits || 0}</h4>
												<small className="opacity-90">Available Credits</small>
												<small className="d-block mt-1 opacity-75">
													Click to add more
												</small>
											</Card.Body>
										</Card>
									</Col>
								</Row>

								<Row>
									<Col lg={8}>
										<Card>
											<Card.Header className="d-flex justify-content-between align-items-center">
												<h5 className="mb-0">Recent Campaigns</h5>
												<Button
													variant="primary"
													size="sm"
													onClick={() => setShowCreateModal(true)}
												>
													<Plus className="me-1" size={14} />
													New Campaign
												</Button>
											</Card.Header>
											<Card.Body>
												{campaigns.slice(0, 5).map((campaign) => (
													<div
														key={campaign.id}
														className="d-flex justify-content-between align-items-center py-2 border-bottom"
													>
														<div>
															<strong>{campaign.title}</strong>
															<div className="text-muted small">
																{campaign.adType} • ${campaign.budget} budget
															</div>
														</div>
														<div className="text-end">
															{getStatusBadge(campaign.status)}
															<div className="text-muted small">
																{campaign.impressions} impressions
															</div>
														</div>
													</div>
												))}
												{campaigns.length === 0 && (
													<div className="text-center py-4 text-muted">
														No campaigns yet. Create your first campaign to get
														started.
													</div>
												)}
											</Card.Body>
										</Card>
									</Col>

									<Col lg={4}>
										<Card className="mb-4">
											<Card.Header>
												<h6 className="mb-0">Performance Metrics</h6>
											</Card.Header>
											<Card.Body>
												<div className="mb-3">
													<div className="d-flex justify-content-between">
														<span>Click-through Rate</span>
														<span>{analytics.averageCTR || 0}%</span>
													</div>
													<ProgressBar
														now={analytics.averageCTR || 0}
														max={10}
														className="mt-1"
													/>
												</div>
												<div className="mb-3">
													<div className="d-flex justify-content-between">
														<span>Conversion Rate</span>
														<span>{analytics.conversions || 0}%</span>
													</div>
													<ProgressBar
														now={analytics.conversions || 0}
														max={5}
														variant="success"
														className="mt-1"
													/>
												</div>
												<div>
													<div className="d-flex justify-content-between">
														<span>Cost per Click</span>
														<span>${analytics.costPerClick || 0}</span>
													</div>
												</div>
											</Card.Body>
										</Card>

										<Card>
											<Card.Header>
												<h6 className="mb-0">Quick Actions</h6>
											</Card.Header>
											<Card.Body className="d-grid gap-2">
												<Button
													variant="primary"
													onClick={() => {
														setShowCreateModal(true);
														// Load initial data based on current target type
														if (campaignForm.targetType === "post" && availablePosts.length === 0) {
															loadPosts();
														} else if (campaignForm.targetType === "profile" && availableProfiles.length === 0) {
															loadProfiles();
														}
													}}
												>
													<Plus className="me-2" size={16} />
													Create Campaign
												</Button>
												<Button
													variant="outline-secondary"
													onClick={() => setActiveTab("analytics")}
												>
													<Bullseye className="me-2" size={16} />
													View Analytics
												</Button>
											</Card.Body>
										</Card>
									</Col>
								</Row>
							</Tab.Pane>

							<Tab.Pane eventKey="campaigns">
								<div className="d-flex justify-content-between align-items-center mb-4">
									<h4>Ad Campaigns</h4>
									<Button
										variant="primary"
										onClick={() => {
											setShowCreateModal(true);
											// Load initial data based on current target type
											if (campaignForm.targetType === "post" && availablePosts.length === 0) {
												loadPosts();
											} else if (campaignForm.targetType === "profile" && availableProfiles.length === 0) {
												loadProfiles();
											}
										}}
									>
										<Plus className="me-2" />
										Create Campaign
									</Button>
								</div>

								{campaigns.length === 0 ? (
									<Card className="text-center py-5">
										<Card.Body>
											<Bullseye size={48} className="text-muted mb-3" />
											<h5>No Campaigns Yet</h5>
											<p className="text-muted">
												Create your first ad campaign to start promoting your
												content
											</p>
											<Button
												variant="primary"
												onClick={() => {
													setShowCreateModal(true);
													// Load initial data based on current target type
													if (campaignForm.targetType === "post" && availablePosts.length === 0) {
														loadPosts();
													} else if (campaignForm.targetType === "profile" && availableProfiles.length === 0) {
														loadProfiles();
													}
												}}
											>
												Create Campaign
											</Button>
										</Card.Body>
									</Card>
								) : (
									<Card>
										<Card.Body>
											<Table responsive>
												<thead>
													<tr>
														<th>Campaign</th>
														<th>Type</th>
														<th>Budget</th>
														<th>Status</th>
														<th>Impressions</th>
														<th>Clicks</th>
														<th>CTR</th>
														<th>Actions</th>
													</tr>
												</thead>
												<tbody>
													{campaigns.map((campaign) => (
														<tr key={campaign.id}>
															<td>
																<div>
																	<strong>{campaign.title}</strong>
																	<div className="text-muted small">
																		{campaign.description}
																	</div>
																</div>
															</td>
															<td>
																<Badge bg="info">{campaign.adType}</Badge>
															</td>
															<td>${campaign.budget}</td>
															<td>{getStatusBadge(campaign.status)}</td>
															<td>{campaign.analytics.impressions || 0}</td>
															<td>{campaign.analytics.clicks || 0}</td>
															<td>
																{campaign.analytics.impressions > 0
																	? (
																			(campaign.analytics.clicks / campaign.analytics.impressions) *
																			100
																		).toFixed(2)
																	: 0}
																%
															</td>
															<td>
																<Button variant="outline-primary" size="sm">
																	Edit
																</Button>
															</td>
														</tr>
													))}
												</tbody>
											</Table>
										</Card.Body>
									</Card>
								)}
							</Tab.Pane>

							<Tab.Pane eventKey="analytics">
								<Row>
									<Col md={12}>
										<Card>
											<Card.Header>
												<h5 className="mb-0">Campaign Analytics</h5>
											</Card.Header>
											<Card.Body>
												<Row>
													<Col md={3}>
														<div className="text-center">
															<h3 className="text-primary">
																{analytics.totalImpressions || 0}
															</h3>
															<p className="text-muted">Total Impressions</p>
														</div>
													</Col>
													<Col md={3}>
														<div className="text-center">
															<h3 className="text-success">
																{analytics.totalClicks || 0}
															</h3>
															<p className="text-muted">Total Clicks</p>
														</div>
													</Col>
													<Col md={3}>
														<div className="text-center">
															<h3 className="text-info">
																{analytics.totalConversions || 0}
															</h3>
															<p className="text-muted">Conversions</p>
														</div>
													</Col>
													<Col md={3}>
														<div className="text-center">
															<h3 className="text-warning">
																{analytics.averageCTR || 0}%
															</h3>
															<p className="text-muted">Average CTR</p>
														</div>
													</Col>
												</Row>
											</Card.Body>
										</Card>
									</Col>
								</Row>
							</Tab.Pane>
						</Tab.Content>
					</Tab.Container>
				</Col>
			</Row>

			{/* Create Campaign Modal */}
			<Modal
				show={showCreateModal}
				onHide={() => setShowCreateModal(false)}
				size="lg"
				fullscreen="md-down"
				scrollable
			>
				<Modal.Header closeButton>
					<Modal.Title>Create Ad Campaign</Modal.Title>
				</Modal.Header>
				<Form onSubmit={handleCreateCampaign}>
					<Modal.Body className="overflow-y-auto vh-100">
						<div style={{ marginBottom: "130px" }}>
							<Row>
								<Col md={6}>
									<Form.Group
										className="d-flex flex-column mb-3"
										style={{ minHeight: "100%" }}
									>
										<Form.Label>Campaign Title *</Form.Label>
										<Form.Control
											type="text"
											value={campaignForm.title}
											onChange={(e) =>
												setCampaignForm({
													...campaignForm,
													title: e.target.value,
												})
											}
											required
										/>
									</Form.Group>
								</Col>
								<Col md={6}>
									<Form.Group className="mb-3">
										<Form.Label>Ad Type</Form.Label>
										<Form.Select
											value={campaignForm.adType}
											onChange={(e) =>
												setCampaignForm({
													...campaignForm,
													adType: e.target.value,
												})
											}
										>
											<option value="promotion">Promotion</option>
											<option value="brand_awareness">Brand Awareness</option>
											<option value="engagement">Engagement</option>
										</Form.Select>
									</Form.Group>
								</Col>
							</Row>

							<Form.Group className="mb-3">
								<Form.Label>Description</Form.Label>
								<Form.Control
									as="textarea"
									rows={3}
									value={campaignForm.description}
									onChange={(e) =>
										setCampaignForm({
											...campaignForm,
											description: e.target.value,
										})
									}
								/>
							</Form.Group>

							<Row>
								<Col md={6}>
									<Form.Group className="mb-3">
										<Form.Label>Target Type</Form.Label>
										<Form.Select
											value={campaignForm.targetType}
											onChange={(e) => handleTargetTypeChange(e.target.value)}
										>
											<option value="post">Post</option>
											<option value="profile">Profile</option>
										</Form.Select>
									</Form.Group>
								</Col>
								<Col md={6}>
									<Form.Group className="mb-3">
										<Form.Label>
											Select {campaignForm.targetType === "post" ? "Post" : "Profile"} *
										</Form.Label>
										{loadingTargets ? (
											<Form.Control
												type="text"
												placeholder={`Loading ${campaignForm.targetType}s...`}
												disabled
											/>
										) : (
											<Form.Select
												value={campaignForm.targetId}
												onChange={(e) =>
													setCampaignForm({
														...campaignForm,
														targetId: e.target.value,
													})
												}
												required
											>
												<option value="">
													Choose a {campaignForm.targetType}...
												</option>
												{campaignForm.targetType === "post"
													? availablePosts.map((post) => (
															<option key={post.id} value={post.id}>
																{post.content
																	? `${post.content.substring(0, 60)}${
																			post.content.length > 60 ? "..." : ""
																		}`
																	: `Post by ${post.author.name}`}
																{post.author.name && ` - by ${post.author.name}`}
															</option>
														))
													: availableProfiles.map((profile) => (
															<option key={profile.uid} value={profile.uid}>
																My Profile - {profile.name} (@{profile.username})
															</option>
														))}
											</Form.Select>
										)}
										{campaignForm.targetType === "post" &&
											availablePosts.length === 0 &&
											!loadingTargets && (
												<Form.Text className="text-muted">
													No posts available. Create some posts first to promote them.
												</Form.Text>
											)}
										{campaignForm.targetType === "profile" &&
											availableProfiles.length === 0 &&
											!loadingTargets && (
												<Form.Text className="text-muted">
													Unable to load your profile for promotion.
												</Form.Text>
											)}
									</Form.Group>
								</Col>
							</Row>

							<Row>
								<Col md={6}>
									<Form.Group className="mb-3">
										<Form.Label>Budget ($) *</Form.Label>
										<Form.Control
											type="number"
											step="0.01"
											min="5"
											value={campaignForm.budget}
											onChange={(e) =>
												setCampaignForm({
													...campaignForm,
													budget: e.target.value,
												})
											}
											required
										/>
									</Form.Group>
								</Col>
								<Col md={6}>
									<Form.Group className="mb-3">
										<Form.Label>Duration (days)</Form.Label>
										<Form.Control
											type="number"
											min="1"
											max="30"
											value={campaignForm.duration}
											onChange={(e) =>
												setCampaignForm({
													...campaignForm,
													duration: parseInt(e.target.value),
												})
											}
										/>
									</Form.Group>
								</Col>
							</Row>

							<Alert variant="info">
								<small>
									<strong>Note:</strong> Campaigns require manual approval
									before going live. You'll be notified once your campaign is
									reviewed.
								</small>
							</Alert>
						</div>
					</Modal.Body>
					<Modal.Footer
						className="sticky-bottom bg-white border-top"
						style={{ zIndex: 1050 }}
					>
						<Button
							variant="secondary"
							onClick={() => setShowCreateModal(false)}
						>
							Cancel
						</Button>
						<Button type="submit" variant="primary">
							Create Campaign
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>

			{/* Credits Modal - Fixed with proper fullscreen and scrollable content */}
			<Modal
				show={showCreditsModal}
				onHide={() => {
					setShowCreditsModal(false);
					setModalError("");
					setModalSuccess("");
					setSelectedPackage(null);
				}}
				fullscreen="md-down"
				size="lg"
				scrollable
			>
				<Modal.Header
					closeButton
					className="sticky-top bg-white"
					style={{ zIndex: 1050 }}
				>
					<Modal.Title>Purchase Credits</Modal.Title>
				</Modal.Header>
				<Modal.Body className="p-0">
					<Form
						onSubmit={handlePurchaseCredits}
						className="d-flex flex-column"
						style={{ minHeight: "100%" }}
					>
						<div
							className="p-4"
							style={{ flex: "1 1 auto", overflowY: "auto" }}
						>
							{modalError && (
								<Alert variant="danger" className="mb-3">
									{modalError}
								</Alert>
							)}
							{modalSuccess && (
								<Alert variant="success" className="mb-3">
									{modalSuccess}
								</Alert>
							)}

							<div className="mb-4">
								<p className="mb-2">
									Your current credits:{" "}
									<strong className="text-primary">
										{credits.credits || 0}
									</strong>
								</p>
								<small className="text-muted">
									Raw credits: {credits.creditsInCentavos || 0}
								</small>
							</div>

							<h6 className="mb-3">Choose a Credits Package</h6>
							<Row className="g-3 mb-4">
								{creditsPackages.map((pkg) => (
									<Col key={pkg.amount} md={6} lg={4}>
										<Card
											className={`h-100 cursor-pointer ${selectedPackage?.amount === pkg.amount ? "border-primary bg-light" : ""} ${pkg.popular ? "border-warning" : ""}`}
											onClick={() => setSelectedPackage(pkg)}
											style={{ cursor: "pointer", position: "relative" }}
										>
											{pkg.popular && (
												<Badge
													bg="warning"
													className="position-absolute top-0 start-50 translate-middle px-3 py-2"
													style={{ fontSize: "0.75rem" }}
												>
													Most Popular
												</Badge>
											)}
											<Card.Body className="text-center p-3">
												<h5 className="mb-2">{pkg.priceDisplay}</h5>
												<div className="mb-2">
													<strong className="text-primary">
														{pkg.totalCredits.toLocaleString()}
													</strong>
													<small className="text-muted d-block">
														{pkg.credits.toLocaleString()} base
														{pkg.bonus > 0 && (
															<span className="text-success">
																+ {pkg.bonus.toLocaleString()} bonus
															</span>
														)}
													</small>
												</div>
												<small className="text-muted">{pkg.description}</small>
												{pkg.bonus > 0 && (
													<div className="mt-2">
														<Badge bg="success" className="small">
															+{((pkg.bonus / pkg.credits) * 100).toFixed(0)}%
															Bonus
														</Badge>
													</div>
												)}
											</Card.Body>
										</Card>
									</Col>
								))}
							</Row>

							{selectedPackage && (
								<Alert variant="info" className="mb-3">
									<div className="d-flex justify-content-between align-items-center">
										<div>
											<strong>Selected: {selectedPackage.priceDisplay}</strong>
											<div className="small text-muted">
												{selectedPackage.totalCredits.toLocaleString()} credits
												total
											</div>
										</div>
										<Button
											variant="outline-secondary"
											size="sm"
											onClick={() => setSelectedPackage(null)}
										>
											Change
										</Button>
									</div>
								</Alert>
							)}

							{selectedPackage && paymentMethods.length > 0 ? (
								<Form.Group className="mb-3">
									<Form.Label>Select Payment Method</Form.Label>
									<Form.Select
										value={paymentMethodId}
										onChange={(e) => setPaymentMethodId(e.target.value)}
										required
									>
										<option value="">Choose a payment method...</option>
										{paymentMethods.map((method) => (
											<option key={method.id} value={method.id}>
												{method.type === "paypal_wallet"
													? `PayPal Wallet - ${method.paypalEmail || "Connected Account"}`
													: method.type === "paypal_card"
														? `**** **** **** ${method.last4} (${method.provider || "PayPal"})`
														: `**** **** **** ${method.last4} (${method.provider || "Unknown"})`}
												{method.isDefault ? " (Default)" : ""}
											</option>
										))}
									</Form.Select>
								</Form.Group>
							) : selectedPackage && paymentMethods.length === 0 ? (
								<Alert variant="warning">
									<div className="d-flex align-items-center">
										<Wallet className="me-2" size={20} />
										<div>
											<strong>No Payment Methods</strong>
											<p className="mb-0 small">
												You need to add a payment method first. Go to Settings →
												Subscription to add one.
											</p>
										</div>
									</div>
								</Alert>
							) : null}

							<Alert variant="info">
								<small>
									<strong>Secure Payment:</strong> Credits are purchased
									securely through PayPal and added instantly to your account.
								</small>
							</Alert>
						</div>
						<Modal.Footer
							className="sticky-bottom bg-white border-top"
							style={{ zIndex: 1050 }}
						>
							<Button
								variant="secondary"
								onClick={() => {
									setShowCreditsModal(false);
									setModalError("");
									setModalSuccess("");
									setSelectedPackage(null);
								}}
							>
								Close
							</Button>
							<Button
								type="submit"
								variant="primary"
								disabled={
									!selectedPackage ||
									!paymentMethodId ||
									paymentMethods.length === 0 ||
									purchaseLoading
								}
							>
								{purchaseLoading
									? "Processing..."
									: `Purchase ${selectedPackage ? selectedPackage.priceDisplay : "Package"}`}
							</Button>
						</Modal.Footer>
					</Form>
				</Modal.Body>
			</Modal>
		</Container>
	);
};

export default BusinessPage;