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

import { postAPI, userAPI, apiRequest } from "../config/ApiConfig";
import { updatePageMeta } from "../utils/meta-utils";
import PostCard from "../components/PostCard";
import { formatTimeAgo } from "../utils/common-utils";
import { parseTextContent } from "../utils/text-utils";

const SearchPage = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
	const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "posts");
	const [posts, setPosts] = useState([]);
	const [users, setUsers] = useState([]);
	const [comments, setComments] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");


	// Get current user from localStorage or context
	const {user: currentUser} = useLoaderData();

	// Update URL when search query changes
	useEffect(() => {
		if (searchQuery.trim()) {
			setSearchParams({ q: searchQuery, tab: activeTab });
		} else {
			setSearchParams({});
		}
	}, [searchQuery, setSearchParams, activeTab]);

	// Listen for URL parameter changes (back/forward navigation)
	useEffect(() => {
		const urlQuery = searchParams.get('q') || "";
		const urlTab = searchParams.get('tab') || "posts";
		if (urlQuery !== searchQuery) {
			setSearchQuery(urlQuery);
		}
		if (urlTab !== activeTab) {
			setActiveTab(urlTab);
		}
	}, [searchParams]);


	const performSearch = useCallback(async (searchQueryParam = searchQuery, tab = activeTab) => {
		if (!searchQueryParam.trim()) return;

		try {
			setLoading(true);
			setError("");

			if (tab === "posts") {
				const response = await postAPI.searchPosts(searchQueryParam);
				setPosts(response.posts || []);
			} else if (tab === "users") {
				const response = await userAPI.searchUsers(searchQueryParam);
				setUsers(response.users || []);
			} else if (tab === "comments") {
				// Use the correct API endpoint for comment search
				const response = await apiRequest(`/comments/search?q=${encodeURIComponent(searchQueryParam)}`);
				setComments(response.comments || []);
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [searchQuery, activeTab]);

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
		if (searchQuery.trim()) {
			handleSearch();
		} else {
			setPosts([]);
			setUsers([]);
			setComments([]);
		}
	}, [searchQuery, handleSearch]);


	// Update meta tags when search query changes
	useEffect(() => {
		updatePageMeta({
			title: searchQuery ? `Search results for "${searchQuery}"` : "Search DOPE Network",
			description: searchQuery ? `Find posts, users, and comments related to "${searchQuery}".` : "Search for posts, people, and comments on the DOPE Network.",
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

	const handleTabChange = (tab) => {
		setActiveTab(tab);
		setPosts([]);
		setUsers([]);
		setComments([]);

		// Update URL with tab parameter
		const newSearchParams = new URLSearchParams(searchParams);
		newSearchParams.set("tab", tab);
		if (searchQuery) {
			newSearchParams.set("q", searchQuery);
		} else {
			newSearchParams.delete("q");
		}
		navigate(`/search?${newSearchParams.toString()}`, { replace: true });

		performSearch(searchQuery, tab);
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
								placeholder="Search posts, users, comments..."
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

			{searchQuery && (
				<Nav variant="tabs" className="mb-3 px-3">
					<Nav.Item>
						<Nav.Link
							active={activeTab === "posts"}
							onClick={() => handleTabChange("posts")}
							className="d-flex align-items-center gap-2"
						>
							<Hash size={16} />
							Posts ({posts.length})
						</Nav.Link>
					</Nav.Item>
					<Nav.Item>
						<Nav.Link
							active={activeTab === "users"}
							onClick={() => handleTabChange("users")}
							className="d-flex align-items-center gap-2"
						>
							<Person size={16} />
							People ({users.length})
						</Nav.Link>
					</Nav.Item>
					<Nav.Item>
						<Nav.Link
							active={activeTab === "comments"}
							onClick={() => handleTabChange("comments")}
							className="d-flex align-items-center gap-2"
						>
							<ChatDots size={16} />
							Comments ({comments.length})
						</Nav.Link>
					</Nav.Item>
				</Nav>
			)}

			{/* Posts Results */}
			{activeTab === "posts" && (
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
										navigator.share({
											title: "Check out this post",
											url: postUrl,
										}).catch(() => {
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
			{activeTab === "users" && (
				<div>
					{loading ? (
						<div className="text-center py-5">
							<Spinner animation="border" variant="primary" />
						</div>
					) : users.length === 0 ? (
						<div className="text-center text-muted py-5">
							<Person size={48} className="mb-3 opacity-50" />
							<h5>No users found</h5>
							<p>Try searching with different keywords</p>
						</div>
					) : (
						<div className="row g-3 px-3">
							{users.map((user) => (
								<div key={user.uid} className="col-12">
									<Card className="border-0 border-bottom rounded-0">
										<Card.Body className="px-3 py-3">
											<div className="d-flex align-items-center gap-3">
												<Image
													src={user.photoURL || "https://i.pravatar.cc/150?img=10"}
													alt="avatar"
													roundedCircle
													width="50"
													height="50"
													style={{ objectFit: "cover" }}
												/>
												<div className="flex-grow-1">
													<div className="d-flex align-items-center gap-2">
														<h6
															className="mb-0 fw-bold"
															style={{ cursor: "pointer" }}
															onClick={() => navigate(`/${user.username}`)}
														>
															{user.name}
														</h6>
														{user.hasBlueCheck && (
															<span className="text-primary">
																<CheckCircleFill size={16} />
															</span>
														)}
													</div>
													<p className="text-muted mb-0 small">@{user.username}</p>
													{user.bio && (
														<p className="mb-0 mt-1 small">{user.bio}</p>
													)}
												</div>
												<Button
													variant="outline-primary"
													size="sm"
													onClick={() => navigate(`/${user.username}`)}
												>
													View Profile
												</Button>
											</div>
										</Card.Body>
									</Card>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Comments Results */}
			{activeTab === "comments" && (
				<div>
					{loading ? (
						<div className="text-center py-5">
							<Spinner animation="border" variant="primary" />
						</div>
					) : comments.length === 0 ? (
						<div className="text-center text-muted py-5">
							<ChatDots size={48} className="mb-3 opacity-50" />
							<h5>No comments found</h5>
							<p>Try searching with different keywords</p>
						</div>
					) : (
						<div className="row g-3 px-3">
							{comments.map((comment) => (
								<div key={comment.id} className="col-12">
									<Card className="border-0 border-bottom rounded-0">
										<Card.Body className="px-3 py-3">
											<div className="d-flex gap-3">
												<Image
													src={comment.author.photoURL || "https://i.pravatar.cc/150?img=10"}
													alt="avatar"
													roundedCircle
													width="40"
													height="40"
													style={{ objectFit: "cover" }}
												/>
												<div className="flex-grow-1">
													<div className="d-flex align-items-center gap-2 mb-1">
														<span
															className="fw-bold"
															style={{ cursor: "pointer" }}
															onClick={() => navigate(`/${comment.author.username}`)}
														>
															{comment.author.name}
														</span>
														{comment.author.hasBlueCheck && (
															<CheckCircleFill className="text-primary" size={16} />
														)}
														<span className="text-muted">·</span>
														<span className="text-muted small">
															{formatTimeAgo(comment.createdAt)}
														</span>
													</div>
													<div className="mb-2">
														{parseTextContent(comment.content, {
															onHashtagClick: (hashtag) => navigate(`/search?q=%23${encodeURIComponent(hashtag)}`),
															onMentionClick: (username) => navigate(`/${username}`),
															onLinkClick: (url) => window.open(url, '_blank', 'noopener,noreferrer')
														})}
													</div>
													<Button
														variant="outline-primary"
														size="sm"
														onClick={() => navigate(`/post/${comment.postId}`)}
													>
														View Post
													</Button>
												</div>
											</div>
										</Card.Body>
									</Card>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{!searchQuery && (
				<div className="text-center py-5 text-muted">
					<Search size={48} className="mb-3" />
					<h5>Search DOPE Network</h5>
					<p>Find posts, people, and comments</p>
				</div>
			)}
		</Container>
	);
};

export default SearchPage;