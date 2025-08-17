/** @format */

import { getUser } from "../../utils/app-utils";

const indexPageLoader = async () => {
	try {
		const user = await getUser();
		return { user };
	} catch (error) {
		console.error("Error loading user:", error);
		return { user: null };
	}
};

export default indexPageLoader;