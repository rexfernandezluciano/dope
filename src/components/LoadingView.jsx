/** @format */

const LoadingView = () => {
	return (
		<div className="d-flex align-items-center justify-content-center min-vh-100">
			<div 
				className="spinner-border text-primary" 
				role="status"
				style={{ width: '2rem', height: '2rem' }}
			>
				<span className="visually-hidden">Loading...</span>
			</div>
		</div>
	);
};

export default LoadingView;
