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
		emailNotifications: false,
		pushNotifications: true,
		smsNotifications: false,
		marketingEmails: false,
		securityAlerts: true,
		followNotifications: true,
		likeNotifications: true,
		commentNotifications: true,
		mentionNotifications: true,
	});
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("success");

	useEffect(() => {
		const fetchNotificationSettings = async () => {
			try {
				const response = await notificationAPI.getSettings();
				if (response && typeof response === "object") {
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

	const handleNotificationChange = (type, value) => {
		setSettings((prev) => ({
			...prev,
			[type]: value,
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
				<Card.Body className="px-3">
					<Form>
						<div className="mb-4">
							<h6 className="mb-3">Notification Types</h6>

							{[
								{
									key: "emailNotifications",
									label: "Email Notifications",
									description: "Receive notifications via email",
								},
								{
									key: "pushNotifications",
									label: "Push Notifications",
									description: "Receive notifications via push notifications",
								},
								{
									key: "smsNotifications",
									label: "SMS Notifications",
									description: "Receive notifications via SMS",
								},
								{
									key: "likeNotifications",
									label: "Likes on your posts",
									description: "Get notified when someone likes your posts",
								},
								{
									key: "commentNotifications",
									label: "Comments on your posts",
									description:
										"Get notified when someone comments on your posts",
								},
								{
									key: "followNotifications",
									label: "New followers",
									description: "Get notified when someone follows you",
								},
								{
									key: "mentionNotifications",
									label: "Mentions",
									description: "Get notified when someone mentions you",
								},
								{
									key: "tipNotifications",
									label: "Tips received",
									description: "Get notified when you receive tips",
								},
								{
									key: "securityAlerts",
									label: "Security alerts",
									description: "Get notified about security-related activities",
								},
								{
									key: "marketingEmails",
									label: "Marketing communications",
									description: "Receive promotional emails and updates",
								},
							].map((notification) => (
								<div key={notification.key} className="mb-4">
									<h6 className="mb-2">{notification.label}</h6>
									<Form.Text className="text-muted d-block mb-2">
										<Form.Group>
											<Form.Check
												type="checkbox"
												label={`${notification.description}`}
												checked={
													settings?.[notification.key] ||
													false
												}
												onChange={(e) =>
													handleNotificationChange(
														notification.key,
														e.target.checked,
													)
												}
											/>
										</Form.Group>
									</Form.Text>
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
			{user.membership?.subscription === "free" && (
				<Adsense
					client="ca-pub-1106169546112879"
					slot="2596463814"
					style={{ display: "block" }}
					format="auto"
				/>
			)}
		</div>
	);
};

export default NotificationSettingsPage;
