
/** @format */

import React, { useState, useEffect } from "react";
import { Modal, Button, Image, Dropdown } from "react-bootstrap";
import {
	ChevronLeft,
	ChevronRight,
	ThreeDots,
	ArrowLeft,
	Heart,
	HeartFill,
	ChatDots,
	Share,
	CheckCircleFill,
	Globe,
	Lock,
	PersonFill,
} from "react-bootstrap-icons";
import { formatTimeAgo } from "../utils/common-utils";
import { parseTextContent } from "../utils/text-utils";

const ImageViewer = ({
	show,
	onHide,
	images = [],
	initialIndex = 0,
	post = null,
	currentUser = null,
	onLike = null,
	onComment = null,
	onShare = null,
	onPostOptions = null,
	onHashtagClick = null,
	onMentionClick = null,
	onLinkClick = null,
	onNavigateToProfile = null,
}) => {
	const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);
	const [showOverlay, setShowOverlay] = useState(true);

	useEffect(() => {
		setCurrentImageIndex(initialIndex);
	}, [initialIndex]);

	useEffect(() => {
		if (show) {
			// Hide overlay after 3 seconds, show again on user interaction
			const timer = setTimeout(() => setShowOverlay(false), 3000);
			return () => clearTimeout(timer);
		}
	}, [show, currentImageIndex]);

	const handlePrevious = () => {
		setCurrentImageIndex((prev) => Math.max(0, prev - 1));
		setShowOverlay(true);
	};

	const handleNext = () => {
		setCurrentImageIndex((prev) => Math.min(images.length - 1, prev + 1));
		setShowOverlay(true);
	};

	const handleImageClick = () => {
		setShowOverlay((prev) => !prev);
	};

	

	useEffect(() => {
		const handleKeyDownEvent = (e) => {
			if (!show) return;
			
			switch (e.key) {
				case "ArrowLeft":
					if (currentImageIndex > 0) {
						setCurrentImageIndex((prev) => Math.max(0, prev - 1));
						setShowOverlay(true);
					}
					break;
				case "ArrowRight":
					if (currentImageIndex < images.length - 1) {
						setCurrentImageIndex((prev) => Math.min(images.length - 1, prev + 1));
						setShowOverlay(true);
					}
					break;
				case "Escape":
					onHide();
					break;
				default:
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDownEvent);
		return () => document.removeEventListener("keydown", handleKeyDownEvent);
	}, [show, currentImageIndex, images.length, onHide]);

	const getPrivacyIcon = (privacy) => {
		switch (privacy) {
			case "public":
				return <Globe size={14} className="text-white-50" />;
			case "private":
				return <Lock size={14} className="text-white-50" />;
			case "followers":
				return <PersonFill size={14} className="text-white-50" />;
			default:
				return <Globe size={14} className="text-white-50" />;
		}
	};

	const currentUserLiked = post?.likes?.some(
		(like) => like.user?.uid === currentUser?.uid
	);

	if (!show || images.length === 0) return null;

	return (
		<Modal
			show={show}
			onHide={onHide}
			fullscreen
			className="image-viewer-modal"
			backdrop="static"
			style={{ zIndex: 1070 }}
		>
			<div className="position-relative w-100 h-100 bg-black">
				{/* Top Action Bar */}
				<div
					className={`position-fixed top-0 start-0 w-100 d-flex align-items-center justify-content-between p-3 transition-opacity ${
						showOverlay ? "opacity-100" : "opacity-0"
					}`}
					style={{
						background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
						zIndex: 1050,
						transition: "opacity 0.3s ease",
					}}
				>
					<Button
						variant="link"
						className="text-white p-2"
						onClick={onHide}
						style={{ backgroundColor: "rgba(0,0,0,0.5)", borderRadius: "50%" }}
					>
						<ArrowLeft size={20} />
					</Button>

					{post && (
						<div className="d-flex align-items-center gap-2 text-white mx-3 min-width-0">
							<div className="d-flex align-items-center gap-2 min-width-0 flex-grow-1">
								<div className="d-flex align-items-center gap-1 min-width-0">
									<span
										className="fw-bold text-white text-truncate"
										style={{ cursor: "pointer" }}
										onClick={() => onNavigateToProfile?.(post.author.username)}
									>
										{post.author.name}'s post
									</span>
									{post.author.hasBlueCheck && (
										<CheckCircleFill className="text-primary flex-shrink-0" size={14} />
									)}
								</div>
							</div>
						</div>
					)}

					<Dropdown align="end">
						<Dropdown.Toggle
							as={Button}
							variant="link"
							className="text-white p-2"
							style={{ 
								backgroundColor: "rgba(0,0,0,0.5)", 
								borderRadius: "50%",
								border: "none"
							}}
						>
							<ThreeDots size={20} />
						</Dropdown.Toggle>
						<Dropdown.Menu 
							className="bg-dark border-secondary"
							style={{ zIndex: 1055 }}
						>
							<Dropdown.Item 
								className="text-white"
								style={{ backgroundColor: "transparent" }}
								onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.1)"}
								onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
								onClick={() => {
									onPostOptions?.();
								}}
							>
								View Post Details
							</Dropdown.Item>
							<Dropdown.Item 
								className="text-white"
								style={{ backgroundColor: "transparent" }}
								onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.1)"}
								onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
								onClick={() => {
									if (post?.author?.username) {
										onNavigateToProfile?.(post.author.username);
									}
								}}
							>
								View Profile
							</Dropdown.Item>
							<Dropdown.Divider className="border-secondary" />
							<Dropdown.Item 
								className="text-danger"
								style={{ backgroundColor: "transparent" }}
								onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(220,53,69,0.1)"}
								onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
								onClick={() => {
									// Add report functionality
									console.log("Report post");
								}}
							>
								Report Post
							</Dropdown.Item>
						</Dropdown.Menu>
					</Dropdown>
				</div>

				{/* Navigation Arrows */}
				{images.length > 1 && (
					<>
						<Button
							variant="link"
							className={`position-fixed top-50 start-0 translate-middle-y text-white ms-3 transition-opacity ${
								showOverlay ? "opacity-100" : "opacity-50"
							}`}
							style={{
								zIndex: 1040,
								backgroundColor: "rgba(0,0,0,0.5)",
								borderRadius: "50%",
								width: "48px",
								height: "48px",
								transition: "opacity 0.3s ease",
							}}
							disabled={currentImageIndex === 0}
							onClick={handlePrevious}
						>
							<ChevronLeft size={24} />
						</Button>

						<Button
							variant="link"
							className={`position-fixed top-50 end-0 translate-middle-y text-white me-3 transition-opacity ${
								showOverlay ? "opacity-100" : "opacity-50"
							}`}
							style={{
								zIndex: 1040,
								backgroundColor: "rgba(0,0,0,0.5)",
								borderRadius: "50%",
								width: "48px",
								height: "48px",
								transition: "opacity 0.3s ease",
							}}
							disabled={currentImageIndex === images.length - 1}
							onClick={handleNext}
						>
							<ChevronRight size={24} />
						</Button>
					</>
				)}

				{/* Image Counter */}
				{images.length > 1 && (
					<div
						className={`position-fixed top-0 start-50 translate-middle-x mt-5 pt-3 text-white transition-opacity ${
							showOverlay ? "opacity-100" : "opacity-0"
						}`}
						style={{
							zIndex: 1040,
							backgroundColor: "rgba(0,0,0,0.5)",
							padding: "8px 16px",
							borderRadius: "20px",
							transition: "opacity 0.3s ease",
						}}
					>
						{currentImageIndex + 1} / {images.length}
					</div>
				)}

				{/* Main Image */}
				<div className="d-flex align-items-center justify-content-center w-100 h-100">
					<Image
						src={images[currentImageIndex]}
						className="img-fluid"
						style={{
							maxHeight: "100vh",
							maxWidth: "100vw",
							objectFit: "contain",
							cursor: "pointer",
						}}
						onClick={handleImageClick}
					/>
				</div>

				{/* Bottom Overlay with Post Content */}
				{post && (
					<div
						className={`position-fixed bottom-0 start-0 w-100 transition-opacity ${
							showOverlay ? "opacity-100" : "opacity-0"
						}`}
						style={{
							background: "linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)",
							zIndex: 1030,
							transition: "opacity 0.3s ease",
						}}
					>
						<div className="p-4">
							{/* Post Content */}
							{post.content && (
								<div className="mb-3 text-white">
									{parseTextContent(post.content, {
										onHashtagClick,
										onMentionClick,
										onLinkClick,
									})}
								</div>
							)}

							{/* Engagement Stats */}
							<div className="d-flex align-items-center justify-content-between mb-3">
								<div className="d-flex flex-wrap gap-3 small text-white-50">
									{post.likes?.length > 0 && (
										<span>
											{currentUserLiked && post.likes.length > 1
												? `You and ${post.likes.length - 1} others reacted`
												: currentUserLiked && post.likes.length === 1
												? "You reacted"
												: `${post.likes.length} ${post.likes.length === 1 ? "reaction" : "reactions"}`}
										</span>
									)}
								</div>
								<div className="d-flex flex-wrap gap-3 small text-white-50">
									{post.stats?.views > 0 && (
										<span>{post.stats.views} views</span>
									)}
									{post.stats?.shares > 0 && (
										<span>{post.stats.shares} shares</span>
									)}
								</div>
							</div>

							{/* Action Buttons */}
							<div className="d-flex justify-content-around border-top border-secondary pt-3">
								<Button
									variant="link"
									size="sm"
									className="text-white-50 p-2 d-flex align-items-center gap-2"
									onClick={onComment}
									style={{ transition: "color 0.2s" }}
									onMouseEnter={(e) => (e.target.style.color = "#1da1f2")}
									onMouseLeave={(e) => (e.target.style.color = "")}
								>
									<ChatDots size={20} />
									{post.stats?.comments > 0 && (
										<span className="small">{post.stats.comments}</span>
									)}
								</Button>

								<Button
									variant="link"
									size="sm"
									className={`p-2 d-flex align-items-center gap-2 ${
										currentUserLiked ? "text-danger" : "text-white-50"
									}`}
									onClick={onLike}
									style={{ transition: "color 0.2s" }}
									onMouseEnter={(e) => {
										if (!currentUserLiked) e.target.style.color = "#dc3545";
									}}
									onMouseLeave={(e) => {
										if (!currentUserLiked) e.target.style.color = "";
									}}
								>
									{currentUserLiked ? (
										<HeartFill size={20} />
									) : (
										<Heart size={20} />
									)}
									{post.stats?.likes > 0 && (
										<span className="small">{post.stats.likes}</span>
									)}
								</Button>

								<Button
									variant="link"
									size="sm"
									className="text-white-50 p-2 d-flex align-items-center gap-2"
									onClick={onShare}
									style={{ transition: "color 0.2s" }}
									onMouseEnter={(e) => (e.target.style.color = "#17bf63")}
									onMouseLeave={(e) => (e.target.style.color = "")}
								>
									<Share size={20} />
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* Click area to toggle overlay */}
				<div
					className="position-absolute top-0 start-0 w-100 h-100"
					style={{ zIndex: 1000 }}
					onClick={handleImageClick}
				/>
			</div>

			<style>{`
				.image-viewer-modal .modal-content {
					background: transparent;
					border: none;
				}
				.image-viewer-modal .modal-dialog {
					margin: 0;
					max-width: 100%;
					height: 100%;
				}
				.transition-opacity {
					transition: opacity 0.3s ease;
				}
			`}</style>
		</Modal>
	);
};

export default ImageViewer;
