/** @format */

import { useParams } from "react-router-dom";

const ProfilePage = () => {
	const { username } = useParams();
	return <div className="mt-3 px-3">Coming Soon, @{username}!</div>;
};

export default ProfilePage;
