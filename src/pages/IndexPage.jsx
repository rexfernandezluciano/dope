/** @format */

import { Outlet, useLoaderData, useLocation } from "react-router-dom";

import NavigationView from "../components/navs/NavigationView";
import HomePage from "./HomePage";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";
import PostDetailPage from "./PostDetailPage";

const IndexPage = () => {
  const loaderData = useLoaderData() || {};
  const { user } = loaderData;
  const location = useLocation();
  const pathname = location.pathname;

  // Check if it's a post detail page
	if (pathname.startsWith('/post/')) {
		return (
			<NavigationView user={user}>
				<PostDetailPage />
			</NavigationView>
		);
	}

	// Check if it's settings page
	if (pathname.endsWith('/settings')) {
		return (
			<NavigationView user={user}>
				<SettingsPage />
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