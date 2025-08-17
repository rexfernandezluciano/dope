/** @format */

import { useState, useEffect, useCallback } from "react";
import { useLoaderData } from "react-router-dom";
import {
	Container,
	Row,
	Col,
	Card,
	Button,
	Table,
	Badge,
	Alert,
	Modal,
	Form,
	InputGroup,
	Dropdown,
	ProgressBar,
	Tab,
	Tabs,
	Spinner,
} from "react-bootstrap";
import {
	BarChart,
	GraphUp as TrendingUp,
	Heart,
	ChatDots as MessageCircle,
	Share,
	Users,
	Calendar,
	Bullseye as Target,
	Gift,
	Award as Crown,
	Eye,
	FileText,
	PieChartFill,
	Activity,
	Star,
	Lightning as Zap,
} from "react-bootstrap-icons";
import { CurrencyDollar as DollarSign } from "react-bootstrap-icons";

import { userAPI, postAPI } from "../config/ApiConfig";
import { formatTimeAgo } from "../utils/common-utils";

const AnalyticsPage = () => {
	const { user } = useLoaderData() || {};
	const [analytics, setAnalytics] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [timeRange, setTimeRange] = useState("30d");
	const [showMonetizationModal, setShowMonetizationModal] = useState(false);
	const [monetizationData, setMonetizationData] = useState({
		totalEarnings: 0,
		monthlyEarnings: 0,
		sponsoredPosts: 0,
		tipJar: 0,
		subscriptions: 0,
	});
	const [contentMetrics, setContentMetrics] = useState({
		bestPerformingPosts: [],
		engagementTrends: [],
		audienceInsights: {},
	});

	useEffect(() => {
		loadAnalytics();
	}, [loadAnalytics]);

	const loadAnalytics = useCallback(async () => {
		try {
			setLoading(true);
			setError("");

			// Simulate API calls for analytics data
			const response = await Promise.all([
				getUserAnalytics(),
				getContentMetrics(),
				getMonetizationData(),
			]);

			setAnalytics(response[0]);
			setContentMetrics(response[1]);
			setMonetizationData(response[2]);
		} catch (err) {
			setError(err.message || "Failed to load analytics");
		} finally {
			setLoading(false);
		}
	}, [timeRange]);

	// Mock API functions (replace with actual API calls)
	const getUserAnalytics = async () => {
		// Simulate fetching user analytics
		return {
			totalPosts: Math.floor(Math.random() * 500) + 50,
			totalLikes: Math.floor(Math.random() * 5000) + 500,
			totalComments: Math.floor(Math.random() * 2000) + 200,
			totalShares: Math.floor(Math.random() * 1000) + 100,
			totalViews: Math.floor(Math.random() * 50000) + 5000,
			followers: Math.floor(Math.random() * 1000) + 100,
			following: Math.floor(Math.random() * 500) + 50,
			engagementRate: (Math.random() * 10 + 2).toFixed(1),
			reachGrowth: (Math.random() * 50 + 10).toFixed(1),
			topPerformingDay: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][Math.floor(Math.random() * 7)],
		};
	};

	const getContentMetrics = async () => {
		return {
			bestPerformingPosts: [
				{
					id: "1",
					content: "Amazing sunset view from my window! 🌅",
					likes: 245,
					comments: 32,
					shares: 18,
					views: 1250,
					engagementRate: 23.6,
					createdAt: "2024-01-10T10:00:00Z",
				},
				{
					id: "2",
					content: "Just finished my morning workout routine! 💪",
					likes: 189,
					comments: 28,
					shares: 12,
					views: 980,
					engagementRate: 23.4,
					createdAt: "2024-01-08T07:30:00Z",
				},
				{
					id: "3",
					content: "Coffee and coding session today ☕️👨‍💻",
					likes: 156,
					comments: 24,
					shares: 8,
					views: 850,
					engagementRate: 22.1,
					createdAt: "2024-01-05T09:15:00Z",
				},
			],
			engagementTrends: {
				labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
				likes: [120, 150, 180, 200],
				comments: [25, 35, 40, 45],
				shares: [10, 15, 20, 25],
			},
			audienceInsights: {
				topCountries: ["United States", "Canada", "United Kingdom", "Australia"],
				ageGroups: {
					"18-24": 35,
					"25-34": 40,
					"35-44": 20,
					"45+": 5,
				},
				genderDistribution: {
					male: 55,
					female: 43,
					other: 2,
				},
			},
		};
	};

	const getMonetizationData = async () => {
		return {
			totalEarnings: (Math.random() * 5000 + 500).toFixed(2),
			monthlyEarnings: (Math.random() * 800 + 100).toFixed(2),
			sponsoredPosts: Math.floor(Math.random() * 10) + 2,
			tipJar: (Math.random() * 200 + 50).toFixed(2),
			subscriptions: (Math.random() * 300 + 100).toFixed(2),
			potentialEarnings: (Math.random() * 2000 + 500).toFixed(2),
		};
	};

	const handleEnableMonetization = async () => {
		try {
			// Simulate enabling monetization
			await new Promise(resolve => setTimeout(resolve, 1000));
			setShowMonetizationModal(false);
			alert("Monetization features enabled! You can now start earning from your content.");
		} catch (err) {
			setError("Failed to enable monetization features");
		}
	};

	if (loading) {
		return (
			<Container className="text-center py-5">
				<Spinner animation="border" variant="primary" />
				<p className="mt-3">Loading analytics...</p>
			</Container>
		);
	}

	if (error) {
		return (
			<Container className="py-3">
				<Alert variant="danger">{error}</Alert>
			</Container>
		);
	}

	return (
		<Container className="py-3 px-3">
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h2 className="mb-0">
					<Activity className="me-2" />
					Analytics Dashboard
				</h2>
				<div className="d-flex gap-2">
					<Dropdown>
						<Dropdown.Toggle variant="outline-primary" size="sm">
							<Calendar className="me-1" size={14} />
							{timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : "Last 90 days"}
						</Dropdown.Toggle>
						<Dropdown.Menu>
							<Dropdown.Item onClick={() => setTimeRange("7d")}>Last 7 days</Dropdown.Item>
							<Dropdown.Item onClick={() => setTimeRange("30d")}>Last 30 days</Dropdown.Item>
							<Dropdown.Item onClick={() => setTimeRange("90d")}>Last 90 days</Dropdown.Item>
						</Dropdown.Menu>
					</Dropdown>
					<Button
						variant="success"
						size="sm"
						onClick={() => setShowMonetizationModal(true)}
					>
						<DollarSign className="me-1" size={14} />
						Monetize
					</Button>
				</div>
			</div>

			<Tabs defaultActiveKey="overview" className="mb-4">
				{/* Overview Tab */}
				<Tab eventKey="overview" title={<><BarChart className="me-1" />Overview</>}>
					{/* Key Metrics Cards */}
					<Row className="mb-4">
						<Col md={3} sm={6} className="mb-3">
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center">
									<div className="d-flex align-items-center justify-content-center mb-2">
										<FileText className="text-primary me-2" size={24} />
										<h3 className="mb-0 text-primary">{analytics?.totalPosts || 0}</h3>
									</div>
									<p className="text-muted mb-0">Total Posts</p>
									<small className="text-success">+{Math.floor(Math.random() * 20 + 5)}% this month</small>
								</Card.Body>
							</Card>
						</Col>
						<Col md={3} sm={6} className="mb-3">
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center">
									<div className="d-flex align-items-center justify-content-center mb-2">
										<Heart className="text-danger me-2" size={24} />
										<h3 className="mb-0 text-danger">{analytics?.totalLikes || 0}</h3>
									</div>
									<p className="text-muted mb-0">Total Likes</p>
									<small className="text-success">+{Math.floor(Math.random() * 30 + 10)}% this month</small>
								</Card.Body>
							</Card>
						</Col>
						<Col md={3} sm={6} className="mb-3">
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center">
									<div className="d-flex align-items-center justify-content-center mb-2">
										<Eye className="text-info me-2" size={24} />
										<h3 className="mb-0 text-info">{analytics?.totalViews || 0}</h3>
									</div>
									<p className="text-muted mb-0">Total Views</p>
									<small className="text-success">+{analytics?.reachGrowth || 0}% reach growth</small>
								</Card.Body>
							</Card>
						</Col>
						<Col md={3} sm={6} className="mb-3">
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center">
									<div className="d-flex align-items-center justify-content-center mb-2">
										<TrendingUp className="text-warning me-2" size={24} />
										<h3 className="mb-0 text-warning">{analytics?.engagementRate || 0}%</h3>
									</div>
									<p className="text-muted mb-0">Engagement Rate</p>
									<small className="text-muted">Industry avg: 3.2%</small>
								</Card.Body>
							</Card>
						</Col>
					</Row>

					{/* Monetization Overview */}
					<Row className="mb-4">
						<Col lg={8}>
							<Card className="border-0 shadow-sm">
								<Card.Header className="bg-gradient-primary text-white">
									<h5 className="mb-0">
										<DollarSign className="me-2" />
										Monetization Overview
									</h5>
								</Card.Header>
								<Card.Body>
									<Row>
										<Col md={6}>
											<div className="mb-3">
												<div className="d-flex justify-content-between align-items-center mb-1">
													<span className="text-muted">Total Earnings</span>
													<span className="fw-bold text-success">${monetizationData.totalEarnings}</span>
												</div>
												<div className="d-flex justify-content-between align-items-center mb-1">
													<span className="text-muted">This Month</span>
													<span className="fw-bold">${monetizationData.monthlyEarnings}</span>
												</div>
												<div className="d-flex justify-content-between align-items-center">
													<span className="text-muted">Potential Monthly</span>
													<span className="fw-bold text-primary">${monetizationData.potentialEarnings}</span>
												</div>
											</div>
										</Col>
										<Col md={6}>
											<div className="mb-3">
												<div className="d-flex justify-content-between align-items-center mb-2">
													<span>Sponsored Posts</span>
													<Badge bg="primary">{monetizationData.sponsoredPosts}</Badge>
												</div>
												<div className="d-flex justify-content-between align-items-center mb-2">
													<span>Tips Received</span>
													<Badge bg="success">${monetizationData.tipJar}</Badge>
												</div>
												<div className="d-flex justify-content-between align-items-center">
													<span>Subscriptions</span>
													<Badge bg="warning">${monetizationData.subscriptions}</Badge>
												</div>
											</div>
										</Col>
									</Row>
									<Button
										variant="outline-success"
										size="sm"
										className="w-100"
										onClick={() => setShowMonetizationModal(true)}
									>
										<Zap className="me-1" size={14} />
										Unlock More Earning Opportunities
									</Button>
								</Card.Body>
							</Card>
						</Col>
						<Col lg={4}>
							<Card className="border-0 shadow-sm h-100">
								<Card.Header>
									<h6 className="mb-0">
										<Target className="me-2" />
										Quick Insights
									</h6>
								</Card.Header>
								<Card.Body>
									<div className="mb-3">
										<small className="text-muted">Best performing day</small>
										<div className="fw-bold">{analytics?.topPerformingDay}</div>
									</div>
									<div className="mb-3">
										<small className="text-muted">Avg. engagement per post</small>
										<div className="fw-bold">{Math.floor((analytics?.totalLikes + analytics?.totalComments) / analytics?.totalPosts) || 0}</div>
									</div>
									<div className="mb-3">
										<small className="text-muted">Growth potential</small>
										<ProgressBar now={75} label="75%" variant="success" />
									</div>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Tab>

				{/* Content Performance Tab */}
				<Tab eventKey="content" title={<><Star className="me-1" />Content Performance</>}>
					<Row>
						<Col lg={8}>
							<Card className="border-0 shadow-sm mb-4">
								<Card.Header>
									<h5 className="mb-0">Best Performing Posts</h5>
								</Card.Header>
								<Card.Body className="p-0">
									<Table responsive hover className="mb-0">
										<thead className="table-light">
											<tr>
												<th>Content</th>
												<th className="text-center">Likes</th>
												<th className="text-center">Comments</th>
												<th className="text-center">Shares</th>
												<th className="text-center">Views</th>
												<th className="text-center">Engagement Rate</th>
												<th className="text-center">Posted</th>
											</tr>
										</thead>
										<tbody>
											{contentMetrics.bestPerformingPosts.map((post, index) => (
												<tr key={post.id}>
													<td>
														<div className="d-flex align-items-center">
															<Badge bg={index === 0 ? "warning" : index === 1 ? "secondary" : "info"} className="me-2">
																{index + 1}
															</Badge>
															<div>
																<div className="fw-bold text-truncate" style={{ maxWidth: "200px" }}>
																	{post.content}
																</div>
															</div>
														</div>
													</td>
													<td className="text-center">
														<Heart className="text-danger me-1" size={14} />
														{post.likes}
													</td>
													<td className="text-center">
														<MessageCircle className="text-primary me-1" size={14} />
														{post.comments}
													</td>
													<td className="text-center">
														<Share className="text-success me-1" size={14} />
														{post.shares}
													</td>
													<td className="text-center">
														<Eye className="text-info me-1" size={14} />
														{post.views}
													</td>
													<td className="text-center">
														<Badge bg="success">{post.engagementRate}%</Badge>
													</td>
													<td className="text-center text-muted">
														{formatTimeAgo(post.createdAt)}
													</td>
												</tr>
											))}
										</tbody>
									</Table>
								</Card.Body>
							</Card>
						</Col>
						<Col lg={4}>
							<Card className="border-0 shadow-sm mb-4">
								<Card.Header>
									<h6 className="mb-0">
										<PieChartFill className="me-2" />
										Audience Demographics
									</h6>
								</Card.Header>
								<Card.Body>
									<div className="mb-4">
										<h6 className="small text-muted mb-2">Age Groups</h6>
										{Object.entries(contentMetrics.audienceInsights.ageGroups || {}).map(([age, percentage]) => (
											<div key={age} className="mb-2">
												<div className="d-flex justify-content-between small mb-1">
													<span>{age}</span>
													<span>{percentage}%</span>
												</div>
												<ProgressBar now={percentage} style={{ height: "6px" }} />
											</div>
										))}
									</div>
									<div className="mb-3">
										<h6 className="small text-muted mb-2">Top Countries</h6>
										{contentMetrics.audienceInsights.topCountries?.slice(0, 4).map((country, index) => (
											<div key={country} className="d-flex justify-content-between small mb-1">
												<span>{country}</span>
												<Badge bg="outline-secondary">{30 - index * 5}%</Badge>
											</div>
										))}
									</div>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Tab>

				{/* Monetization Tab */}
				<Tab eventKey="monetization" title={<><DollarSign className="me-1" />Monetization</>}>
					<Row>
						<Col lg={8}>
							<Card className="border-0 shadow-sm mb-4">
								<Card.Header className="bg-success text-white">
									<h5 className="mb-0">
										<Crown className="me-2" />
										Monetization Opportunities
									</h5>
								</Card.Header>
								<Card.Body>
									<Row>
										<Col md={6} className="mb-4">
											<Card className="border border-primary h-100">
												<Card.Body className="text-center">
													<Gift className="text-primary mb-2" size={32} />
													<h6>Sponsored Content</h6>
													<p className="small text-muted mb-3">
														Partner with brands to create sponsored posts and earn up to $500 per post.
													</p>
													<Button variant="primary" size="sm" onClick={() => console.log('Find Sponsors clicked')}>
														Find Sponsors
													</Button>
												</Card.Body>
											</Card>
										</Col>
										<Col md={6} className="mb-4">
											<Card className="border border-success h-100">
												<Card.Body className="text-center">
													<Heart className="text-success mb-2" size={32} />
													<h6>Tip Jar</h6>
													<p className="small text-muted mb-3">
														Enable tips from your followers and earn up to $200 per month.
													</p>
													<Button variant="success" size="sm" onClick={() => console.log('Enable Tips clicked')}>
														Enable Tips
													</Button>
												</Card.Body>
											</Card>
										</Col>
										<Col md={6} className="mb-4">
											<Card className="border border-warning h-100">
												<Card.Body className="text-center">
													<Users className="text-warning mb-2" size={32} />
													<h6>Exclusive Content</h6>
													<p className="small text-muted mb-3">
														Create premium content for subscribers and earn recurring revenue.
													</p>
													<Button variant="warning" size="sm" onClick={() => console.log('Setup Subscriptions clicked')}>
														Setup Subscriptions
													</Button>
												</Card.Body>
											</Card>
										</Col>
										<Col md={6} className="mb-4">
											<Card className="border border-info h-100">
												<Card.Body className="text-center">
													<Zap className="text-info mb-2" size={32} />
													<h6>Live Streaming</h6>
													<p className="small text-muted mb-3">
														Monetize your live streams with super chats and donations.
													</p>
													<Button variant="info" size="sm" onClick={() => console.log('Start Streaming clicked')}>
														Start Streaming
													</Button>
												</Card.Body>
											</Card>
										</Col>
									</Row>
								</Card.Body>
							</Card>
						</Col>
						<Col lg={4}>
							<Card className="border-0 shadow-sm mb-4">
								<Card.Header>
									<h6 className="mb-0">Earning Calculator</h6>
								</Card.Header>
								<Card.Body>
									<Form>
										<Form.Group className="mb-3">
											<Form.Label className="small">Followers</Form.Label>
											<Form.Control
												type="number"
												placeholder={analytics?.followers || "1000"}
												size="sm"
											/>
										</Form.Group>
										<Form.Group className="mb-3">
											<Form.Label className="small">Posts per month</Form.Label>
											<Form.Control
												type="number"
												placeholder="20"
												size="sm"
											/>
										</Form.Group>
										<Form.Group className="mb-3">
											<Form.Label className="small">Engagement rate</Form.Label>
											<InputGroup size="sm">
												<Form.Control
													type="number"
													placeholder={analytics?.engagementRate || "5"}
												/>
												<InputGroup.Text>%</InputGroup.Text>
											</InputGroup>
										</Form.Group>
										<hr />
										<div className="text-center">
											<div className="small text-muted mb-1">Estimated Monthly Earnings</div>
											<div className="h4 text-success mb-2">${(Math.random() * 1000 + 200).toFixed(0)}</div>
											<Button variant="outline-success" size="sm" className="w-100">
												Optimize Earnings
											</Button>
										</div>
									</Form>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Tab>
			</Tabs>

			{/* Monetization Setup Modal */}
			<Modal
				show={showMonetizationModal}
				onHide={() => setShowMonetizationModal(false)}
				centered
				size="lg"
			>
				<Modal.Header closeButton>
					<Modal.Title>
						<DollarSign className="me-2" />
						Enable Monetization
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<div className="text-center mb-4">
						<Crown size={48} className="text-warning mb-3" />
						<h5>Start Earning from Your Content</h5>
						<p className="text-muted">
							Unlock various monetization features and start earning from your social media presence.
						</p>
					</div>

					<Row>
						<Col md={6} className="mb-3">
							<Card className="border-primary h-100">
								<Card.Body className="text-center">
									<Gift className="text-primary mb-2" size={24} />
									<h6>Brand Partnerships</h6>
									<small className="text-muted">Connect with brands for sponsored content</small>
								</Card.Body>
							</Card>
						</Col>
						<Col md={6} className="mb-3">
							<Card className="border-success h-100">
								<Card.Body className="text-center">
									<Heart className="text-success mb-2" size={24} />
									<h6>Fan Support</h6>
									<small className="text-muted">Receive tips and donations from followers</small>
								</Card.Body>
							</Card>
						</Col>
						<Col md={6} className="mb-3">
							<Card className="border-warning h-100">
								<Card.Body className="text-center">
									<Users className="text-warning mb-2" size={24} />
									<h6>Premium Content</h6>
									<small className="text-muted">Offer exclusive content to subscribers</small>
								</Card.Body>
							</Card>
						</Col>
						<Col md={6} className="mb-3">
							<Card className="border-info h-100">
								<Card.Body className="text-center">
									<Zap className="text-info mb-2" size={24} />
									<h6>Live Monetization</h6>
									<small className="text-muted">Earn from live streaming and events</small>
								</Card.Body>
							</Card>
						</Col>
					</Row>

					<Alert variant="info" className="mt-3">
						<strong>Requirements:</strong> To enable monetization, you need at least 100 followers and 
						an active subscription (Premium or Pro).
					</Alert>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() => setShowMonetizationModal(false)}
					>
						Cancel
					</Button>
					<Button
						variant="success"
						onClick={handleEnableMonetization}
						disabled={!user?.subscription || user.subscription === "free"}
					>
						{user?.subscription === "free" ? "Upgrade Required" : "Enable Monetization"}
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
};

export default AnalyticsPage;