/** @format */

import { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import IndexPageLoader from "../router/loader/IndexPageLoader";
import LoadingView from "../components/LoadingView";

const HomePage = lazy(() => import("../pages/HomePage.jsx"));
const ProfilePage = lazy(() => import("../pages/ProfilePage.jsx"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage.jsx"));
const SignUpPage = lazy(() => import("../pages/auth/SignUpPage.jsx"));
const IndexPage = lazy(() => import("../pages/IndexPage.jsx"));
const RequireAuth = lazy(() => import("../router/security/RequireAuth.jsx"));

const router = createBrowserRouter([
	{
		path: "/",
		element: (
			<Suspense fallback={<LoadingView />}>
				<RequireAuth>
					<IndexPage />
				</RequireAuth>
			</Suspense>
		),
		hydrateFallbackElement: <LoadingView />,
		loader: IndexPageLoader,
		children: [
			{
				index: true,
				element: <HomePage />,
			},
			{
				path: ":username",
				element: <ProfilePage />,
			},
		],
	},
	{
		path: "/auth/login",
		element: <LoginPage />,
	},
	{
		path: "/auth/signup",
		element: <SignUpPage />,
	},
]);

const AppRouter = () => {
	return <RouterProvider router={router} />;
};

export default AppRouter;
