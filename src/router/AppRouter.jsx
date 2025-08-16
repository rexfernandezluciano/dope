
/** @format */

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import StartPage from "../pages/StartPage";
import LoginPage from "../pages/auth/LoginPage";
import SignUpPage from "../pages/auth/SignUpPage";
import IndexPage from "../pages/IndexPage";
import HomePage from "../pages/HomePage";
import ProfilePage from "../pages/ProfilePage";
import SettingsPage from "../pages/SettingsPage";

import RequireAuth from "./security/RequireAuth";
import indexPageLoader from "./loader/IndexPageLoader";

const router = createBrowserRouter([
	{
		path: "/",
		element: <StartPage />,
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
		path: "/app",
		element: (
			<RequireAuth>
				<IndexPage />
			</RequireAuth>
		),
		loader: indexPageLoader,
		children: [
			{
				index: true,
				element: <HomePage />,
			},
			{
				path: "profile/:username",
				element: <ProfilePage />,
			},
			{
				path: "settings",
				element: <SettingsPage />,
			},
		],
	},
	// Legacy routes for backward compatibility
	{
		path: "/home",
		element: (
			<RequireAuth>
				<IndexPage />
			</RequireAuth>
		),
		loader: indexPageLoader,
		children: [
			{
				index: true,
				element: <HomePage />,
			},
		],
	},
	{
		path: "/profile/:username",
		element: (
			<RequireAuth>
				<IndexPage />
			</RequireAuth>
		),
		loader: indexPageLoader,
		children: [
			{
				index: true,
				element: <ProfilePage />,
			},
		],
	},
	{
		path: "/settings",
		element: (
			<RequireAuth>
				<IndexPage />
			</RequireAuth>
		),
		loader: indexPageLoader,
		children: [
			{
				index: true,
				element: <SettingsPage />,
			},
		],
	},
]);

const AppRouter = () => {
	return <RouterProvider router={router} />;
};

export default AppRouter;
