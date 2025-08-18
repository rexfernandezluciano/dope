/** @format */

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLoaderData } from "react-router-dom";
import {
	Container,
	Card,
	Image,
	Button,
	Form,
	Alert,
	Spinner,
	Modal,
} from "react-bootstrap";
import {
	ArrowLeft,
	Heart,
	HeartFill,
	ChatDots,
	Share,
	CheckCircleFill,
	Globe,
	Lock,
	PersonFill,
	X,
	ThreeDots,
	ChevronLeft,
	ChevronRight,
	Trash
} from "react-bootstrap-icons";
import { postAPI, commentAPI } from "../config/ApiConfig";
import AlertDialog from "../components/dialogs/AlertDialog";
import {
	formatTimeAgo,
	deletePost as deletePostUtil,
	sharePost,
} from "../utils/common-utils";
import { parseTextContent } from "../utils/text-utils";

const PostDetailPage = () => {
	const { postId } = useParams();
	const loaderData = useLoaderData() || {};
	const { user: currentUser } = loaderData; // Renamed to avoid conflict with 'user' in post.author
	const navigate = useNavigate();
	const [post, setPost] = useState(null);
	const [comments, setComments] = useState([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [showImageViewer, setShowImageViewer] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [currentImages, setCurrentImages] = useState([]);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [postToDelete, setPostToDelete] = useState(null);
	const [showPostOptionsModal, setShowPostOptionsModal] = useState(false);
	const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);
	const [commentToDelete, setCommentToDelete] = useState(null);
	const [showCommentOptionsModal, setShowCommentOptionsModal] = useState(false);
	const [selectedComment, setSelectedComment] = useState(null);
	const [deletingPost, setDeletingPost] = useState(false);
	const [deletingComment, setDeletingComment] = useState(false);

	useEffect(() => {
		const loadPostAndComments = async () => {
			try {
				setLoading(true);
				const [postResponse, commentsResponse] = await Promise.all([
					postAPI.getPost(postId),
					commentAPI.getComments(postId),
				]);

				setPost(postResponse.post);
				setComments(commentsResponse.comments || []);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};
		loadPostAndComments();
	}, [postId]);

	const handleLikePost = async () => {
		try {
			await postAPI.likePost(postId);
			setPost((prev) => {
				if (!prev) return prev;
				const isLiked = (prev.likes || []).some(
					(like) => like.user.uid === currentUser.uid,
				);
				return {
					...prev,
					likes: isLiked
						? prev.likes.filter((like) => like.user.uid !== currentUser.uid)
						: [...(prev.likes || []), { user: { uid: currentUser.uid } }],
					stats: {
						...prev.stats,
						likes: isLiked
							? (prev.stats?.likes || 1) - 1
							: (prev.stats?.likes || 0) + 1,
					},
				};
			});
		} catch (err) {
			console.error("Error liking post:", err);
		}
	};

	// Replaced handleSharePost with the reusable sharePost utility
	const handleSharePost = async (postId) => {
		const postUrl = `${window.location.origin}/post/${postId}`;
		await sharePost(postUrl);
	};

	const handleHashtagClick = (hashtag) => {
		navigate(`/search?q=%23${encodeURIComponent(hashtag)}`);
	};

	const handleMentionClick = (username) => {
		navigate(`/${username}`);
	};

	const handleLinkClick = (url) => {
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	const handleDeleteComment = (commentId) => {
		setCommentToDelete(commentId);
		setShowDeleteCommentDialog(true);
	};

	const confirmDeleteComment = async () => {
		if (!commentToDelete) return;

		try {
			setDeletingComment(true);
			await commentAPI.deleteComment(commentToDelete);
			// Reload comments after deletion
			const commentsResponse = await commentAPI.getComments(postId);
			setComments(commentsResponse.comments || []);
		} catch (err) {
			console.error("Error deleting comment:", err);
			setError("Failed to delete comment");
		} finally {
			setDeletingComment(false);
			setShowDeleteCommentDialog(false);
			setCommentToDelete(null);
		}
	};

	const handleCommentOptions = (comment) => {
		setSelectedComment(comment);
		setShowCommentOptionsModal(true);
	};

	const handleCopyComment = () => {
		if (selectedComment) {
			navigator.clipboard.writeText(selectedComment.content);
			setShowCommentOptionsModal(false);
		}
	};

	const handleReportComment = () => {
		// Implement report functionality here
		console.log("Report comment:", selectedComment?.id);
		setShowCommentOptionsModal(false);
	};

	const handleDeleteCommentFromModal = () => {
		if (selectedComment) {
			setCommentToDelete(selectedComment.id);
			setShowDeleteCommentDialog(true);
			setShowCommentOptionsModal(false);
		}
	};

	const handleDeletePost = (postId) => {
		setPostToDelete(postId);
		setShowDeleteDialog(true);
	};

	// Replaced deleteFromCloudinary with the reusable deletePostUtil
	const confirmDeletePost = async () => {
		if (!postToDelete) return;

		try {
			setDeletingPost(true);
			// Delete associated images from Cloudinary first
			if (post && post.imageUrls && post.imageUrls.length > 0) {
				for (const imageUrl of post.imageUrls) {
					if (imageUrl.includes('cloudinary.com')) {
						await deletePostUtil(imageUrl);
					}
				}
			}

			// Then delete the post
			await postAPI.deletePost(postToDelete);
			navigate(-1); // Go back since post is deleted
		} catch (err) {
			console.error("Error deleting post:", err.message || err);
			// Optionally show user-friendly error message
		} finally {
			setDeletingPost(false);
			setShowDeleteDialog(false);
			setPostToDelete(null);
		}
	};

	const openImageViewer = (images, startIndex = 0) => {
		setCurrentImages(images);
		setCurrentImageIndex(startIndex);
		setShowImageViewer(true);
	};

	const closeImageViewer = () => {
		setShowImageViewer(false);
		setCurrentImages([]);
		setCurrentImageIndex(0);
	};

	const canComment = (post) => {
		if (!currentUser) return false;

		// Post owner can always comment
		if (post.author.uid === currentUser.uid) return true;

		// Check privacy settings
		switch (post.privacy) {
			case "public":
				return true;
			case "private":
				return post.author.uid === currentUser.uid;
			case "followers":
				// Check if current user follows the post author
				return post.author.isFollowedByCurrentUser || false;
			default:
				return true;
		}
	};

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

	const handleSubmitComment = async (e) => {
		e.preventDefault();
		if (!newComment.trim()) return;

		try {
			setSubmitting(true);
			await commentAPI.createComment(postId, newComment.trim());
			setNewComment("");
			// Reload to get updated comments
			const [postResponse, commentsResponse] = await Promise.all([
				postAPI.getPost(postId),
				commentAPI.getComments(postId),
			]);
			setPost(postResponse.post);
			setComments(commentsResponse.comments || []);
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	// formatTimeAgo is now imported from common-utils

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
			<div 
				className="d-flex align-items-center gap-3 p-3 border-bottom bg-white sticky-top d-none d-md-block"
				style={{ 
					top: '112px', /* Below navbar (56px) + tabs (56px) */
					zIndex: 1018 /* Below tabs but above content */
				}}
			>
				<Button
					variant="link"
					size="sm"
					className="text-dark p-0"
					onClick={() => navigate(-1)}
				>
					<ArrowLeft size={20} />
				</Button>
				<h5 className="mb-0">Post</h5>
			</div>
			{/* Mobile Header */}
			<div className="d-flex align-items-center gap-3 p-3 border-bottom bg-white sticky-top d-md-none">
				<Button
					variant="link"
					size="sm"
					className="text-dark p-0"
					onClick={() => navigate(-1)}
				>
					<ArrowLeft size={20} />
				</Button>
				<h5 className="mb-0">Post</h5>
			</div>

			{/* Post Card */}
			<Card className="border-0 border-bottom rounded-0">
				<Card.Body className="px-3 py-3">
					<div className="d-flex gap-2">
						<Image
							src={post.author.photoURL || "https://i.pravatar.cc/150?img=10"}
							alt="avatar"
							roundedCircle
							width="40"
							height="40"
							style={{ objectFit: "cover", minWidth: "40px", minHeight: "40px" }}
						/>
						<div className="flex-grow-1">
							<div className="d-flex align-items-center justify-content-between">
								<div className="d-flex align-items-center gap-1">
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
								<Button
									variant="link"
									className="text-muted p-1 border-0 rounded-circle d-flex align-items-center justify-content-center"
									style={{
										width: "32px",
										height: "32px",
										background: "none",
										border: "none !important",
										boxShadow: "none !important",
									}}
									onClick={() => setShowPostOptionsModal(true)}
								>
									<ThreeDots size={16} />
								</Button>
							</div>

							{post.content && (
								<div className="mb-2 mt-2 fs-5">
									{parseTextContent(post.content, {
										onHashtagClick: handleHashtagClick,
										onMentionClick: handleMentionClick,
										onLinkClick: handleLinkClick
									})}
								</div>
							)}


							{post.imageUrls && post.imageUrls.length > 0 && (
								<div className="mb-2">
									{post.imageUrls.length === 1 ? (
										// Single image - full width
										<Image
											src={post.imageUrls[0]}
											className="rounded w-100"
											style={{
												height: "300px",
												objectFit: "cover",
												cursor: "pointer",
											}}
											onClick={() => openImageViewer(post.imageUrls, 0)}
										/>
									) : (
										// Multiple images - box layout
										<div className="d-flex gap-2" style={{ height: "300px" }}>
											{/* Main image on the left */}
											<div style={{ flex: "2" }}>
												<Image
													src={post.imageUrls[0]}
													className="rounded w-100 h-100"
													style={{
														objectFit: "cover",
														cursor: "pointer",
													}}
													onClick={() => openImageViewer(post.imageUrls, 0)}
												/>
											</div>
											{/* Right side with stacked images */}
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
															style={{
																objectFit: "cover",
																cursor: "pointer",
															}}
															onClick={() => openImageViewer(post.imageUrls, 1)}
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
																style={{
																	objectFit: "cover",
																	cursor: "pointer",
																}}
																onClick={() =>
																	openImageViewer(post.imageUrls, 2)
																}
															/>
															{/* Show more indicator */}
															{post.imageUrls.length > 3 && (
																<div
																	className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded"
																	style={{
																		backgroundColor: "rgba(0, 0, 0, 0.7)",
																		cursor: "pointer",
																		color: "white",
																		fontWeight: "bold",
																		fontSize: "1.2rem",
																	}}
																	onClick={() =>
																		openImageViewer(post.imageUrls, 2)
																	}
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
								{post.likes.length > 0 &&
									(post.likes[0].user.uid === currentUser.uid ? (
										<div className="small text-muted">
											<span className="fw-bold">You</span>{" "}
											{post.likes.length > 1
												? "& " + (post.likes.length - 1) + " reacted."
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
									className={`p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn ${!canComment(post) ? "opacity-50" : "text-muted"}`}
									style={{
										transition: "all 0.2s",
										minWidth: "40px",
										height: "36px",
									}}
									disabled={!canComment(post)}
									title={
										!canComment(post)
											? "You cannot comment on this post"
											: "Comment"
									}
									onMouseEnter={(e) => {
										if (canComment(post)) {
											e.target.closest(".action-btn").style.backgroundColor =
												"rgba(29, 161, 242, 0.1)";
											e.target.closest(".action-btn").style.color = "#1da1f2";
										}
									}}
									onMouseLeave={(e) => {
										if (canComment(post)) {
											e.target.closest(".action-btn").style.backgroundColor =
												"transparent";
											e.target.closest(".action-btn").style.color = "#6c757d";
										}
									}}
								>
									<ChatDots size={24} style={{ flexShrink: 0 }} />
									{post.stats.comments > 0 && (
										<span className="small">{post.stats.comments}</span>
									)}
								</Button>

								<Button
									variant="link"
									size="sm"
									className="p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn"
									style={{
										color: (post.likes || []).some(
											(like) => like.user.uid === currentUser.uid,
										)
											? "#dc3545"
											: "#6c757d",
										transition: "all 0.2s",
										minWidth: "40px",
										height: "36px",
									}}
									onClick={handleLikePost}
									onMouseEnter={(e) => {
										if (
											!(post.likes || []).some(
												(like) => like.user.uid === currentUser.uid,
											)
										) {
											e.target.closest(".action-btn").style.backgroundColor =
												"rgba(220, 53, 69, 0.1)";
											e.target.closest(".action-btn").style.color = "#dc3545";
										}
									}}
									onMouseLeave={(e) => {
										if (
											!(post.likes || []).some(
												(like) => like.user.uid === currentUser.uid,
											)
										) {
											e.target.closest(".action-btn").style.backgroundColor =
												"transparent";
											e.target.closest(".action-btn").style.color = "#6c757d";
										}
									}}
								>
									{(post.likes || []).some(
										(like) => like.user.uid === currentUser.uid,
									) ? (
										<HeartFill size={24} style={{ flexShrink: 0 }} />
									) : (
										<Heart size={24} style={{ flexShrink: 0 }} />
									)}
									{post.stats.likes > 0 && (
										<span className="small">{post.stats.likes}</span>
									)}
								</Button>

								<Button
									variant="link"
									size="sm"
									className="text-muted p-2 border-0 rounded-circle action-btn"
									style={{
										transition: "all 0.2s",
										minWidth: "40px",
										height: "36px",
									}}
									onClick={() => handleSharePost(post.id)}
									onMouseEnter={(e) => {
										e.target.closest(".action-btn").style.backgroundColor =
											"rgba(23, 191, 99, 0.1)";
										e.target.closest(".action-btn").style.color = "#17bf63";
									}}
									onMouseLeave={(e) => {
										e.target.closest(".action-btn").style.backgroundColor =
											"transparent";
										e.target.closest(".action-btn").style.color = "#6c757d";
									}}
								>
									<Share size={24} style={{ flexShrink: 0 }} />
								</Button>
							</div>
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Comment Form */}
			{canComment(post) ? (
				<Card className="border-0 border-bottom rounded-0">
					<Card.Body className="px-3 py-3">
						<Form onSubmit={handleSubmitComment}>
							<div className="d-flex gap-3">
								<Image
									src={currentUser?.photoURL || "https://i.pravatar.cc/150?img=10"}
									alt="avatar"
									roundedCircle
									width="40"
									height="40"
									style={{ objectFit: "cover", minWidth: "40px", minHeight: "40px" }}
								/>
								<div className="flex-grow-1">
									<Form.Control
										as="textarea"
										rows={2}
										value={newComment}
										onChange={(e) => setNewComment(e.target.value)}
										placeholder="Post your reply"
										className="border-0 shadow-none resize-none"
										style={{ fontSize: "1.1rem" }}
									/>
									<div className="d-flex justify-content-end mt-2">
										<Button
											type="submit"
											size="sm"
											disabled={!newComment.trim() || submitting}
											className="rounded-pill px-3"
										>
											{submitting ? (
												<Spinner size="sm" animation="border" />
											) : (
												"Reply"
											)}
										</Button>
									</div>
								</div>
							</div>
						</Form>
					</Card.Body>
				</Card>
			) : (
				<Card className="border-0 border-bottom rounded-0">
					<Card.Body className="px-3 py-3 text-center text-muted">
						<div className="d-flex align-items-center justify-content-center gap-2">
							{getPrivacyIcon(post.privacy)}
							<span>
								{post.privacy === "private"
									? "Only the author can comment on this post"
									: post.privacy === "followers"
										? "Only followers can comment on this post"
										: "Comments are restricted"}
							</span>
						</div>
					</Card.Body>
				</Card>
			)}

			{/* Comments */}
			{comments.length === 0 ? (
				<div className="text-center py-5 text-muted">
					<p>No comments yet</p>
				</div>
			) : (
				<div className="comment-thread px-3 py-4">
					{comments.map((comment, index) => (
						<div 
							key={comment.id} 
							className={`comment-item ${index === comments.length - 1 ? "mb-0" : ""} d-flex gap-2 mb-3`}
						>
							<Image
								src={
									comment.author.photoURL ||
									"https://i.pravatar.cc/150?img=10"
								}
								alt="avatar"
								roundedCircle
								width="40"
								height="40"
								className="comment-avatar"
								style={{ objectFit: "cover", minWidth: "40px", minHeight: "40px" }}
							/>
							<div className="comment-content flex-grow-1">
								<div className="d-flex align-items-center justify-content-between mb-1">
									<div className="d-flex align-items-center gap-1">
										<span className="fw-bold">{comment.author.name}</span>
										{comment.author.hasBlueCheck && (
											<span className="text-primary">
												<CheckCircleFill className="text-primary" size={16} />
											</span>
										)}
										<span className="text-muted">·</span>
										<span className="text-muted small">
											{formatTimeAgo(comment.createdAt)}
										</span>
									</div>
									<Button
										variant="link"
										size="sm"
										className="text-muted p-1 border-0 rounded-circle d-flex align-items-center justify-content-center"
										style={{
											width: "24px",
											height: "24px",
											background: "none",
											border: "none !important",
											boxShadow: "none !important",
										}}
										onClick={() => handleCommentOptions(comment)}
										title="Comment options"
									>
										<ThreeDots size={14} />
									</Button>
								</div>

								<div className="mb-2">
												{parseTextContent(comment.content, {
													onHashtagClick: handleHashtagClick,
													onMentionClick: handleMentionClick,
													onLinkClick: handleLinkClick
												})}
											</div>
							</div>
						</div>
					))}
				</div>
			)}
			{/* Image Viewer Modal */}
			{showImageViewer && (
				<Modal
					show={showImageViewer}
					onHide={closeImageViewer}
					centered
					size="lg"
					className="image-viewer-modal"
				>
					<Modal.Body className="p-0 bg-dark text-center">
						<div className="position-relative">
							<Button
								variant="link"
								className="position-absolute top-0 end-0 m-2 text-white"
								style={{ zIndex: 10 }}
								onClick={closeImageViewer}
							>
								<X size={24} />
							</Button>

							{currentImages.length > 1 && (
								<>
									<Button
										variant="link"
										className="position-absolute top-50 start-0 translate-middle-y text-white ms-2"
										style={{ zIndex: 10 }}
										disabled={currentImageIndex === 0}
										onClick={() =>
											setCurrentImageIndex((prev) => Math.max(0, prev - 1))
										}
									>
										<ChevronLeft size={32} />
									</Button>

									<Button
										variant="link"
										className="position-absolute top-50 end-0 translate-middle-y text-white me-2"
										style={{ zIndex: 10 }}
										disabled={currentImageIndex === currentImages.length - 1}
										onClick={() =>
											setCurrentImageIndex((prev) =>
												Math.min(currentImages.length - 1, prev + 1),
											)
										}
									>
										<ChevronRight size={32} />
									</Button>
								</>
							)}

							<Image
								src={currentImages[currentImageIndex]}
								className="w-100"
								style={{
									maxHeight: "80vh",
									objectFit: "contain",
								}}
							/>

							{currentImages.length > 1 && (
								<div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 text-white">
									{currentImageIndex + 1} / {currentImages.length}
								</div>
							)}
						</div>
					</Modal.Body>
				</Modal>
			)}

			{/* Post Options Modal */}
			<Modal
				show={showPostOptionsModal}
				onHide={() => setShowPostOptionsModal(false)}
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title>Post Options</Modal.Title>
				</Modal.Header>
				<Modal.Body className="p-0">
					<div className="list-group list-group-flush">
						<button
							className="list-group-item list-group-item-action border-0"
							onClick={() => {
								navigator.clipboard.writeText(
									`${window.location.origin}/post/${post.id}`,
								);
								setShowPostOptionsModal(false);
							}}
						>
							Copy Link
						</button>
						<button
							className="list-group-item list-group-item-action border-0"
							onClick={() => setShowPostOptionsModal(false)}
						>
							Repost
						</button>
						{post.author.id !== currentUser.uid && (
							<button
								className="list-group-item list-group-item-action border-0 text-danger"
								onClick={() => setShowPostOptionsModal(false)}
							>
								Report
							</button>
						)}
						{post.author.uid === currentUser.uid && (
							<button
								className="list-group-item list-group-item-action border-0 text-danger"
								onClick={() => {
									setShowPostOptionsModal(false);
									handleDeletePost(post.id);
								}}
							>
								Delete Post
							</button>
						)}
					</div>
				</Modal.Body>
			</Modal>

			{/* Delete Post Confirmation Dialog */}
			<AlertDialog
				show={showDeleteDialog}
				onHide={() => {
					if (!deletingPost) {
						setShowDeleteDialog(false);
						setPostToDelete(null);
					}
				}}
				title="Delete Post"
				message="Are you sure you want to delete this post? This action cannot be undone."
				dialogButtonMessage={deletingPost ? "Deleting..." : "Delete"}
				onDialogButtonClick={confirmDeletePost}
				type="danger"
				disabled={deletingPost}
			/>

			{/* Comment Options Modal */}
			<Modal
				show={showCommentOptionsModal}
				onHide={() => {
					setShowCommentOptionsModal(false);
					setSelectedComment(null);
				}}
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title>Comment Options</Modal.Title>
				</Modal.Header>
				<Modal.Body className="p-0 pb-2">
					<div className="list-group list-group-flush">
						<button
							className="list-group-item list-group-item-action border-0"
							onClick={handleCopyComment}
						>
							Copy Comment
						</button>
						{selectedComment?.author.uid !== currentUser.uid && (
							<button
								className="list-group-item list-group-item-action border-0 text-warning"
								onClick={handleReportComment}
							>
								Report Comment
							</button>
						)}
						{selectedComment?.author.uid === currentUser.uid && (
							<button
								className="list-group-item list-group-item-action border-0 text-danger"
								onClick={handleDeleteCommentFromModal}
							>
								Delete Comment
							</button>
						)}
					</div>
				</Modal.Body>
			</Modal>

			{/* Delete Comment Confirmation Dialog */}
			<AlertDialog
				show={showDeleteCommentDialog}
				onHide={() => {
					if (!deletingComment) {
						setShowDeleteDialog(false);
						setCommentToDelete(null);
					}
				}}
				title="Delete Comment"
				message="Are you sure you want to delete this comment? This action cannot be undone."
				dialogButtonMessage={deletingComment ? "Deleting..." : "Delete"}
				onDialogButtonClick={confirmDeleteComment}
				type="danger"
				disabled={deletingComment}
			/>
		</Container>
	);
};

export default PostDetailPage;