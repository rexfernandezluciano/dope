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
	Globe,
	Lock,
	PersonFill,
} from "react-bootstrap-icons";

import { postAPI, userAPI } from "../config/ApiConfig";
import PostCard from "../components/PostCard";

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

	const canComment = (post) => {
		if (!currentUser) return false;
		
		// Post owner can always comment
		if (post.author.uid === currentUser.uid) return true;
		
		// Check privacy settings
		switch (post.privacy) {
			case 'public':
				return true;
			case 'private':
				return post.author.uid === currentUser.uid;
			case 'followers':
				// Check if current user follows the post author
				return post.author.isFollowedByCurrentUser || false;
			default:
				return true;
		}
	};

	const getPrivacyIcon = (privacy) => {
		switch (privacy) {
			case 'public':
				return <Globe size={14} className="text-muted" />;
			case 'private':
				return <Lock size={14} className="text-muted" />;
			case 'followers':
				return <PersonFill size={14} className="text-muted" />;
			default:
				return <Globe size={14} className="text-muted" />;
		}
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