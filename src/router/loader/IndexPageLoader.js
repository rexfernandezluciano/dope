/** @format */

import { getUser } from "../../utils/app-utils";

const IndexPageLoader = async () => {
	try {
		const user = await getUser();
		return { user };
	} catch (e) {
		return null;
	}
};

export default IndexPageLoader;
