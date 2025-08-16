/** @format */

import { Modal, Button } from "react-bootstrap";

export default function AlertDialog({ title, message, dialogButtonMessage, onDialogButtonClick, type = "dark", ...props }) {
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
					onClick={props.onHide}>
					Cancel
				</Button>
				<Button
					variant={type}
					onClick={onDialogButtonClick}>
					{dialogButtonMessage}
				</Button>
			</Modal.Footer>
		</Modal>
	);
}
