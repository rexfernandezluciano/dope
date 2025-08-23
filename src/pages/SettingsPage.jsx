/** @format */

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Nav, Button, Tab } from "react-bootstrap";
import {
	ChevronLeft,
	Person,
	Eye,
	Bell,
	X,
	Shield,
	CodeSlash,
	PersonSlash,
} from "react-bootstrap-icons";
import { Link } from "react-router-dom";

import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import AccountSettingsPage from "./settings/AccountSettingsPage";
import ProfileSettingsPage from "./settings/ProfileSettingsPage";
import PrivacySettingsPage from "./settings/PrivacySettingsPage";
import NotificationSettingsPage from "./settings/NotificationSettingsPage";
import SessionSettingsPage from "./settings/SessionSettingsPage";
import OAuthAppsPage from "./settings/OAuthAppsPage"; // Assuming this component exists
import OAuthConsentPage from "./settings/OAuthConsentPage"; // Assuming this component exists
import { authAPI } from "../config/ApiConfig";
import { removeAuthToken } from "../config/ApiConfig";

const SettingsPage = () => {
	const navigate = useNavigate();
	const { tab } = useParams();
	const [activeTab, setActiveTab] = useState("account");

	const handleLogout = async () => {
		await authAPI.logout();
		removeAuthToken();
		navigate("/");
	};

	const settingsTabs = useMemo(
		() => [
			{
				key: "account",
				label: "Account",
				icon: <Person size={20} />,
				component: <AccountSettingsPage />,
				category: "Personal",
			},
			{
				key: "profile",
				label: "Profile",
				icon: <Person size={20} />,
				component: <ProfileSettingsPage />,
				category: "Personal",
			},
			{
				key: "privacy",
				label: "Privacy and safety",
				icon: <Eye size={20} />,
				component: <PrivacySettingsPage />,
				category: "Privacy & Security",
			},
			{
				key: "notifications",
				label: "Notifications",
				icon: <Bell size={20} />,
				component: <NotificationSettingsPage />,
				category: "Preferences",
			},
			{
				key: "sessions",
				label: "Sessions",
				icon: <Shield size={20} />,
				component: <SessionSettingsPage />,
				category: "Privacy & Security",
			},
			{
				key: "oauth-apps",
				label: "OAuth Apps",
				icon: <Shield size={20} />,
				component: <OAuthAppsPage />,
				category: "Developer",
			},
			{
				key: "oauth-consent",
				label: "Authorizations",
				icon: <Shield size={20} />,
				component: <OAuthConsentPage />,
				category: "Developer",
			},
		],
		[],
	);

	const currentTab = settingsTabs.find((tab) => tab.key === activeTab);

	useEffect(() => {
		// Set active tab based on URL parameter
		if (tab && settingsTabs.find((tabItem) => tabItem.key === tab)) {
			setActiveTab(tab);
		} else {
			setActiveTab("account"); // Default to account tab
		}
	}, [tab, settingsTabs]);

	useEffect(() => {
		// Update page meta data based on active section
		const metaKey = `${activeTab}Settings`;
		if (pageMetaData[metaKey]) {
			updatePageMeta(pageMetaData[metaKey]);
		} else {
			updatePageMeta(pageMetaData.settings);
		}
	}, [activeTab]);

	return (
		<Container className="py-0 px-0">
			{/* Header */}
			<div
				className="d-flex align-items-center justify-content-between p-3 border-bottom bg-white sticky-top"
				style={{ zIndex: 100 }}
			>
				<div className="d-flex align-items-center gap-3">
					<Button
						variant="link"
						className="p-0 text-dark"
						onClick={() => navigate(-1)}
					>
						<ChevronLeft size={20} />
					</Button>
					<h4 className="mb-0">Settings</h4>
				</div>
				<Button
					variant="link"
					className="p-0 text-dark d-md-none"
					onClick={() => navigate(-1)}
				>
					<X size={20} />
				</Button>
			</div>

			<div className="row g-0">
				{/* Sidebar Navigation */}
				<div className="bg-white border-end d-none d-md-block" style={{ width: "280px", minHeight: "100vh" }}>
					<Nav variant="pills" className="flex-column p-3">
						{/* Group settings by category */}
						{["Personal", "Privacy & Security", "Preferences", "Developer"].map((category) => {
							const categoryTabs = settingsTabs.filter(tab => tab.category === category);
							if (categoryTabs.length === 0) return null;

							return (
								<div key={category} className="mb-4">
									<h6 className="text-muted mb-2 px-2 fw-bold" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
										{category}
									</h6>
									{categoryTabs.map((tab) => (
										<Nav.Item key={tab.key} className="mb-1">
											<Nav.Link
												href={`/settings/${tab.key}`}
												active={activeTab === tab.key}
												className={`d-flex align-items-center gap-2 text-dark ${
													activeTab === tab.key ? "active" : ""
												}`}
												style={{
													borderRadius: "8px",
													backgroundColor: activeTab === tab.key ? "#0d6efd" : "transparent",
													color: activeTab === tab.key ? "white" : "#333",
													fontSize: "0.9rem",
													padding: "0.5rem 0.75rem",
												}}
											>
												{tab.icon}
												{tab.label}
											</Nav.Link>
										</Nav.Item>
									))}
								</div>
							);
						})}
					</Nav>

					{/* Logout Button */}
					<div className="p-3 border-top mt-auto">
						<Button
							variant="outline-danger"
							className="w-100"
							onClick={handleLogout}
						>
							Logout
						</Button>
					</div>
				</div>

				{/* Main Content */}
				<div className="col-md-8 col-lg-9">
					<Tab.Container activeKey={activeTab}>
						<div className="p-4">
							<div className="d-flex align-items-center gap-2 mb-4">
								{currentTab?.icon}
								<h5 className="mb-0">{currentTab?.label}</h5>
							</div>

							<Tab.Content>
								{settingsTabs.map((tab) => (
									<Tab.Pane key={tab.key} eventKey={tab.key}>
										{tab.component}
									</Tab.Pane>
								))}
							</Tab.Content>
						</div>
					</Tab.Container>
				</div>
			</div>
		</Container>
	);
};

export default SettingsPage;