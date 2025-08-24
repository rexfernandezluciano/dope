/** @format */

import { Outlet, useLoaderData, useLocation } from "react-router-dom";

import NavigationView from "../components/navs/NavigationView";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";
import SubscriptionPage from "./SubscriptionPage";
import AnalyticsPage from "./AnalyticsPage";
import MySubscriptionsPage from "./MySubscriptionsPage";

const IndexPage = () => {
	const loaderData = useLoaderData() || {};
	const { user } = loaderData;
	const location = useLocation();
	const pathname = location.pathname;

	

	// Check if it's subscription page
	if (pathname === "/subscription") {
		return (
			<NavigationView user={user}>
				<SubscriptionPage />
			</NavigationView>
		);
	}

	// Check if it's my subscriptions page
	if (pathname === "/my-subscriptions") {
		return (
			<NavigationView user={user}>
				<MySubscriptionsPage />
			</NavigationView>
		);
	}

	// Check if it's analytics page
	if (pathname === "/analytics") {
		return (
			<NavigationView user={user}>
				<AnalyticsPage />
			</NavigationView>
		);
	}

	// For home page and post detail pages, use Outlet
	if (pathname === "/home" || pathname.startsWith("/post/")) {
		return (
			<NavigationView user={user}>
				<Outlet />
			</NavigationView>
		);
	}

	// Check if it's a profile page (username path)
	if (pathname !== "/home" && pathname !== "/" && !pathname.startsWith("/post/")) {
		return (
			<NavigationView user={user}>
				<ProfilePage />
			</NavigationView>
		);
	}

	return (
		<NavigationView user={user}>
			<Outlet />
		</NavigationView>
	);
};

export default IndexPage;
