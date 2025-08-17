/** @format */

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import StartPage from "../pages/StartPage";
import LoginPage from "../pages/auth/LoginPage";
import SignUpPage from "../pages/auth/SignUpPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import IndexPage from "../pages/IndexPage";
import HomePage from "../pages/HomePage";
import ProfilePage from "../pages/ProfilePage";
import SettingsPage from "../pages/SettingsPage";
import SubscriptionPage from "../pages/SubscriptionPage";
import SearchPage from "../pages/SearchPage";
import AnalyticsPage from "../pages/AnalyticsPage";

import RequireAuth from "./security/RequireAuth";
import IndexPageLoader from "./loader/IndexPageLoader";
import NavigationView from "../components/navs/NavigationView";

import LoadingView from "../components/LoadingView";

const router = createBrowserRouter([
	{
		path: "/",
		element: <StartPage />,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/auth/login",
		element: <LoginPage />,
	},
	{
		path: "/auth/signup",
		element: <SignUpPage />,
	},
	{
		path: "/auth/verify/:verificationId",
		element: <VerifyEmailPage />,
	},
	{
		path: "/home",
		element: (
			<RequireAuth>
				<IndexPage />
			</RequireAuth>
		),
		loader: IndexPageLoader,
		children: [
			{
				index: true,
				element: <HomePage />,
				loader: IndexPageLoader,
			},
		],
	},
	{
		path: "/post/:postId",
		element: (
			<RequireAuth>
				<IndexPage />
			</RequireAuth>
		),
		loader: IndexPageLoader,
	},
	{
		path: "/:username",
		element: (
			<RequireAuth>
				<IndexPage />
			</RequireAuth>
		),
		loader: IndexPageLoader,
		children: [
			{
				index: true,
				element: <ProfilePage />,
				loader: IndexPageLoader,
			},
		],
	},
	{
		path: "/:username/settings",
		element: (
			<RequireAuth>
				<IndexPage />
			</RequireAuth>
		),
		loader: IndexPageLoader,
		children: [
			{
				index: true,
				element: <SettingsPage />,
				loader: IndexPageLoader,
			},
		],
	},
	{
		path: "/search",
		element: (
			<RequireAuth>
				<NavigationView>
					<SearchPage />
				</NavigationView>
			</RequireAuth>
		),
		loader: IndexPageLoader,
	},
	{
		path: "/dashboard",
		element: (
			<RequireAuth>
				<NavigationView>
					<IndexPage />
				</NavigationView>
			</RequireAuth>
		),
		loader: IndexPageLoader,
		children: [
			{
				index: true,
				element: <HomePage />,
				loader: IndexPageLoader,
			},
			{
				path: "subscription",
				element: <SubscriptionPage />,
			},
			{
				path: "analytics",
				element: <AnalyticsPage />,
			},
			{
				path: "settings",
				element: <SettingsPage />,
			},
		],
	},
]);

const AppRouter = () => {
	return <RouterProvider router={router} />;
};

export default AppRouter;