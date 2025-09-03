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
const OAuthAuthorizePage = lazy(() => import("../pages/auth/OAuthAuthorizePage"));
const IndexPage = lazy(() => import("../pages/IndexPage"));
const HomePage = lazy(() => import("../pages/HomePage"));
const PostDetailPage = lazy(() => import("../pages/PostDetailPage"));
const RepostsPage = lazy(() => import("../pages/RepostsPage"));
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
const MySubscriptionsPage = lazy(() => import("../pages/MySubscriptionsPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
// Payment and Credits pages
const PaymentSuccessPage = lazy(() => import("../pages/payments/PaymentSuccessPage"));
const PaymentCancelPage = lazy(() => import("../pages/payments/PaymentCancelPage"));
const CreditsSuccessPage = lazy(() => import("../pages/credits/CreditsSuccessPage"));
const CreditsCancelPage = lazy(() => import("../pages/credits/CreditsCancelPage"));
// Lazy load settings route components
const SessionSettingsPage = lazy(() =>
	import("../pages/settings/SessionSettingsPage"),
);
const OAuthAppsPage = lazy(() => import("../pages/settings/OAuthAppsPage"));
const OAuthConsentPage = lazy(() => import("../pages/settings/OAuthConsentPage"));
const BlockedUsersPage = lazy(() => import("../pages/settings/BlockedUsersPage"));

const router = createBrowserRouter([
	{
		path: "/start",
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
		path: "/",
		element: <StartPage />,
		hydrateFallbackElement: <LoadingView />,
		loader: IndexPageLoader
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
		path: "/post/:postId/reposts",
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
				element: <RepostsPage />,
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
		path: "/@:handle",
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
		children: [
			{
				index: true,
				element: <SessionSettingsPage />,
				loader: IndexPageLoader,
				hydrateFallbackElement: <LoadingView />,
			},
			{
				path: "oauth/apps",
				element: <OAuthAppsPage />,
				loader: IndexPageLoader,
				hydrateFallbackElement: <LoadingView />,
			},
			{
				path: "/settings/oauth/consent",
				element: <OAuthConsentPage />,
				loader: IndexPageLoader,
			},
			{
				path: "/settings/blocked-users",
				element: <BlockedUsersPage />,
				loader: IndexPageLoader,
			},
		],
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
		path: "/dashboard/analytics",
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
		path: "/dashboard/ads-manager",
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
	{
		path: "/account/billing/subscription",
		element: (
			<RequireAuth>
				<NavigationView>
					<SubscriptionPage />
				</NavigationView>
			</RequireAuth>
		),
		loader: IndexPageLoader,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/manage/creators/subscription",
		element: (
			<RequireAuth>
				<NavigationView>
					<MySubscriptionsPage />
				</NavigationView>
			</RequireAuth>
		),
		loader: IndexPageLoader,
		hydrateFallbackElement: <LoadingView />,
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
		path: "/oauth/authorize",
		element: (
			<RequireAuth>
				<OAuthAuthorizePage />
			</RequireAuth>
		),
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/payments/success",
		element: <PaymentSuccessPage />,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/payments/cancel",
		element: <PaymentCancelPage />,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/credits/success",
		element: <CreditsSuccessPage />,
		hydrateFallbackElement: <LoadingView />,
	},
	{
		path: "/credits/cancel",
		element: <CreditsCancelPage />,
		hydrateFallbackElement: <LoadingView />,
	},
]);

const AppRouter = () => {
	useEffect(() => {
		// Configure NProgress
		NProgress.configure({
			showSpinner: false,
			minimum: 0.1,
			easing: "ease",
			speed: 200,
		});

		// Handle browser navigation (back/forward buttons)
		const handlePopState = () => {
			NProgress.start();
			setTimeout(() => NProgress.done(), 100);
		};

		// Add event listener for browser navigation
		window.addEventListener("popstate", handlePopState);

		// Listen for route changes by monitoring URL changes
		let currentUrl = window.location.href;
		const urlObserver = new MutationObserver(() => {
			if (window.location.href !== currentUrl) {
				currentUrl = window.location.href;
				NProgress.start();
				setTimeout(() => NProgress.done(), 100);
			}
		});

		// Observe URL changes
		urlObserver.observe(document, { subtree: true, childList: true });

		return () => {
			window.removeEventListener("popstate", handlePopState);
			urlObserver.disconnect();
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