
/** @format */

import React, { useState, useEffect } from "react";
import { Card, Image, Button, Spinner } from "react-bootstrap";
import { CheckCircleFill, PersonPlus } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../config/ApiConfig";

const UserRecommendation = ({ currentUser }) => {
	const navigate = useNavigate();
	const [recommendedUsers, setRecommendedUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [followingUsers, setFollowingUsers] = useState(new Set());

	useEffect(() => {
		fetchRecommendedUsers();
	}, []);

	const fetchRecommendedUsers = async () => {
		try {
			setLoading(true);
			// You'll need to implement this API endpoint
			const response = await userAPI.getRecommendedUsers({ limit: 3 });
			setRecommendedUsers(response.users || []);
		} catch (error) {
			console.error("Failed to fetch recommended users:", error);
			// Fallback to mock data for demo
			setRecommendedUsers([
				{
					uid: "user1",
					username: "john_doe",
					name: "John Doe",
					photoURL: "https://i.pravatar.cc/150?img=1",
					hasBlueCheck: true,
					bio: "Software engineer and tech enthusiast"
				},
				{
					uid: "user2",
					username: "jane_smith",
					name: "Jane Smith",
					photoURL: "https://i.pravatar.cc/150?img=2",
					hasBlueCheck: false,
					bio: "Designer and creative thinker"
				}
			]);
		} finally {
			setLoading(false);
		}
	};

	const handleFollow = async (userId) => {
		try {
			await userAPI.followUser(userId);
			setFollowingUsers(prev => new Set([...prev, userId]));
		} catch (error) {
			console.error("Failed to follow user:", error);
		}
	};

	if (loading) {
		return (
			<Card className="mb-3">
				<Card.Body className="text-center">
					<Spinner size="sm" />
				</Card.Body>
			</Card>
		);
	}

	if (recommendedUsers.length === 0) return null;

	return (
		<Card className="mb-3 border-0 border-bottom rounded-0">
			<Card.Body className="px-3">
				<div className="d-flex align-items-center justify-content-between mb-3">
					<h6 className="mb-0 fw-bold">Who to follow</h6>
					<Button 
						variant="link" 
						size="sm" 
						className="text-primary p-0"
						onClick={() => navigate('/search?tab=users')}
					>
						See all
					</Button>
				</div>
				
				{recommendedUsers.map((user) => (
					<div key={user.uid} className="d-flex align-items-center gap-2 mb-3">
						<Image
							src={user.photoURL || "https://i.pravatar.cc/150?img=10"}
							alt={user.name}
							roundedCircle
							width="40"
							height="40"
							style={{ objectFit: "cover", cursor: "pointer" }}
							onClick={() => navigate(`/${user.username}`)}
						/>
						<div className="flex-grow-1 min-width-0">
							<div className="d-flex align-items-center gap-1">
								<span 
									className="fw-bold text-truncate" 
									style={{ cursor: "pointer" }}
									onClick={() => navigate(`/${user.username}`)}
								>
									{user.name}
								</span>
								{user.hasBlueCheck && (
									<CheckCircleFill className="text-primary" size={14} />
								)}
							</div>
							<p className="text-muted mb-0 small">@{user.username}</p>
							{user.bio && (
								<p className="text-muted mb-0 small text-truncate">{user.bio}</p>
							)}
						</div>
						<Button
							variant={followingUsers.has(user.uid) ? "outline-secondary" : "primary"}
							size="sm"
							onClick={() => handleFollow(user.uid)}
							disabled={followingUsers.has(user.uid)}
							className="d-flex align-items-center gap-1"
						>
							{followingUsers.has(user.uid) ? (
								"Following"
							) : (
								<>
									<PersonPlus size={14} />
									Follow
								</>
							)}
						</Button>
					</div>
				))}
			</Card.Body>
		</Card>
	);
};

export default UserRecommendation;
