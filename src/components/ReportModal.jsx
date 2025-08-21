
import React, { useState, useCallback } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { reportAPI } from '../config/ApiConfig';

const ReportModal = ({ show, onHide, contentType, contentId, contentAuthor }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reportReasons = [
    { value: 'spam', label: 'Spam or unwanted content' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'hate_speech', label: 'Hate speech or discrimination' },
    { value: 'violence', label: 'Violence or threats' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'misinformation', label: 'False or misleading information' },
    { value: 'copyright', label: 'Copyright infringement' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!reason) {
      setError('Please select a reason for reporting');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      await reportAPI.createReport({
        contentType,
        contentId,
        reason,
        description: description.trim()
      });
      
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [contentType, contentId, reason, description]);

  const handleClose = useCallback(() => {
    if (!submitting) {
      setReason('');
      setDescription('');
      setError('');
      setSuccess(false);
      onHide();
    }
  }, [submitting, onHide]);

  if (success) {
    return (
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Body className="text-center py-4">
          <div className="text-success mb-3">
            <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem' }}></i>
          </div>
          <h5>Report Submitted</h5>
          <p className="text-muted">
            Thank you for reporting this content. We'll review it and take appropriate action.
          </p>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Report {contentType}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Why are you reporting this {contentType}?</Form.Label>
            {reportReasons.map(({ value, label }) => (
              <Form.Check
                key={value}
                type="radio"
                id={`reason-${value}`}
                label={label}
                name="reason"
                value={value}
                checked={reason === value}
                onChange={(e) => setReason(e.target.value)}
              />
            ))}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Additional details (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about why you're reporting this content..."
              maxLength={500}
            />
            <Form.Text className="text-muted">
              {description.length}/500 characters
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleSubmit} disabled={!reason || submitting}>
          {submitting ? <Spinner size="sm" /> : 'Submit Report'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReportModal;
