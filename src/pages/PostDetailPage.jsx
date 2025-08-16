/** @format */

import { useState, useEffect } from "react";
import { useParams, useLoaderData, useNavigate } from "react-router-dom";
import {
	Container,
	Image,
	Button,
	Card,
	Form,
	Spinner,
	Alert,
	OverlayTrigger,
	Tooltip,
	Dropdown,
	Modal
} from "react-bootstrap";
import {
	Heart,
	HeartFill,
	ChatDots,
	Share,
	ArrowLeft,
	ThreeDots,
	ChevronLeft,
	ChevronRight,
	X
} from "react-bootstrap-icons";

import { postAPI, commentAPI } from "../config/ApiConfig";
import AlertDialog from "../components/dialogs/AlertDialog";

const PostDetailPage = () => {
	const { postId } = useParams();
	const loaderData = useLoaderData() || {};
	const { user } = loaderData;
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

	useEffect(() => {
		loadPostAndComments();
	}, [postId]);

	const loadPostAndComments = async () => {
		try {
			setLoading(true);
			const [postResponse, commentsResponse] = await Promise.all([
				postAPI.getPost(postId),
				commentAPI.getComments(postId)
			]);

			setPost(postResponse);
			setComments(commentsResponse.comments || []);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleLikePost = async () => {
		try {
			await postAPI.likePost(postId);
			setPost(prev => {
				if (!prev) return prev;
				const isLiked = (prev.likes || []).some(like => like.userId === user.uid);
				return {
					...prev,
					likes: isLiked
						? prev.likes.filter(like => like.userId !== user.uid)
						: [...(prev.likes || []), { userId: user.uid }],
					_count: {
						...prev._count,
						likes: isLiked ? (prev._count?.likes || 1) - 1 : (prev._count?.likes || 0) + 1
					}
				};
			});
		} catch (err) {
			console.error('Error liking post:', err);
		}
	};

	const handleSharePost = async (postId) => {
		const postUrl = `${window.location.origin}/post/${postId}`;
		
		if (navigator.share) {
			try {
				await navigator.share({
					title: 'Check out this post',
					url: postUrl
				});
			} catch (err) {
				navigator.clipboard.writeText(postUrl);
			}
		} else {
			try {
				await navigator.clipboard.writeText(postUrl);
			} catch (err) {
				console.error('Failed to copy to clipboard:', err);
			}
		}
	};

	const handleDeletePost = (postId) => {
		setPostToDelete(postId);
		setShowDeleteDialog(true);
	};

	const confirmDeletePost = async () => {
		if (!postToDelete) return;

		try {
			await postAPI.deletePost(postToDelete);
			navigate(-1); // Go back since post is deleted
		} catch (err) {
			console.error('Error deleting post:', err);
			setError('Failed to delete post.');
		} finally {
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

	const handleSubmitComment = async (e) => {
		e.preventDefault();
		if (!newComment.trim()) return;

		try {
			setSubmitting(true);
			await commentAPI.createComment(postId, newComment.trim());
			setNewComment("");
			loadPostAndComments(); // Reload to get updated comments
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
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

	if (loading) {
		return (
			<Container className="text-center py-5">
				<Spinner animation="border" />
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
					onClick={() => navigate(-1)}>
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
										<span className="text-primary">✓</span>
									)}
									<span className="text-muted">·</span>
									<span className="text-muted small">{formatTimeAgo(post.createdAt)}</span>
								</div>
								<Dropdown align="end">
									<OverlayTrigger
										placement="bottom"
										overlay={<Tooltip>More options</Tooltip>}
									>
										<Dropdown.Toggle 
											variant="link" 
											className="text-muted p-1 border-0 rounded-circle d-flex align-items-center justify-content-center"
											style={{
												width: '32px',
												height: '32px',
												background: 'none',
												border: 'none !important',
												boxShadow: 'none !important'
											}}
										>
											<ThreeDots size={16} />
										</Dropdown.Toggle>
									</OverlayTrigger>
									<Dropdown.Menu>
										<Dropdown.Item onClick={() => navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)}>
											Copy Link
										</Dropdown.Item>
										<Dropdown.Item>
											Repost
										</Dropdown.Item>
										{post.author.id !== user.uid && (
											<Dropdown.Item className="text-danger">
												Report
											</Dropdown.Item>
										)}
										{post.author.id === user.uid && (
											<Dropdown.Item 
												className="text-danger"
												onClick={() => handleDeletePost(post.id)}>
												Delete Post
											</Dropdown.Item>
										)}
									</Dropdown.Menu>
								</Dropdown>
							</div>

							{post.content && (
								<p className="mb-2 mt-2 fs-5">{post.content}</p>
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
												cursor: "pointer"
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
														cursor: "pointer"
													}}
													onClick={() => openImageViewer(post.imageUrls, 0)}
												/>
											</div>
											{/* Right side with stacked images */}
											{post.imageUrls.length > 1 && (
												<div className="d-flex flex-column gap-2" style={{ flex: "1" }}>
													<div style={{ height: post.imageUrls.length > 2 ? "calc(50% - 4px)" : "100%" }}>
														<Image
															src={post.imageUrls[1]}
															className="rounded w-100 h-100"
															style={{
																objectFit: "cover",
																cursor: "pointer"
															}}
															onClick={() => openImageViewer(post.imageUrls, 1)}
														/>
													</div>
													{post.imageUrls.length > 2 && (
														<div style={{ height: "calc(50% - 4px)" }} className="position-relative">
															<Image
																src={post.imageUrls[2]}
																className="rounded w-100 h-100"
																style={{
																	objectFit: "cover",
																	cursor: "pointer"
																}}
																onClick={() => openImageViewer(post.imageUrls, 2)}
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
																		fontSize: "1.2rem"
																	}}
																	onClick={() => openImageViewer(post.imageUrls, 2)}
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

							<div className="d-flex justify-content-around text-muted mt-3 pt-2 border-top" style={{ maxWidth: '400px' }}>
								<OverlayTrigger
									placement="bottom"
									overlay={<Tooltip>Reply</Tooltip>}
								>
									<Button
										variant="link"
										size="sm"
										className="text-muted p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn"
										style={{ 
											transition: 'all 0.2s',
											minWidth: '40px',
											height: '36px'
										}}
										onMouseEnter={(e) => {
											e.target.closest('.action-btn').style.backgroundColor = 'rgba(29, 161, 242, 0.1)';
											e.target.closest('.action-btn').style.color = '#1da1f2';
										}}
										onMouseLeave={(e) => {
											e.target.closest('.action-btn').style.backgroundColor = 'transparent';
											e.target.closest('.action-btn').style.color = '#6c757d';
										}}
									>
										<ChatDots size={24} style={{ flexShrink: 0 }} />
										{post._count.comments > 0 && (
											<span className="small">{post._count.comments}</span>
										)}
									</Button>
								</OverlayTrigger>

								<OverlayTrigger
									placement="bottom"
									overlay={<Tooltip>{(post.likes || []).some(like => like.userId === user.uid) ? 'Unlike' : 'Like'}</Tooltip>}
								>
									<Button
										variant="link"
										size="sm"
										className="p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn"
										style={{
											color: (post.likes || []).some(like => like.userId === user.uid) ? '#dc3545' : '#6c757d',
											transition: 'all 0.2s',
											minWidth: '40px',
											height: '36px'
										}}
										onClick={handleLikePost}
										onMouseEnter={(e) => {
											if (!(post.likes || []).some(like => like.userId === user.uid)) {
												e.target.closest('.action-btn').style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
												e.target.closest('.action-btn').style.color = '#dc3545';
											}
										}}
										onMouseLeave={(e) => {
											if (!(post.likes || []).some(like => like.userId === user.uid)) {
												e.target.closest('.action-btn').style.backgroundColor = 'transparent';
												e.target.closest('.action-btn').style.color = '#6c757d';
											}
										}}
									>
										{(post.likes || []).some(like => like.userId === user.uid) ? (
											<HeartFill size={24} style={{ flexShrink: 0 }} />
										) : (
											<Heart size={24} style={{ flexShrink: 0 }} />
										)}
										{post._count.likes > 0 && (
											<span className="small">{post._count.likes}</span>
										)}
									</Button>
								</OverlayTrigger>

								<OverlayTrigger
									placement="bottom"
									overlay={<Tooltip>Share</Tooltip>}
								>
									<Button
										variant="link"
										size="sm"
										className="text-muted p-2 border-0 rounded-circle action-btn"
										style={{ 
											transition: 'all 0.2s',
											minWidth: '40px',
											height: '36px'
										}}
										onClick={() => handleSharePost(post.id)}
										onMouseEnter={(e) => {
											e.target.closest('.action-btn').style.backgroundColor = 'rgba(23, 191, 99, 0.1)';
											e.target.closest('.action-btn').style.color = '#17bf63';
										}}
										onMouseLeave={(e) => {
											e.target.closest('.action-btn').style.backgroundColor = 'transparent';
											e.target.closest('.action-btn').style.color = '#6c757d';
										}}
									>
										<Share size={24} style={{ flexShrink: 0 }} />
									</Button>
								</OverlayTrigger>
							</div>
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Comment Form */}
			<Card className="border-0 border-bottom rounded-0">
				<Card.Body className="px-3 py-3">
					<Form onSubmit={handleSubmitComment}>
						<div className="d-flex gap-3">
							<Image
								src={user?.photoURL || "https://i.pravatar.cc/150?img=10"}
								alt="avatar"
								roundedCircle
								width="40"
								height="40"
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
										className="rounded-pill px-3">
										{submitting ? <Spinner size="sm" animation="border" /> : "Reply"}
									</Button>
								</div>
							</div>
						</div>
					</Form>
				</Card.Body>
			</Card>

			{/* Comments */}
			{comments.length === 0 ? (
				<div className="text-center py-5 text-muted">
					<p>No comments yet</p>
				</div>
			) : (
				comments.map((comment) => (
					<Card key={comment.id} className="border-0 border-bottom rounded-0">
						<Card.Body className="px-3 py-3">
							<div className="d-flex gap-3">
								<Image
									src={comment.author.photoURL || "https://i.pravatar.cc/150?img=10"}
									alt="avatar"
									roundedCircle
									width="40"
									height="40"
								/>
								<div className="flex-grow-1">
									<div className="d-flex align-items-center gap-1">
										<span className="fw-bold">{comment.author.name}</span>
										{comment.author.hasBlueCheck && (
											<span className="text-primary">✓</span>
										)}
										<span className="text-muted">@{comment.author.username}</span>
										<span className="text-muted">·</span>
										<span className="text-muted small">{formatTimeAgo(comment.createdAt)}</span>
									</div>

									<p className="mb-2 mt-1">{comment.content}</p>

									<div className="d-flex gap-4 text-muted">
										<OverlayTrigger placement="bottom" overlay={<Tooltip>Reply</Tooltip>}>
											<Button
												variant="link"
												size="sm"
												className="text-muted p-1 border-0 d-flex align-items-center gap-1 rounded-circle"
												style={{ width: '28px', height: '28px' }}
											>
												<ChatDots size={14} />
											</Button>
										</OverlayTrigger>

										<OverlayTrigger placement="bottom" overlay={<Tooltip>Like</Tooltip>}>
											<Button
												variant="link"
												size="sm"
												className="text-muted p-1 border-0 d-flex align-items-center gap-1 rounded-circle"
												style={{ width: '28px', height: '28px' }}
											>
												<Heart size={14} />
											</Button>
										</OverlayTrigger>
									</div>
								</div>
							</div>
						</Card.Body>
					</Card>
				))
			)}
		{/* Image Viewer Modal */}
			{showImageViewer && (
				<Modal
					show={showImageViewer}
					onHide={closeImageViewer}
					centered
					size="lg"
					className="image-viewer-modal">
					<Modal.Body className="p-0 bg-dark text-center">
						<div className="position-relative">
							<Button
								variant="link"
								className="position-absolute top-0 end-0 m-2 text-white"
								style={{ zIndex: 10 }}
								onClick={closeImageViewer}>
								<X size={24} />
							</Button>

							{currentImages.length > 1 && (
								<>
									<Button
										variant="link"
										className="position-absolute top-50 start-0 translate-middle-y text-white ms-2"
										style={{ zIndex: 10 }}
										disabled={currentImageIndex === 0}
										onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}>
										<ChevronLeft size={32} />
									</Button>

									<Button
										variant="link"
										className="position-absolute top-50 end-0 translate-middle-y text-white me-2"
										style={{ zIndex: 10 }}
										disabled={currentImageIndex === currentImages.length - 1}
										onClick={() => setCurrentImageIndex(prev => Math.min(currentImages.length - 1, prev + 1))}>
										<ChevronRight size={32} />
									</Button>
								</>
							)}

							<Image
								src={currentImages[currentImageIndex]}
								className="w-100"
								style={{
									maxHeight: "80vh",
									objectFit: "contain"
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

			{/* Delete Post Confirmation Dialog */}
			<AlertDialog
				show={showDeleteDialog}
				onHide={() => {
					setShowDeleteDialog(false);
					setPostToDelete(null);
				}}
				title="Delete Post"
				message="Are you sure you want to delete this post? This action cannot be undone."
				dialogButtonMessage="Delete"
				onDialogButtonClick={confirmDeletePost}
				type="danger"
			/>
		</Container>
	);
};

export default PostDetailPage;