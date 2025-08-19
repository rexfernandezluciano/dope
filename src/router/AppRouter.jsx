/** @format */

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useEffect } from "react";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

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
import LiveStreamPage from "../pages/LiveStreamPage";

import RequireAuth from "./security/RequireAuth";
import { IndexPageLoader } from "./loader/IndexPageLoader";
import { SecurityProvider } from "../components/SecurityProvider";

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
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/auth/signup",
		element: <SignUpPage />,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/auth/verify/:verificationId",
		element: <VerifyEmailPage />,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/home",
		element: <IndexPage />,
		loader: IndexPageLoader,
		hydrateFallbackElement: <LoadingView />,
		children: [
			{
				index: true,
				element: <HomePage />,
				loader: IndexPageLoader,
				hydrateFallbackElement: <LoadingView />,
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
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/:username",
		element: (
			<RequireAuth>
				<IndexPage />
			</RequireAuth>
		),
		loader: IndexPageLoader,
		hydrateFallbackElement: <LoadingView />,
		children: [
			{
				index: true,
				element: <ProfilePage />,
				loader: IndexPageLoader,
				hydrateFallbackElement: <LoadingView />,
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
		hydrateFallbackElement: <LoadingView />,
		children: [
			{
				index: true,
				element: <SettingsPage />,
				loader: IndexPageLoader,
				hydrateFallbackElement: <LoadingView />,
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
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/analytics",
		element: (
			<RequireAuth>
				<NavigationView>
					<AnalyticsPage />
				</NavigationView>
			</RequireAuth>
		),
		loader: IndexPageLoader,
		hydrateFallbackElement: <LoadingView />,
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
		hydrateFallbackElement: <LoadingView />,
		children: [
			{
				index: true,
				element: <HomePage />,
				loader: IndexPageLoader,
				hydrateFallbackElement: <LoadingView />,
			},
			{
				path: "subscription",
				element: <SubscriptionPage />,
				hydrateFallbackElement: <LoadingView />,
			},
			{
				path: "analytics",
				element: <AnalyticsPage />,
				hydrateFallbackElement: <LoadingView />,
			},
			{
				path: "settings",
				element: <SettingsPage />,
				hydrateFallbackElement: <LoadingView />,
			},
		],
	},
	{
		path: "/live/:streamKey",
		element: <LiveStreamPage />,
		hydrateFallbackElement: <LoadingView />,
	},
]);

const AppRouter = () => {
	useEffect(() => {
		// Configure NProgress
		NProgress.configure({
			showSpinner: false,
			speed: 500,
			minimum: 0.3
		});

		// Handle browser navigation (back/forward buttons)
		const handlePopState = () => {
			NProgress.start();
		};

		// Add event listener for browser navigation
		window.addEventListener('popstate', handlePopState);

		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	}, []);

	return (
		<SecurityProvider>
			<RouterProvider router={router} />
		</SecurityProvider>
	);
};

export default AppRouter;