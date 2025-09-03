/** @format */

import { getUser } from "../../utils/app-utils.js";

const IndexPageLoader = async () => {
	try {
		const user = await getUser();
		return { user };
	} catch (error) {
		console.error("Error loading user:", error);
		return { user: null, error: error.message };
	}
};

export { IndexPageLoader };
export default IndexPageLoader;
