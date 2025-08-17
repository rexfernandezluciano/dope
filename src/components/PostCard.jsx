/** @format */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Card,
	Image,
	Button,
	Modal,
} from "react-bootstrap";
import {
	Heart,
	HeartFill,
	ChatDots,
	Share,
	X,
	ThreeDots,
	CheckCircleFill,
	Globe,
	Lock,
	PersonFill,
	ChevronLeft,
	ChevronRight,
} from "react-bootstrap-icons";

import { postAPI } from "../config/ApiConfig";
import {
	formatTimeAgo,
	deletePost as deletePostUtil,
	sharePost,
	handlePostClick as handlePostClickUtil,
} from "../utils/common-utils";

// Giphy imports temporarily removed due to module issues
// import { GifIcon } from '@giphy/js-fetch-api';
// import { Gif } from '@giphy/react-components';

const PostCard = ({
	post,
	currentUser,
	onLike,
	onShare,
	onDeletePost,
	showComments = false,
	comments = [],
	onPostClick,
}) => {
	const navigate = useNavigate();
	const [showImageViewer, setShowImageViewer] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [currentImages, setCurrentImages] = useState([]);
	const [showPostOptionsModal, setShowPostOptionsModal] = useState(false);

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

	const handlePostClick = (e) => {
		handlePostClickUtil(post.id, e, onPostClick, navigate);
	};

	const handleLike = (e) => {
		e.stopPropagation();
		if (onLike) {
			onLike(post.id);
		}
	};

	const handleShare = (e) => {
		e.stopPropagation();
		sharePost(post.id); // Use the utility function
		if (onShare) {
			onShare(post.id);
		}
	};

	const handleComment = (e) => {
		e.stopPropagation();
		if (canComment(post)) {
			navigate(`/post/${post.id}`);
		}
	};

	const handleDeletePost = async (postId) => {
		await deletePostUtil(postId, postAPI.deletePost); // Use the utility function
		onDeletePost?.(postId);
	};

	const openPostOptionsModal = (e) => {
		e.stopPropagation();
		setShowPostOptionsModal(true);
	};

	const closePostOptionsModal = () => {
		setShowPostOptionsModal(false);
	};

	return (
		<>
			<Card
				className="border-0 border-bottom rounded-0 mb-0 post-card"
				style={{ cursor: "pointer" }}
				onClick={handlePostClick}
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
							style={{ objectFit: "cover", minWidth: "40px", minHeight: "40px" }}
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
									onClick={openPostOptionsModal}
								>
									<ThreeDots size={16} />
								</Button>
							</div>

							{post.content && <p className="mb-2">{post.content}</p>}

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
											onClick={(e) => {
												e.stopPropagation();
												openImageViewer(post.imageUrls, 0);
											}}
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
													onClick={(e) => {
														e.stopPropagation();
														openImageViewer(post.imageUrls, 0);
													}}
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
															onClick={(e) => {
																e.stopPropagation();
																openImageViewer(post.imageUrls, 1);
															}}
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
																onClick={(e) => {
																	e.stopPropagation();
																	openImageViewer(post.imageUrls, 2);
																}}
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
																	onClick={(e) => {
																		e.stopPropagation();
																		openImageViewer(post.imageUrls, 2);
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

							{post.postType === "live_video" && post.liveVideoUrl && (
								<div className="mb-2">
									<p className="text-danger fw-bold">
										Live Video: {post.liveVideoUrl}
									</p>
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
									className={`p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn ${!canComment(post) ? 'opacity-50' : 'text-muted'}`}
									style={{
										transition: "all 0.2s",
										minWidth: "40px",
										height: "36px",
									}}
									onClick={handleComment}
									disabled={!canComment(post)}
									title={!canComment(post) ? "You cannot comment on this post" : "Comment"}
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
									<ChatDots size={20} style={{ flexShrink: 0 }} />
									{post.stats?.comments > 0 && (
										<span className="small">{post.stats?.comments}</span>
									)}
								</Button>

								<Button
									variant="link"
									size="sm"
									className="p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn"
									style={{
										color: post.likes.some(
											(like) => like.user.uid === currentUser.uid,
										)
											? "#dc3545"
											: "#6c757d",
										transition: "all 0.2s",
										minWidth: "40px",
										height: "36px",
									}}
									onClick={handleLike}
									onMouseEnter={(e) => {
										if (
											!post.likes.some(
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
											!post.likes.some(
												(like) => like.user.uid === currentUser.uid,
											)
										) {
											e.target.closest(".action-btn").style.backgroundColor =
												"transparent";
											e.target.closest(".action-btn").style.color = "#6c757d";
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
									{post.stats?.likes > 0 && (
										<span className="small">{post.stats?.likes}</span>
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
									onClick={handleShare}
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
									<Share size={20} style={{ flexShrink: 0 }} />
								</Button>
							</div>

							{/* Random Comments Display */}
							{showComments && comments && comments.length > 0 && (
								<div className="mt-3 pt-2 border-top comment-thread">
									{comments.map((comment, index) => (
										<div key={comment.id} className={`comment-item ${index === comments.length - 1 ? 'mb-0' : 'mb-2'}`}>
											<Image
												src={comment.author.photoURL || "https://i.pravatar.cc/150?img=10"}
												alt="avatar"
												roundedCircle
												width="32"
												height="32"
												className="comment-avatar"
												style={{ objectFit: "cover", minWidth: "32px", minHeight: "32px" }}
											/>
											<div className="comment-content">
												<div className="d-flex align-items-center gap-1">
													<span
														className="fw-bold small"
														style={{ cursor: "pointer", color: "inherit" }}
														onClick={(e) => {
															e.stopPropagation();
															navigate(`/${comment.author.username}`);
														}}
													>
														{comment.author.name}
													</span>
													{comment.author.hasBlueCheck && (
														<CheckCircleFill className="text-primary" size={12} />
													)}
													<span className="text-muted small">·</span>
													<span className="text-muted small">
														{formatTimeAgo(comment.createdAt)}
													</span>
												</div>
												<p className="mb-0 small">{comment.content}</p>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</Card.Body>
			</Card>

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
				onHide={closePostOptionsModal}
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title>Post Options</Modal.Title>
				</Modal.Header>
				<Modal.Body className="px-0 pt-0 pb-2">
					<div className="list-group list-group-flush">
						<button
							className="list-group-item list-group-item-action border-0"
							onClick={() => {
								navigator.clipboard.writeText(
									`${window.location.origin}/post/${post.id}`,
								);
								closePostOptionsModal();
							}}
						>
							Copy Link
						</button>
						<button
							className="list-group-item list-group-item-action border-0"
							onClick={closePostOptionsModal}
						>
							Repost
						</button>
						{post.author.uid !== currentUser.uid && (
							<button
								className="list-group-item list-group-item-action border-0 text-danger"
								onClick={closePostOptionsModal}
							>
								Report
							</button>
						)}
						{post.author.uid === currentUser.uid && (
							<button
								className="list-group-item list-group-item-action border-0 text-danger"
								onClick={() => handleDeletePost(post.id)}
							>
								Delete Post
							</button>
						)}
					</div>
				</Modal.Body>
			</Modal>
		</>
	);
};

export default PostCard;