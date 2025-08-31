
/** @format */

import React, { useState, useRef, useCallback } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const ImageCropper = ({ show, onHide, imageSrc, onCropComplete, aspectRatio = 1 }) => {
	const [crop, setCrop] = useState({
		unit: '%',
		width: 90,
		height: 90,
		x: 5,
		y: 5
	});
	const [completedCrop, setCompletedCrop] = useState(null);
	const imgRef = useRef(null);
	const [error, setError] = useState('');

	const onImageLoad = useCallback((e) => {
		const { width, height } = e.currentTarget;
		const cropSize = Math.min(width, height) * 0.9;
		const cropX = (width - cropSize) / 2 / width * 100;
		const cropY = (height - cropSize) / 2 / height * 100;
		const cropSizePercent = cropSize / Math.max(width, height) * 100;

		setCrop({
			unit: '%',
			width: cropSizePercent,
			height: cropSizePercent,
			x: cropX,
			y: cropY
		});
	}, []);

	const getCroppedImg = useCallback((image, crop) => {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			throw new Error('No 2d context');
		}

		const scaleX = image.naturalWidth / image.width;
		const scaleY = image.naturalHeight / image.height;
		const pixelRatio = window.devicePixelRatio;

		canvas.width = crop.width * pixelRatio;
		canvas.height = crop.height * pixelRatio;

		ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
		ctx.imageSmoothingQuality = 'high';

		ctx.drawImage(
			image,
			crop.x * scaleX,
			crop.y * scaleY,
			crop.width * scaleX,
			crop.height * scaleY,
			0,
			0,
			crop.width,
			crop.height
		);

		return new Promise((resolve) => {
			canvas.toBlob((blob) => {
				resolve(blob);
			}, 'image/jpeg', 0.95);
		});
	}, []);

	const handleCropConfirm = useCallback(async () => {
		if (!completedCrop || !imgRef.current) {
			setError('Please select a crop area');
			return;
		}

		try {
			setError('');
			const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
			const croppedFile = new File([croppedImageBlob], 'profile-image.jpg', {
				type: 'image/jpeg'
			});
			onCropComplete(croppedFile);
			onHide();
		} catch (err) {
			console.error('Error cropping image:', err);
			setError('Failed to crop image');
		}
	}, [completedCrop, getCroppedImg, onCropComplete, onHide]);

	return (
		<Modal show={show} onHide={onHide} size="lg" centered>
			<Modal.Header closeButton>
				<Modal.Title>Crop Profile Picture</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{error && (
					<Alert variant="danger" className="mb-3">
						{error}
					</Alert>
				)}
				<div className="text-center">
					<ReactCrop
						crop={crop}
						onChange={(newCrop) => setCrop(newCrop)}
						onComplete={(c) => setCompletedCrop(c)}
						aspect={aspectRatio}
						circularCrop
						style={{ maxHeight: '400px' }}
					>
						<img
							ref={imgRef}
							src={imageSrc}
							alt="Crop preview"
							onLoad={onImageLoad}
							style={{ maxWidth: '100%', maxHeight: '400px' }}
						/>
					</ReactCrop>
				</div>
				<div className="mt-3 text-muted small text-center">
					Drag to select the area you want to use as your profile picture
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={onHide}>
					Cancel
				</Button>
				<Button variant="primary" onClick={handleCropConfirm}>
					Apply Crop
				</Button>
			</Modal.Footer>
		</Modal>
	);
};

export default ImageCropper;
