/** @format */

import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Alert, Button, Badge, Tab, Tabs } from "react-bootstrap";
import { analyticsAPI, businessAPI } from "../config/ApiConfig";
import { formatTimeAgo, formatCurrency } from "../utils/common-utils";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const AnalyticsPage = () => {
	const [analytics, setAnalytics] = useState(null);
	const [businessDashboard, setBusinessDashboard] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedPeriod, setSelectedPeriod] = useState("30d");
	const [activeTab, setActiveTab] = useState("home");
	const [growthData, setGrowthData] = useState([]); // State for growth data
	const [monetizationData, setMonetizationData] = useState([]); // State for monetization data

	useEffect(() => {
		updatePageMeta(pageMetaData.analytics);
		loadAnalytics();
	}, [selectedPeriod]);

	useEffect(() => {
		// Fetch growth and monetization data when analytics data is available
		if (analytics) {
			fetchGrowthData();
			fetchMonetizationData();
		}
	}, [analytics]);

	const loadAnalytics = async () => {
		try {
			setLoading(true);
			const [userAnalytics, businessData] = await Promise.all([
				analyticsAPI.getUserAnalytics(selectedPeriod),
				businessAPI.getDashboard().catch(() => null) // Optional business data
			]);

			setAnalytics(userAnalytics);
			setBusinessDashboard(businessData);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const formatNumber = (num) => {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		}
		if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num?.toString() || '0';
	};

	const fetchGrowthData = async () => {
		try {
			const response = await analyticsAPI.getUserAnalytics(selectedPeriod); // Use analyticsAPI

			// Transform API response to chart data format
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
			// Fallback to mock data if API fails
			const growthData = {
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
			setGrowthData(growthData);
		}
	};

	const fetchMonetizationData = async () => {
		try {
			const response = await analyticsAPI.getUserAnalytics(selectedPeriod); // Use analyticsAPI

			// Transform API response to chart data format
			const monetizationData = {
				revenue: [
					{ month: 'Jan', earnings: (response.overview?.totalEarnings || 0) * 0.6, views: (response.overview?.totalViews || 0) * 0.6 },
					{ month: 'Feb', earnings: (response.overview?.totalEarnings || 0) * 0.7, views: (response.overview?.totalViews || 0) * 0.7 },
					{ month: 'Mar', earnings: (response.overview?.totalEarnings || 0) * 0.8, views: (response.overview?.totalViews || 0) * 0.8 },
					{ month: 'Apr', earnings: (response.overview?.totalEarnings || 0) * 0.9, views: (response.overview?.totalViews || 0) * 0.9 },
					{ month: 'May', earnings: response.overview?.totalEarnings || 0, views: response.overview?.totalViews || 0 },
				],
				sources: [
					{ name: 'Ad Revenue', value: 60 },
					{ name: 'Subscriptions', value: 25 },
					{ name: 'Tips', value: 15 }
				]
			};
			setMonetizationData(monetizationData);
		} catch (error) {
			console.error('Error fetching monetization data:', error);
			// Fallback to mock data if API fails
			const monetizationData = {
				revenue: [
					{ month: 'Jan', earnings: 150, views: 12000 },
					{ month: 'Feb', earnings: 180, views: 15000 },
					{ month: 'Mar', earnings: 220, views: 18000 },
					{ month: 'Apr', earnings: 280, views: 22000 },
					{ month: 'May', earnings: 350, views: 28000 },
				],
				sources: [
					{ name: 'Ad Revenue', value: 60 },
					{ name: 'Subscriptions', value: 25 },
					{ name: 'Tips', value: 15 }
				]
			};
			setMonetizationData(monetizationData);
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
		name: post.content?.substring(0, 20) + '...' || 'Post',
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

	// Real growth data from API
	// const growthData = analytics?.growthData || []; // This line is replaced by state

	// Real monetization data from API
	// const monetizationData = analytics?.monetizationData || []; // This line is replaced by state

	const renderHomeTab = () => (
		<>
			{/* Overview Cards */}
			<Row className="mb-4">
				<Col md={6} lg={3} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Body className="text-center">
							<h3 className="text-primary mb-1">
								{formatNumber(analytics?.overview?.totalViews || 0)}
							</h3>
							<p className="text-muted mb-0">Total Views</p>
							<small className="text-success">
								+{analytics?.overview?.viewsGained || 0} this period
							</small>
						</Card.Body>
					</Card>
				</Col>

				<Col md={6} lg={3} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Body className="text-center">
							<h3 className="text-success mb-1">
								${analytics?.overview?.totalEarnings?.toFixed(2) || "0.00"}
							</h3>
							<p className="text-muted mb-0">Total Earnings</p>
							<small className="text-muted">
								{analytics?.period || '30 days'}
							</small>
						</Card.Body>
					</Card>
				</Col>

				<Col md={6} lg={3} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Body className="text-center">
							<h3 className="text-info mb-1">
								{formatNumber(analytics?.overview?.currentFollowers || 0)}
							</h3>
							<p className="text-muted mb-0">Followers</p>
							<small className="text-success">
								+{analytics?.overview?.followersGained || 0} gained
							</small>
						</Card.Body>
					</Card>
				</Col>

				<Col md={6} lg={3} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Body className="text-center">
							<h3 className="text-warning mb-1">
								{analytics?.overview?.engagementRate || 0}%
							</h3>
							<p className="text-muted mb-0">Engagement Rate</p>
							<small className="text-muted">
								{formatNumber((analytics?.overview?.totalLikes || 0) + (analytics?.overview?.totalComments || 0) + (analytics?.overview?.totalShares || 0))} engagements
							</small>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			{/* Charts Row */}
			<Row className="mb-4">
				<Col lg={8} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Header>
							<h5 className="mb-0">Top Posts Performance</h5>
						</Card.Header>
						<Card.Body>
							{chartData.length > 0 ? (
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={chartData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="name" />
										<YAxis />
										<Tooltip />
										<Bar dataKey="views" fill="#8884d8" name="Views" />
										<Bar dataKey="likes" fill="#82ca9d" name="Likes" />
									</BarChart>
								</ResponsiveContainer>
							) : (
								<div className="text-center py-5 text-muted">
									<p>No data available</p>
									<small>Start creating content to see performance charts!</small>
								</div>
							)}
						</Card.Body>
					</Card>
				</Col>

				<Col lg={4} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Header>
							<h5 className="mb-0">Engagement Breakdown</h5>
						</Card.Header>
						<Card.Body>
							<ResponsiveContainer width="100%" height={300}>
								<PieChart>
									<Pie
										data={engagementData.filter(item => item.value > 0)}
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
							<div className="mt-2">
								{engagementData.map((item, index) => (
									<div key={index} className="d-flex justify-content-between align-items-center small mb-1">
										<span>
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
										<span className="fw-bold">{formatNumber(item.value)}</span>
									</div>
								))}
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			{/* Top Posts */}
			<Card className="mb-4 border-0 shadow-sm">
				<Card.Header>
					<h5 className="mb-0">Top Performing Posts</h5>
				</Card.Header>
				<Card.Body>
					{analytics?.topPosts?.length > 0 ? (
						<div className="row g-3">
							{analytics.topPosts.slice(0, 3).map((post, index) => (
								<div key={post.id} className="col-md-4">
									<div className="border rounded p-3">
										<div className="d-flex justify-content-between align-items-start mb-2">
											<Badge bg="primary">#{index + 1}</Badge>
											<small className="text-muted">
												{formatTimeAgo(post.createdAt)}
											</small>
										</div>
										<p className="mb-2" style={{ fontSize: '0.9rem' }}>
											{post.content?.substring(0, 100) + (post.content?.length > 100 ? '...' : '') || 'No content'}
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
			<Row className="mb-4">
				<Col lg={8} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Header>
							<h5 className="mb-0">Growth Trends</h5>
						</Card.Header>
						<Card.Body>
							<ResponsiveContainer width="100%" height={350}>
								<AreaChart data={growthData.followers}> {/* Use growthData.followers */}
									<defs>
										<linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
											<stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
										</linearGradient>
										<linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
											<stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
										</linearGradient>
									</defs>
									<XAxis dataKey="date" />
									<YAxis />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip />
									<Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorFollowers)" name="Followers" />
									{/* Removed the second Area for views as it was duplicated logic */}
								</AreaChart>
							</ResponsiveContainer>
						</Card.Body>
					</Card>
				</Col>
				<Col lg={4} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Header>
							<h5 className="mb-0">Growth Metrics</h5>
						</Card.Header>
						<Card.Body>
							<div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
								<div>
									<h6 className="mb-0">Follower Growth</h6>
									<small className="text-muted">Last 30 days</small>
								</div>
								<div className="text-end">
									<h5 className="mb-0 text-success">
										{analytics?.overview?.followerGrowthRate >= 0 ? '+' : ''}{analytics?.overview?.followerGrowthRate?.toFixed(1) || '0.0'}%
									</h5>
									<small className="text-muted">+{analytics?.overview?.followersGained || 0}</small>
								</div>
							</div>
							<div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
								<div>
									<h6 className="mb-0">Content Views</h6>
									<small className="text-muted">Growth rate</small>
								</div>
								<div className="text-end">
									<h5 className="mb-0 text-info">
										{analytics?.overview?.viewsGrowthRate >= 0 ? '+' : ''}{analytics?.overview?.viewsGrowthRate?.toFixed(1) || '0.0'}%
									</h5>
									<small className="text-muted">
										{analytics?.overview?.viewsGrowthRate >= 0 ? 'Trending up' : 'Declining'}
									</small>
								</div>
							</div>
							<div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
								<div>
									<h6 className="mb-0">Engagement Rate</h6>
									<small className="text-muted">Average</small>
								</div>
								<div className="text-end">
									<h5 className="mb-0 text-warning">{analytics?.overview?.engagementRate || 0}%</h5>
									<small className="text-muted">Above average</small>
								</div>
							</div>
							<div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
								<div>
									<h6 className="mb-0">Content Output</h6>
									<small className="text-muted">Posts this period</small>
								</div>
								<div className="text-end">
									<h5 className="mb-0 text-primary">{analytics?.overview?.totalPosts || 0}</h5>
									<small className="text-muted">Consistent</small>
								</div>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
			{/* Add a section for engagement trend if needed */}
			<Row className="mb-4">
				<Col lg={12}>
					<Card className="h-100 border-0 shadow-sm">
						<Card.Header>
							<h5 className="mb-0">Engagement Trends</h5>
						</Card.Header>
						<Card.Body>
							<ResponsiveContainer width="100%" height={350}>
								<LineChart data={growthData.engagement}> {/* Use growthData.engagement */}
									<XAxis dataKey="date" />
									<YAxis />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip formatter={(value) => [value.toFixed(2), '']} />
									<Line type="monotone" dataKey="value" stroke="#82ca9d" name="Engagement Rate" />
								</LineChart>
							</ResponsiveContainer>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</>
	);

	const renderMonetizationTab = () => {
		const totalRevenue = analytics?.overview?.totalEarnings || 0;
		const totalSubscriptions = analytics?.overview?.totalSubscriptions || 0;
		const followers = analytics?.overview?.currentFollowers || 0;
		const revenueGrowth = analytics?.overview?.revenueGrowth || 0;
		const growthRate = revenueGrowth;

		return (
		<>
			<Row className="mb-4">
				<Col md={3} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Body className="text-center">
							<h3 className="text-success mb-1">
								${totalRevenue.toFixed(2)}
							</h3>
							<p className="text-muted mb-0">Total Revenue</p>
							<small className="text-success">{revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% vs last month</small>
						</Card.Body>
					</Card>
				</Col>
				<Col md={3} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Body className="text-center">
							<h3 className="text-info mb-1">
								${analytics?.overview?.adRevenue?.toFixed(2) || "0.00"}
							</h3>
							<p className="text-muted mb-0">Ad Revenue</p>
							<small className="text-muted">{analytics?.overview?.adRevenuePercentage || 0}% of total</small>
						</Card.Body>
					</Card>
				</Col>
				<Col md={3} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Body className="text-center">
							<h3 className="text-warning mb-1">
								${analytics?.overview?.subscriptionRevenue?.toFixed(2) || "0.00"}
							</h3>
							<p className="text-muted mb-0">Subscriptions</p>
							<small className="text-muted">{analytics?.overview?.subscriptionRevenuePercentage || 0}% of total</small>
						</Card.Body>
					</Card>
				</Col>
				<Col md={3} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Body className="text-center">
							<h3 className="text-purple mb-1">
								${analytics?.overview?.tipsRevenue?.toFixed(2) || "0.00"}
							</h3>
							<p className="text-muted mb-0">Tips & Donations</p>
							<small className="text-muted">{analytics?.overview?.tipsRevenuePercentage || 0}% of total</small>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			<Row className="mb-4">
				<Col lg={12}>
					<Card className="border-0 shadow-sm">
						<Card.Header>
							<h5 className="mb-0">Revenue Performance Metrics</h5>
						</Card.Header>
						<Card.Body>
							<Row>
								<Col md={3} className="mb-3">
									<div className="text-center p-3 bg-light rounded">
										<h6 className="text-muted mb-1">RPM (Revenue per Mille)</h6>
										<h4 className="text-primary mb-0">
											${analytics?.overview?.totalViews > 0 ? ((totalRevenue / analytics.overview.totalViews) * 1000).toFixed(2) : '0.00'}
										</h4>
										<small className="text-muted">Per 1000 views</small>
									</div>
								</Col>
								<Col md={3} className="mb-3">
									<div className="text-center p-3 bg-light rounded">
										<h6 className="text-muted mb-1">ARPU</h6>
										<h4 className="text-success mb-0">
											${analytics?.overview?.currentFollowers > 0 ? (totalRevenue / analytics.overview.currentFollowers).toFixed(2) : '0.00'}
										</h4>
										<small className="text-muted">Average Revenue Per User</small>
									</div>
								</Col>
								<Col md={3} className="mb-3">
									<div className="text-center p-3 bg-light rounded">
										<h6 className="text-muted mb-1">Conversion Rate</h6>
										<h4 className="text-warning mb-0">
											{analytics?.overview?.currentFollowers > 0 && totalSubscriptions > 0 ?
												((totalSubscriptions / analytics.overview.currentFollowers) * 100).toFixed(2) : '0.00'}%
										</h4>
										<small className="text-muted">Followers to subscribers</small>
									</div>
								</Col>
								<Col md={3} className="mb-3">
									<div className="text-center p-3 bg-light rounded">
										<h6 className="text-muted mb-1">Monthly Growth</h6>
										<h4 className={`mb-0 ${growthRate >= 0 ? 'text-success' : 'text-danger'}`}>
											{growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
										</h4>
										<small className="text-muted">Revenue trend</small>
									</div>
								</Col>
							</Row>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			<Row className="mb-4">
				<Col lg={8} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Header>
							<h5 className="mb-0">Revenue Trends</h5>
						</Card.Header>
						<Card.Body>
							<ResponsiveContainer width="100%" height={350}>
								<AreaChart data={monetizationData.revenue}> {/* Use monetizationData.revenue */}
									<defs>
										<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#28a745" stopOpacity={0.8}/>
											<stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
										</linearGradient>
									</defs>
									<XAxis dataKey="month" />
									<YAxis />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip formatter={(value) => [`$${value}`, '']} />
									<Area type="monotone" dataKey="earnings" stroke="#28a745" fillOpacity={1} fill="url(#colorRevenue)" name="Total Revenue" />
									{/* Assuming you want to show Ad Revenue and Subscriptions as separate bars */}
									<Bar dataKey="adRevenue" fill="#17a2b8" name="Ad Revenue" />
									<Bar dataKey="subscriptions" fill="#ffc107" name="Subscriptions" />
								</AreaChart>
							</ResponsiveContainer>
						</Card.Body>
					</Card>
				</Col>
				<Col lg={4} className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Header>
							<h5 className="mb-0">Revenue Breakdown</h5>
						</Card.Header>
						<Card.Body>
							<div className="mb-3">
								<div className="d-flex justify-content-between mb-1">
									<span>Ad Revenue</span>
									<span className="fw-bold">{analytics?.overview?.adRevenuePercentage || 0}%</span>
								</div>
								<div className="progress" style={{ height: '8px' }}>
									<div className="progress-bar bg-info" style={{ width: `${analytics?.overview?.adRevenuePercentage || 0}%` }}></div>
								</div>
							</div>
							<div className="mb-3">
								<div className="d-flex justify-content-between mb-1">
									<span>Subscriptions</span>
									<span className="fw-bold">{analytics?.overview?.subscriptionRevenuePercentage || 0}%</span>
								</div>
								<div className="progress" style={{ height: '8px' }}>
									<div className="progress-bar bg-warning" style={{ width: `${analytics?.overview?.subscriptionRevenuePercentage || 0}%` }}></div>
								</div>
							</div>
							<div className="mb-3">
								<div className="d-flex justify-content-between mb-1">
									<span>Tips & Donations</span>
									<span className="fw-bold">{analytics?.overview?.tipsRevenuePercentage || 0}%</span>
								</div>
								<div className="progress" style={{ height: '8px' }}>
									<div className="progress-bar bg-success" style={{ width: `${analytics?.overview?.tipsRevenuePercentage || 0}%` }}></div>
								</div>
							</div>
							<hr />
							<div className="text-center">
								<h5 className="text-success mb-1">
									${totalRevenue.toFixed(2)}
								</h5>
								<small className="text-muted">Total this period</small>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</>
	);
	}

	return (
		<Container className="py-4">
			<div className="d-flex justify-content-between align-items-center px-3 mb-4">
				<h2 className="mb-0">Analytics Dashboard</h2>
				<div className="d-flex gap-2">
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

			{analytics ? (
				<Tabs
					activeKey={activeTab}
					onSelect={(tab) => setActiveTab(tab)}
					className="mb-4"
					fill
				>
					<Tab eventKey="home" title="Home">
						{renderHomeTab()}
					</Tab>
					<Tab eventKey="growth" title="Growth">
						{renderGrowthTab()}
					</Tab>
					<Tab eventKey="monetization" title="Monetization">
						{renderMonetizationTab()}
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

			{/* Business Dashboard if available */}
			{businessDashboard && (
				<Card className="border-0 shadow-sm mt-4">
					<Card.Header>
						<h5 className="mb-0">Business Analytics</h5>
					</Card.Header>
					<Card.Body>
						<Row>
							<Col md={3} className="text-center">
								<h4 className="text-primary">{businessDashboard.overview?.totalCampaigns || 0}</h4>
								<p className="text-muted">Total Campaigns</p>
							</Col>
							<Col md={3} className="text-center">
								<h4 className="text-success">${businessDashboard.overview?.totalSpent?.toFixed(2) || '0.00'}</h4>
								<p className="text-muted">Total Spent</p>
							</Col>
							<Col md={3} className="text-center">
								<h4 className="text-info">{formatNumber(businessDashboard.analytics?.totalImpressions || 0)}</h4>
								<p className="text-muted">Impressions</p>
							</Col>
							<Col md={3} className="text-center">
								<h4 className="text-warning">{businessDashboard.analytics?.averageCTR?.toFixed(2) || 0}%</h4>
								<p className="text-muted">Average CTR</p>
							</Col>
						</Row>
					</Card.Body>
				</Card>
			)}
		</Container>
	);
};

export default AnalyticsPage;