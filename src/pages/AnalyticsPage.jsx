/** @format */

import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Alert, Button, Badge } from "react-bootstrap";
import { enhancedAnalyticsAPI, businessAPI } from "../config/ApiConfig";
import { formatTimeAgo, formatCurrency } from "../utils/common-utils";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AnalyticsPage = () => {
	const [analytics, setAnalytics] = useState(null);
	const [businessDashboard, setBusinessDashboard] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedPeriod, setSelectedPeriod] = useState("30d");

	useEffect(() => {
		updatePageMeta(pageMetaData.analytics);
		loadAnalytics();
	}, [selectedPeriod]);

	const loadAnalytics = async () => {
		try {
			setLoading(true);
			const [userAnalytics, businessData] = await Promise.all([
				enhancedAnalyticsAPI.getUserAnalytics(selectedPeriod),
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

	return (
		<Container className="py-4">
			<div className="d-flex justify-content-between align-items-center mb-4">
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

			{analytics && (
				<>
					{/* Overview Cards */}
					<Row className="mb-4">
						<Col md={6} lg={3} className="mb-3">
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center">
									<h3 className="text-primary mb-1">
										{formatNumber(analytics.overview?.totalViews)}
									</h3>
									<p className="text-muted mb-0">Total Views</p>
									<small className="text-success">
										+{analytics.overview?.followersGained || 0} this period
									</small>
								</Card.Body>
							</Card>
						</Col>

						<Col md={6} lg={3} className="mb-3">
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center">
									<h3 className="text-success mb-1">
										${analytics.overview?.totalEarnings?.toFixed(2) || "0.00"}
									</h3>
									<p className="text-muted mb-0">Total Earnings</p>
									<small className="text-muted">
										{analytics.period || '30 days'}
									</small>
								</Card.Body>
							</Card>
						</Col>

						<Col md={6} lg={3} className="mb-3">
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center">
									<h3 className="text-info mb-1">
										{formatNumber(analytics.overview?.currentFollowers)}
									</h3>
									<p className="text-muted mb-0">Followers</p>
									<small className="text-success">
										+{analytics.overview?.followersGained || 0} gained
									</small>
								</Card.Body>
							</Card>
						</Col>

						<Col md={6} lg={3} className="mb-3">
							<Card className="h-100 border-0 shadow-sm">
								<Card.Body className="text-center">
									<h3 className="text-warning mb-1">
										{analytics.overview?.engagementRate || 0}%
									</h3>
									<p className="text-muted mb-0">Engagement Rate</p>
									<small className="text-muted">
										{formatNumber(analytics.overview?.totalLikes + analytics.overview?.totalComments + analytics.overview?.totalShares)} engagements
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
							{analytics.topPosts?.length > 0 ? (
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

					{/* Business Dashboard if available */}
					{businessDashboard && (
						<Card className="border-0 shadow-sm">
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
				</>
			)}

			{!analytics && (
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