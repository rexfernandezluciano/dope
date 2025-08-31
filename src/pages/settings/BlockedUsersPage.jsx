import React, { useState, useEffect } from "react";
import {
	Container,
	Card,
	Button,
	Alert,
	Spinner,
	Image,
} from "react-bootstrap";
import { useLoaderData, useNavigate } from "react-router-dom";
import { Adsense } from "@ctrl/react-adsense";
import { blockAPI } from "../../config/ApiConfig";

const BlockedUsersPage = () => {
	const loaderData = useLoaderData() || {};
	const { user } = loaderData;
	const navigate = useNavigate();
	const [blockedUsers, setBlockedUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [unblockingUsers, setUnblockingUsers] = useState(new Set());

	useEffect(() => {
		const fetchBlockedUsers = async () => {
			try {
				setLoading(true);
				const response = await blockAPI.getBlockedUsers();
				setBlockedUsers(response.blockedUsers || []);
			} catch (err) {
				console.error("Error fetching blocked users:", err);
				setError("Failed to load blocked users");
			} finally {
				setLoading(false);
			}
		};

		if (user) {
			fetchBlockedUsers();
		}
	}, [user]);

	const handleUnblock = async (userId) => {
		try {
			setUnblockingUsers((prev) => new Set([...prev, userId]));
			await blockAPI.unblockUser(userId);
			setBlockedUsers((prev) =>
				prev.filter((block) => block.blockedUserId !== userId),
			);
		} catch (err) {
			console.error("Error unblocking user:", err);
			setError("Failed to unblock user");
		} finally {
			setUnblockingUsers((prev) => {
				const newSet = new Set(prev);
				newSet.delete(userId);
				return newSet;
			});
		}
	};

	if (!user) {
		return (
			<Container className="text-center py-5">
				<Spinner animation="border" variant="primary" />
			</Container>
		);
	}

	if (loading) {
		return (
			<Container className="py-4">
				<div className="text-center">
					<Spinner animation="border" variant="primary" />
					<p className="mt-2">Loading blocked users...</p>
				</div>
			</Container>
		);
	}

	return (
		<Container className="py-4">
			<div className="d-flex align-items-center mb-4">
				<Button
					variant="outline-secondary"
					size="sm"
					onClick={() => navigate(-1)}
					className="me-3"
				>
					← Back
				</Button>
				<h2 className="mb-0">Blocked Users</h2>
			</div>

			{error && (
				<Alert variant="danger" onClose={() => setError("")} dismissible>
					{error}
				</Alert>
			)}

			{blockedUsers.length === 0 ? (
				<Card>
					<Card.Body className="text-center py-5">
						<h5>No blocked users</h5>
						<p className="text-muted">You haven't blocked any users yet.</p>
					</Card.Body>
				</Card>
			) : (
				<div className="space-y-3">
					{blockedUsers.map((block) => (
						<Card key={block.id} className="border-0 border-bottom rounded-0">
							<Card.Body className="px-3 py-3">
								<div className="d-flex align-items-center justify-content-between">
									<div className="d-flex align-items-center gap-3">
										<Image
											src={
												block.blockedUser?.photoURL ||
												"https://i.pravatar.cc/150?img=10"
											}
											alt="avatar"
											roundedCircle
											width="50"
											height="50"
											style={{ objectFit: "cover" }}
										/>
										<div>
											<div className="fw-bold">
												{block.blockedUser?.name || "Unknown User"}
											</div>
											<p className="text-muted mb-0">
												@{block.blockedUser?.username || "unknown"}
											</p>
											<small className="text-muted">
												Blocked on{" "}
												{new Date(block.createdAt).toLocaleDateString()}
											</small>
										</div>
									</div>
									<Button
										variant="outline-success"
										size="sm"
										onClick={() => handleUnblock(block.blockedUserId)}
										disabled={unblockingUsers.has(block.blockedUserId)}
									>
										{unblockingUsers.has(block.blockedUserId) ? (
											<>
												<Spinner size="sm" className="me-1" />
												Unblocking...
											</>
										) : (
											"Unblock"
										)}
									</Button>
								</div>
							</Card.Body>
						</Card>
					))}
				</div>
			)}
			{/* <!-- banner_ad --> */}
			<Adsense
				client="ca-pub-1106169546112879"
				slot="2596463814"
				style={{ display: "block" }}
				format="auto"
			/>
		</Container>
	);
};

export default BlockedUsersPage;
