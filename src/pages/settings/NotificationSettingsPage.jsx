
/** @format */

import { useLoaderData } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { Bell } from "react-bootstrap-icons";
import { Adsense } from "@ctrl/react-adsense";

import { notificationAPI } from "../../config/ApiConfig.js";

const NotificationSettingsPage = () => {
	const loaderData = useLoaderData() || {};
	const { user } = loaderData;
	const [settings, setSettings] = useState({
		emailNotifications: true,
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
				setSettings(response);
			} catch (err) {
				console.error("Error fetching notification settings:", err);
				// Keep default settings if fetch fails
			}
		};

		if (user) {
			fetchNotificationSettings();
		}
	}, [user]);

	if (!user) {
		return (
			<Container className="text-center py-5">
				<div>Loading...</div>
			</Container>
		);
	}

	const handleSaveSettings = async () => {
		try {
			setLoading(true);
			const response = await notificationAPI.updateSettings(settings);
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

	const handleNotificationChange = (key, value) => {
		setSettings((prev) => ({
			...prev,
			[key]: value,
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
							<h6 className="mb-3">Activity Notifications</h6>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="Likes on your posts"
									checked={settings.likeNotifications}
									onChange={(e) =>
										handleNotificationChange("likeNotifications", e.target.checked)
									}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Get notified when someone likes your posts
								</Form.Text>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="Comments on your posts"
									checked={settings.commentNotifications}
									onChange={(e) =>
										handleNotificationChange("commentNotifications", e.target.checked)
									}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Get notified when someone comments on your posts
								</Form.Text>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="New followers"
									checked={settings.followNotifications}
									onChange={(e) =>
										handleNotificationChange("followNotifications", e.target.checked)
									}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Get notified when someone follows you
								</Form.Text>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="Mentions"
									checked={settings.mentionNotifications}
									onChange={(e) =>
										handleNotificationChange("mentionNotifications", e.target.checked)
									}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Get notified when someone mentions you
								</Form.Text>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="Security alerts"
									checked={settings.securityAlerts}
									onChange={(e) =>
										handleNotificationChange("securityAlerts", e.target.checked)
									}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Get notified about security-related activities
								</Form.Text>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="Marketing emails"
									checked={settings.marketingEmails}
									onChange={(e) =>
										handleNotificationChange("marketingEmails", e.target.checked)
									}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Receive promotional emails and updates
								</Form.Text>
							</Form.Group>
						</div>

						<hr />

						<div className="mb-4">
							<h6 className="mb-3">Delivery Methods</h6>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="Push notifications"
									checked={settings.pushNotifications}
									onChange={(e) =>
										handleNotificationChange("pushNotifications", e.target.checked)
									}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Receive notifications on your device
								</Form.Text>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="Email notifications"
									checked={settings.emailNotifications}
									onChange={(e) =>
										handleNotificationChange("emailNotifications", e.target.checked)
									}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Receive notifications via email
								</Form.Text>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="SMS notifications"
									checked={settings.smsNotifications}
									onChange={(e) =>
										handleNotificationChange("smsNotifications", e.target.checked)
									}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Receive notifications via SMS
								</Form.Text>
							</Form.Group>
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
