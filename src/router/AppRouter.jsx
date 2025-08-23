/** @format */

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

import RequireAuth from "./security/RequireAuth.jsx";
import { IndexPageLoader } from "./loader/IndexPageLoader.js";
import { SecurityProvider } from "../components/SecurityProvider.jsx";

import NavigationView from "../components/navs/NavigationView";

import LoadingView from "../components/LoadingView";

// Lazy load route components for better performance
const StartPage = lazy(() => import("../pages/StartPage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const SignUpPage = lazy(() => import("../pages/auth/SignUpPage"));
const VerifyEmailPage = lazy(() => import("../pages/auth/VerifyEmailPage"));
const GoogleCallbackPage = lazy(
	() => import("../pages/auth/GoogleCallbackPage"),
);
const IndexPage = lazy(() => import("../pages/IndexPage"));
const HomePage = lazy(() => import("../pages/HomePage"));
const PostDetailPage = lazy(() => import("../pages/PostDetailPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const SubscriptionPage = lazy(() => import("../pages/SubscriptionPage"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const AnalyticsPage = lazy(() => import("../pages/AnalyticsPage"));
const LiveStreamPage = lazy(() => import("../pages/LiveStreamPage"));
const PrivacyPolicyPage = lazy(() => import("../pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("../pages/TermsOfServicePage"));
const NetworkTestPage = lazy(() => import("../pages/NetworkTestPage"));
const DeveloperPage = lazy(() => import("../pages/DeveloperPage"));
const BusinessPage = lazy(() => import("../pages/BusinessPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));

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
		path: "/auth/google/callback",
		element: <GoogleCallbackPage />,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/auth/forgot-password",
		element: <ForgotPasswordPage />,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/auth/reset-password",
		element: <ResetPasswordPage />,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/home",
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
		children: [
			{
				index: true,
				element: <PostDetailPage />,
				loader: IndexPageLoader,
				hydrateFallbackElement: <LoadingView />,
			},
		],
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
		path: "/settings",
		element: (
			<RequireAuth>
				<NavigationView>
					<SettingsPage />
				</NavigationView>
			</RequireAuth>
		),
		loader: IndexPageLoader,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/settings/:tab",
		element: (
			<RequireAuth>
				<NavigationView>
					<SettingsPage />
				</NavigationView>
			</RequireAuth>
		),
		loader: IndexPageLoader,
		hydrateFallbackElement: <LoadingView />,
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
	{
		path: "/policies/privacy",
		element: <PrivacyPolicyPage />,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/policies/terms",
		element: <TermsOfServicePage />,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/network-test",
		element: <NetworkTestPage />,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/developer",
		element: (
			<RequireAuth>
				<NavigationView>
					<DeveloperPage />
				</NavigationView>
			</RequireAuth>
		),
		loader: IndexPageLoader,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/business",
		element: (
			<RequireAuth>
				<NavigationView>
					<BusinessPage />
				</NavigationView>
			</RequireAuth>
		),
		loader: IndexPageLoader,
		hydrateFallbackElement: <LoadingView />,
	},
]);

const AppRouter = () => {
	useEffect(() => {
		// Configure NProgress
		NProgress.configure({
			showSpinner: false,
			speed: 500,
			minimum: 0.3,
		});

		// Handle browser navigation (back/forward buttons)
		const handlePopState = () => {
			NProgress.start();
		};

		// Add event listener for browser navigation
		window.addEventListener("popstate", handlePopState);

		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, []);

	return (
		<SecurityProvider>
			<Suspense fallback={<LoadingView />}>
				<RouterProvider router={router} />
			</Suspense>
		</SecurityProvider>
	);
};

export default AppRouter;
