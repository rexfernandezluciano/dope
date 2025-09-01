
/** @format */

import { useLoaderData } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { Bell } from "react-bootstrap-icons";
import { Adsense } from "@ctrl/react-adsense";

import { notificationAPI } from "../../config/ApiConfig.js";

const NotificationSettingsPage = () => {
	const loaderData = useLoaderData() || {};
	const { user } = loaderData || {};
	const [settings, setSettings] = useState({
		email: {
			likes: true,
			comments: true,
			follows: true,
			mentions: true,
			tips: true,
			subscriptions: true,
			security: true,
			marketing: false,
		},
		push: {
			likes: true,
			comments: true,
			follows: true,
			mentions: true,
			tips: true,
			subscriptions: true,
			security: true,
			marketing: false,
		},
		inApp: {
			likes: true,
			comments: true,
			follows: true,
			mentions: true,
			tips: true,
			subscriptions: true,
			security: true,
			marketing: true,
		},
	});
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("success");

	useEffect(() => {
		const fetchNotificationSettings = async () => {
			try {
				const response = await notificationAPI.getSettings();
				if (response && typeof response === 'object') {
					setSettings(response);
				}
			} catch (err) {
				console.error("Error fetching notification settings:", err);
				// Keep default settings if fetch fails
			}
		};

		if (user && user.uid) {
			fetchNotificationSettings();
		}
	}, [user]);

	if (!user || !user.uid) {
		return (
			<Container className="text-center py-5">
				<div>Loading user data...</div>
			</Container>
		);
	}

	const handleSaveSettings = async () => {
		try {
			setLoading(true);
			await notificationAPI.updateSettings(settings);
			setMessage("Notification settings updated successfully!");
			setMessageType("success");
		} catch (err) {
			console.error("Error updating notification settings:", err);
			setMessage(err.message || "Failed to update notification settings");
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
	};

	const handleNotificationChange = (category, type, value) => {
		setSettings((prev) => ({
			...prev,
			[category]: {
				...prev[category],
				[type]: value,
			},
		}));
	};

	return (
		<div className="py-3">
			{message && (
				<Alert
					variant={messageType}
					dismissible
					onClose={() => setMessage("")}
					className="mb-4"
				>
					{message}
				</Alert>
			)}

			{/* Notification Preferences */}
			<Card className="mb-4">
				<Card.Header className="d-flex align-items-center gap-2">
					<Bell size={20} />
					<h5 className="mb-0">Notification Preferences</h5>
				</Card.Header>
				<Card.Body>
					<Form>
						<div className="mb-4">
							<h6 className="mb-3">Notification Types</h6>

							{[
								{ key: "likes", label: "Likes on your posts", description: "Get notified when someone likes your posts" },
								{ key: "comments", label: "Comments on your posts", description: "Get notified when someone comments on your posts" },
								{ key: "follows", label: "New followers", description: "Get notified when someone follows you" },
								{ key: "mentions", label: "Mentions", description: "Get notified when someone mentions you" },
								{ key: "tips", label: "Tips received", description: "Get notified when you receive tips" },
								{ key: "subscriptions", label: "Subscription updates", description: "Get notified about subscription-related activities" },
								{ key: "security", label: "Security alerts", description: "Get notified about security-related activities" },
								{ key: "marketing", label: "Marketing communications", description: "Receive promotional emails and updates" },
							].map((notification) => (
								<div key={notification.key} className="mb-4">
									<h6 className="mb-2">{notification.label}</h6>
									<Form.Text className="text-muted d-block mb-2">
										{notification.description}
									</Form.Text>
									
									<div className="d-flex gap-4">
										<Form.Group>
											<Form.Check
												type="checkbox"
												label="Email"
												checked={settings?.email?.[notification.key] || false}
												onChange={(e) =>
													handleNotificationChange("email", notification.key, e.target.checked)
												}
											/>
										</Form.Group>
										
										<Form.Group>
											<Form.Check
												type="checkbox"
												label="Push"
												checked={settings?.push?.[notification.key] || false}
												onChange={(e) =>
													handleNotificationChange("push", notification.key, e.target.checked)
												}
											/>
										</Form.Group>
										
										<Form.Group>
											<Form.Check
												type="checkbox"
												label="In-App"
												checked={settings?.inApp?.[notification.key] || false}
												onChange={(e) =>
													handleNotificationChange("inApp", notification.key, e.target.checked)
												}
											/>
										</Form.Group>
									</div>
								</div>
							))}
						</div>
					</Form>
				</Card.Body>
			</Card>

			{/* Save Button */}
			<div className="d-grid">
				<Button
					variant="primary"
					size="md"
					onClick={handleSaveSettings}
					disabled={loading}
				>
					{loading ? "Saving..." : "Save Notification Settings"}
				</Button>
			</div>
			{/* <!-- banner_ad --> */}
			<Adsense
				client="ca-pub-1106169546112879"
				slot="2596463814"
				style={{ display: "block" }}
				format="auto"
			/>
		</div>
	);
};

export default NotificationSettingsPage;
