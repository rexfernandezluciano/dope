/** @format */

import { Outlet, useLoaderData, useLocation } from "react-router-dom";

import NavigationView from "../components/navs/NavigationView";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";
import SubscriptionPage from "./SubscriptionPage";
import AnalyticsPage from "./AnalyticsPage";

const IndexPage = () => {
  const loaderData = useLoaderData() || {};
  const { user } = loaderData;
  const location = useLocation();
  const pathname = location.pathname;

  

	// Check if it's settings page
	if (pathname.endsWith('/settings')) {
		return (
			<NavigationView user={user}>
				<SettingsPage />
			</NavigationView>
		);
	}

	// Check if it's subscription page
	if (pathname === '/subscription') {
		return (
			<NavigationView user={user}>
				<SubscriptionPage />
			</NavigationView>
		);
	}

	// Check if it's analytics page
	if (pathname === '/analytics') {
		return (
			<NavigationView user={user}>
				<AnalyticsPage />
			</NavigationView>
		);
	}

	

	// Check if it's a profile page (username path)
	if (pathname !== '/home' && pathname !== '/') {
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