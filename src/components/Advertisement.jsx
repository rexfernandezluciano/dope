
/** @format */

import React, { useState, useEffect } from "react";
import { Card, Image, Button } from "react-bootstrap";
import { X } from "react-bootstrap-icons";

const Advertisement = ({ onClose }) => {
	const [ads, setAds] = useState([]);
	const [currentAd, setCurrentAd] = useState(null);

	useEffect(() => {
		// Mock advertisement data - replace with actual API call
		const mockAds = [
			{
				id: "ad1",
				title: "Boost Your Productivity",
				description: "Try our new productivity app - get 30% off for new users!",
				imageUrl: "https://via.placeholder.com/400x200/007bff/white?text=Productivity+App",
				ctaText: "Learn More",
				ctaUrl: "https://example.com/productivity",
				sponsor: "ProductivityCorp"
			},
			{
				id: "ad2",
				title: "Learn to Code",
				description: "Master programming with our interactive courses. Start your journey today!",
				imageUrl: "https://via.placeholder.com/400x200/28a745/white?text=Coding+Course",
				ctaText: "Start Learning",
				ctaUrl: "https://example.com/coding",
				sponsor: "CodeAcademy"
			},
			{
				id: "ad3",
				title: "Professional Design Tools",
				description: "Create stunning designs with our professional toolkit. Free trial available!",
				imageUrl: "https://via.placeholder.com/400x200/17a2b8/white?text=Design+Tools",
				ctaText: "Try Free",
				ctaUrl: "https://example.com/design",
				sponsor: "DesignPro"
			}
		];

		setAds(mockAds);
		// Select a random ad
		const randomAd = mockAds[Math.floor(Math.random() * mockAds.length)];
		setCurrentAd(randomAd);
	}, []);

	const handleAdClick = (url) => {
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	const handleClose = () => {
		if (onClose) {
			onClose();
		}
	};

	if (!currentAd) return null;

	return (
		<Card className="mb-3 border-0 border-bottom rounded-0 position-relative">
			<div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 1 }}>
				<Button
					variant="link"
					size="sm"
					className="text-muted p-1 rounded-circle"
					onClick={handleClose}
					style={{ width: "24px", height: "24px" }}
				>
					<X size={12} />
				</Button>
			</div>
			
			<Card.Body className="px-3 py-2">
				<div className="small text-muted mb-2">
					Sponsored · {currentAd.sponsor}
				</div>
				
				<div 
					className="cursor-pointer"
					onClick={() => handleAdClick(currentAd.ctaUrl)}
				>
					{currentAd.imageUrl && (
						<Image
							src={currentAd.imageUrl}
							alt={currentAd.title}
							className="w-100 rounded mb-2"
							style={{ height: "150px", objectFit: "cover" }}
						/>
					)}
					
					<h6 className="fw-bold mb-1">{currentAd.title}</h6>
					<p className="text-muted mb-2 small">{currentAd.description}</p>
					
					<Button
						variant="outline-primary"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							handleAdClick(currentAd.ctaUrl);
						}}
					>
						{currentAd.ctaText}
					</Button>
				</div>
			</Card.Body>
		</Card>
	);
};

export default Advertisement;
