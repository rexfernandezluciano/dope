
/** @format */

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLoaderData } from "react-router-dom";
import {
	Container,
	Card,
	Image,
	Button,
	Alert,
	Spinner,
} from "react-bootstrap";
import {
	ArrowLeft,
	CheckCircleFill,
	Globe,
	Lock,
	PersonFill,
	Share,
} from "react-bootstrap-icons";
import { postAPI } from "../config/ApiConfig";
import { formatTimeAgo } from "../utils/common-utils";
import { parseTextContent } from "../utils/text-utils";
import { updatePageMeta } from "../utils/meta-utils";

const RepostsPage = () => {
	const { postId } = useParams();
	const loaderData = useLoaderData() || {};
	const { user: currentUser } = loaderData;
	const navigate = useNavigate();
	const [post, setPost] = useState(null);
	const [reposts, setReposts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const loadPostAndReposts = async () => {
			try {
				setLoading(true);
				setError("");

				// Load the original post
				const postResponse = await postAPI.getPost(postId);
				if (postResponse && postResponse.post) {
					setPost(postResponse.post);
				} else {
					throw new Error("Post not found");
				}

				// Load reposts
				const repostsResponse = await postAPI.getReposts(postId);
				if (repostsResponse && Array.isArray(repostsResponse.reposts)) {
					setReposts(repostsResponse.reposts);
				} else {
					setReposts([]);
				}
			} catch (err) {
				console.error("Failed to load post and reposts:", err);
				setError(err.message || "Failed to load reposts");
			} finally {
				setLoading(false);
			}
		};

		if (postId) {
			loadPostAndReposts();
		}
	}, [postId]);

	// Update page meta data when post loads
	useEffect(() => {
		if (post) {
			updatePageMeta({
				title: `Reposts of ${post.author.name}'s post - DOPE Network`,
				description: `See who reposted this post by ${post.author.name}`,
				keywords: `reposts, ${post.author.name}, DOPE Network, social media`,
			});
		}
	}, [post]);

	const getPrivacyIcon = (privacy) => {
		switch (privacy) {
			case "public":
				return <Globe size={14} className="text-muted" />;
			case "private":
				return <Lock size={14} className="text-muted" />;
			case "followers":
				return <PersonFill size={14} className="text-muted" />;
			default:
				return <Globe size={14} className="text-muted" />;
		}
	};

	const handleHashtagClick = (hashtag) => {
		navigate(`/search?q=%23${encodeURIComponent(hashtag)}&tab=comments`);
	};

	const handleMentionClick = (username) => {
		navigate(`/${username}`);
	};

	const handleLinkClick = (url) => {
		window.open(url, "_blank", "noopener,noreferrer");
	};

	if (loading) {
		return (
			<Container className="text-center py-5">
				<Spinner animation="border" variant="primary" />
			</Container>
		);
	}

	if (error || !post) {
		return (
			<Container className="py-3">
				<Alert variant="danger">{error || "Post not found"}</Alert>
			</Container>
		);
	}

	return (
		<Container className="py-0 px-0">
			{/* Header */}
			<div className="d-flex align-items-center gap-3 p-3 border-bottom bg-white sticky-top">
				<Button
					variant="link"
					size="sm"
					className="text-dark p-0"
					onClick={() => navigate(-1)}
				>
					<ArrowLeft size={20} />
				</Button>
				<div>
					<h5 className="mb-0">Reposts</h5>
					<small className="text-muted">
						{reposts.length} {reposts.length === 1 ? "repost" : "reposts"}
					</small>
				</div>
			</div>

			{/* Original Post */}
			<Card className="border-0 border-bottom rounded-0">
				<Card.Body className="px-3 py-3">
					<div className="d-flex gap-2">
						<Image
							src={post.author.photoURL || "https://i.pravatar.cc/150?img=10"}
							alt="avatar"
							roundedCircle
							width="40"
							height="40"
							style={{
								objectFit: "cover",
								minWidth: "40px",
								minHeight: "40px",
							}}
						/>
						<div className="flex-grow-1">
							<div className="d-flex align-items-center gap-1 mb-2">
								<span
									className="fw-bold"
									style={{ cursor: "pointer", color: "inherit" }}
									onClick={() => navigate(`/${post.author.username}`)}
								>
									{post.author.name}
								</span>
								{post.author.hasBlueCheck && (
									<CheckCircleFill className="text-primary" size={16} />
								)}
								<span className="text-muted">·</span>
								<span className="text-muted small">
									{formatTimeAgo(post.createdAt)}
								</span>
								<span className="text-muted">·</span>
								{getPrivacyIcon(post.privacy)}
							</div>

							{post.content && (
								<div className="mb-2">
									{parseTextContent(post.content, {
										onHashtagClick: handleHashtagClick,
										onMentionClick: handleMentionClick,
										onLinkClick: handleLinkClick,
									})}
								</div>
							)}

							{post.imageUrls && post.imageUrls.length > 0 && (
								<div className="mb-2">
									{post.imageUrls.length === 1 ? (
										<Image
											src={post.imageUrls[0]}
											className="rounded w-100"
											style={{
												height: "300px",
												objectFit: "cover",
											}}
										/>
									) : (
										<div className="d-flex gap-2" style={{ height: "300px" }}>
											<div style={{ flex: "2" }}>
												<Image
													src={post.imageUrls[0]}
													className="rounded w-100 h-100"
													style={{ objectFit: "cover" }}
												/>
											</div>
											{post.imageUrls.length > 1 && (
												<div
													className="d-flex flex-column gap-2"
													style={{ flex: "1" }}
												>
													<div
														style={{
															height:
																post.imageUrls.length > 2
																	? "calc(50% - 4px)"
																	: "100%",
														}}
													>
														<Image
															src={post.imageUrls[1]}
															className="rounded w-100 h-100"
															style={{ objectFit: "cover" }}
														/>
													</div>
													{post.imageUrls.length > 2 && (
														<div
															style={{ height: "calc(50% - 4px)" }}
															className="position-relative"
														>
															<Image
																src={post.imageUrls[2]}
																className="rounded w-100 h-100"
																style={{ objectFit: "cover" }}
															/>
															{post.imageUrls.length > 3 && (
																<div
																	className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded"
																	style={{
																		backgroundColor: "rgba(0, 0, 0, 0.7)",
																		color: "white",
																		fontWeight: "bold",
																		fontSize: "1.2rem",
																	}}
																>
																	+{post.imageUrls.length - 3}
																</div>
															)}
														</div>
													)}
												</div>
											)}
										</div>
									)}
								</div>
							)}

							<div className="d-flex align-items-center justify-content-between">
								<div className="d-flex flex-wrap gap-3 small text-muted">
									{post.stats?.likes > 0 && (
										<span>{post.stats.likes} likes</span>
									)}
									{post.stats?.comments > 0 && (
										<span>{post.stats.comments} comments</span>
									)}
								</div>
								<div className="d-flex flex-wrap gap-3 small text-muted">
									{post.analytics?.views > 0 && (
										<span>{post.analytics.views} views</span>
									)}
									{post.analytics?.shares > 0 && (
										<span>{post.analytics.shares} shares</span>
									)}
								</div>
							</div>
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Reposts Section */}
			<div className="px-3 py-2 bg-light border-bottom">
				<h6 className="mb-0 text-muted">
					<Share size={16} className="me-2" />
					Reposts ({reposts.length})
				</h6>
			</div>

			{/* Reposts List */}
			{reposts.length === 0 ? (
				<div className="text-center py-5 text-muted">
					<Share size={48} className="mb-3 opacity-50" />
					<p>No reposts yet</p>
					<small>Be the first to repost this!</small>
				</div>
			) : (
				<div>
					{reposts.map((repost, index) => (
						<Card
							key={repost.id}
							className="border-0 border-bottom rounded-0"
							style={{ cursor: "pointer" }}
							onClick={() => navigate(`/${repost.user.username}`)}
						>
							<Card.Body className="px-3 py-3">
								<div className="d-flex gap-2">
									<Image
										src={
											repost.user.photoURL ||
											"https://i.pravatar.cc/150?img=10"
										}
										alt="avatar"
										roundedCircle
										width="40"
										height="40"
										style={{
											objectFit: "cover",
											minWidth: "40px",
											minHeight: "40px",
										}}
									/>
									<div className="flex-grow-1">
										<div className="d-flex align-items-center gap-1 mb-2">
											<span
												className="fw-bold"
												style={{ cursor: "pointer", color: "inherit" }}
												onClick={(e) => {
													e.stopPropagation();
													navigate(`/${repost.user.username}`);
												}}
											>
												{repost.user.name}
											</span>
											{repost.user.hasBlueCheck && (
												<CheckCircleFill className="text-primary" size={16} />
											)}
											<span className="text-muted">·</span>
											<span className="text-muted small">
												{formatTimeAgo(repost.createdAt)}
											</span>
										</div>

										{repost.content && (
											<div className="mb-2">
												{parseTextContent(repost.content, {
													onHashtagClick: handleHashtagClick,
													onMentionClick: handleMentionClick,
													onLinkClick: handleLinkClick,
												})}
											</div>
										)}

										<div className="d-flex align-items-center gap-2 text-muted small">
											<Share size={14} />
											<span>Reposted</span>
										</div>
									</div>
								</div>
							</Card.Body>
						</Card>
					))}
				</div>
			)}
		</Container>
	);
};

export default RepostsPage;
