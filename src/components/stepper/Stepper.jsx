
/** @format */

import React from "react";

const Stepper = ({ steps, currentStep }) => {
	return (
		<div className="stepper-container mb-4">
			{/* Mobile view - show only current step */}
			<div className="d-block d-md-none text-center">
				<div className="mb-2">
					<span className="badge bg-primary fs-6 px-3 py-2">
						Step {currentStep + 1} of {steps.length}
					</span>
				</div>
				<h6 className="text-primary mb-0">{steps[currentStep]}</h6>
			</div>

			{/* Desktop view - show all steps */}
			<div className="d-none d-md-flex justify-content-between align-items-center position-relative">
				{steps.map((step, index) => {
					const isActive = index === currentStep;
					const isCompleted = index < currentStep;

					return (
						<div
							key={index}
							className="text-center position-relative"
							style={{ 
								flex: "1",
								minWidth: "60px"
							}}
						>
							{/* Step circle */}
							<div
								className={`rounded-circle border border-2 d-inline-flex align-items-center justify-content-center fw-bold ${
									isActive
										? "border-primary bg-primary text-white"
										: isCompleted
										? "border-success bg-success text-white"
										: "border-secondary text-secondary bg-white"
								}`}
								style={{
									width: "40px",
									height: "40px",
									fontSize: "14px",
									position: "relative",
									zIndex: 2
								}}
							>
								{isCompleted ? "✓" : index + 1}
							</div>

							{/* Step label */}
							<div
								className={`mt-2 small ${
									isActive
										? "fw-bold text-primary"
										: isCompleted
										? "text-success"
										: "text-muted"
								}`}
								style={{ 
									fontSize: "12px",
									lineHeight: "1.2"
								}}
							>
								{step}
							</div>

							{/* Connector line */}
							{index < steps.length - 1 && (
								<div
									className="position-absolute"
									style={{
										top: "20px",
										left: "50%",
										right: `-${100 / (steps.length - 1)}%`,
										height: "2px",
										backgroundColor: isCompleted ? "#198754" : "#dee2e6",
										zIndex: 1,
										transform: "translateY(-50%)"
									}}
								></div>
							)}
						</div>
					);
				})}
			</div>

			{/* Progress bar for mobile */}
			<div className="d-block d-md-none mt-3">
				<div className="progress" style={{ height: "4px" }}>
					<div
						className="progress-bar bg-primary"
						role="progressbar"
						style={{
							width: `${((currentStep + 1) / steps.length) * 100}%`
						}}
						aria-valuenow={currentStep + 1}
						aria-valuemin="0"
						aria-valuemax={steps.length}
					></div>
				</div>
			</div>
		</div>
	);
};

export default Stepper;
