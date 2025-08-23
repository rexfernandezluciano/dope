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
	Calendar,
	Bullseye,
	CurrencyDollar,
	Cursor,
	Wallet,
	ArrowUpCircle,
} from "react-bootstrap-icons";
import { updatePageMeta } from "../utils/meta-utils";
import { businessAPI } from "../config/ApiConfig";

const BusinessPage = () => {
	const [activeTab, setActiveTab] = useState("overview");
	const [dashboard, setDashboard] = useState({});
	const [campaigns, setCampaigns] = useState([]);
	const [credits, setCredits] = useState({ credits: 0, creditsDisplay: 0 });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showCreditsModal, setShowCreditsModal] = useState(false);
	const [paymentMethodId, setPaymentMethodId] = useState("");
	const [purchaseAmount, setPurchaseAmount] = useState(100);
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

	useEffect(() => {
		updatePageMeta({
			title: "Business Dashboard - DOPE Network",
			description: "Manage your ad campaigns and business analytics",
		});
		loadBusinessData();
		loadCredits();
	}, []);

	const loadBusinessData = async () => {
		try {
			setLoading(true);
			const [dashboardResponse, campaignsResponse] = await Promise.all([
				businessAPI.getDashboard(),
				businessAPI.getCampaigns(),
			]);
			setDashboard(dashboardResponse);
			setCampaigns(campaignsResponse.campaigns || []);
		} catch (error) {
			setError("Failed to load business data");
			console.error(error);
		} finally {
			setLoading(false);
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

	const handlePurchaseCredits = async (e) => {
		e.preventDefault();
		try {
			setError("");
			setSuccess("");
			await businessAPI.purchaseCredits({
				credits: parseInt(purchaseAmount),
				paymentMethodId: paymentMethodId,
			});
			setSuccess("Credits purchased successfully!");
			setShowCreditsModal(false);
			setPaymentMethodId("");
			setPurchaseAmount(100);
			loadCredits(); // Reload credits after purchase
		} catch (error) {
			setError(error.message || "Failed to purchase credits");
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
												<h4>${overview.totalSpent || 0}</h4>
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
											className="border-0 bg-gradient text-white position-relative cursor-pointer"
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
												<h4 className="mb-0">{credits.creditsDisplay || 0}</h4>
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
														<span>
															{analytics.conversionRate || 0}%
														</span>
													</div>
													<ProgressBar
														now={analytics.conversionRate || 0}
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
													onClick={() => setShowCreateModal(true)}
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
										onClick={() => setShowCreateModal(true)}
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
												onClick={() => setShowCreateModal(true)}
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
															<td>{campaign.impressions || 0}</td>
															<td>{campaign.clicks || 0}</td>
															<td>
																{campaign.impressions > 0
																	? (
																			(campaign.clicks / campaign.impressions) *
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
			>
				<Modal.Header closeButton>
					<Modal.Title>Create Ad Campaign</Modal.Title>
				</Modal.Header>
				<Form onSubmit={handleCreateCampaign}>
					<Modal.Body>
						<Row>
							<Col md={6}>
								<Form.Group className="mb-3">
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
										onChange={(e) =>
											setCampaignForm({
												...campaignForm,
												targetType: e.target.value,
											})
										}
									>
										<option value="post">Post</option>
										<option value="profile">Profile</option>
									</Form.Select>
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Target ID *</Form.Label>
									<Form.Control
										type="text"
										value={campaignForm.targetId}
										onChange={(e) =>
											setCampaignForm({
												...campaignForm,
												targetId: e.target.value,
											})
										}
										placeholder="Enter post or profile ID"
										required
									/>
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
								<strong>Note:</strong> Campaigns require manual approval before
								going live. You'll be notified once your campaign is reviewed.
							</small>
						</Alert>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => setShowCreateModal(false)}>
							Cancel
						</Button>
						<Button type="submit" variant="primary">
							Create Campaign
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>

			{/* Credits Modal */}
			<Modal
				show={showCreditsModal}
				onHide={() => setShowCreditsModal(false)}
				size="md"
			>
				<Modal.Header closeButton>
					<Modal.Title>Add Credits</Modal.Title>
				</Modal.Header>
				<Form onSubmit={handlePurchaseCredits}>
					<Modal.Body>
						<p>
							Your current credits:{" "}
							<strong>{credits.creditsDisplay.toFixed(1)}</strong>
						</p>
						<Form.Group className="mb-3">
							<Form.Label>Amount of Credits to Purchase</Form.Label>
							<Form.Control
								type="number"
								value={purchaseAmount}
								onChange={(e) => setPurchaseAmount(e.target.value)}
								required
							/>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Payment Method ID</Form.Label>
							<Form.Control
								type="text"
								value={paymentMethodId}
								onChange={(e) => setPaymentMethodId(e.target.value)}
								placeholder="e.g., pm_jsjs"
								required
							/>
						</Form.Group>
						<Alert variant="info">
							<small>
								Please ensure you have a valid payment method ID. Credits are
								added instantly upon successful purchase.
							</small>
						</Alert>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => setShowCreditsModal(false)}>
							Close
						</Button>
						<Button type="submit" variant="primary">
							Purchase Credits
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>
		</Container>
	);
};

export default BusinessPage;