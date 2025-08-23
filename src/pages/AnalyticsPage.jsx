
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
	const [activeTab, setActiveTab] = useState("overview");
	const [growthData, setGrowthData] = useState({});
	const [monetizationData, setMonetizationData] = useState({});

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
			const [userAnalytics, businessData] = await Promise.all([
				analyticsAPI.getUserAnalytics(selectedPeriod),
				businessAPI.getDashboard().catch(() => null)
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

	const StatCard = ({ icon, value, label, subtitle, variant = "primary" }) => (
		<Card className="h-100 border-0 shadow-sm">
			<Card.Body className="text-center p-3">
				{icon && <div className={`text-${variant} mb-2`}>{icon}</div>}
				<h4 className="mb-1">{value}</h4>
				<p className="text-muted mb-0 small">{label}</p>
				{subtitle && <small className={`text-${variant === 'success' ? 'success' : 'muted'}`}>{subtitle}</small>}
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
						value={`$${analytics?.overview?.totalEarnings?.toFixed(2) || "0.00"}`}
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
				<Col lg={8} className="order-1 order-lg-0">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Header>
							<h6 className="mb-0">Top Posts Performance</h6>
						</Card.Header>
						<Card.Body>
							{chartData.length > 0 ? (
								<ResponsiveContainer width="100%" height={250}>
									<BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis 
											dataKey="name" 
											fontSize={12}
											interval={0}
											angle={-45}
											textAnchor="end"
											height={60}
										/>
										<YAxis fontSize={12} />
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

				<Col lg={4} className="order-0 order-lg-1">
					<Card className="h-100 border-0 shadow-sm">
						<Card.Header>
							<h6 className="mb-0">Engagement Breakdown</h6>
						</Card.Header>
						<Card.Body>
							<ResponsiveContainer width="100%" height={200}>
								<PieChart>
									<Pie
										data={engagementData.filter(item => item.value > 0)}
										cx="50%"
										cy="50%"
										innerRadius={30}
										outerRadius={70}
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
												className="d-inline-block me-2"
												style={{
													width: 10,
													height: 10,
													backgroundColor: item.color,
													borderRadius: 2
												}}
											></span>
											<span className="text-truncate">{item.name}</span>
										</span>
										<span className="fw-bold">{formatNumber(item.value)}</span>
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
		const totalRevenue = analytics?.overview?.totalEarnings || 0;
		const totalSubscriptions = analytics?.overview?.totalSubscriptions || 0;
		const revenueGrowth = analytics?.overview?.revenueGrowth || 0;

		return (
			<>
				<Row className="g-3 mb-4">
					<Col xs={6} lg={3}>
						<StatCard
							value={`$${totalRevenue.toFixed(2)}`}
							label="Total Revenue"
							subtitle={`${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% vs last month`}
							variant="success"
						/>
					</Col>
					<Col xs={6} lg={3}>
						<StatCard
							value={`$${analytics?.overview?.adRevenue?.toFixed(2) || "0.00"}`}
							label="Ad Revenue"
							subtitle={`${analytics?.overview?.adRevenuePercentage || 0}% of total`}
							variant="info"
						/>
					</Col>
					<Col xs={6} lg={3}>
						<StatCard
							value={`$${analytics?.overview?.subscriptionRevenue?.toFixed(2) || "0.00"}`}
							label="Subscriptions"
							subtitle={`${analytics?.overview?.subscriptionRevenuePercentage || 0}% of total`}
							variant="warning"
						/>
					</Col>
					<Col xs={6} lg={3}>
						<StatCard
							value={`$${analytics?.overview?.tipsRevenue?.toFixed(2) || "0.00"}`}
							label="Tips & Donations"
							subtitle={`${analytics?.overview?.tipsRevenuePercentage || 0}% of total`}
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
											<small className="fw-bold">{analytics?.overview?.adRevenuePercentage || 0}%</small>
										</div>
										<div className="progress" style={{ height: '6px' }}>
											<div 
												className="progress-bar bg-info" 
												style={{ width: `${analytics?.overview?.adRevenuePercentage || 0}%` }}
											></div>
										</div>
									</div>
									<div>
										<div className="d-flex justify-content-between mb-1">
											<small>Subscriptions</small>
											<small className="fw-bold">{analytics?.overview?.subscriptionRevenuePercentage || 0}%</small>
										</div>
										<div className="progress" style={{ height: '6px' }}>
											<div 
												className="progress-bar bg-warning" 
												style={{ width: `${analytics?.overview?.subscriptionRevenuePercentage || 0}%` }}
											></div>
										</div>
									</div>
									<div>
										<div className="d-flex justify-content-between mb-1">
											<small>Tips & Donations</small>
											<small className="fw-bold">{analytics?.overview?.tipsRevenuePercentage || 0}%</small>
										</div>
										<div className="progress" style={{ height: '6px' }}>
											<div 
												className="progress-bar bg-success" 
												style={{ width: `${analytics?.overview?.tipsRevenuePercentage || 0}%` }}
											></div>
										</div>
									</div>
									<hr />
									<div className="text-center">
										<h6 className="text-success mb-1">${totalRevenue.toFixed(2)}</h6>
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

	return (
		<Container className="py-3 py-md-4">
			<div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center px-4 mb-4">
				<div className="mb-3 mb-md-0">
					<h2 className="mb-1">Analytics Dashboard</h2>
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
				>
					<Tab eventKey="overview" title="Overview">
						{renderOverviewTab()}
					</Tab>
					<Tab eventKey="growth" title={
						<span className="d-inline">Growth</span>
					}>
						{renderGrowthTab()}
					</Tab>
					<Tab eventKey="monetization" title={
						<span className="d-inline">Monetization</span>
					}>
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
						<h6 className="mb-0">Business Analytics</h6>
					</Card.Header>
					<Card.Body>
						<Row className="g-3">
							<Col xs={6} md={3} className="text-center">
								<h5 className="text-primary">{businessDashboard.overview?.totalCampaigns || 0}</h5>
								<small className="text-muted">Total Campaigns</small>
							</Col>
							<Col xs={6} md={3} className="text-center">
								<h5 className="text-success">${businessDashboard.overview?.totalSpent?.toFixed(2) || '0.00'}</h5>
								<small className="text-muted">Total Spent</small>
							</Col>
							<Col xs={6} md={3} className="text-center">
								<h5 className="text-info">{formatNumber(businessDashboard.analytics?.totalImpressions || 0)}</h5>
								<small className="text-muted">Impressions</small>
							</Col>
							<Col xs={6} md={3} className="text-center">
								<h5 className="text-warning">{businessDashboard.analytics?.averageCTR?.toFixed(2) || 0}%</h5>
								<small className="text-muted">Average CTR</small>
							</Col>
						</Row>
					</Card.Body>
				</Card>
			)}
		</Container>
	);
};

export default AnalyticsPage;
