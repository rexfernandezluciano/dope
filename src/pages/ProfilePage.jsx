/** @format */

import { useState, useEffect } from "react";
import { useParams, useLoaderData } from "react-router-dom";
import { Container, Image, Button, Card, Nav, Tab, Row, Col, Spinner, Alert, Modal, Form } from "react-bootstrap";
import { Calendar, LocationOn, Link as LinkIcon, Heart, HeartFill, ChatDots, Share, Camera, People } from "react-bootstrap-icons";

import { userAPI, postAPI } from "../config/ApiConfig";

const ProfilePage = () => {
	const { username } = useParams();
	const loaderData = useLoaderData() || {};
	const { user: currentUser } = loaderData;
	const [profileUser, setProfileUser] = useState(null);
	const [posts, setPosts] = useState([]);
	const [followers, setFollowers] = useState([]);
	const [following, setFollowing] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [isFollowing, setIsFollowing] = useState(false);
	const [activeTab, setActiveTab] = useState("posts");
	const [showEditModal, setShowEditModal] = useState(false);
	const [editForm, setEditForm] = useState({
		name: "",
		bio: "",
		photoURL: ""
	});

	useEffect(() => {
		loadProfile();
	}, [username]);

	const loadProfile = async () => {
		try {
			setLoading(true);
			const [userResponse, postsResponse, followersResponse, followingResponse] = await Promise.all([
				userAPI.getUser(username),
				postAPI.getPosts({ author: username }),
				userAPI.getFollowers(username),
				userAPI.getFollowing(username)
			]);

			setProfileUser(userResponse.user);
			setPosts(postsResponse.posts);
			setFollowers(followersResponse.followers);
			setFollowing(followingResponse.following);

			// Check if current user is following this profile
			setIsFollowing(followersResponse.followers.some(f => f.uid === currentUser.uid));

			// Set edit form data
			setEditForm({
				name: userResponse.user.name || "",
				bio: userResponse.user.bio || "",
				photoURL: userResponse.user.photoURL || ""
			});
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleFollow = async () => {
		try {
			await userAPI.followUser(username);
			setIsFollowing(!isFollowing);

			// Update followers count
			if (isFollowing) {
				setFollowers(prev => prev.filter(f => f.uid !== currentUser.uid));
			} else {
				setFollowers(prev => [...prev, currentUser]);
			}
		} catch (err) {
			setError(err.message);
		}
	};

	const handleLikePost = async (postId) => {
		try {
			await postAPI.likePost(postId);
			setPosts(prev => prev.map(post => {
				if (post.id === postId) {
					const isLiked = post.likes.some(like => like.userId === currentUser.uid);
					return {
						...post,
						likes: isLiked
							? post.likes.filter(like => like.userId !== currentUser.uid)
							: [...post.likes, { userId: currentUser.uid }],
						_count: {
							...post._count,
							likes: isLiked ? post._count.likes - 1 : post._count.likes + 1
						}
					};
				}
				return post;
			}));
		} catch (err) {
			console.error('Error liking post:', err);
		}
	};

	const handleUpdateProfile = async () => {
		try {
			await userAPI.updateUser(username, editForm);
			setProfileUser(prev => ({ ...prev, ...editForm }));
			setShowEditModal(false);
		} catch (err) {
			setError(err.message);
		}
	};

	const formatTimeAgo = (dateString) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now - date;
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'now';
		if (diffMins < 60) return `${diffMins}m`;
		if (diffHours < 24) return `${diffHours}h`;
		return `${diffDays}d`;
	};

	const formatJoinDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long'
		});
	};

	if (loading || !currentUser) {
		return (
			<Container className="text-center py-5">
				<Spinner animation="border" />
			</Container>
		);
	}

	if (error || !profileUser) {
		return (
			<Container className="py-3">
				<Alert variant="danger">{error || "User not found"}</Alert>
			</Container>
		);
	}

	const isOwnProfile = currentUser.username === username;

	return (
		<Container className="px-0 px-md-3">
			{/* Cover & Profile Photo */}
			<div className="position-relative">
				<div
					style={{ height: "200px", background: "linear-gradient(45deg, #667eea 0%, #764ba2 100%)" }}
					className="w-100 bg-primary"
				/>
				<div className="position-absolute" style={{ bottom: "-50px", left: "20px" }}>
					<Image
						src={profileUser.photoURL || "https://i.pravatar.cc/150?img=10"}
						alt="Profile"
						roundedCircle
						width="100"
						height="100"
						className="border border-4 border-white"
						style={{ objectFit: "cover" }}
					/>
				</div>
			</div>

			{/* Profile Info */}
			<div className="px-3 pt-5">
				<div className="d-flex justify-content-between align-items-start mb-3">
					<div>
						<div className="d-flex align-items-center gap-1">
							<h3 className="mb-0">{profileUser.name}</h3>
							{profileUser.hasBlueCheck && (
								<span className="text-primary fs-5">✓</span>
							)}
						</div>
						<p className="text-muted mb-0">@{profileUser.username}</p>
					</div>

					{isOwnProfile ? (
						<Button
							variant="outline-primary"
							size="sm"
							onClick={() => setShowEditModal(true)}>
							Edit Profile
						</Button>
					) : (
						<Button
							variant={isFollowing ? "outline-primary" : "primary"}
							size="sm"
							onClick={handleFollow}>
							{isFollowing ? "Unfollow" : "Follow"}
						</Button>
					)}
				</div>

				{profileUser.bio && (
					<p className="mb-2">{profileUser.bio}</p>
				)}

				<div className="d-flex flex-wrap gap-3 text-muted small mb-3">
					<div className="d-flex align-items-center gap-1">
						<Calendar size={14} />
						Joined {formatJoinDate(profileUser.createdAt)}
					</div>
					{profileUser.subscription !== 'free' && (
						<div className="d-flex align-items-center gap-1">
							<span className="badge bg-primary">{profileUser.subscription}</span>
						</div>
					)}
					{/* Email Verification Status */}
					{!profileUser.hasVerifiedEmail && (
						<div className="d-flex align-items-center gap-1 text-danger">
							<Alert variant="danger" className="p-1 mb-0 fs-6">Email not verified</Alert>
						</div>
					)}
				</div>

				<div className="d-flex gap-4 mb-3">
					<span>
						<strong>{following.length}</strong>
						<span className="text-muted"> Following</span>
					</span>
					<span>
						<strong>{followers.length}</strong>
						<span className="text-muted"> Followers</span>
					</span>
				</div>
			</div>

			{/* Tabs */}
			<Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
				<Nav variant="tabs" className="border-bottom">
					<Nav.Item>
						<Nav.Link eventKey="posts" className="text-center">
							Posts
							<div className="small text-muted">{posts.length}</div>
						</Nav.Link>
					</Nav.Item>
					<Nav.Item>
						<Nav.Link eventKey="followers" className="text-center">
							Followers
							<div className="small text-muted">{followers.length}</div>
						</Nav.Link>
					</Nav.Item>
					<Nav.Item>
						<Nav.Link eventKey="following" className="text-center">
							Following
							<div className="small text-muted">{following.length}</div>
						</Nav.Link>
					</Nav.Item>
				</Nav>

				<Tab.Content>
					<Tab.Pane eventKey="posts">
						{posts.length === 0 ? (
							<div className="text-center py-5 text-muted">
								<p>No posts yet</p>
							</div>
						) : (
							posts.map((post) => (
								<Card key={post.id} className="border-0 border-bottom rounded-0">
									<Card.Body className="px-3">
										<div className="d-flex gap-2">
											<Image
												src={post.author.photoURL || "https://i.pravatar.cc/150?img=10"}
												alt="avatar"
												roundedCircle
												width="40"
												height="40"
											/>
											<div className="flex-grow-1">
												<div className="d-flex align-items-center gap-1">
													<span className="fw-bold">{post.author.name}</span>
													{post.author.hasBlueCheck && (
														<span className="text-primary">✓</span>
													)}
													<span className="text-muted">@{post.author.username}</span>
													<span className="text-muted">·</span>
													<span className="text-muted small">{formatTimeAgo(post.createdAt)}</span>
												</div>

												{post.content && (
													<p className="mb-2">{post.content}</p>
												)}

												{post.imageUrls && post.imageUrls.length > 0 && (
													<div className="mb-2">
														{post.imageUrls.map((url, idx) => (
															<Image
																key={idx}
																src={url}
																className="rounded mb-2 w-100"
																style={{ maxHeight: "400px", objectFit: "cover" }}
															/>
														))}
													</div>
												)}

												<div className="d-flex justify-content-between text-muted mt-2">
													<Button
														variant="link"
														size="sm"
														className="text-muted p-0 border-0 d-flex align-items-center gap-1">
														<ChatDots size={16} />
														<span className="small">{post._count.comments}</span>
													</Button>

													<Button
														variant="link"
														size="sm"
														className={`p-0 border-0 d-flex align-items-center gap-1 ${
															post.likes.some(like => like.userId === currentUser.uid)
																? 'text-danger'
																: 'text-muted'
														}`}
														onClick={() => handleLikePost(post.id)}>
														{post.likes.some(like => like.userId === currentUser.uid) ? (
															<HeartFill size={16} />
														) : (
															<Heart size={16} />
														)}
														<span className="small">{post._count.likes}</span>
													</Button>

													<Button
														variant="link"
														size="sm"
														className="text-muted p-0 border-0">
														<Share size={16} />
													</Button>
												</div>
											</div>
										</div>
									</Card.Body>
								</Card>
							))
						)}
					</Tab.Pane>

					<Tab.Pane eventKey="followers">
						{followers.length === 0 ? (
							<div className="text-center py-5 text-muted">
								<p>No followers yet</p>
							</div>
						) : (
							followers.map((follower) => (
								<Card key={follower.uid} className="border-0 border-bottom rounded-0">
									<Card.Body className="px-3">
										<div className="d-flex align-items-center gap-3">
											<Image
												src={follower.photoURL || "https://i.pravatar.cc/150?img=10"}
												alt="avatar"
												roundedCircle
												width="50"
												height="50"
											/>
											<div className="flex-grow-1">
												<div className="d-flex align-items-center gap-1">
													<span className="fw-bold">{follower.name}</span>
													{follower.hasBlueCheck && (
														<span className="text-primary">✓</span>
													)}
												</div>
												<p className="text-muted mb-0">@{follower.username}</p>
												{follower.bio && (
													<p className="small text-muted mb-0">{follower.bio}</p>
												)}
											</div>
										</div>
									</Card.Body>
								</Card>
							))
						)}
					</Tab.Pane>

					<Tab.Pane eventKey="following">
						{following.length === 0 ? (
							<div className="text-center py-5 text-muted">
								<p>Not following anyone yet</p>
							</div>
						) : (
							following.map((followedUser) => (
								<Card key={followedUser.uid} className="border-0 border-bottom rounded-0">
									<Card.Body className="px-3">
										<div className="d-flex align-items-center gap-3">
											<Image
												src={followedUser.photoURL || "https://i.pravatar.cc/150?img=10"}
												alt="avatar"
												roundedCircle
												width="50"
												height="50"
											/>
											<div className="flex-grow-1">
												<div className="d-flex align-items-center gap-1">
													<span className="fw-bold">{followedUser.name}</span>
													{followedUser.hasBlueCheck && (
														<span className="text-primary">✓</span>
													)}
												</div>
												<p className="text-muted mb-0">@{followedUser.username}</p>
												{followedUser.bio && (
													<p className="small text-muted mb-0">{followedUser.bio}</p>
												)}
											</div>
										</div>
									</Card.Body>
								</Card>
							))
						)}
					</Tab.Pane>
				</Tab.Content>
			</Tab.Container>

			{/* Edit Profile Modal */}
			{showEditModal && (
				<Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
					<Modal.Header closeButton>
						<Modal.Title>Edit Profile</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<Form>
							<Form.Group className="mb-3">
								<Form.Label>Profile Picture URL</Form.Label>
								<Form.Control
									type="url"
									value={editForm.photoURL}
									onChange={(e) => setEditForm(prev => ({ ...prev, photoURL: e.target.value }))}
									placeholder="https://example.com/photo.jpg"
								/>
							</Form.Group>
							<Form.Group className="mb-3">
								<Form.Label>Name</Form.Label>
								<Form.Control
									type="text"
									value={editForm.name}
									onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
									placeholder="Your name"
								/>
							</Form.Group>
							<Form.Group className="mb-3">
								<Form.Label>Bio</Form.Label>
								<Form.Control
									as="textarea"
									rows={3}
									value={editForm.bio}
									onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
									placeholder="Tell us about yourself"
								/>
							</Form.Group>
						</Form>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => setShowEditModal(false)}>
							Cancel
						</Button>
						<Button variant="primary" onClick={handleUpdateProfile}>
							Save Changes
						</Button>
					</Modal.Footer>
				</Modal>
			)}
		</Container>
	);
};

export default ProfilePage;