/** @format */

import { useState, useEffect, useCallback } from "react";
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
	Star,
	Lightning as Zap
} from "react-bootstrap-icons";

import { postAPI } from "../config/ApiConfig";
import { formatTimeAgo } from "../utils/common-utils";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";

const AnalyticsPage = () => {
	const { user } = useLoaderData() || {};
	const [analytics, setAnalytics] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [timeRange, setTimeRange] = useState("30d");

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
				// Use actual analytics views if available, otherwise estimate based on engagement
				const analyticsViews = post?.analytics?.views || 0;
				const estimatedViews = analyticsViews > 0 ? analyticsViews : (post.stats?.likes || 0) + (post.stats?.comments || 0) + (post?.sharesCount || 0);
				return sum + estimatedViews;
			}, 0);

			// Calculate engagement rate
			const totalEngagement = totalLikes + totalComments + totalShares;
			const engagementRate = totalViews > 0 ? ((totalEngagement / totalViews) * 100).toFixed(1) : "0.0";

			// Get top performing posts based on real API data
			const topPosts = [...userPosts]
				.sort((a, b) => {
					const aEngagement = (a.stats?.likes || 0) + (a.stats?.comments || 0) + (a?.sharesCount || a?.analytics?.shares || 0);
					const bEngagement = (b.stats?.likes || 0) + (b.stats?.comments || 0) + (b?.sharesCount || b?.analytics?.shares || 0);
					return bEngagement - aEngagement;
				})
				.slice(0, 5);

			// Calculate growth metrics from real data
			const now = new Date();
			const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			const recentPosts = userPosts.filter(post => new Date(post.createdAt) >= thirtyDaysAgo);
			const recentLikes = recentPosts.reduce((sum, post) => sum + (post.stats?.likes || 0), 0);
			const recentGrowth = totalLikes > 0 ? ((recentLikes / totalLikes) * 100).toFixed(1) : "0.0";

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
			});

		} catch (err) {
			console.error("Analytics loading error:", err);
			setError("Failed to load analytics data");
		} finally {
			setLoading(false);
		}
	}, [user?.username, user?.followersCount, user?.followingCount]);

	useEffect(() => {
		if (user?.uid && user?.username) {
			loadAnalytics();
			updatePageMeta("Analytics", `View your content performance and growth metrics on DOPE. Your username is ${user?.username}.`);
		}
	}, [loadAnalytics, user?.uid, user?.username]);

	const StatCard = ({ icon: Icon, title, value, subtitle, color = "primary", growth }) => (
		<Card className="border-0 shadow-sm h-100 stat-card">
			<Card.Body className="p-3">
				<div className="d-flex align-items-center justify-content-between mb-2">
					<Icon className={`text-${color}`} size={24} />
					{growth && (
						<Badge bg={growth > 0 ? "success" : "secondary"} className="rounded-pill">
							{growth > 0 ? "+" : ""}{growth}%
						</Badge>
					)}
				</div>
				<h3 className="mb-1 fw-bold">{value}</h3>
				<p className="text-muted mb-1 small">{title}</p>
				{subtitle && <small className="text-muted">{subtitle}</small>}
			</Card.Body>
		</Card>
	);

	const TopPostCard = ({ post, rank }) => {
		const totalEngagement = (post.stats?.likes || 0) + (post.stats?.comments || 0) + (post?.sharesCount || post?.analytics?.shares || 0);
		// Use actual analytics views if available, otherwise estimate as 3x engagement
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
				@media (max-width: 768px) {
					.mobile-stack {
						margin-bottom: 1rem;
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
							icon={GraphUp}
							title="Engagement Rate"
							value={`${analytics?.engagementRate || 0}%`}
							color="success"
							subtitle="Above average"
						/>
					</Col>
				</Row>

				{/* Engagement Breakdown */}
				<Row className="g-3 mb-4">
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

				{/* Top Performing Content */}
				<Row className="g-4">
					<Col lg={8}>
						<Card className="border-0 shadow-sm">
							<Card.Header className="bg-white border-0 pb-0">
								<h5 className="mb-0 fw-bold">
									<Star className="me-2 text-warning" />
									Top Performing Posts
								</h5>
								<small className="text-muted">Your best content based on engagement</small>
							</Card.Header>
							<Card.Body className="p-3">
								{analytics?.topPosts?.length > 0 ? (
									analytics.topPosts.map((post, index) => (
										<TopPostCard key={post.id} post={post} rank={index + 1} />
									))
								) : (
									<div className="text-center py-4">
										<FileText className="text-muted mb-2" size={32} />
										<p className="text-muted">No posts available for analysis</p>
										<small className="text-muted">Start creating content to see analytics</small>
									</div>
								)}
							</Card.Body>
						</Card>
					</Col>

					<Col lg={4}>
						{/* Growth Metrics */}
						<Card className="border-0 shadow-sm mb-3">
							<Card.Header className="bg-white border-0 pb-0">
								<h6 className="mb-0 fw-bold">
									<GraphUp className="me-2 text-success" />
									Growth Metrics
								</h6>
							</Card.Header>
							<Card.Body className="p-3">
								<div className="mb-3">
									<div className="d-flex justify-content-between align-items-center mb-1">
										<small className="text-muted">Recent Growth</small>
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
										<small className="text-muted">Engagement Quality</small>
										<span className="small fw-bold">{analytics?.engagementRate || 0}%</span>
									</div>
									<ProgressBar
										now={Math.min((analytics?.engagementRate || 0) * 10, 100)}
										variant="primary"
										className="rounded-3"
										style={{ height: '6px' }}
									/>
								</div>
								<div>
									<div className="d-flex justify-content-between align-items-center mb-1">
										<small className="text-muted">Content Consistency</small>
										<span className="small fw-bold">
											{analytics?.totalPosts > 0 ? Math.min(analytics.totalPosts * 2, 100) : 0}%
										</span>
									</div>
									<ProgressBar
										now={analytics?.totalPosts > 0 ? Math.min(analytics.totalPosts * 2, 100) : 0}
										variant="warning"
										className="rounded-3"
										style={{ height: '6px' }}
									/>
								</div>
							</Card.Body>
						</Card>

						{/* Pro Tips */}
						<Card className="border-0 bg-gradient-primary text-white">
							<Card.Body className="p-3">
								<div className="d-flex align-items-center mb-2">
									<Zap className="me-2" size={20} />
									<h6 className="mb-0 fw-bold">Pro Tips</h6>
								</div>
								<ul className="small mb-0 ps-3">
									<li className="mb-1">Post consistently to maintain engagement</li>
									<li className="mb-1">Engage with your audience's comments</li>
									<li className="mb-1">Use trending hashtags and topics</li>
									<li>Share content during peak hours</li>
								</ul>
							</Card.Body>
						</Card>
					</Col>
				</Row>
			</Container>
		</>
	);
};

export default AnalyticsPage;