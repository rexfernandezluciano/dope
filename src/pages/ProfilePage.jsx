/** @format */

import { useState, useEffect } from "react";
import { useParams, useLoaderData, useNavigate } from "react-router-dom";
import {
	Container,
	Image,
	Card,
	Nav,
	Tab,
	Button,
	Modal,
	Form,
	Spinner,
	Alert,
} from "react-bootstrap";
import {
	Calendar,
	CheckCircleFill,
	Camera,
} from "react-bootstrap-icons";

import { userAPI, postAPI, blockAPI } from "../config/ApiConfig";
import {
	deletePost as deletePostUtil,
	sharePost,
	handlePostClick,
	handlePostOption,
	formatJoinDate,
} from "../utils/common-utils";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import { 
	discoverActor, 
	formatActivityPubHandle,
	parseActivityPubNote 
} from "../utils/activitypub-utils";
import PostCard from "../components/PostCard";
import AlertDialog from "../components/dialogs/AlertDialog";
import UserBlockModal from "../components/UserBlockModal";

const ProfilePage = () => {
	const { username: rawUsername, handle } = useParams();
	// Handle both /:username and /@:handle routes
	const username = handle || rawUsername;
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
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [postToDelete, setPostToDelete] = useState(null);
	const [deletingPost, setDeletingPost] = useState(false);
	const [editForm, setEditForm] = useState({
		name: "",
		bio: "",
		photoURL: "",
	});
	const [showPostOptionsModal, setShowPostOptionsModal] = useState(false);
	const [selectedPostForOptions, setSelectedPostForOptions] = useState(null);
	const [profileImagePreview, setProfileImagePreview] = useState("");
	const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
	const [isFederatedProfile, setIsFederatedProfile] = useState(false);
	const [federatedActor, setFederatedActor] = useState(null);
	const [showBlockModal, setShowBlockModal] = useState(false);
	const [isBlocked, setIsBlocked] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		const loadProfile = async () => {
			try {
				setLoading(true);
				setError("");

				// Check if this is a federated profile (contains @)
				const isFederated = username.includes('@');
				setIsFederatedProfile(isFederated);

				if (isFederated) {
					// Handle federated profile
					await loadFederatedProfile(username);
				} else {
					// Load local user profile
					const userResponse = await userAPI.getUser(username);
					if (!userResponse) {
						throw new Error("User not found");
					}
					await loadLocalProfile(userResponse);
				}
			} catch (err) {
				console.error("Error loading profile:", err);
				setError(err.message || "Failed to load profile");
			} finally {
				setLoading(false);
			}
		};

		const loadFederatedProfile = async (handle) => {
			try {
				// Discover the ActivityPub actor
				const webfingerResult = await discoverActor(handle);
				
				// Find the ActivityPub actor link
				const actorLink = webfingerResult.links?.find(
					link => link.rel === 'self' && link.type === 'application/activity+json'
				);
				
				if (!actorLink) {
					throw new Error("ActivityPub profile not found");
				}

				// Get the actor profile
				const actorUrl = actorLink.href;
				const actorResponse = await fetch(actorUrl, {
					headers: {
						'Accept': 'application/activity+json'
					}
				});

				if (!actorResponse.ok) {
					throw new Error("Failed to fetch ActivityPub profile");
				}

				const actor = await actorResponse.json();
				setFederatedActor(actor);

				// Convert ActivityPub actor to local profile format
				const federatedProfile = {
					uid: actor.id,
					username: actor.preferredUsername,
					name: actor.name || actor.preferredUsername,
					bio: actor.summary || '',
					photoURL: actor.icon?.url || actor.image?.url,
					createdAt: actor.published || new Date().toISOString(),
					privacy: { profile: 'public' }, // Federated profiles are public
					isFollowedByCurrentUser: false, // TODO: Check if following
					hasBlueCheck: false, // Federated users don't have blue checks
					membership: { subscription: 'free' }
				};

				setProfileUser(federatedProfile);

				// Load federated posts if outbox is available
				if (actor.outbox) {
					await loadFederatedPosts(actor.outbox);
				}

				// Federated profiles can't be edited and don't have local followers/following
				setFollowers([]);
				setFollowing([]);
				setIsFollowing(false);

			} catch (err) {
				console.error("Error loading federated profile:", err);
				throw new Error(`Failed to load federated profile: ${err.message}`);
			}
		};

		const loadFederatedPosts = async (outboxUrl) => {
			try {
				const outboxResponse = await fetch(outboxUrl, {
					headers: {
						'Accept': 'application/activity+json'
					}
				});

				if (!outboxResponse.ok) {
					console.warn("Failed to fetch outbox");
					setPosts([]);
					return;
				}

				const outbox = await outboxResponse.json();
				
				// If it's a collection, get the first page
				let items = [];
				if (outbox.type === 'OrderedCollection' && outbox.first) {
					const firstPageResponse = await fetch(outbox.first, {
						headers: {
							'Accept': 'application/activity+json'
						}
					});
					
					if (firstPageResponse.ok) {
						const firstPage = await firstPageResponse.json();
						items = firstPage.orderedItems || [];
					}
				} else if (outbox.orderedItems) {
					items = outbox.orderedItems;
				}

				// Convert ActivityPub activities to local post format
				const federatedPosts = items
					.filter(item => item.type === 'Create' && item.object?.type === 'Note')
					.map(activity => {
						const note = activity.object;
						const parsedNote = parseActivityPubNote(note);
						
						return {
							id: note.id,
							content: parsedNote.content,
							createdAt: parsedNote.published,
							author: federatedActor ? {
								uid: federatedActor.id,
								username: federatedActor.preferredUsername,
								name: federatedActor.name || federatedActor.preferredUsername,
								photoURL: federatedActor.icon?.url || federatedActor.image?.url
							} : null,
							imageUrls: parsedNote.attachments
								.filter(att => att.type === 'Document' && att.mediaType?.startsWith('image/'))
								.map(att => att.url),
							likes: [],
							comments: [],
							shares: [],
							stats: {
								likes: 0,
								comments: 0,
								shares: 0
							},
							privacy: 'public',
							tags: parsedNote.hashtags,
							mentions: parsedNote.mentions,
							isFederated: true,
							originalUrl: note.id
						};
					});

				setPosts(federatedPosts);
			} catch (err) {
				console.error("Error loading federated posts:", err);
				setPosts([]);
			}
		};

		const loadLocalProfile = async (userResponse) => {
			try {

				// Handle response structure - the API returns user data directly
				const profileUserData = userResponse.user;
				const profilePrivacy = profileUserData.privacy?.profile || "public";

				// Check if current user can view this profile
				const canViewProfile = () => {
					// Profile owner can always view their own profile
					if (profileUserData.uid === currentUser.uid) return true;

					// Public profiles are visible to everyone
					if (profilePrivacy === "public") return true;

					// Private profiles are only visible to the owner
					if (profilePrivacy === "private") return false;

					// Followers-only profiles are visible to followers
					if (profilePrivacy === "followers") {
						return profileUserData.isFollowedByCurrentUser || false;
					}

					return false;
				};

				if (!canViewProfile()) {
					throw new Error("This profile is private");
				}

				setProfileUser(profileUserData);

				// Check if user is blocked
				setIsBlocked(profileUserData.isBlocked || false);

				// Set edit form data
				setEditForm({
					name: userResponse.user.name || "",
					bio: userResponse.user.bio || "",
					photoURL: userResponse.user.photoURL || "",
				});

				// Set posts from user response if available
				if (userResponse.user.posts) {
					// Filter posts based on profile privacy
					const filteredPosts = userResponse.user.posts.filter((post) => {
						// Profile owner can see all their posts
						if (post.author.uid === currentUser.uid) return true;

						// For other users, respect the profile privacy settings
						const authorPrivacy = post.author.privacy?.profile || "public";

						if (authorPrivacy === "public") return true;
						if (authorPrivacy === "private") return false;
						if (authorPrivacy === "followers") {
							return post.author.isFollowedByCurrentUser || false;
						}

						return false;
					});

					setPosts(filteredPosts);
				} else {
					// Fallback to separate posts API call
					try {
						const postsResponse = await postAPI.getPosts({ author: username });

						// Filter posts based on profile privacy
						const filteredPosts = (postsResponse.posts || []).filter((post) => {
							// Profile owner can see all their posts
							if (post.author.uid === currentUser.uid) return true;

							// For other users, respect the profile privacy settings
							const authorPrivacy = post.author.privacy?.profile || "public";

							if (authorPrivacy === "public") return true;
							if (authorPrivacy === "private") return false;
							if (authorPrivacy === "followers") {
								return post.author.isFollowedByCurrentUser || false;
							}

							return false;
						});

						setPosts(filteredPosts);
					} catch (err) {
						console.error("Error loading posts:", err);
						setPosts([]);
					}
				}

				// Load followers and following data
				try {
					const followersResponse = await userAPI.getFollowers(username);
					setFollowers(followersResponse.followers || []);

					// Check if current user is following this profile from user data or followers list
					if (currentUser) {
						const isFollowingFromUserData =
							profileUserData.isFollowedByCurrentUser;
						const isFollowingFromFollowers = (
							followersResponse.followers || []
						).some((f) => f.uid === currentUser.uid);

						// Prefer the user data value if available, otherwise check followers list
						setIsFollowing(
							isFollowingFromUserData !== undefined
								? isFollowingFromUserData
								: isFollowingFromFollowers,
						);
					}
				} catch (err) {
					console.error("Error loading followers:", err);
					setFollowers([]);
				}

				try {
					const followingResponse = await userAPI.getFollowing(username);
					setFollowing(followingResponse.following || []);
				} catch (err) {
					console.error("Error loading following:", err);
					setFollowing([]);
				}
			} catch (err) {
				console.error("Error loading local profile:", err);
				throw err;
			}
		};

		if (username && currentUser) {
			loadProfile();
		}
	}, [username, currentUser]);

	// Update page meta data when profile user changes
	useEffect(() => {
		if (profileUser) {
			updatePageMeta({
				title: `${profileUser.name} (@${profileUser.username}) - DOPE Network`,
				description: `View ${profileUser.name}'s profile on DOPE Network. ${profileUser.bio || 'See their posts, followers, and more.'}`,
				keywords: `${profileUser.username}, ${profileUser.name}, profile, DOPE Network, social media`
			});
		}
	}, [profileUser]);

	const handleFollow = async () => {
		try {
			const response = await userAPI.followUser(username);

			// Update following state based on API response
			setIsFollowing(response.following);

			// Update followers list based on the action
			if (response.following) {
				// User just followed - add current user to followers
				setFollowers((prev) => [...prev, currentUser]);
			} else {
				// User just unfollowed - remove current user from followers
				setFollowers((prev) => prev.filter((f) => f.uid !== currentUser.uid));
			}

			// Update profile user's isFollowedByCurrentUser status
			setProfileUser((prev) => ({
				...prev,
				isFollowedByCurrentUser: response.following,
			}));
		} catch (err) {
			setError(err.message);
		}
	};

	const handleLikePost = async (postId) => {
		// Don't allow liking federated posts
		if (isFederatedProfile) {
			console.warn("Cannot like federated posts");
			return;
		}

		try {
			await postAPI.likePost(postId);
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
									? (post.stats?.likes || 1) - 1
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

	const uploadProfileImageToCloudinary = async (file) => {
		// Handle HEIC files
		let finalFile = file;
		if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
			try {
				const heic2any = (await import("heic2any")).default;
				const blob = await heic2any({ blob: file, toType: "image/jpeg" });
				finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
			} catch (err) {
				console.error("Error converting HEIC:", err);
				throw new Error("Failed to convert HEIC image");
			}
		}

		// Validate file size (5MB limit)
		if (finalFile.size > 5 * 1024 * 1024) {
			throw new Error("Image size must be less than 5MB");
		}

		const formData = new FormData();
		formData.append("file", finalFile);
		formData.append("upload_preset", "dope-network");
		formData.append("folder", "profile_pictures");

		try {
			console.log("Uploading image to Cloudinary...", finalFile.name);
			const response = await fetch(
				"https://api.cloudinary.com/v1_1/zxpic/image/upload",
				{
					method: "POST",
					body: formData,
				},
			);

			if (!response.ok) {
				throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			console.log("Cloudinary upload successful:", data.secure_url);

			if (!data.secure_url) {
				throw new Error("No secure URL returned from Cloudinary");
			}

			return data.secure_url;
		} catch (error) {
			console.error("Error uploading to Cloudinary:", error);
			throw new Error(`Failed to upload image: ${error.message}`);
		}
	};

	const handleUpdateProfile = async () => {
		try {
			setUploadingProfileImage(true);
			let updateData = { ...editForm };

			// Upload profile image if a new file was selected
			if (editForm.profileImageFile) {
				try {
					const uploadedUrl = await uploadProfileImageToCloudinary(editForm.profileImageFile);
					updateData.photoURL = uploadedUrl;
					// Remove the file from update data
					delete updateData.profileImageFile;
				} catch (uploadError) {
					setError(`Image upload failed: ${uploadError.message}`);
					setUploadingProfileImage(false);
					return;
				}
			}

			await userAPI.updateUser(username, updateData);
			setProfileUser((prev) => ({ ...prev, ...updateData }));
			setShowEditModal(false);
			setProfileImagePreview("");
		} catch (err) {
			setError(err.message);
		} finally {
			setUploadingProfileImage(false);
		}
	};

	const handleProfileImageUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				setProfileImagePreview(e.target.result);
			};
			reader.readAsDataURL(file);

			// Store file for later upload
			setEditForm((prev) => ({ ...prev, profileImageFile: file }));
		}
	};

	

	const handleDeletePost = (postId) => {
		setPostToDelete(postId);
		setShowDeleteDialog(true);
	};

	const confirmDeletePost = async () => {
		if (!postToDelete) return;

		setDeletingPost(true); // Set deleting post state
		try {
			await deletePostUtil(postToDelete); // Use the utility function
			setPosts((prev) => prev.filter((post) => post.id !== postToDelete));
			setShowDeleteDialog(false);
			setPostToDelete(null);
		} catch (err) {
			console.error("Error deleting post:", err);
			setError("Failed to delete post.");
			setShowDeleteDialog(false);
			setPostToDelete(null);
		} finally {
			setDeletingPost(false); // Reset deleting post state
		}
	};

	const handleShare = async (postId) => {
		sharePost(postId); // Use the utility function
	};

	const handleOptionsClick = (post) => {
		setSelectedPostForOptions(post);
		setShowPostOptionsModal(true);
	};

	const closePostOptionsModal = () => {
		setShowPostOptionsModal(false);
		setSelectedPostForOptions(null);
	};

	const handleBlockUser = async (userId, action) => {
		try {
			if (action === 'blocked') {
				setIsBlocked(true);
				// Optionally clear posts from blocked user
				setPosts([]);
			} else if (action === 'restricted') {
				// Handle restriction if needed
				console.log('User restricted');
			}
		} catch (err) {
			console.error('Error handling block action:', err);
			setError('Failed to block user');
		}
	};

	const handleUnblockUser = async () => {
		try {
			await blockAPI.unblockUser(profileUser.uid);
			setIsBlocked(false);
			// Reload profile data
			window.location.reload();
		} catch (err) {
			console.error('Error unblocking user:', err);
			setError('Failed to unblock user');
		}
	};

	const handleOptionAction = (action, postId) => {
		handlePostOption(action, postId, {
			copyLink: () =>
				navigator.clipboard.writeText(
					`${window.location.origin}/post/${postId}`,
				),
			delete: () => handleDeletePost(postId),
			// Add other actions as needed
		});
		closePostOptionsModal();
	};

	if (loading || !currentUser) {
		return (
			<Container className="text-center py-5">
				<Spinner animation="border" variant="primary" />
			</Container>
		);
	}

	if (error || !profileUser) {
		return (
			<Container className="px-3 py-3">
				<Alert variant="danger">{error || "User not found"}</Alert>
			</Container>
		);
	}

	const isOwnProfile = !isFederatedProfile && currentUser.username === username;

	return (
		<Container className="py-0 px-0">
			{/* Cover & Profile Photo */}
			<div className="position-relative mb-4">
				<div
					style={{
						height: "200px",
						background: "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
					}}
					className="w-100 bg-primary"
				/>
				<div
					className="position-absolute"
					style={{ bottom: "-50px", left: "20px" }}
				>
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
			<div className="px-3 pt-4">
				<div className="d-flex justify-content-between align-items-start mb-3">
					<div>
						<div className="d-flex align-items-center gap-2">
							<h3 className="mb-0">{profileUser.name}</h3>
							{profileUser.hasBlueCheck && (
								<span
									className="text-primary fs-5"
									style={{ fontSize: "1.2rem" }}
								>
									<CheckCircleFill className="text-primary" size={16} />
								</span>
							)}
							{(profileUser.membership?.subscription ||
								profileUser.subscription) &&
								(profileUser.membership?.subscription ||
									profileUser.subscription) !== "free" && (
									<span
										className={`badge ${
											(profileUser.membership?.subscription ||
												profileUser.subscription) === "premium"
												? "bg-warning text-dark"
												: (profileUser.membership?.subscription ||
															profileUser.subscription) === "pro"
													? "bg-primary"
													: "bg-secondary"
										}`}
										style={{ fontSize: "0.7rem" }}
									>
										{(
											profileUser.membership?.subscription ||
											profileUser.subscription
										).toUpperCase()}
									</span>
								)}
						</div>
						<p className="text-muted mb-0">
							{isFederatedProfile ? formatActivityPubHandle(username) : `@${profileUser.username}`}
						</p>
					</div>

					{isOwnProfile ? (
						<Button
							variant="outline-primary"
							size="sm"
							onClick={() => setShowEditModal(true)}
						>
							Edit Profile
						</Button>
					) : isFederatedProfile ? (
						<div className="d-flex gap-2">
							<span className="badge bg-info">Federated User</span>
							{federatedActor?.url && (
								<Button
									variant="outline-primary"
									size="sm"
									onClick={() => window.open(federatedActor.url, '_blank')}
								>
									View Original
								</Button>
							)}
						</div>
					) : (
						<div className="d-flex gap-2">
							{isBlocked ? (
								<Button
									variant="outline-success"
									size="sm"
									onClick={handleUnblockUser}
								>
									Unblock
								</Button>
							) : (
								<>
									<Button
										variant={isFollowing ? "outline-primary" : "primary"}
										size="sm"
										onClick={handleFollow}
									>
										{isFollowing ? "Following" : "Follow"}
									</Button>
									<Button
										variant="outline-danger"
										size="sm"
										onClick={() => setShowBlockModal(true)}
									>
										Block
									</Button>
								</>
							)}
						</div>
					)}
				</div>

				{profileUser.bio && <p className="mb-2">{profileUser.bio}</p>}

				<div className="d-flex flex-wrap gap-3 text-muted small mb-3">
					<div className="d-flex align-items-center gap-1">
						<Calendar size={14} />
						Joined {formatJoinDate(profileUser.createdAt)}
					</div>
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
				<Nav variant="tabs" className="border-bottom mx-0">
					<Nav.Item className="flex-fill">
						<Nav.Link eventKey="posts" className="text-center py-3">
							<div className="fw-bold">{posts.length}</div>
							<div className="ms-1 small text-muted">Posts</div>
						</Nav.Link>
					</Nav.Item>
					<Nav.Item className="flex-fill">
						<Nav.Link eventKey="followers" className="text-center py-3">
							<div className="fw-bold">{followers.length}</div>
							<div className="ms-1 small text-muted">Followers</div>
						</Nav.Link>
					</Nav.Item>
					<Nav.Item className="flex-fill">
						<Nav.Link eventKey="following" className="text-center py-3">
							<div className="fw-bold">{following.length}</div>
							<div className="ms-1 small text-muted">Following</div>
						</Nav.Link>
					</Nav.Item>
				</Nav>

				<Tab.Content>
					<Tab.Pane eventKey="posts" className="px-0">
						{isBlocked ? (
							<div className="text-center py-5 text-muted">
								<p>You have blocked this user</p>
								<Button 
									variant="outline-success" 
									size="sm" 
									onClick={handleUnblockUser}
								>
									Unblock to see posts
								</Button>
							</div>
						) : posts.length === 0 ? (
							<div className="text-center py-5 text-muted">
								<p>No posts yet</p>
							</div>
						) : (
							posts.map((post) => (
								<PostCard
									key={post.id}
									post={post}
									currentUser={currentUser}
									onLike={post.isFederated ? null : handleLikePost}
									onShare={post.isFederated ? null : () => handleShare(post.id)}
									onDeletePost={post.isFederated ? null : () => handleDeletePost(post.id)}
									onPostClick={post.isFederated ? null : (e) => handlePostClick(post.id, e)}
									onOpenOptions={post.isFederated ? null : handleOptionsClick}
									disabled={post.isFederated}
								/>
							))
						)}
					</Tab.Pane>

					<Tab.Pane eventKey="followers" className="px-0">
						{followers.length === 0 ? (
							<div className="text-center py-5 text-muted">
								<p>No followers yet</p>
							</div>
						) : (
							followers.map((follower) => (
								<Card
									key={follower.uid}
									className="border-0 border-bottom rounded-0"
								>
									<Card.Body className="px-3 py-3">
										<div className="d-flex align-items-center gap-3">
											<Image
												src={
													follower.photoURL ||
													"https://i.pravatar.cc/150?img=10"
												}
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
													<p className="small text-muted mb-0">
														{follower.bio}
													</p>
												)}
											</div>
										</div>
									</Card.Body>
								</Card>
							))
						)}
					</Tab.Pane>

					<Tab.Pane eventKey="following" className="px-0">
						{following.length === 0 ? (
							<div className="text-center py-5 text-muted">
								<p>Not following anyone yet</p>
							</div>
						) : (
							following.map((followedUser) => (
								<Card
									key={followedUser.uid}
									className="border-0 border-bottom rounded-0"
									onClick={() => navigate(`/${followedUser.username}`)}
								>
									<Card.Body className="px-3 py-3">
										<div className="d-flex align-items-center gap-3">
											<Image
												src={
													followedUser.photoURL ||
													"https://i.pravatar.cc/150?img=10"
												}
												alt="avatar"
												roundedCircle
												width="50"
												height="50"
											/>
											<div className="flex-grow-1">
												<div className="d-flex align-items-center gap-1">
													<span className="fw-bold">{followedUser.name}</span>
													{followedUser.hasBlueCheck && (
														<span className="text-primary">
															<CheckCircleFill
																className="text-primary"
																size={16}
															/>
														</span>
													)}
												</div>
												<p className="text-muted mb-0">
													@{followedUser.username}
												</p>
												{followedUser.bio && (
													<p className="small text-muted mb-0">
														{followedUser.bio}
													</p>
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
				<Modal
					show={showEditModal}
					fullscreen="md-down"
					onHide={() => setShowEditModal(false)}
					centered
				>
					<Modal.Header closeButton>
						<Modal.Title>Edit Profile</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<Form>
							<Form.Group className="mb-3">
								<Form.Label>Profile Picture</Form.Label>
								<div className="d-flex flex-column align-items-center gap-3">
									<div className="position-relative">
										<Image
											src={
												profileImagePreview ||
												editForm.photoURL ||
												"https://i.pravatar.cc/150?img=10"
											}
											alt="Profile Preview"
											roundedCircle
											width={120}
											height={120}
											style={{ objectFit: "cover", cursor: "pointer" }}
											onClick={() =>
												document.getElementById("profile-image-upload").click()
											}
										/>
										<Button
											variant="primary"
											size="sm"
											className="position-absolute bottom-0 end-0 rounded-circle p-2"
											style={{ width: "35px", height: "35px" }}
											onClick={() =>
												document.getElementById("profile-image-upload").click()
											}
										>
											<Camera size={16} />
										</Button>
									</div>
									<Button
										variant="outline-primary"
										onClick={() =>
											document.getElementById("profile-image-upload").click()
										}
									>
										Choose Photo
									</Button>
								</div>
								<input
									id="profile-image-upload"
									type="file"
									accept="image/*,.heic"
									onChange={handleProfileImageUpload}
									style={{ display: "none" }}
								/>
								<Form.Text className="text-muted d-block text-center mt-2">
									Click on the avatar or button to upload a new profile picture
								</Form.Text>
							</Form.Group>
							<Form.Group className="mb-3">
								<Form.Label>Name</Form.Label>
								<Form.Control
									type="text"
									value={editForm.name}
									onChange={(e) =>
										setEditForm((prev) => ({ ...prev, name: e.target.value }))
									}
									placeholder="Your name"
									className="form-control-no-shadow"
								/>
							</Form.Group>
							<Form.Group className="mb-3">
								<Form.Label>Bio</Form.Label>
								<Form.Control
									as="textarea"
									rows={3}
									value={editForm.bio}
									onChange={(e) =>
										setEditForm((prev) => ({ ...prev, bio: e.target.value }))
									}
									placeholder="Tell us about yourself"
									className="form-control-no-shadow"
								/>
							</Form.Group>
						</Form>
					</Modal.Body>
					<Modal.Footer>
						<Button
							variant="secondary"
							onClick={() => {
								setShowEditModal(false);
								setProfileImagePreview("");
							}}
							disabled={uploadingProfileImage}
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleUpdateProfile}
							disabled={uploadingProfileImage}
						>
							{uploadingProfileImage ? "Uploading..." : "Save Changes"}
						</Button>
					</Modal.Footer>
				</Modal>
			)}

			

			{/* Post Options Modal */}
			{showPostOptionsModal && selectedPostForOptions && (
				<Modal
					show={showPostOptionsModal}
					onHide={closePostOptionsModal}
					centered
				>
					<Modal.Header closeButton>
						<Modal.Title className="fs-4">Post Options</Modal.Title>
					</Modal.Header>
					<Modal.Body className="p-0">
						<div className="list-group list-group-flush px-0">
							<button
								className="list-group-item list-group-item-action d-flex px-3 p-2"
								onClick={() =>
									handleOptionAction("copyLink", selectedPostForOptions.id)
								}
							>
								<span>Copy Link</span>
							</button>
							<button
								className="list-group-item list-group-item-action d-flex px-3 p-2"
								onClick={() =>
									handleOptionAction("repost", selectedPostForOptions.id)
								}
							>
								<span>Repost</span>
							</button>
							{selectedPostForOptions.author.uid !== currentUser.uid && (
								<button
									className="list-group-item list-group-item-action text-danger d-flex px-3 p-2"
									onClick={() =>
										handleOptionAction("report", selectedPostForOptions.id)
									}
								>
									<span>Report Post</span>
								</button>
							)}
							{selectedPostForOptions.author.uid === currentUser.uid && (
								<button
									className="list-group-item list-group-item-action text-danger d-flex px-3"
									onClick={() =>
										handleOptionAction("delete", selectedPostForOptions.id)
									}
									disabled={deletingPost} // Disable button when deleting
								>
									{deletingPost ? (
										<>
											<Spinner
												as="span"
												animation="border"
												size="sm"
												role="status"
												aria-hidden="true"
												className="me-2"
											/>
											Deleting...
										</>
									) : (
										<span>Delete Post</span>
									)}
								</button>
							)}
						</div>
					</Modal.Body>
				</Modal>
			)}

			{/* Delete Post Confirmation Dialog */}
			<AlertDialog
				show={showDeleteDialog}
				onHide={() => {
					setShowDeleteDialog(false);
					setPostToDelete(null);
				}}
				title="Delete Post"
				message="Are you sure you want to delete this post? This action cannot be undone."
				dialogButtonMessage={deletingPost ? "Deleting..." : "Delete"}
				onDialogButtonClick={confirmDeletePost}
				type="danger"
				disabled={deletingPost} // Disable dialog button when deleting
			/>

			{/* User Block Modal */}
			<UserBlockModal
				show={showBlockModal}
				onHide={() => setShowBlockModal(false)}
				user={profileUser}
				onBlockUser={handleBlockUser}
			/>
		</Container>
	);
};

export default ProfilePage;