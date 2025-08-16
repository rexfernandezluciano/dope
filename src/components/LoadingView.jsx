/** @format */

import { Spinner } from "react-bootstrap";

const LoadingView = () => {
	return (
		<div className="d-flex align-items-center justify-content-center min-vh-100">
			<Spinner
				animation="border"
				variant="primary"
				size="md"
			/>
		</div>
	);
};

export default LoadingView;
