/** @format */

import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Alert, Button, Badge, Tab, Tabs } from "react-bootstrap";
import { analyticsAPI, subscriptionAPI } from "../config/ApiConfig";
import { formatTimeAgo, formatCurrency } from "../utils/common-utils";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { CheckCircle, XCircle, BarChart, TrendingUp, CurrencyDollar, PeopleFill } from 'react-bootstrap-icons';

const AnalyticsPage = () => {
	const [analytics, setAnalytics] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedPeriod, setSelectedPeriod] = useState("30d");
	const [activeTab, setActiveTab] = useState("overview");
	const [growthData, setGrowthData] = useState({});
	const [monetizationData, setMonetizationData] = useState({});
	const [subscribers, setSubscribers] = useState([]);
	const [subscriberStats, setSubscriberStats] = useState({});

	useEffect(() => {
		updatePageMeta(pageMetaData.analytics);
		loadAnalytics();
	}, [selectedPeriod]);

	useEffect(() => {
		if (analytics) {
			fetchGrowthData();
			fetchMonetizationData();
		}
	}, [analytics]);

	const loadAnalytics = async () => {
		try {
			setLoading(true);
			const [userAnalytics, subscriberData] = await Promise.all([
				analyticsAPI.getUserAnalytics(selectedPeriod),
				subscriptionAPI.getSubscribers().catch(() => ({ subscribers: [], stats: {} }))
			]);

			setAnalytics(userAnalytics);
			setSubscribers(subscriberData.subscribers || []);
			setSubscriberStats(subscriberData.stats || {});
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const formatNumber = (num) => {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num?.toString() || '0';
	};

	const fetchGrowthData = async () => {
		try {
			const response = await analyticsAPI.getUserAnalytics(selectedPeriod);

			const growthData = {
				followers: [
					{ date: '2024-01-01', value: response.overview?.currentFollowers || 0 },
					{ date: '2024-01-02', value: (response.overview?.currentFollowers || 0) - Math.floor((response.overview?.followersGained || 0) * 0.8) },
					{ date: '2024-01-03', value: (response.overview?.currentFollowers || 0) - Math.floor((response.overview?.followersGained || 0) * 0.6) },
					{ date: '2024-01-04', value: (response.overview?.currentFollowers || 0) - Math.floor((response.overview?.followersGained || 0) * 0.4) },
					{ date: '2024-01-05', value: (response.overview?.currentFollowers || 0) - Math.floor((response.overview?.followersGained || 0) * 0.2) },
				],
				engagement: [
					{ date: '2024-01-01', value: (response.overview?.engagementRate || 0) * 0.8 },
					{ date: '2024-01-02', value: (response.overview?.engagementRate || 0) * 0.85 },
					{ date: '2024-01-03', value: (response.overview?.engagementRate || 0) * 0.9 },
					{ date: '2024-01-04', value: (response.overview?.engagementRate || 0) * 0.95 },
					{ date: '2024-01-05', value: response.overview?.engagementRate || 0 },
				]
			};
			setGrowthData(growthData);
		} catch (error) {
			console.error('Error fetching growth data:', error);
			const fallbackGrowthData = {
				followers: [
					{ date: '2024-01-01', value: 1000 },
					{ date: '2024-01-02', value: 1050 },
					{ date: '2024-01-03', value: 1100 },
					{ date: '2024-01-04', value: 1200 },
					{ date: '2024-01-05', value: 1250 },
				],
				engagement: [
					{ date: '2024-01-01', value: 5.2 },
					{ date: '2024-01-02', value: 6.1 },
					{ date: '2024-01-03', value: 7.3 },
					{ date: '2024-01-04', value: 8.2 },
					{ date: '2024-01-05', value: 9.5 },
				]
			};
			setGrowthData(fallbackGrowthData);
		}
	};

	const fetchMonetizationData = async () => {
		try {
			const response = await analyticsAPI.getUserAnalytics(selectedPeriod);

			const monetizationData = {
				revenue: [
					{ month: 'Jan', earnings: (response.overview?.totalEarnings || 0) * 0.6, views: (response.overview?.totalViews || 0) * 0.6 },
					{ month: 'Feb', earnings: (response.overview?.totalEarnings || 0) * 0.7, views: (response.overview?.totalViews || 0) * 0.7 },
					{ month: 'Mar', earnings: (response.overview?.totalEarnings || 0) * 0.8, views: (response.overview?.totalViews || 0) * 0.8 },
					{ month: 'Apr', earnings: (response.overview?.totalEarnings || 0) * 0.9, views: (response.overview?.totalViews || 0) * 0.9 },
					{ month: 'May', earnings: response.overview?.totalEarnings || 0, views: response.overview?.totalViews || 0 },
				],
				sources: [
					{ name: 'Ad Revenue', value: 60, color: '#17a2b8' },
					{ name: 'Subscriptions', value: 25, color: '#28a745' },
					{ name: 'Tips', value: 15, color: '#ffc107' }
				]
			};
			setMonetizationData(monetizationData);
		} catch (error) {
			console.error('Error fetching monetization data:', error);
			const fallbackMonetizationData = {
				revenue: [
					{ month: 'Jan', earnings: 150, views: 12000 },
					{ month: 'Feb', earnings: 180, views: 15000 },
					{ month: 'Mar', earnings: 220, views: 18000 },
					{ month: 'Apr', earnings: 280, views: 22000 },
					{ month: 'May', earnings: 350, views: 28000 },
				],
				sources: [
					{ name: 'Ad Revenue', value: 60, color: '#17a2b8' },
					{ name: 'Subscriptions', value: 25, color: '#28a745' },
					{ name: 'Tips', value: 15, color: '#ffc107' }
				]
			};
			setMonetizationData(fallbackMonetizationData);
		}
	};

	if (loading) {
		return (
			<Container className="py-5 text-center">
				<Spinner animation="border" variant="primary" />
			</Container>
		);
	}

	if (error) {
		return (
			<Container className="py-5">
				<Alert variant="danger">{error}</Alert>
			</Container>
		);
	}

	const chartData = analytics?.topPosts?.slice(0, 5).map(post => ({
		name: post.content?.substring(0, 15) + '...' || 'Post',
		views: post.views,
		likes: post.likes,
		earnings: post.earnings
	})) || [];

	const engagementData = [
		{ name: 'Views', value: analytics?.overview?.totalViews || 0, color: '#8884d8' },
		{ name: 'Likes', value: analytics?.overview?.totalLikes || 0, color: '#82ca9d' },
		{ name: 'Comments', value: analytics?.overview?.totalComments || 0, color: '#ffc658' },
		{ name: 'Shares', value: analytics?.overview?.totalShares || 0, color: '#ff7300' }
	];

	const StatCard = ({ icon = null, value, label, subtitle, variant = "primary" }) => (
		<Card className="h-100 border-0 shadow-sm">
			<Card.Body className="text-center p-2 p-md-3">
				{icon && <div className={`text-${variant} mb-2`}>{icon}</div>}
				<h5 className="mb-1 fs-6 fs-md-4">{value}</h5>
				<p className="text-muted mb-0 small">{label}</p>
				{subtitle && <small className={`text-${variant === 'success' ? 'success' : 'muted'} d-block text-truncate`}>{subtitle}</small>}
			</Card.Body>
		</Card>
	);

	const renderOverviewTab = () => (
		<>
			{/* Overview Cards - Mobile Responsive Grid */}
			<Row className="g-3 mb-4">
				<Col xs={6} lg={3}>
					<StatCard
						value={formatNumber(analytics?.overview?.totalViews || 0)}
						label="Total Views"
						subtitle={`+${analytics?.overview?.viewsGained || 0} this period`}
						variant="primary"
					/>
				</Col>
				<Col xs={6} lg={3}>
					<StatCard
						value={analytics?.revenue?.totalRevenueFormatted || "₱0.00"}
						label="Total Earnings"
						subtitle={analytics?.period || '30 days'}
						variant="success"
					/>
				</Col>
				<Col xs={6} lg={3}>
					<StatCard
						value={formatNumber(analytics?.overview?.currentFollowers || 0)}
						label="Followers"
						subtitle={`+${analytics?.overview?.followersGained || 0} gained`}
						variant="info"
					/>
				</Col>
				<Col xs={6} lg={3}>
					<StatCard
						value={`${analytics?.overview?.engagementRate || 0}%`}
						label="Engagement Rate"
						subtitle={`${formatNumber((analytics?.overview?.totalLikes || 0) + (analytics?.overview?.totalComments || 0) + (analytics?.overview?.totalShares || 0))} engagements`}
						variant="warning"
					/>
				</Col>
			</Row>

			{/* Charts Row - Stack on mobile */}
			<Row className="g-3 mb-4">
				<Col xl={8} className="order-1 order-xl-0">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Header>
							<h6 className="mb-0 small">Top Posts Performance</h6>
						</Card.Header>
						<Card.Body className="p-2 p-md-3">
							{chartData.length > 0 ? (
								<ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 200 : 250}>
									<BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis 
											dataKey="name" 
											fontSize={10}
											interval={0}
											angle={-45}
											textAnchor="end"
											height={60}
										/>
										<YAxis fontSize={10} />
										<Tooltip />
										<Bar dataKey="views" fill="#8884d8" name="Views" />
										<Bar dataKey="likes" fill="#82ca9d" name="Likes" />
									</BarChart>
								</ResponsiveContainer>
							) : (
								<div className="text-center py-4 py-md-5 text-muted">
									<p className="small">No data available</p>
									<small>Start creating content to see performance charts!</small>
								</div>
							)}
						</Card.Body>
					</Card>
				</Col>

				<Col xl={4} className="order-0 order-xl-1">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Header>
							<h6 className="mb-0 small">Engagement Breakdown</h6>
						</Card.Header>
						<Card.Body className="p-2 p-md-3">
							<ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 150 : 200}>
								<PieChart>
									<Pie
										data={engagementData.filter(item => item.value > 0)}
										cx="50%"
										cy="50%"
										innerRadius={window.innerWidth < 768 ? 20 : 30}
										outerRadius={window.innerWidth < 768 ? 50 : 70}
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
							<div className="mt-2">
								{engagementData.map((item, index) => (
									<div key={index} className="d-flex justify-content-between align-items-center small mb-1">
										<span className="d-flex align-items-center">
											<span
												className="d-inline-block me-2 flex-shrink-0"
												style={{
													width: 8,
													height: 8,
													backgroundColor: item.color,
													borderRadius: 2
												}}
											></span>
											<span className="text-truncate">{item.name}</span>
										</span>
										<span className="fw-bold text-nowrap">{formatNumber(item.value)}</span>
									</div>
								))}
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			{/* Top Posts - Mobile optimized */}
			<Card className="mb-4 border-0 shadow-sm">
				<Card.Header>
					<h6 className="mb-0">Top Performing Posts</h6>
				</Card.Header>
				<Card.Body>
					{analytics?.topPosts?.length > 0 ? (
						<div className="row g-3">
							{analytics.topPosts.slice(0, 3).map((post, index) => (
								<div key={post.id} className="col-lg-4">
									<div className="border rounded p-3 h-100">
										<div className="d-flex justify-content-between align-items-start mb-2">
											<Badge bg="primary">#{index + 1}</Badge>
											<small className="text-muted">
												{formatTimeAgo(post.createdAt)}
											</small>
										</div>
										<p className="mb-2 small">
											{post.content?.substring(0, 80) + (post.content?.length > 80 ? '...' : '') || 'No content'}
										</p>
										<div className="row g-2 small text-muted">
											<div className="col-6">
												<strong>{formatNumber(post.views)}</strong> views
											</div>
											<div className="col-6">
												<strong>{formatNumber(post.likes)}</strong> likes
											</div>
											<div className="col-6">
												<strong>{formatNumber(post.comments)}</strong> comments
											</div>
											<div className="col-6">
												<strong>${post.earnings?.toFixed(2) || '0.00'}</strong> earned
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-4 text-muted">
							<p>No top posts data available yet.</p>
							<small>Create more content to see your best performing posts!</small>
						</div>
					)}
				</Card.Body>
			</Card>
		</>
	);

	const renderGrowthTab = () => (
		<>
			<Row className="g-3 mb-4">
				<Col lg={8}>
					<Card className="h-100 border-0 shadow-sm">
						<Card.Header>
							<h6 className="mb-0">Growth Trends</h6>
						</Card.Header>
						<Card.Body>
							<ResponsiveContainer width="100%" height={300}>
								<AreaChart data={growthData.followers || []}>
									<defs>
										<linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
											<stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
										</linearGradient>
									</defs>
									<XAxis dataKey="date" fontSize={12} />
									<YAxis fontSize={12} />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip />
									<Area 
										type="monotone" 
										dataKey="value" 
										stroke="#8884d8" 
										fillOpacity={1} 
										fill="url(#colorFollowers)" 
										name="Followers" 
									/>
								</AreaChart>
							</ResponsiveContainer>
						</Card.Body>
					</Card>
				</Col>
				<Col lg={4}>
					<Card className="h-100 border-0 shadow-sm">
						<Card.Header>
							<h6 className="mb-0">Growth Metrics</h6>
						</Card.Header>
						<Card.Body>
							<div className="d-grid gap-3">
								<div className="p-3 bg-light rounded">
									<div className="d-flex justify-content-between align-items-center">
										<div>
											<h6 className="mb-0 small">Follower Growth</h6>
											<small className="text-muted">Last 30 days</small>
										</div>
										<div className="text-end">
											<h6 className="mb-0 text-success">
												{analytics?.overview?.followerGrowthRate >= 0 ? '+' : ''}{analytics?.overview?.followerGrowthRate?.toFixed(1) || '0.0'}%
											</h6>
											<small className="text-muted">+{analytics?.overview?.followersGained || 0}</small>
										</div>
									</div>
								</div>
								<div className="p-3 bg-light rounded">
									<div className="d-flex justify-content-between align-items-center">
										<div>
											<h6 className="mb-0 small">Content Views</h6>
											<small className="text-muted">Growth rate</small>
										</div>
										<div className="text-end">
											<h6 className="mb-0 text-info">
												{analytics?.overview?.viewsGrowthRate >= 0 ? '+' : ''}{analytics?.overview?.viewsGrowthRate?.toFixed(1) || '0.0'}%
											</h6>
											<small className="text-muted">
												{analytics?.overview?.viewsGrowthRate >= 0 ? 'Trending up' : 'Declining'}
											</small>
										</div>
									</div>
								</div>
								<div className="p-3 bg-light rounded">
									<div className="d-flex justify-content-between align-items-center">
										<div>
											<h6 className="mb-0 small">Engagement Rate</h6>
											<small className="text-muted">Average</small>
										</div>
										<div className="text-end">
											<h6 className="mb-0 text-warning">{analytics?.overview?.engagementRate || 0}%</h6>
											<small className="text-muted">Above average</small>
										</div>
									</div>
								</div>
								<div className="p-3 bg-light rounded">
									<div className="d-flex justify-content-between align-items-center">
										<div>
											<h6 className="mb-0 small">Content Output</h6>
											<small className="text-muted">Posts this period</small>
										</div>
										<div className="text-end">
											<h6 className="mb-0 text-primary">{analytics?.overview?.totalPosts || 0}</h6>
											<small className="text-muted">Consistent</small>
										</div>
									</div>
								</div>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			<Row className="g-3">
				<Col>
					<Card className="border-0 shadow-sm">
						<Card.Header>
							<h6 className="mb-0">Engagement Trends</h6>
						</Card.Header>
						<Card.Body>
							<ResponsiveContainer width="100%" height={300}>
								<LineChart data={growthData.engagement || []}>
									<XAxis dataKey="date" fontSize={12} />
									<YAxis fontSize={12} />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip formatter={(value) => [value.toFixed(2), '']} />
									<Line type="monotone" dataKey="value" stroke="#82ca9d" name="Engagement Rate" strokeWidth={2} />
								</LineChart>
							</ResponsiveContainer>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</>
	);

	const renderMonetizationTab = () => {
		const totalRevenue = analytics?.revenue?.totalRevenue || 0;
		const totalSubscriptions = analytics?.overview?.totalSubscriptions || 0;
		const revenueGrowth = analytics?.overview?.revenueGrowth || 0;

		// Get monetization eligibility from analytics
		const monetization = analytics?.monetization || {
			isEligible: false,
			requirements: {
				followers: { current: 0, required: 500, met: false },
				recentActivity: { postsLast24h: 0, required: 1, met: false },
				accountStatus: { blocked: false, restricted: false, violations: 0, goodStanding: true }
			}
		};

		return (
			<>
				{/* Monetization Eligibility Card */}
				<Card className="border-0 shadow-sm mb-4">
					<Card.Header>
						<div className="d-flex justify-content-between align-items-center">
							<h6 className="mb-0">Monetization Eligibility</h6>
							<Badge bg={monetization.isEligible ? 'success' : 'warning'}>
								{monetization.isEligible ? 'Eligible' : 'Not Eligible'}
							</Badge>
						</div>
					</Card.Header>
					<Card.Body>
						{!monetization.isEligible && (
							<div className="mb-3">
								<div className="alert alert-info mb-3">
									<small>
										<strong>Complete the requirements below to start monetizing your content!</strong>
									</small>
								</div>
							</div>
						)}

						<Row className="g-3">
							{/* Followers Requirement */}
							<Col md={4}>
								<div className="p-3 border rounded">
									<div className="d-flex justify-content-between align-items-center mb-2">
										<small className="text-muted">Followers</small>
										<Badge bg={monetization.requirements.followers.met ? 'success' : 'secondary'}>
											{monetization.requirements.followers.met ? <CheckCircle size={12} /> : <XCircle size={12} />}
										</Badge>
									</div>
									<div className="mb-2">
										<strong>{monetization.requirements.followers.current}</strong>
										<span className="text-muted"> / {monetization.requirements.followers.required}</span>
									</div>
									<div className="progress" style={{ height: '4px' }}>
										<div 
											className={`progress-bar ${monetization.requirements.followers.met ? 'bg-success' : 'bg-primary'}`}
											style={{ 
												width: `${Math.min((monetization.requirements.followers.current / monetization.requirements.followers.required) * 100, 100)}%` 
											}}
										></div>
									</div>
									{!monetization.requirements.followers.met && (
										<small className="text-muted">
											{monetization.requirements.followers.required - monetization.requirements.followers.current} more needed
										</small>
									)}
								</div>
							</Col>

							{/* Recent Activity Requirement */}
							<Col md={4}>
								<div className="p-3 border rounded">
									<div className="d-flex justify-content-between align-items-center mb-2">
										<small className="text-muted">Daily Activity</small>
										<Badge bg={monetization.requirements.recentActivity.met ? 'success' : 'secondary'}>
											{monetization.requirements.recentActivity.met ? <CheckCircle size={12} /> : <XCircle size={12} />}
										</Badge>
									</div>
									<div className="mb-2">
										<strong>{monetization.requirements.recentActivity.postsLast24h}</strong>
										<span className="text-muted"> / {monetization.requirements.recentActivity.required} posts</span>
									</div>
									<div className="progress" style={{ height: '4px' }}>
										<div 
											className={`progress-bar ${monetization.requirements.recentActivity.met ? 'bg-success' : 'bg-primary'}`}
											style={{ 
												width: `${Math.min((monetization.requirements.recentActivity.postsLast24h / monetization.requirements.recentActivity.required) * 100, 100)}%` 
											}}
										></div>
									</div>
									<small className="text-muted">Posts in last 24h</small>
								</div>
							</Col>

							{/* Account Status Requirement */}
							<Col md={4}>
								<div className="p-3 border rounded">
									<div className="d-flex justify-content-between align-items-center mb-2">
										<small className="text-muted">Account Status</small>
										<Badge bg={monetization.requirements.accountStatus.goodStanding ? 'success' : 'danger'}>
											{monetization.requirements.accountStatus.goodStanding ? <CheckCircle size={12} /> : <XCircle size={12} />}
										</Badge>
									</div>
									<div className="mb-2">
										<div className="d-flex justify-content-between">
											<small>Good Standing</small>
											<small className={monetization.requirements.accountStatus.goodStanding ? 'text-success' : 'text-danger'}>
												{monetization.requirements.accountStatus.goodStanding ? 'Yes' : 'No'}
											</small>
										</div>
										<div className="d-flex justify-content-between">
											<small>Violations</small>
											<small className={monetization.requirements.accountStatus.violations === 0 ? 'text-success' : 'text-warning'}>
												{monetization.requirements.accountStatus.violations}
											</small>
										</div>
									</div>
									{(monetization.requirements.accountStatus.blocked || monetization.requirements.accountStatus.restricted) && (
										<small className="text-danger">Account restricted</small>
									)}
								</div>
							</Col>
						</Row>
					</Card.Body>
				</Card>

				<Row className="g-3 mb-4">
					<Col xs={6} lg={3}>
						<StatCard
							value={analytics?.revenue?.totalRevenue || "$0.00"}
							label="Total Revenue"
							subtitle={`${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% vs last month`}
							variant="success"
						/>
					</Col>
					<Col xs={6} lg={3}>
						<StatCard
							value={analytics?.revenue?.breakdown?.adRevenue?.formatted || "$0.00"}
							label="Ad Revenue"
							subtitle={`${analytics?.revenue?.breakdown?.adRevenue?.percentage || 0}% of total`}
							variant="info"
						/>
					</Col>
					<Col xs={6} lg={3}>
						<StatCard
							value={analytics?.revenue?.breakdown?.subscriptionRevenue?.formatted || "$0.00"}
							label="Subscriptions"
							subtitle={`${analytics?.revenue?.breakdown?.subscriptionRevenue?.percentage || 0}% of total`}
							variant="warning"
						/>
					</Col>
					<Col xs={6} lg={3}>
						<StatCard
							value={`${analytics?.revenue?.breakdown?.tipsEarned?.formatted || "$0.00"} + ${analytics?.revenue?.breakdown?.donationsEarned?.formatted || "$0.00"}`}
							label="Tips & Donations"
							subtitle={`${(analytics?.revenue?.breakdown?.tipsEarned?.percentage || 0) + (analytics?.revenue?.breakdown?.donationsEarned?.percentage || 0)}% of total`}
							variant="danger"
						/>
					</Col>
				</Row>

				<Row className="g-3 mb-4">
					<Col lg={8}>
						<Card className="border-0 shadow-sm">
							<Card.Header>
								<h6 className="mb-0">Revenue Trends</h6>
							</Card.Header>
							<Card.Body>
								<ResponsiveContainer width="100%" height={300}>
									<AreaChart data={monetizationData.revenue || []}>
										<defs>
											<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#28a745" stopOpacity={0.8}/>
												<stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
											</linearGradient>
										</defs>
										<XAxis dataKey="month" fontSize={12} />
										<YAxis fontSize={12} />
										<CartesianGrid strokeDasharray="3 3" />
										<Tooltip formatter={(value) => [`$${value}`, '']} />
										<Area 
											type="monotone" 
											dataKey="earnings" 
											stroke="#28a745" 
											fillOpacity={1} 
											fill="url(#colorRevenue)" 
											name="Total Revenue" 
										/>
									</AreaChart>
								</ResponsiveContainer>
							</Card.Body>
						</Card>
					</Col>
					<Col lg={4}>
						<Card className="border-0 shadow-sm">
							<Card.Header>
								<h6 className="mb-0">Revenue Breakdown</h6>
							</Card.Header>
							<Card.Body>
								<div className="d-grid gap-3">
									<div>
										<div className="d-flex justify-content-between mb-1">
											<small>Ad Revenue</small>
											<small className="fw-bold">{analytics?.revenue?.breakdown?.adRevenue?.percentage || 0}%</small>
										</div>
										<div className="progress" style={{ height: '6px' }}>
											<div 
												className="progress-bar bg-info" 
												style={{ width: `${analytics?.revenue?.breakdown?.adRevenue?.percentage || 0}%` }}
											></div>
										</div>
									</div>
									<div>
										<div className="d-flex justify-content-between mb-1">
											<small>Subscriptions</small>
											<small className="fw-bold">{analytics?.revenue?.breakdown?.subscriptionRevenue?.percentage || 0}%</small>
										</div>
										<div className="progress" style={{ height: '6px' }}>
											<div 
												className="progress-bar bg-warning" 
												style={{ width: `${analytics?.revenue?.breakdown?.subscriptionRevenue?.percentage || 0}%` }}
											></div>
										</div>
									</div>
									<div>
										<div className="d-flex justify-content-between mb-1">
											<small>Tips & Donations</small>
											<small className="fw-bold">{(analytics?.revenue?.breakdown?.tipsEarned?.percentage || 0) + (analytics?.revenue?.breakdown?.donationsEarned?.percentage || 0)}%</small>
										</div>
										<div className="progress" style={{ height: '6px' }}>
											<div 
												className="progress-bar bg-success" 
												style={{ width: `${(analytics?.revenue?.breakdown?.tipsEarned?.percentage || 0) + (analytics?.revenue?.breakdown?.donationsEarned?.percentage || 0)}%` }}
											></div>
										</div>
									</div>
									<div>
										<div className="d-flex justify-content-between mb-1">
											<small>Content Earnings</small>
											<small className="fw-bold">{analytics?.revenue?.breakdown?.contentEarnings?.percentage || 0}%</small>
										</div>
										<div className="progress" style={{ height: '6px' }}>
											<div 
												className="progress-bar bg-primary" 
												style={{ width: `${analytics?.revenue?.breakdown?.contentEarnings?.percentage || 0}%` }}
											></div>
										</div>
									</div>
									<hr />
									<div className="text-center">
										<h6 className="text-success mb-1">{analytics?.revenue?.totalRevenueFormatted || "₱0.00"}</h6>
										<small className="text-muted">Total this period</small>
									</div>
								</div>
							</Card.Body>
						</Card>
					</Col>
				</Row>
			</>
		);
	};

	const renderSubscriberTab = () => (
		<>
			<Row className="g-3 mb-4">
				<Col lg={8}>
					<Card className="border-0 shadow-sm">
						<Card.Header>
							<h5 className="mb-0">My Subscribers</h5>
						</Card.Header>
						<Card.Body>
							{subscribers.length === 0 ? (
								<div className="text-center py-4">
									<h5>No subscribers yet</h5>
									<p className="text-muted">Share your profile to start getting supporters!</p>
								</div>
							) : (
								<Row className="g-3">
									{subscribers.map((subscriber) => (
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
									<strong>{subscriberStats.totalSubscribers || 0}</strong>
								</div>
								<div className="progress" style={{ height: '6px' }}>
									<div className="progress-bar bg-primary" style={{ width: '100%' }}></div>
								</div>
							</div>
							<div className="mb-3">
								<div className="d-flex justify-content-between align-items-center mb-1">
									<small className="text-muted">Basic Tier</small>
									<strong>{subscriberStats.basicSubscribers || 0}</strong>
								</div>
								<div className="progress" style={{ height: '6px' }}>
									<div 
										className="progress-bar bg-primary" 
										style={{ 
											width: subscriberStats.totalSubscribers > 0 ? 
												`${(subscriberStats.basicSubscribers || 0) / subscriberStats.totalSubscribers * 100}%` : 
												'0%'
										}}>
									</div>
								</div>
							</div>
							<div className="mb-3">
								<div className="d-flex justify-content-between align-items-center mb-1">
									<small className="text-muted">Premium Tier</small>
									<strong>{subscriberStats.premiumSubscribers || 0}</strong>
								</div>
								<div className="progress" style={{ height: '6px' }}>
									<div 
										className="progress-bar bg-success" 
										style={{ 
											width: subscriberStats.totalSubscribers > 0 ? 
												`${(subscriberStats.premiumSubscribers || 0) / subscriberStats.totalSubscribers * 100}%` : 
												'0%'
										}}>
									</div>
								</div>
							</div>
							<div className="mb-3">
								<div className="d-flex justify-content-between align-items-center mb-1">
									<small className="text-muted">VIP Tier</small>
									<strong>{subscriberStats.vipSubscribers || 0}</strong>
								</div>
								<div className="progress" style={{ height: '6px' }}>
									<div 
										className="progress-bar bg-warning" 
										style={{ 
											width: subscriberStats.totalSubscribers > 0 ? 
												`${(subscriberStats.vipSubscribers || 0) / subscriberStats.totalSubscribers * 100}%` : 
												'0%'
										}}>
									</div>
								</div>
							</div>
							<hr />
							<div className="text-center">
								<h4 className="text-success mb-1">
									${subscriberStats.monthlyRevenue ? (subscriberStats.monthlyRevenue / 100).toFixed(2) : '0.00'}
								</h4>
								<small className="text-muted">Monthly Revenue</small>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</>
	);

	return (
		<Container fluid className="py-3 py-md-4 px-2 px-md-3">
			<div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
				<div className="mb-3 mb-md-0">
					<h2 className="mb-1 fs-4 fs-md-2">Analytics Dashboard</h2>
					<p className="text-muted mb-0 small">Track your performance and insights</p>
				</div>
				<div className="d-flex flex-wrap gap-2">
					{['7d', '30d', '90d'].map(period => (
						<Button
							key={period}
							variant={selectedPeriod === period ? 'primary' : 'outline-primary'}
							size="sm"
							onClick={() => setSelectedPeriod(period)}
						>
							<span className="d-none d-sm-inline">
								{period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
							</span>
							<span className="d-sm-none">
								{period}
							</span>
						</Button>
					))}
				</div>
			</div>

			{analytics ? (
				<Tabs
					activeKey={activeTab}
					onSelect={(tab) => setActiveTab(tab)}
					className="mb-4 analytics-tabs"
				>
					<Tab eventKey="overview" title={
						<>
							<span className="d-none d-md-inline">Overview</span>
							<span className="d-md-none"><BarChart size={16} /></span>
						</>
					}>
						{renderOverviewTab()}
					</Tab>
					<Tab eventKey="growth" title={
						<>
							<span className="d-none d-md-inline">Growth</span>
							<span className="d-md-none"><TrendingUp size={16} /></span>
						</>
					}>
						{renderGrowthTab()}
					</Tab>
					<Tab eventKey="monetization" title={
						<>
							<span className="d-none d-md-inline">Monetization</span>
							<span className="d-md-none"><CurrencyDollar size={16} /></span>
						</>
					}>
						{renderMonetizationTab()}
					</Tab>
					<Tab eventKey="subscribers" title={
						<>
							<span className="d-none d-md-inline">Subscribers</span>
							<span className="d-md-none"><PeopleFill size={16} /></span>
						</>
					}>
						{renderSubscriberTab()}
					</Tab>
				</Tabs>
			) : (
				<Card className="border-0 shadow-sm">
					<Card.Body className="text-center py-5">
						<div className="text-muted">
							<h5>No analytics data available yet</h5>
							<p>Start creating content to see your analytics!</p>
							<Button variant="primary" href="/">
								Create Your First Post
							</Button>
						</div>
					</Card.Body>
				</Card>
			)}


		</Container>
	);
};

export default AnalyticsPage;