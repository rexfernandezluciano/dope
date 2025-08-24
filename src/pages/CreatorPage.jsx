
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Alert, Badge, Tab, Tabs, Form, Modal, Table, ProgressBar } from "react-bootstrap";
import { CurrencyDollar, GraphUpArrow, Calendar, Eye, Heart, Share, Plus, Gear } from "react-bootstrap-icons";
import { analyticsAPI, businessAPI, subscriptionAPI } from "../config/ApiConfig";
import { formatTimeAgo, formatCurrency } from "../utils/common-utils";
import { updatePageMeta } from "../utils/meta-utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const CreatorPage = () => {
	const [activeTab, setActiveTab] = useState("earnings");
	const [earnings, setEarnings] = useState({});
	const [monetization, setMonetization] = useState({});
	const [analytics, setAnalytics] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [showPayoutModal, setShowPayoutModal] = useState(false);
	const [showMonetizationModal, setShowMonetizationModal] = useState(false);
	const [selectedPeriod, setSelectedPeriod] = useState("30d");

	const [payoutForm, setPayoutForm] = useState({
		amount: "",
		method: "paypal",
		email: ""
	});

	const [monetizationSettings, setMonetizationSettings] = useState({
		subscriptionEnabled: false,
		subscriptionPrice: "",
		tipsEnabled: false,
		adRevenueEnabled: false
	});

	useEffect(() => {
		updatePageMeta({
			title: "Creator Dashboard - DOPE Network",
			description: "Manage your earnings, monetization settings, and creator analytics"
		});
		loadCreatorData();
	}, [selectedPeriod]);

	const loadCreatorData = async () => {
		try {
			setLoading(true);
			const [analyticsData, businessData, subscriberData] = await Promise.all([
				analyticsAPI.getUserAnalytics(selectedPeriod),
				businessAPI.getDashboard().catch(() => ({})),
				subscriptionAPI.getSubscribers().catch(() => ({ subscribers: [], stats: {} }))
			]);

			// Merge subscriber data into analytics
			const mergedAnalytics = {
				...analyticsData,
				subscribers: subscriberData.subscribers || [],
				subscriberStats: subscriberData.stats || {}
			};

			setAnalytics(mergedAnalytics);
			setEarnings(mergedAnalytics.earnings || {});
			setMonetization(mergedAnalytics.monetization || {});
		} catch (error) {
			setError("Failed to load creator data");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const handlePayout = async (e) => {
		e.preventDefault();
		try {
			setError("");
			setSuccess("");

			// Mock payout API call
			console.log("Processing payout:", payoutForm);
			
			setSuccess("Payout request submitted successfully");
			setShowPayoutModal(false);
			setPayoutForm({ amount: "", method: "paypal", email: "" });
		} catch (error) {
			setError(error.message || "Failed to process payout");
		}
	};

	const handleMonetizationSettings = async (e) => {
		e.preventDefault();
		try {
			setError("");
			setSuccess("");

			// Mock monetization settings API call
			console.log("Updating monetization settings:", monetizationSettings);

			setSuccess("Monetization settings updated successfully");
			setShowMonetizationModal(false);
		} catch (error) {
			setError(error.message || "Failed to update settings");
		}
	};

	const formatNumber = (num) => {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num?.toString() || '0';
	};

	const totalEarnings = analytics.overview?.totalEarnings || 0;
	const availableBalance = totalEarnings * 0.8; // Mock available balance
	const pendingEarnings = totalEarnings * 0.2; // Mock pending earnings

	const revenueData = [
		{ name: 'Jan', subscriptions: 450, ads: 280, tips: 120 },
		{ name: 'Feb', subscriptions: 520, ads: 310, tips: 150 },
		{ name: 'Mar', subscriptions: 480, ads: 290, tips: 180 },
		{ name: 'Apr', subscriptions: 600, ads: 350, tips: 200 },
		{ name: 'May', subscriptions: 680, ads: 380, tips: 220 },
	];

	const revenueBreakdown = [
		{ name: 'Subscriptions', value: 60, color: '#28a745' },
		{ name: 'Ad Revenue', value: 30, color: '#17a2b8' },
		{ name: 'Tips & Donations', value: 10, color: '#ffc107' }
	];

	return (
		<Container className="py-3 py-md-4">
			<div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center px-4 mb-4">
				<div className="mb-3 mb-md-0">
					<h2 className="mb-1">Creator Dashboard</h2>
					<p className="text-muted mb-0">Manage your earnings and monetization</p>
				</div>
				<div className="d-flex flex-wrap gap-2">
					{['7d', '30d', '90d'].map(period => (
						<Button
							key={period}
							variant={selectedPeriod === period ? 'primary' : 'outline-primary'}
							size="sm"
							onClick={() => setSelectedPeriod(period)}
						>
							{period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
						</Button>
					))}
				</div>
			</div>

			{error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
			{success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

			<Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
				<Tab eventKey="earnings" title={
					<span className="d-flex align-items-center">
						<CurrencyDollar className="me-2" size={16} />
						<span className="d-none d-sm-inline">Earnings</span>
					</span>
				}>
					{/* Earnings Overview Cards */}
					<Row className="g-3 mb-4">
						<Col xs={6} lg={3}>
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center p-3">
									<CurrencyDollar size={24} className="text-success mb-2" />
									<h4 className="mb-1">${totalEarnings.toFixed(2)}</h4>
									<small className="text-muted">Total Earnings</small>
								</Card.Body>
							</Card>
						</Col>
						<Col xs={6} lg={3}>
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center p-3">
									<GraphUpArrow size={24} className="text-primary mb-2" />
									<h4 className="mb-1">${availableBalance.toFixed(2)}</h4>
									<small className="text-muted">Available</small>
								</Card.Body>
							</Card>
						</Col>
						<Col xs={6} lg={3}>
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center p-3">
									<Calendar size={24} className="text-warning mb-2" />
									<h4 className="mb-1">${pendingEarnings.toFixed(2)}</h4>
									<small className="text-muted">Pending</small>
								</Card.Body>
							</Card>
						</Col>
						<Col xs={6} lg={3}>
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center p-3">
									<Eye size={24} className="text-info mb-2" />
									<h4 className="mb-1">{formatNumber(analytics.overview?.totalViews || 0)}</h4>
									<small className="text-muted">Views</small>
								</Card.Body>
							</Card>
						</Col>
					</Row>

					{/* Revenue Chart */}
					<Row className="g-3 mb-4">
						<Col lg={8}>
							<Card className="h-100 border-0 shadow-sm">
								<Card.Header className="d-flex justify-content-between align-items-center">
									<h6 className="mb-0">Revenue Trends</h6>
									<Button 
										variant="outline-success" 
										size="sm"
										onClick={() => setShowPayoutModal(true)}
									>
										Request Payout
									</Button>
								</Card.Header>
								<Card.Body>
									<ResponsiveContainer width="100%" height={300}>
										<AreaChart data={revenueData}>
											<defs>
												<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
													<stop offset="5%" stopColor="#28a745" stopOpacity={0.8}/>
													<stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
												</linearGradient>
											</defs>
											<XAxis dataKey="name" />
											<YAxis />
											<CartesianGrid strokeDasharray="3 3" />
											<Tooltip formatter={(value) => [`$${value}`, '']} />
											<Area 
												type="monotone" 
												dataKey="subscriptions" 
												stackId="1"
												stroke="#28a745" 
												fill="#28a745" 
												name="Subscriptions" 
											/>
											<Area 
												type="monotone" 
												dataKey="ads" 
												stackId="1"
												stroke="#17a2b8" 
												fill="#17a2b8" 
												name="Ad Revenue" 
											/>
											<Area 
												type="monotone" 
												dataKey="tips" 
												stackId="1"
												stroke="#ffc107" 
												fill="#ffc107" 
												name="Tips" 
											/>
										</AreaChart>
									</ResponsiveContainer>
								</Card.Body>
							</Card>
						</Col>
						<Col lg={4}>
							<Card className="h-100 border-0 shadow-sm">
								<Card.Header>
									<h6 className="mb-0">Revenue Breakdown</h6>
								</Card.Header>
								<Card.Body>
									<ResponsiveContainer width="100%" height={250}>
										<PieChart>
											<Pie
												data={revenueBreakdown}
												cx="50%"
												cy="50%"
												innerRadius={40}
												outerRadius={80}
												paddingAngle={5}
												dataKey="value"
											>
												{revenueBreakdown.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={entry.color} />
												))}
											</Pie>
											<Tooltip formatter={(value) => [`${value}%`, '']} />
										</PieChart>
									</ResponsiveContainer>
									<div className="mt-2">
										{revenueBreakdown.map((item, index) => (
											<div key={index} className="d-flex justify-content-between align-items-center small mb-1">
												<span className="d-flex align-items-center">
													<span
														className="d-inline-block me-2"
														style={{
															width: 12,
															height: 12,
															backgroundColor: item.color,
															borderRadius: 2
														}}
													></span>
													{item.name}
												</span>
												<span className="fw-bold">{item.value}%</span>
											</div>
										))}
									</div>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Tab>

				<Tab eventKey="subscribers" title={
					<span className="d-flex align-items-center">
						<Heart className="me-2" size={16} />
						<span className="d-none d-sm-inline">Subscribers</span>
					</span>
				}>
					<Row className="g-3 mb-4">
						<Col lg={8}>
							<Card className="border-0 shadow-sm">
								<Card.Header>
									<h5 className="mb-0">My Subscribers</h5>
								</Card.Header>
								<Card.Body>
									{analytics.subscribers?.length === 0 ? (
										<div className="text-center py-4">
											<CurrencyDollar size={48} className="text-muted mb-3" />
											<p className="text-muted">No subscribers yet</p>
											<small className="text-muted">Share your profile to start getting supporters!</small>
										</div>
									) : (
										<Row className="g-3">
											{(analytics.subscribers || []).map((subscriber) => (
												<Col md={6} key={subscriber.id}>
													<Card className="h-100">
														<Card.Body>
															<div className="d-flex align-items-center gap-3 mb-3">
																<img
																	src={subscriber.subscriber?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(subscriber.subscriber?.name || 'User')}&size=40`}
																	alt={subscriber.subscriber?.name || 'User'}
																	className="rounded-circle"
																	width="40"
																	height="40"
																	style={{ objectFit: 'cover' }}
																/>
																<div>
																	<h6 className="mb-1">{subscriber.subscriber?.name || 'Anonymous'}</h6>
																	<small className="text-muted">@{subscriber.subscriber?.username || 'user'}</small>
																</div>
															</div>
															<div className="d-flex justify-content-between align-items-center mb-2">
																<Badge bg={subscriber.tier === 'premium' ? 'success' : subscriber.tier === 'vip' ? 'warning' : 'primary'}>
																	{subscriber.tier?.charAt(0).toUpperCase() + subscriber.tier?.slice(1) || 'Basic'}
																</Badge>
																<Badge bg={subscriber.status === 'active' ? 'success' : 'secondary'}>
																	{subscriber.status?.charAt(0).toUpperCase() + subscriber.status?.slice(1) || 'Unknown'}
																</Badge>
															</div>
															<div className="d-flex align-items-center gap-2 text-muted">
																<Calendar size={14} />
																<small>Since {subscriber.createdAt ? new Date(subscriber.createdAt).toLocaleDateString() : 'Unknown'}</small>
															</div>
														</Card.Body>
													</Card>
												</Col>
											))}
										</Row>
									)}
								</Card.Body>
							</Card>
						</Col>
						<Col lg={4}>
							<Card className="border-0 shadow-sm">
								<Card.Header>
									<h5 className="mb-0">Subscriber Stats</h5>
								</Card.Header>
								<Card.Body>
									<div className="mb-3">
										<div className="d-flex justify-content-between align-items-center mb-1">
											<small className="text-muted">Total Subscribers</small>
											<strong>{analytics.subscriberStats?.totalSubscribers || 0}</strong>
										</div>
										<ProgressBar 
											now={100} 
											variant="primary" 
											style={{ height: '6px' }}
										/>
									</div>
									<div className="mb-3">
										<div className="d-flex justify-content-between align-items-center mb-1">
											<small className="text-muted">Basic Tier</small>
											<strong>{analytics.subscriberStats?.basicSubscribers || 0}</strong>
										</div>
										<ProgressBar 
											now={analytics.subscriberStats?.totalSubscribers > 0 ? 
												(analytics.subscriberStats?.basicSubscribers || 0) / analytics.subscriberStats.totalSubscribers * 100 : 0} 
											variant="primary" 
											style={{ height: '6px' }}
										/>
									</div>
									<div className="mb-3">
										<div className="d-flex justify-content-between align-items-center mb-1">
											<small className="text-muted">Premium Tier</small>
											<strong>{analytics.subscriberStats?.premiumSubscribers || 0}</strong>
										</div>
										<ProgressBar 
											now={analytics.subscriberStats?.totalSubscribers > 0 ? 
												(analytics.subscriberStats?.premiumSubscribers || 0) / analytics.subscriberStats.totalSubscribers * 100 : 0} 
											variant="success" 
											style={{ height: '6px' }}
										/>
									</div>
									<div className="mb-3">
										<div className="d-flex justify-content-between align-items-center mb-1">
											<small className="text-muted">VIP Tier</small>
											<strong>{analytics.subscriberStats?.vipSubscribers || 0}</strong>
										</div>
										<ProgressBar 
											now={analytics.subscriberStats?.totalSubscribers > 0 ? 
												(analytics.subscriberStats?.vipSubscribers || 0) / analytics.subscriberStats.totalSubscribers * 100 : 0} 
											variant="warning" 
											style={{ height: '6px' }}
										/>
									</div>
									<hr />
									<div className="text-center">
										<h4 className="text-success mb-1">
											${analytics.subscriberStats?.monthlyRevenue ? (analytics.subscriberStats.monthlyRevenue / 100).toFixed(2) : '0.00'}
										</h4>
										<small className="text-muted">Monthly Revenue</small>
									</div>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Tab>

				<Tab eventKey="monetization" title={
					<span className="d-flex align-items-center">
						<Gear className="me-2" size={16} />
						<span className="d-none d-sm-inline">Monetization</span>
					</span>
				}>
					<Row className="g-3 mb-4">
						<Col md={4}>
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center">
									<h5 className="text-success mb-3">Subscriptions</h5>
									<h3>${analytics.overview?.subscriptionRevenue?.toFixed(2) || "0.00"}</h3>
									<p className="text-muted">Monthly Revenue</p>
									<Badge bg="success">Active</Badge>
								</Card.Body>
							</Card>
						</Col>
						<Col md={4}>
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center">
									<h5 className="text-info mb-3">Ad Revenue</h5>
									<h3>${analytics.overview?.adRevenue?.toFixed(2) || "0.00"}</h3>
									<p className="text-muted">This Month</p>
									<Badge bg="info">Enabled</Badge>
								</Card.Body>
							</Card>
						</Col>
						<Col md={4}>
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center">
									<h5 className="text-warning mb-3">Tips & Donations</h5>
									<h3>${analytics.overview?.tipsRevenue?.toFixed(2) || "0.00"}</h3>
									<p className="text-muted">All Time</p>
									<Badge bg="warning">Active</Badge>
								</Card.Body>
							</Card>
						</Col>
					</Row>

					<Card className="border-0 shadow-sm mb-4">
						<Card.Header className="d-flex justify-content-between align-items-center">
							<h5 className="mb-0">Monetization Settings</h5>
							<Button 
								variant="primary" 
								size="sm"
								onClick={() => setShowMonetizationModal(true)}
							>
								<Gear className="me-2" size={14} />
								Settings
							</Button>
						</Card.Header>
						<Card.Body>
							<div className="row g-3">
								<div className="col-md-4">
									<div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
										<div>
											<h6 className="mb-1">Subscription Tier</h6>
											<small className="text-muted">$9.99/month</small>
										</div>
										<Badge bg="success">Active</Badge>
									</div>
								</div>
								<div className="col-md-4">
									<div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
										<div>
											<h6 className="mb-1">Ad Revenue Share</h6>
											<small className="text-muted">70% creator share</small>
										</div>
										<Badge bg="info">Enabled</Badge>
									</div>
								</div>
								<div className="col-md-4">
									<div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
										<div>
											<h6 className="mb-1">Tips</h6>
											<small className="text-muted">Direct support</small>
										</div>
										<Badge bg="warning">Active</Badge>
									</div>
								</div>
							</div>
						</Card.Body>
					</Card>
				</Tab>

				<Tab eventKey="analytics" title={
					<span className="d-flex align-items-center">
						<GraphUpArrow className="me-2" size={16} />
						<span className="d-none d-sm-inline">Analytics</span>
					</span>
				}>
					<Row className="g-3">
						<Col md={12}>
							<Card className="border-0 shadow-sm">
								<Card.Header>
									<h5 className="mb-0">Creator Performance Metrics</h5>
								</Card.Header>
								<Card.Body>
									<Row className="g-3">
										<Col sm={6} lg={3}>
											<div className="text-center p-3 bg-light rounded">
												<h6 className="text-muted mb-1">RPM</h6>
												<h4 className="text-primary mb-0">
													${analytics.overview?.totalViews > 0 ? 
														((totalEarnings / analytics.overview.totalViews) * 1000).toFixed(2) : 
														'0.00'
													}
												</h4>
												<small className="text-muted">Per 1K views</small>
											</div>
										</Col>
										<Col sm={6} lg={3}>
											<div className="text-center p-3 bg-light rounded">
												<h6 className="text-muted mb-1">Subscriber Rate</h6>
												<h4 className="text-success mb-0">
													{analytics.overview?.currentFollowers > 0 ? 
														((analytics.overview?.totalSubscriptions || 0) / analytics.overview.currentFollowers * 100).toFixed(1) : 
														'0.0'
													}%
												</h4>
												<small className="text-muted">Conversion rate</small>
											</div>
										</Col>
										<Col sm={6} lg={3}>
											<div className="text-center p-3 bg-light rounded">
												<h6 className="text-muted mb-1">Avg. Tip</h6>
												<h4 className="text-warning mb-0">
													${analytics.overview?.averageTip?.toFixed(2) || '0.00'}
												</h4>
												<small className="text-muted">Per donation</small>
											</div>
										</Col>
										<Col sm={6} lg={3}>
											<div className="text-center p-3 bg-light rounded">
												<h6 className="text-muted mb-1">Growth Rate</h6>
												<h4 className="text-info mb-0">
													{analytics.overview?.revenueGrowth >= 0 ? '+' : ''}{analytics.overview?.revenueGrowth?.toFixed(1) || '0.0'}%
												</h4>
												<small className="text-muted">Monthly</small>
											</div>
										</Col>
									</Row>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Tab>
			</Tabs>

			{/* Payout Modal */}
			<Modal show={showPayoutModal} onHide={() => setShowPayoutModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Request Payout</Modal.Title>
				</Modal.Header>
				<Form onSubmit={handlePayout}>
					<Modal.Body>
						<Form.Group className="mb-3">
							<Form.Label>Amount ($)</Form.Label>
							<Form.Control
								type="number"
								step="0.01"
								min="10"
								max={availableBalance}
								value={payoutForm.amount}
								onChange={(e) => setPayoutForm({...payoutForm, amount: e.target.value})}
								required
							/>
							<small className="text-muted">Available: ${availableBalance.toFixed(2)}</small>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Payout Method</Form.Label>
							<Form.Select
								value={payoutForm.method}
								onChange={(e) => setPayoutForm({...payoutForm, method: e.target.value})}
							>
								<option value="paypal">PayPal</option>
								<option value="stripe">Stripe</option>
								<option value="bank">Bank Transfer</option>
							</Form.Select>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Email</Form.Label>
							<Form.Control
								type="email"
								value={payoutForm.email}
								onChange={(e) => setPayoutForm({...payoutForm, email: e.target.value})}
								required
							/>
						</Form.Group>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => setShowPayoutModal(false)}>
							Cancel
						</Button>
						<Button type="submit" variant="success">
							Request Payout
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>

			{/* Monetization Settings Modal */}
			<Modal show={showMonetizationModal} onHide={() => setShowMonetizationModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Monetization Settings</Modal.Title>
				</Modal.Header>
				<Form onSubmit={handleMonetizationSettings}>
					<Modal.Body>
						<Form.Group className="mb-3">
							<Form.Check
								type="switch"
								id="subscription-switch"
								label="Enable Subscriptions"
								checked={monetizationSettings.subscriptionEnabled}
								onChange={(e) => setMonetizationSettings({
									...monetizationSettings,
									subscriptionEnabled: e.target.checked
								})}
							/>
						</Form.Group>
						{monetizationSettings.subscriptionEnabled && (
							<Form.Group className="mb-3">
								<Form.Label>Subscription Price ($)</Form.Label>
								<Form.Control
									type="number"
									step="0.01"
									min="1"
									value={monetizationSettings.subscriptionPrice}
									onChange={(e) => setMonetizationSettings({
										...monetizationSettings,
										subscriptionPrice: e.target.value
									})}
								/>
							</Form.Group>
						)}
						<Form.Group className="mb-3">
							<Form.Check
								type="switch"
								id="tips-switch"
								label="Enable Tips & Donations"
								checked={monetizationSettings.tipsEnabled}
								onChange={(e) => setMonetizationSettings({
									...monetizationSettings,
									tipsEnabled: e.target.checked
								})}
							/>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Check
								type="switch"
								id="ads-switch"
								label="Enable Ad Revenue"
								checked={monetizationSettings.adRevenueEnabled}
								onChange={(e) => setMonetizationSettings({
									...monetizationSettings,
									adRevenueEnabled: e.target.checked
								})}
							/>
						</Form.Group>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => setShowMonetizationModal(false)}>
							Cancel
						</Button>
						<Button type="submit" variant="primary">
							Update Settings
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>
		</Container>
	);
};

export default CreatorPage;
