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
	Nav,
} from "react-bootstrap";
import {
	ArrowLeft,
	Search,
	CheckCircleFill,
	Person,
	Hash,
	ChatDots,
} from "react-bootstrap-icons";

import { postAPI, apiRequest } from "../config/ApiConfig";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import PostCard from "../components/PostCard";
import { formatTimeAgo } from "../utils/common-utils";
import { parseTextContent } from "../utils/text-utils";

const SearchPage = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
	const [activeTab, setActiveTab] = useState(
		searchParams.get("tab") || "posts",
	);
	const [posts, setPosts] = useState([]);
	const [users, setUsers] = useState([]);
	const [comments, setComments] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Get current user from localStorage or context
	const { user: currentUser } = useLoaderData();

	// Update URL when search query changes
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (searchQuery.trim()) {
				setSearchParams({ q: searchQuery, tab: activeTab });
			} else {
				setSearchParams({});
			}
		}, 300); // Debounce to avoid too many URL updates

		return () => clearTimeout(timeoutId);
	}, [searchQuery, setSearchParams, activeTab]);

	// Listen for URL parameter changes (back/forward navigation)
	useEffect(() => {
		const urlQuery = searchParams.get("q") || "";
		const urlTab = searchParams.get("tab") || "posts";
		setSearchQuery(urlQuery);
		setActiveTab(urlTab);
	}, [searchParams]);

	const performSearch = useCallback(async (searchQueryParam, tab) => {
		if (!searchQueryParam.trim()) return;

		try {
			setLoading(true);
			setError("");

			if (tab === "posts") {
				const response = await apiRequest(
					`/posts?search=${encodeURIComponent(searchQueryParam)}&limit=20`,
				);
				setPosts(response.posts || []);
			} else if (tab === "users") {
				// Use /users endpoint to get all users, then filter by search query
				const response = await apiRequest(`/users`);
				const allUsers = response.users || [];
				const filteredUsers = allUsers.filter(
					(user) =>
						user.name.toLowerCase().includes(searchQueryParam.toLowerCase()) ||
						user.username
							.toLowerCase()
							.includes(searchQueryParam.toLowerCase()) ||
						(user.bio &&
							user.bio.toLowerCase().includes(searchQueryParam.toLowerCase())),
				);
				setUsers(filteredUsers);
			} else if (tab === "comments") {
				// Use the correct API endpoint for comment search with proper parameters
				const response = await apiRequest(
					`/comments/search?query=${encodeURIComponent(searchQueryParam)}&limit=20&sortBy=desc`,
				);
				setComments(response.comments || []);
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, []);

	const handleSearch = useCallback(() => {
		if (!searchQuery.trim()) {
			setPosts([]);
			setUsers([]);
			setComments([]);
			return;
		}
		performSearch(searchQuery, activeTab);
	}, [searchQuery, activeTab, performSearch]);

	useEffect(() => {
		const query = searchParams.get("q");
		if (query) {
			setSearchQuery(query);
			performSearch(query);
			updatePageMeta({
				title: `Search: ${query} - DOPE Network`,
				description: `Search results for "${query}" on DOPE Network.`,
				keywords: `search, ${query}, posts, people, DOPE Network`,
			});
		} else {
			updatePageMeta(pageMetaData.search);
		}
	}, [searchParams]);

	useEffect(() => {
		updatePageMeta({
			title: searchQuery
				? `Search results for "${searchQuery}"`
				: "Search DOPE Network",
			description: searchQuery
				? `Find posts, users, and comments related to "${searchQuery}".`
				: "Search for posts, people, and comments on the DOPE Network.",
		});
	}, [searchQuery]);

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
								: [...likes, { user: { uid: currentUser.uid } }],
							stats: {
								...post.stats,
								likes: isLiked
									? (post.stats?.likes || 0) - 1
									: (post.stats?.likes || 0) + 1,
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

	const handleTabChange = (tab) => {
		setActiveTab(tab);

		// Update URL with tab parameter
		const newSearchParams = new URLSearchParams(searchParams);
		newSearchParams.set("tab", tab);
		if (searchQuery) {
			newSearchParams.set("q", searchQuery);
		} else {
			newSearchParams.delete("q");
		}
		navigate(`/search?${newSearchParams.toString()}`, { replace: true });

		// Only search if we don't have results for this tab yet
		if (tab === "posts" && posts.length === 0 && searchQuery.trim()) {
			performSearch(searchQuery, tab);
		} else if (tab === "users" && users.length === 0 && searchQuery.trim()) {
			performSearch(searchQuery, tab);
		} else if (
			tab === "comments" &&
			comments.length === 0 &&
			searchQuery.trim()
		) {
			performSearch(searchQuery, tab);
		}
	};

	return (
		<Container fluid className="py-0 px-0">
			{/* Header */}
			<div className="d-flex align-items-center gap-2 gap-md-3 p-2 p-md-3 border-bottom bg-white sticky-top">
				<Button
					variant="link"
					size="sm"
					className="text-dark p-0 d-flex align-items-center justify-content-center"
					style={{ minWidth: "32px", height: "32px" }}
					onClick={() => navigate(-1)}
				>
					<ArrowLeft size={18} />
				</Button>
				<div className="flex-grow-1">
					<Form
						onSubmit={(e) => {
							e.preventDefault();
							handleSearch();
						}}
					>
						<div className="d-flex gap-1 gap-md-2">
							<Form.Control
								type="text"
								placeholder="Search posts, users, comments..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="rounded-pill border-0 bg-light"
								style={{ fontSize: "14px" }}
								autoFocus
							/>
							<Button
								type="submit"
								variant="primary"
								className="rounded-pill d-flex align-items-center justify-content-center"
								style={{ minWidth: "40px", height: "38px" }}
								disabled={loading}
							>
								{loading ? <Spinner size="sm" /> : <Search size={14} />}
							</Button>
						</div>
					</Form>
				</div>
			</div>

			{error && (
				<Alert variant="danger" className="mx-2 mx-md-3 mt-2 mt-md-3 mb-0">
					{error}
				</Alert>
			)}

			{searchQuery && (
				<div
					className="border-bottom bg-white sticky-top"
					style={{ top: "60px" }}
				>
					<Nav
						variant="tabs"
						className="px-2 px-md-3"
						style={{ borderBottom: "none" }}
					>
						<Nav.Item className="flex-fill flex-md-grow-0">
							<Nav.Link
								active={activeTab === "posts"}
								onClick={() => handleTabChange("posts")}
								className="d-flex align-items-center justify-content-center justify-content-md-start gap-1 gap-md-2 py-2 px-2 px-md-3 text-center text-md-start"
								style={{ fontSize: "13px", fontWeight: "500" }}
							>
								<Hash size={14} />
								<span className="d-none d-sm-inline">Posts</span>
								<span className="d-sm-none">Posts</span>
								<span
									className="badge bg-secondary ms-1"
									style={{ fontSize: "10px" }}
								>
									{posts.length}
								</span>
							</Nav.Link>
						</Nav.Item>
						<Nav.Item className="flex-fill flex-md-grow-0">
							<Nav.Link
								active={activeTab === "users"}
								onClick={() => handleTabChange("users")}
								className="d-flex align-items-center justify-content-center justify-content-md-start gap-1 gap-md-2 py-2 px-2 px-md-3 text-center text-md-start"
								style={{ fontSize: "13px", fontWeight: "500" }}
							>
								<Person size={14} />
								<span className="d-none d-sm-inline">People</span>
								<span className="d-sm-none">People</span>
								<span
									className="badge bg-secondary ms-1"
									style={{ fontSize: "10px" }}
								>
									{users.length}
								</span>
							</Nav.Link>
						</Nav.Item>
						<Nav.Item className="flex-fill flex-md-grow-0">
							<Nav.Link
								active={activeTab === "comments"}
								onClick={() => handleTabChange("comments")}
								className="d-flex align-items-center justify-content-center justify-content-md-start gap-1 gap-md-2 py-2 px-2 px-md-3 text-center text-md-start"
								style={{ fontSize: "13px", fontWeight: "500" }}
							>
								<ChatDots size={14} />
								<span className="d-none d-sm-inline">Comments</span>
								<span className="d-sm-none">Comments</span>
								<span
									className="badge bg-secondary ms-1"
									style={{ fontSize: "10px" }}
								>
									{comments.length}
								</span>
							</Nav.Link>
						</Nav.Item>
					</Nav>
				</div>
			)}

			{/* Posts Results */}
			{activeTab === "posts" && searchQuery.trim() && (
				<div>
					{loading ? (
						<div className="text-center py-5">
							<Spinner animation="border" variant="primary" />
						</div>
					) : posts.length === 0 ? (
						<div className="text-center text-muted py-5">
							<Hash size={48} className="mb-3 opacity-50" />
							<h5>No posts found</h5>
							<p>Try searching with different keywords</p>
						</div>
					) : (
						posts.map((post) => (
							<PostCard
								key={post.id}
								post={post}
								currentUser={currentUser}
								onLike={handleLikePost}
								onShare={(postId) => {
									const postUrl = `${window.location.origin}/post/${postId}`;
									if (navigator.share) {
										navigator
											.share({
												title: "Check out this post",
												url: postUrl,
											})
											.catch(() => {
												navigator.clipboard.writeText(postUrl);
											});
									} else {
										navigator.clipboard.writeText(postUrl);
									}
								}}
								onPostClick={handlePostClick}
							/>
						))
					)}
				</div>
			)}

			{/* Users Results */}
			{activeTab === "users" && searchQuery.trim() && (
				<div className="pb-3">
					{loading ? (
						<div className="text-center py-5">
							<Spinner animation="border" variant="primary" />
						</div>
					) : users.length === 0 ? (
						<div className="text-center text-muted py-5">
							<Person size={48} className="mb-3 opacity-50" />
							<h5>No users found</h5>
							<p className="mb-0">Try searching with different keywords</p>
						</div>
					) : (
						<div>
							{users.map((user) => (
								<div key={user.uid} className="border-bottom">
									<div className="p-3">
										<div className="d-flex align-items-start gap-3">
											<Image
												src={
													user.photoURL || "https://i.pravatar.cc/150?img=10"
												}
												alt="avatar"
												roundedCircle
												width="48"
												height="48"
												className="d-none d-sm-block"
												style={{
													objectFit: "cover",
													minWidth: "48px",
													minHeight: "48px",
												}}
											/>
											<Image
												src={
													user.photoURL || "https://i.pravatar.cc/150?img=10"
												}
												alt="avatar"
												roundedCircle
												width="40"
												height="40"
												className="d-sm-none"
												style={{
													objectFit: "cover",
													minWidth: "40px",
													minHeight: "40px",
												}}
											/>
											<div className="flex-grow-1 min-width-0">
												<div className="d-flex align-items-center gap-2 mb-1">
													<h6
														className="mb-0 fw-bold text-truncate"
														style={{ cursor: "pointer" }}
														onClick={() => navigate(`/${user.username}`)}
													>
														{user.name}
													</h6>
													{user.hasBlueCheck && (
														<span className="text-primary flex-shrink-0">
															<CheckCircleFill size={16} />
														</span>
													)}
												</div>
												<p className="text-muted mb-1 small text-truncate">
													@{user.username}
												</p>
												{user.bio && (
													<p
														className="mb-2 small text-muted d-none d-md-block"
														style={{
															display: "-webkit-box",
															WebkitLineClamp: 2,
															WebkitBoxOrient: "vertical",
															overflow: "hidden",
														}}
													>
														{user.bio}
													</p>
												)}
												<Button
													variant="outline-primary"
													size="sm"
													className="mt-1"
													style={{ fontSize: "12px" }}
													onClick={() => navigate(`/${user.username}`)}
												>
													<span className="d-none d-sm-inline">
														View Profile
													</span>
													<span className="d-sm-none">View</span>
												</Button>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Comments Results */}
			{activeTab === "comments" && searchQuery.trim() && (
				<div className="pb-3">
					{loading ? (
						<div className="text-center py-5">
							<Spinner animation="border" variant="primary" />
						</div>
					) : comments.length === 0 ? (
						<div className="text-center text-muted py-5">
							<ChatDots size={48} className="mb-3 opacity-50" />
							<h5>No comments found</h5>
							<p className="mb-0">Try searching with different keywords</p>
						</div>
					) : (
						<div>
							{comments.map((comment) => (
								<div key={comment.id} className="border-bottom">
									<div className="p-3">
										<div className="d-flex gap-2 gap-md-3">
											<Image
												src={
													comment.author.photoURL ||
													"https://i.pravatar.cc/150?img=10"
												}
												alt="avatar"
												roundedCircle
												width="36"
												height="36"
												className="d-sm-none flex-shrink-0"
												style={{ objectFit: "cover" }}
											/>
											<Image
												src={
													comment.author.photoURL ||
													"https://i.pravatar.cc/150?img=10"
												}
												alt="avatar"
												roundedCircle
												width="40"
												height="40"
												className="d-none d-sm-block flex-shrink-0"
												style={{ objectFit: "cover" }}
											/>
											<div className="flex-grow-1 min-width-0">
												<div className="d-flex align-items-center gap-1 gap-md-2 mb-1 flex-wrap">
													<span
														className="fw-bold text-truncate"
														style={{ cursor: "pointer", maxWidth: "120px" }}
														onClick={() =>
															navigate(`/${comment.author.username}`)
														}
													>
														{comment.author.name}
													</span>
													{comment.author.hasBlueCheck && (
														<CheckCircleFill
															className="text-primary flex-shrink-0"
															size={14}
														/>
													)}
													<span className="text-muted d-none d-sm-inline">
														·
													</span>
													<span
														className="text-muted small flex-shrink-0"
														style={{ fontSize: "12px" }}
													>
														{formatTimeAgo(comment.createdAt)}
													</span>
												</div>
												<div
													className="mb-2"
													style={{ fontSize: "14px", lineHeight: "1.4" }}
												>
													{parseTextContent(comment.content, {
														onHashtagClick: (hashtag) =>
															navigate(
																`/search?q=%23${encodeURIComponent(hashtag)}`,
															),
														onMentionClick: (username) =>
															navigate(`/${username}`),
														onLinkClick: (url) =>
															window.open(url, "_blank", "noopener,noreferrer"),
													})}
												</div>
												<Button
													variant="outline-primary"
													size="sm"
													style={{ fontSize: "12px", padding: "4px 12px" }}
													onClick={() => navigate(`/post/${comment.postId}`)}
												>
													<span className="d-none d-sm-inline">View Post</span>
													<span className="d-sm-none">View</span>
												</Button>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{!searchQuery && (
				<div className="text-center py-5 text-muted px-3">
					<Search size={48} className="mb-3 d-none d-md-block" />
					<Search size={36} className="mb-3 d-md-none" />
					<h5 className="d-none d-md-block">Search DOPE Network</h5>
					<h6 className="d-md-none">Search DOPE Network</h6>
					<p className="mb-0" style={{ fontSize: "14px" }}>
						Find posts, people, and comments
					</p>
				</div>
			)}
			{/* <!-- banner_ad --> */}
			<ins
				class="adsbygoogle"
				style="display:block"
				data-ad-client="ca-pub-1106169546112879"
				data-ad-slot="2596463814"
				data-ad-format="auto"
				data-full-width-responsive="true"
			></ins>
			<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
		</Container>
	);
};

export default SearchPage;
