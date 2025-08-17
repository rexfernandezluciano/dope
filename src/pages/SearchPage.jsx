/** @format */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, useLoaderData } from "react-router-dom";
import {
	Container,
	Image,
	Form,
	Button,
	Card,
	Spinner,
	Alert,
	Tabs,
	Tab,
} from "react-bootstrap";
import {
	ArrowLeft,
	Search,
	Heart,
	HeartFill,
	ChatDots,
	Share,
	CheckCircleFill,
} from "react-bootstrap-icons";

import { postAPI, userAPI } from "../config/ApiConfig";

const SearchPage = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
	const [posts, setPosts] = useState([]);
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [activeTab, setActiveTab] = useState("posts");

	// Get current user from localStorage or context
	const {user: currentUser} = useLoaderData();

	// Update URL when search query changes
	useEffect(() => {
		if (searchQuery.trim()) {
			setSearchParams({ q: searchQuery });
		} else {
			setSearchParams({});
		}
	}, [searchQuery, setSearchParams]);

	// Listen for URL parameter changes (back/forward navigation)
	useEffect(() => {
		const urlQuery = searchParams.get('q') || "";
		if (urlQuery !== searchQuery) {
			setSearchQuery(urlQuery);
		}
	}, [searchParams]);

	const handleSearch = useCallback(async () => {
		if (!searchQuery.trim()) {
			setPosts([]);
			setUsers([]);
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError("");

			// Search posts and users concurrently
			const [postsResponse, usersResponse] = await Promise.all([
				postAPI.getPosts({ search: searchQuery, limit: 20 }),
				userAPI.searchUsers(searchQuery),
			]);

			setPosts(postsResponse.posts || []);
			setUsers(usersResponse.users || []);
		} catch (err) {
			console.error("Search error:", err);
			setError("Failed to search. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [searchQuery]);

	useEffect(() => {
		if (searchQuery.trim()) {
			handleSearch();
		} else {
			setPosts([]);
			setUsers([]);
		}
	}, [searchQuery, handleSearch]);

	const formatTimeAgo = (dateString) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now - date;
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "now";
		if (diffMins < 60) return `${diffMins}m`;
		if (diffHours < 24) return `${diffHours}h`;
		return `${diffDays}d`;
	};

	const handleLikePost = async (postId) => {
		try {
			await postAPI.likePost(postId);
			// Update posts state to reflect like change
			setPosts((prev) =>
				prev.map((post) => {
					if (post.id === postId) {
						const likes = post.likes || [];
						const isLiked = likes.some(
							(like) => like.user.uid === currentUser.uid,
						);
						return {
							...post,
							likes: isLiked
								? likes.filter((like) => like.user.uid !== currentUser.uid)
								: [...likes, { user: {uid: currentUser.uid }}],
							stats: {
								...post.stats,
								likes: isLiked ? (post.stats?.likes || 0) - 1 : (post.stats?.likes || 0) + 1,
							},
						};
					}
					return post;
				}),
			);
		} catch (err) {
			console.error("Error liking post:", err);
		}
	};

	const handlePostClick = (postId, e) => {
		if (
			e.target.closest("button") ||
			e.target.closest("a") ||
			e.target.closest(".dropdown")
		) {
			return;
		}
		navigate(`/post/${postId}`);
	};

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
				<div className="flex-grow-1">
					<Form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
						<div className="d-flex gap-2">
							<Form.Control
								type="text"
								placeholder="Search posts, users..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="rounded-pill"
								autoFocus
							/>
							<Button
								type="submit"
								variant="primary"
								className="rounded-pill px-3"
								disabled={loading}
							>
								{loading ? <Spinner size="sm" /> : <Search size={16} />}
							</Button>
						</div>
					</Form>
				</div>
			</div>

			{error && (
				<Alert variant="danger" className="mx-3 mt-3">
					{error}
				</Alert>
			)}

			{searchQuery && !loading && (
				<Tabs
					activeKey={activeTab}
					onSelect={setActiveTab}
					className="border-bottom mx-0"
				>
					<Tab
						eventKey="posts"
						title={`Posts (${posts.length})`}
						className="px-0"
					>
						{posts.length === 0 ? (
							<div className="text-center py-5 text-muted">
								<h5>No posts found</h5>
								<p>Try different keywords</p>
							</div>
						) : (
							posts.map((post) => (
								<Card
									key={post.id}
									className="border-0 border-bottom rounded-0 post-card"
									style={{ cursor: "pointer" }}
									onClick={(e) => handlePostClick(post.id, e)}
								>
									<Card.Body className="px-3">
										<div className="d-flex gap-2">
											<Image
												src={
													post.author.photoURL ||
													"https://i.pravatar.cc/150?img=10"
												}
												alt="avatar"
												roundedCircle
												width="40"
												height="40"
											/>
											<div className="flex-grow-1">
												<div className="d-flex align-items-center justify-content-between">
													<div className="d-flex align-items-center gap-1">
														<span
															className="fw-bold"
															style={{ cursor: "pointer", color: "inherit" }}
															onClick={(e) => {
																e.stopPropagation();
																navigate(`/${post.author.username}`);
															}}
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
													</div>
												</div>

												{post.content && <p className="mb-2">{post.content}</p>}

												{post.imageUrls && post.imageUrls.length > 0 && (
													<div className="mb-2">
														<Image
															src={post.imageUrls[0]}
															className="rounded w-100"
															style={{
																height: "200px",
																objectFit: "cover",
															}}
														/>
													</div>
												)}

												<div className="d-flex align-items-center justify-content-between">
													{post.likes.length > 0 &&
														(post.likes[0].user.uid === currentUser.uid ? (
															<div className="small text-muted">
																<span className="fw-bold">You</span>{" "}
																{post.likes.length > 1
																	? "& " + post.likes.length - 1 + " reacted."
																	: " reacted."}
															</div>
														) : (
															""
														))}
												</div>

												<div
													className="d-flex justify-content-around text-muted mt-3 pt-2 border-top"
													style={{ maxWidth: "400px" }}
												>
													<Button
														variant="link"
														size="sm"
														className="text-muted p-2 border-0 d-flex align-items-center gap-1 rounded-circle"
														onClick={(e) => {
															e.stopPropagation();
															navigate(`/post/${post.id}`);
														}}
													>
														<ChatDots size={20} />
														{post.stats?.comments > 0 && (
															<span className="small">
																{post.stats?.comments}
															</span>
														)}
													</Button>

													<Button
														variant="link"
														size="sm"
														className="p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn"
														style={{
															color: post?.likes.some(
																(like) => like.user.uid === currentUser.uid,
															)
																? "#dc3545"
																: "#6c757d",
															transition: "all 0.2s",
															minWidth: "40px",
															height: "36px",
														}}
														onClick={(e) => {
															e.stopPropagation();
															handleLikePost(post.id);
														}}
														onMouseEnter={(e) => {
															if (
																!post.likes.some(
																	(like) => like.user.uid === currentUser.uid,
																)
															) {
																e.target.closest(
																	".action-btn",
																).style.backgroundColor =
																	"rgba(220, 53, 69, 0.1)";
																e.target.closest(".action-btn").style.color =
																	"#dc3545";
															}
														}}
														onMouseLeave={(e) => {
															if (
																!post.likes.some(
																	(like) => like.user.uid === currentUser.uid,
																)
															) {
																e.target.closest(
																	".action-btn",
																).style.backgroundColor = "transparent";
																e.target.closest(".action-btn").style.color =
																	"#6c757d";
															}
														}}
													>
														{post.likes.some(
															(like) => like.user.uid === currentUser.uid,
														) ? (
															<HeartFill size={20} style={{ flexShrink: 0 }} />
														) : (
															<Heart size={20} style={{ flexShrink: 0 }} />
														)}
														{(post.stats?.likes || 0) > 0 && (
															<span className="small">{post.stats?.likes || 0}</span>
														)}
													</Button>

													<Button
														variant="link"
														size="sm"
														className="text-muted p-2 border-0 rounded-circle"
													>
														<Share size={20} />
													</Button>
												</div>
											</div>
										</div>
									</Card.Body>
								</Card>
							))
						)}
					</Tab>

					<Tab
						eventKey="users"
						title={`Users (${users.length})`}
						className="px-0"
					>
						{users.length === 0 ? (
							<div className="text-center py-5 text-muted">
								<h5>No users found</h5>
								<p>Try different keywords</p>
							</div>
						) : (
							users.map((user) => (
								<Card
									key={user.uid}
									className="border-0 border-bottom rounded-0"
									style={{ cursor: "pointer" }}
									onClick={() => navigate(`/${user.username}`)}
								>
									<Card.Body className="px-3 py-3">
										<div className="d-flex align-items-center gap-3">
											<Image
												src={
													user.photoURL ||
													"https://i.pravatar.cc/150?img=10"
												}
												alt="avatar"
												roundedCircle
												width="50"
												height="50"
											/>
											<div className="flex-grow-1">
												<div className="d-flex align-items-center gap-1">
													<span className="fw-bold">{user.name}</span>
													{user.hasBlueCheck && (
														<CheckCircleFill className="text-primary" size={16} />
													)}
												</div>
												<p className="text-muted mb-0">@{user.username}</p>
												{user.bio && (
													<p className="small text-muted mb-0">{user.bio}</p>
												)}
											</div>
										</div>
									</Card.Body>
								</Card>
							))
						)}
					</Tab>
				</Tabs>
			)}

			{!searchQuery && (
				<div className="text-center py-5 text-muted">
					<Search size={48} className="mb-3" />
					<h5>Search DOPE Network</h5>
					<p>Find posts and people</p>
				</div>
			)}
		</Container>
	);
};

export default SearchPage;