
/** @format */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLoaderData } from "react-router-dom";
import {
	Container,
	Row,
	Col,
	Card,
	Badge,
	Alert,
	Dropdown,
	ProgressBar,
	Spinner,
	Nav,
	Tab,
	Table,
} from "react-bootstrap";
import {
	BarChartFill,
	GraphUp,
	Heart,
	ChatDots as MessageCircle,
	Share,
	People as Users,
	Calendar3,
	Bullseye as Target,
	Eye,
	FileText,
	Activity,
	CurrencyDollar,
	GraphUp as TrendingUp,
	House,
	PersonCheck,
} from "react-bootstrap-icons";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	AreaChart,
	Area,
} from "recharts";

import { postAPI, userAPI } from "../config/ApiConfig";
import { formatTimeAgo } from "../utils/common-utils";
import { updatePageMeta } from "../utils/meta-utils";

const AnalyticsPage = () => {
	const { user } = useLoaderData() || {};
	const [analytics, setAnalytics] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [timeRange, setTimeRange] = useState("30d");
	const [activeTab, setActiveTab] = useState("home");
	const [userEarnings, setUserEarnings] = useState(0);

	const loadAnalytics = useCallback(async () => {
		try {
			setLoading(true);
			setError("");

			// Fetch real user posts data from DOPE API
			const userPostsResponse = await postAPI.getPosts({
				author: user?.username,
				limit: 100
			});

			const userPosts = userPostsResponse?.posts || [];

			// Calculate real analytics from DOPE API posts data
			const totalPosts = userPosts.length;
			const totalLikes = userPosts.reduce((sum, post) => sum + (post.stats?.likes || 0), 0);
			const totalComments = userPosts.reduce((sum, post) => sum + (post.stats?.comments || 0), 0);
			const totalShares = userPosts.reduce((sum, post) => sum + (post?.sharesCount || post?.analytics?.shares || 0), 0);
			const totalViews = userPosts.reduce((sum, post) => {
				const analyticsViews = post?.analytics?.views || 0;
				const estimatedViews = analyticsViews > 0 ? analyticsViews : (post.stats?.likes || 0) + (post.stats?.comments || 0) + (post?.sharesCount || 0);
				return sum + estimatedViews;
			}, 0);

			// Calculate engagement rate
			const totalEngagement = totalLikes + totalComments + totalShares;
			const engagementRate = totalViews > 0 ? ((totalEngagement / totalViews) * 100).toFixed(1) : "0.0";

			// Get top performing posts
			const topPosts = [...userPosts]
				.sort((a, b) => {
					const aEngagement = (a.stats?.likes || 0) + (a.stats?.comments || 0) + (a?.sharesCount || a?.analytics?.shares || 0);
					const bEngagement = (b.stats?.likes || 0) + (b.stats?.comments || 0) + (b?.sharesCount || b?.analytics?.shares || 0);
					return bEngagement - aEngagement;
				})
				.slice(0, 5);

			// Calculate growth metrics
			const now = new Date();
			const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			const recentPosts = userPosts.filter(post => new Date(post.createdAt) >= thirtyDaysAgo);
			const recentLikes = recentPosts.reduce((sum, post) => sum + (post.stats?.likes || 0), 0);
			const recentGrowth = totalLikes > 0 ? ((recentLikes / totalLikes) * 100).toFixed(1) : "0.0";

			// Generate mock earnings data for monetization
			const earningPosts = topPosts.map((post, index) => ({
				...post,
				earnings: (Math.random() * 50 + 10).toFixed(2),
				views: (post.stats?.likes || 0) * (Math.random() * 10 + 5),
				cpm: (Math.random() * 3 + 1).toFixed(2)
			}));

			setAnalytics({
				totalPosts,
				totalLikes,
				totalComments,
				totalShares,
				totalViews,
				followers: user?.followersCount || 0,
				following: user?.followingCount || 0,
				engagementRate,
				reachGrowth: recentGrowth,
				topPosts,
				recentPostsCount: recentPosts.length,
				earningPosts,
				totalEarnings: userEarnings
			});

		} catch (err) {
			console.error("Analytics loading error:", err);
			setError("Failed to load analytics data");
		} finally {
			setLoading(false);
		}
	}, [user?.username]);

	const loadUserEarnings = useCallback(async () => {
		const earnings = await userAPI.getUserEarnings();
		const totalEarnings = earnings.totalEarnings;
		setUserEarnings(totalEarnings ?? 0)
	}, [])

	useEffect(() => {
		if (user?.uid && user?.username) {
			loadAnalytics();
			loadUserEarnings();
			updatePageMeta("Analytics", `View your content performance and growth metrics on DOPE. Your username is ${user?.username}.`);
		}
	}, [loadAnalytics, loadUserEarnings, user?.uid, user?.username]);

	// Chart data
	const chartData = useMemo(() => {
		if (!analytics) return [];
		
		const last7Days = Array.from({ length: 7 }, (_, i) => {
			const date = new Date();
			date.setDate(date.getDate() - (6 - i));
			return {
				date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
				likes: Math.floor(Math.random() * 50) + 10,
				views: Math.floor(Math.random() * 200) + 50,
				comments: Math.floor(Math.random() * 20) + 5,
				shares: Math.floor(Math.random() * 15) + 2,
			};
		});
		return last7Days;
	}, [analytics]);

	const engagementData = useMemo(() => [
		{ name: 'Likes', value: analytics?.totalLikes || 0, color: '#dc3545' },
		{ name: 'Comments', value: analytics?.totalComments || 0, color: '#0d6efd' },
		{ name: 'Shares', value: analytics?.totalShares || 0, color: '#198754' },
	], [analytics]);

	const StatCard = ({ icon: Icon, title, value, subtitle, color = "primary", growth, size = "normal" }) => (
		<Card className="border-0 shadow-sm h-100 stat-card">
			<Card.Body className={`${size === "large" ? "p-4" : "p-3"}`}>
				<div className="d-flex align-items-center justify-content-between mb-2">
					<Icon className={`text-${color}`} size={size === "large" ? 28 : 24} />
					{growth && (
						<Badge bg={growth > 0 ? "success" : "secondary"} className="rounded-pill">
							{growth > 0 ? "+" : ""}{growth}%
						</Badge>
					)}
				</div>
				<h3 className={`mb-1 fw-bold ${size === "large" ? "display-6" : ""}`}>{value}</h3>
				<p className="text-muted mb-1 small">{title}</p>
				{subtitle && <small className="text-muted">{subtitle}</small>}
			</Card.Body>
		</Card>
	);

	const TopPostCard = ({ post, rank, showEarnings = false }) => {
		const totalEngagement = (post.stats?.likes || 0) + (post.stats?.comments || 0) + (post?.sharesCount || post?.analytics?.shares || 0);
		const actualViews = post?.analytics?.views || 0;
		const estimatedViews = actualViews > 0 ? actualViews : totalEngagement * 3;
		const engagementRate = estimatedViews > 0 ? ((totalEngagement / estimatedViews) * 100).toFixed(1) : 0;

		return (
			<Card className="border-0 shadow-sm mb-3 post-card">
				<Card.Body className="p-3">
					<div className="d-flex align-items-start">
						<Badge
							bg={rank === 1 ? "warning" : rank === 2 ? "secondary" : "info"}
							className="rounded-circle me-3 rank-badge"
						>
							{rank}
						</Badge>
						<div className="flex-grow-1">
							<p className="mb-2 post-content">{post.content}</p>
							<div className="d-flex flex-wrap gap-3 text-muted small">
								<span><Heart className="me-1 text-danger" size={12} />{post.stats?.likes || 0}</span>
								<span><MessageCircle className="me-1 text-primary" size={12} />{post.stats?.comments || 0}</span>
								<span><Share className="me-1 text-success" size={12} />{post.sharesCount || 0}</span>
								<span><Eye className="me-1 text-info" size={12} />{estimatedViews}</span>
								{showEarnings && <span><CurrencyDollar className="me-1 text-warning" size={12} />${post.earnings}</span>}
							</div>
							<div className="mt-2 d-flex justify-content-between align-items-center">
								<Badge bg="success" className="rounded-pill">{engagementRate}% engagement</Badge>
								<small className="text-muted">{formatTimeAgo(post.createdAt)}</small>
							</div>
						</div>
					</div>
				</Card.Body>
			</Card>
		);
	};

	if (loading) {
		return (
			<Container className="text-center py-5">
				<Spinner animation="border" variant="primary" />
				<p className="mt-3 text-muted">Loading analytics...</p>
			</Container>
		);
	}

	if (error) {
		return (
			<Container className="py-3">
				<Alert variant="danger" className="rounded-3">
					<Activity className="me-2" />
					{error}
				</Alert>
			</Container>
		);
	}

	return (
		<>
			<style jsx>{`
				.stat-card {
					transition: transform 0.2s ease-in-out;
				}
				.stat-card:hover {
					transform: translateY(-2px);
				}
				.post-card:hover {
					transform: translateY(-1px);
					transition: transform 0.2s ease-in-out;
				}
				.rank-badge {
					width: 24px;
					height: 24px;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 12px;
					font-weight: bold;
				}
				.post-content {
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
					line-height: 1.4;
				}
				.nav-tabs .nav-link {
					border: none;
					color: #6c757d;
					font-weight: 500;
				}
				.nav-tabs .nav-link.active {
					background-color: transparent;
					border-bottom: 2px solid #0d6efd;
					color: #0d6efd;
				}
				.chart-container {
					height: 300px;
				}
				@media (max-width: 768px) {
					.mobile-stack {
						margin-bottom: 1rem;
					}
					.chart-container {
						height: 250px;
					}
				}
			`}</style>

			<Container fluid className="py-3 px-3">
				{/* Header */}
				<div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
					<div className="mb-3 mb-md-0">
						<h2 className="mb-1 fw-bold">
							<BarChartFill className="me-2 text-primary" />
							Analytics Dashboard
						</h2>
						<p className="text-muted mb-0">Track your content performance and growth</p>
					</div>
					<div className="d-flex gap-2">
						<Dropdown>
							<Dropdown.Toggle variant="outline-primary" size="sm" className="rounded-3">
								<Calendar3 className="me-1" size={14} />
								{timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : "Last 90 days"}
							</Dropdown.Toggle>
							<Dropdown.Menu>
								<Dropdown.Item onClick={() => setTimeRange("7d")}>Last 7 days</Dropdown.Item>
								<Dropdown.Item onClick={() => setTimeRange("30d")}>Last 30 days</Dropdown.Item>
								<Dropdown.Item onClick={() => setTimeRange("90d")}>Last 90 days</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown>
					</div>
				</div>

				{/* Tabs Navigation */}
				<Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
					<Nav variant="tabs" className="mb-4">
						<Nav.Item>
							<Nav.Link eventKey="home" className="d-flex align-items-center gap-2">
								<House size={16} />
								<span className="d-none d-inline">Home</span>
							</Nav.Link>
						</Nav.Item>
						<Nav.Item>
							<Nav.Link eventKey="growth" className="d-flex align-items-center gap-2">
								<TrendingUp size={16} />
								<span className="d-none d-md-inline">Growth</span>
							</Nav.Link>
						</Nav.Item>
						<Nav.Item>
							<Nav.Link eventKey="monetization" className="d-flex align-items-center gap-2">
								<CurrencyDollar size={16} />
								<span className="d-none d-md-inline">Monetization</span>
							</Nav.Link>
						</Nav.Item>
						<Nav.Item>
							<Nav.Link eventKey="audience" className="d-flex align-items-center gap-2">
								<PersonCheck size={16} />
								<span className="d-none d-md-inline">Audience</span>
							</Nav.Link>
						</Nav.Item>
					</Nav>

					<Tab.Content>
						{/* Home Tab */}
						<Tab.Pane eventKey="home">
							{/* Key Metrics */}
							<Row className="g-3 mb-4">
								<Col xs={6} lg={3}>
									<StatCard
										icon={FileText}
										title="Total Posts"
										value={analytics?.totalPosts || 0}
										color="primary"
										growth={analytics?.recentPostsCount}
									/>
								</Col>
								<Col xs={6} lg={3}>
									<StatCard
										icon={Heart}
										title="Total Likes"
										value={analytics?.totalLikes || 0}
										color="danger"
										growth={parseInt(analytics?.reachGrowth) || 0}
									/>
								</Col>
								<Col xs={6} lg={3}>
									<StatCard
										icon={Eye}
										title="Total Views"
										value={analytics?.totalViews || 0}
										color="info"
										subtitle="Organic reach"
									/>
								</Col>
								<Col xs={6} lg={3}>
									<StatCard
										icon={CurrencyDollar}
										title="Total Earnings"
										value={`$${analytics?.totalEarnings || "0.00"}`}
										color="success"
										subtitle="This month"
									/>
								</Col>
							</Row>

							{/* Charts */}
							<Row className="g-4 mb-4">
								<Col lg={8}>
									<Card className="border-0 shadow-sm">
										<Card.Header className="bg-white border-0">
											<h5 className="mb-0 fw-bold">Performance Overview</h5>
										</Card.Header>
										<Card.Body>
											<div className="chart-container">
												<ResponsiveContainer width="100%" height="100%">
													<LineChart data={chartData}>
														<CartesianGrid strokeDasharray="3 3" />
														<XAxis dataKey="date" />
														<YAxis />
														<Tooltip />
														<Line type="monotone" dataKey="views" stroke="#0d6efd" strokeWidth={2} />
														<Line type="monotone" dataKey="likes" stroke="#dc3545" strokeWidth={2} />
														<Line type="monotone" dataKey="comments" stroke="#198754" strokeWidth={2} />
													</LineChart>
												</ResponsiveContainer>
											</div>
										</Card.Body>
									</Card>
								</Col>
								<Col lg={4}>
									<Card className="border-0 shadow-sm">
										<Card.Header className="bg-white border-0">
											<h5 className="mb-0 fw-bold">Engagement Breakdown</h5>
										</Card.Header>
										<Card.Body>
											<div className="chart-container">
												<ResponsiveContainer width="100%" height="100%">
													<PieChart>
														<Pie
															data={engagementData}
															cx="50%"
															cy="50%"
															innerRadius={40}
															outerRadius={80}
															paddingAngle={5}
															dataKey="value"
														>
															{engagementData.map((entry, index) => (
																<Cell key={`cell-${index}`} fill={entry.color} />
															))}
														</Pie>
														<Tooltip />
													</PieChart>
												</ResponsiveContainer>
											</div>
											<div className="mt-3">
												{engagementData.map((item, index) => (
													<div key={index} className="d-flex justify-content-between align-items-center mb-2">
														<div className="d-flex align-items-center">
															<div 
																className="rounded-circle me-2" 
																style={{ width: 12, height: 12, backgroundColor: item.color }}
															></div>
															<small>{item.name}</small>
														</div>
														<small className="fw-bold">{item.value}</small>
													</div>
												))}
											</div>
										</Card.Body>
									</Card>
								</Col>
							</Row>

							{/* Quick Insights */}
							<Row className="g-3">
								<Col xs={4} sm={4} lg={2}>
									<Card className="border-0 bg-light h-100">
										<Card.Body className="text-center p-3">
											<MessageCircle className="text-primary mb-2" size={20} />
											<div className="fw-bold">{analytics?.totalComments || 0}</div>
											<small className="text-muted">Comments</small>
										</Card.Body>
									</Card>
								</Col>
								<Col xs={4} sm={4} lg={2}>
									<Card className="border-0 bg-light h-100">
										<Card.Body className="text-center p-3">
											<Share className="text-success mb-2" size={20} />
											<div className="fw-bold">{analytics?.totalShares || 0}</div>
											<small className="text-muted">Shares</small>
										</Card.Body>
									</Card>
								</Col>
								<Col xs={4} sm={4} lg={2}>
									<Card className="border-0 bg-light h-100">
										<Card.Body className="text-center p-3">
											<Users className="text-warning mb-2" size={20} />
											<div className="fw-bold">{analytics?.followers || 0}</div>
											<small className="text-muted">Followers</small>
										</Card.Body>
									</Card>
								</Col>
								<Col xs={12} lg={6}>
									<Card className="border-0 shadow-sm h-100">
										<Card.Body className="p-3">
											<h6 className="mb-3">
												<Target className="me-2 text-primary" />
												Quick Insights
											</h6>
											<div className="row g-2">
												<div className="col-6">
													<small className="text-muted d-block">Avg. likes per post</small>
													<div className="fw-bold">{analytics?.totalPosts > 0 ? Math.round(analytics.totalLikes / analytics.totalPosts) : 0}</div>
												</div>
												<div className="col-6">
													<small className="text-muted d-block">Avg. engagement</small>
													<div className="fw-bold">{analytics?.totalPosts > 0 ? Math.round((analytics.totalLikes + analytics.totalComments) / analytics.totalPosts) : 0}</div>
												</div>
											</div>
											<div className="mt-3">
												<small className="text-muted d-block mb-1">Content Performance</small>
												<ProgressBar
													now={Math.min((analytics?.engagementRate || 0) * 10, 100)}
													variant="success"
													className="rounded-3"
													style={{ height: '8px' }}
												/>
											</div>
										</Card.Body>
									</Card>
								</Col>
							</Row>
						</Tab.Pane>

						{/* Growth Tab */}
						<Tab.Pane eventKey="growth">
							<Row className="g-4">
								<Col lg={8}>
									<Card className="border-0 shadow-sm">
										<Card.Header className="bg-white border-0">
											<h5 className="mb-0 fw-bold">Growth Trends</h5>
										</Card.Header>
										<Card.Body>
											<div className="chart-container">
												<ResponsiveContainer width="100%" height="100%">
													<AreaChart data={chartData}>
														<CartesianGrid strokeDasharray="3 3" />
														<XAxis dataKey="date" />
														<YAxis />
														<Tooltip />
														<Area type="monotone" dataKey="views" stackId="1" stroke="#0d6efd" fill="#0d6efd" fillOpacity={0.6} />
														<Area type="monotone" dataKey="likes" stackId="2" stroke="#dc3545" fill="#dc3545" fillOpacity={0.6} />
													</AreaChart>
												</ResponsiveContainer>
											</div>
										</Card.Body>
									</Card>
								</Col>
								<Col lg={4}>
									<Card className="border-0 shadow-sm mb-3">
										<Card.Header className="bg-white border-0">
											<h6 className="mb-0 fw-bold">Growth Metrics</h6>
										</Card.Header>
										<Card.Body>
											<div className="mb-3">
												<div className="d-flex justify-content-between align-items-center mb-1">
													<small className="text-muted">Follower Growth</small>
													<Badge bg="success" className="rounded-pill">+{analytics?.reachGrowth || 0}%</Badge>
												</div>
												<ProgressBar
													now={Math.min(analytics?.reachGrowth || 0, 100)}
													variant="success"
													className="rounded-3"
													style={{ height: '6px' }}
												/>
											</div>
											<div className="mb-3">
												<div className="d-flex justify-content-between align-items-center mb-1">
													<small className="text-muted">Engagement Growth</small>
													<span className="small fw-bold">+{Math.floor(Math.random() * 20) + 5}%</span>
												</div>
												<ProgressBar
													now={Math.floor(Math.random() * 60) + 20}
													variant="primary"
													className="rounded-3"
													style={{ height: '6px' }}
												/>
											</div>
											<div>
												<div className="d-flex justify-content-between align-items-center mb-1">
													<small className="text-muted">Content Reach</small>
													<span className="small fw-bold">+{Math.floor(Math.random() * 30) + 10}%</span>
												</div>
												<ProgressBar
													now={Math.floor(Math.random() * 50) + 30}
													variant="warning"
													className="rounded-3"
													style={{ height: '6px' }}
												/>
											</div>
										</Card.Body>
									</Card>

									<Card className="border-0 bg-gradient-primary text-white">
										<Card.Body className="p-3">
											<div className="d-flex align-items-center mb-2">
												<TrendingUp className="me-2" size={20} />
												<h6 className="mb-0 fw-bold">Growth Tips</h6>
											</div>
											<ul className="small mb-0 ps-3">
												<li className="mb-1">Post consistently to maintain growth</li>
												<li className="mb-1">Engage with trending topics</li>
												<li className="mb-1">Collaborate with other creators</li>
												<li>Optimize posting times</li>
											</ul>
										</Card.Body>
									</Card>
								</Col>
							</Row>
						</Tab.Pane>

						{/* Monetization Tab */}
						<Tab.Pane eventKey="monetization">
							<Row className="g-4">
								<Col lg={8}>
									<Card className="border-0 shadow-sm">
										<Card.Header className="bg-white border-0">
											<h5 className="mb-0 fw-bold">
												<CurrencyDollar className="me-2 text-success" />
												Earning Posts
											</h5>
											<small className="text-muted">Posts that generated revenue</small>
										</Card.Header>
										<Card.Body className="p-3">
											{analytics?.earningPosts?.length > 0 ? (
												analytics.earningPosts.map((post, index) => (
													<TopPostCard key={post.id} post={post} rank={index + 1} showEarnings={true} />
												))
											) : (
												<div className="text-center py-4">
													<CurrencyDollar className="text-muted mb-2" size={32} />
													<p className="text-muted">No earning posts yet</p>
													<small className="text-muted">Start creating monetizable content</small>
												</div>
											)}
										</Card.Body>
									</Card>
								</Col>
								<Col lg={4}>
									<Row className="g-3">
										<Col xs={12}>
											<StatCard
												icon={CurrencyDollar}
												title="Total Earnings"
												value={`$${analytics?.totalEarnings || "0.00"}`}
												color="success"
												size="large"
												subtitle="All time"
											/>
										</Col>
										<Col xs={6} lg={12}>
											<StatCard
												icon={BarChartFill}
												title="Avg. CPM"
												value={`$${(Math.random() * 3 + 1).toFixed(2)}`}
												color="primary"
												subtitle="Per 1000 views"
											/>
										</Col>
										<Col xs={6} lg={12}>
											<StatCard
												icon={TrendingUp}
												title="Revenue Growth"
												value={`+${Math.floor(Math.random() * 25) + 5}%`}
												color="success"
												subtitle="This month"
											/>
										</Col>
									</Row>
									
									<Card className="border-0 bg-warning text-white mt-3">
										<Card.Body className="p-3">
											<div className="d-flex align-items-center mb-2">
												<CurrencyDollar className="me-2" size={20} />
												<h6 className="mb-0 fw-bold">Monetization Tips</h6>
											</div>
											<ul className="small mb-0 ps-3">
												<li className="mb-1">Create engaging, longer content</li>
												<li className="mb-1">Use relevant hashtags</li>
												<li className="mb-1">Build a loyal audience</li>
												<li>Partner with brands</li>
											</ul>
										</Card.Body>
									</Card>
								</Col>
							</Row>
						</Tab.Pane>

						{/* Audience Tab */}
						<Tab.Pane eventKey="audience">
							<Row className="g-4">
								<Col lg={6}>
									<Card className="border-0 shadow-sm">
										<Card.Header className="bg-white border-0">
											<h5 className="mb-0 fw-bold">Audience Demographics</h5>
										</Card.Header>
										<Card.Body>
											<div className="chart-container">
												<ResponsiveContainer width="100%" height="100%">
													<BarChart data={[
														{ age: '18-24', male: 30, female: 45 },
														{ age: '25-34', male: 40, female: 35 },
														{ age: '35-44', male: 25, female: 20 },
														{ age: '45+', male: 15, female: 10 }
													]}>
														<CartesianGrid strokeDasharray="3 3" />
														<XAxis dataKey="age" />
														<YAxis />
														<Tooltip />
														<Bar dataKey="male" fill="#0d6efd" />
														<Bar dataKey="female" fill="#dc3545" />
													</BarChart>
												</ResponsiveContainer>
											</div>
										</Card.Body>
									</Card>
								</Col>
								<Col lg={6}>
									<Card className="border-0 shadow-sm">
										<Card.Header className="bg-white border-0">
											<h5 className="mb-0 fw-bold">Top Locations</h5>
										</Card.Header>
										<Card.Body>
											<Table responsive className="mb-0">
												<thead>
													<tr>
														<th className="border-0 small text-muted">Country</th>
														<th className="border-0 small text-muted text-end">Followers</th>
														<th className="border-0 small text-muted text-end">%</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td>🇺🇸 United States</td>
														<td className="text-end fw-bold">{Math.floor((analytics?.followers || 0) * 0.4)}</td>
														<td className="text-end text-muted">40%</td>
													</tr>
													<tr>
														<td>🇬🇧 United Kingdom</td>
														<td className="text-end fw-bold">{Math.floor((analytics?.followers || 0) * 0.15)}</td>
														<td className="text-end text-muted">15%</td>
													</tr>
													<tr>
														<td>🇨🇦 Canada</td>
														<td className="text-end fw-bold">{Math.floor((analytics?.followers || 0) * 0.12)}</td>
														<td className="text-end text-muted">12%</td>
													</tr>
													<tr>
														<td>🇦🇺 Australia</td>
														<td className="text-end fw-bold">{Math.floor((analytics?.followers || 0) * 0.08)}</td>
														<td className="text-end text-muted">8%</td>
													</tr>
													<tr>
														<td>🌍 Others</td>
														<td className="text-end fw-bold">{Math.floor((analytics?.followers || 0) * 0.25)}</td>
														<td className="text-end text-muted">25%</td>
													</tr>
												</tbody>
											</Table>
										</Card.Body>
									</Card>
								</Col>
								<Col xs={12}>
									<Row className="g-3">
										<Col xs={6} md={3}>
											<StatCard
												icon={Users}
												title="Total Followers"
												value={analytics?.followers || 0}
												color="primary"
											/>
										</Col>
										<Col xs={6} md={3}>
											<StatCard
												icon={PersonCheck}
												title="Active Followers"
												value={Math.floor((analytics?.followers || 0) * 0.7)}
												color="success"
												subtitle="Last 30 days"
											/>
										</Col>
										<Col xs={6} md={3}>
											<StatCard
												icon={GraphUp}
												title="Engagement Rate"
												value={`${analytics?.engagementRate || 0}%`}
												color="warning"
											/>
										</Col>
										<Col xs={6} md={3}>
											<StatCard
												icon={TrendingUp}
												title="Growth Rate"
												value={`+${analytics?.reachGrowth || 0}%`}
												color="info"
												subtitle="Monthly"
											/>
										</Col>
									</Row>
								</Col>
							</Row>
						</Tab.Pane>
					</Tab.Content>
				</Tab.Container>
			</Container>
		</>
	);
};

export default AnalyticsPage;
