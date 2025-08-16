/** @format */

import React from "react";

const Stepper = ({ steps, currentStep }) => {
	return (
		<div className="d-flex justify-content-between align-items-center mb-4">
			{steps.map((step, index) => {
				const isActive = index === currentStep;
				const isCompleted = index < currentStep;

				return (
					<div
						key={index}
						className="text-center flex-fill"
						style={{ position: "relative" }}
					>
						<div
							className={`rounded-circle border border-2 ${
								isActive
									? "border-primary bg-primary text-white"
									: isCompleted
									? "border-success bg-success text-white"
									: "border-secondary text-secondary"
							}`}
							style={{
								width: "40px",
								height: "40px",
								lineHeight: "38px",
								margin: "0 auto",
								fontWeight: "bold",
							}}
						>
							{index + 1}
						</div>
						<small
							className={`d-block mt-2 ${
								isActive
									? "fw-bold text-primary"
									: isCompleted
									? "text-success"
									: "text-muted"
							}`}
						>
							{step}
						</small>

						{/* Connector line */}
						{index < steps.length - 1 && (
							<div
								style={{
									position: "absolute",
									top: "20px",
									left: "50%",
									width: "100%",
									height: "2px",
									backgroundColor: isCompleted
										? "#198754"
										: "#dee2e6",
									zIndex: -1,
								}}
							></div>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default Stepper;