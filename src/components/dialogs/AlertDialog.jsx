/** @format */

import { Modal, Button, Spinner } from "react-bootstrap";

export default function AlertDialog({ title, message, dialogButtonMessage, onDialogButtonClick, type = "primary", disabled = false, ...props }) {
	return (
		<Modal
			{...props}
			size="md"
			aria-labelledby="contained-modal-title-vcenter"
			centered>
			<Modal.Header closeButton>
				<Modal.Title id="contained-modal-title-vcenter">{title}</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<p>{message}</p>
			</Modal.Body>
			<Modal.Footer>
				<Button
					variant="outline-secondary"
					onClick={props.onHide}
					disabled={disabled}>
					Cancel
				</Button>
				<Button
					variant={type}
					onClick={onDialogButtonClick}
					disabled={disabled}>
					{disabled && <Spinner size="sm" animation="border" className="me-2" />}
					{dialogButtonMessage}
				</Button>
			</Modal.Footer>
		</Modal>
	);
}