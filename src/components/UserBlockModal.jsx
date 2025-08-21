
import React, { useState, useCallback } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { blockAPI } from '../config/ApiConfig';

const UserBlockModal = ({ show, onHide, user, onBlockUser }) => {
  const [blocking, setBlocking] = useState(false);
  const [restricting, setRestricting] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [error, setError] = useState('');

  const handleBlock = useCallback(async () => {
    if (!user) return;

    try {
      setBlocking(true);
      setError('');
      await blockAPI.blockUser(user.uid);
      onBlockUser?.(user.uid, 'blocked');
      onHide();
    } catch (err) {
      setError(err.message);
    } finally {
      setBlocking(false);
    }
  }, [user, onBlockUser, onHide]);

  const handleRestrict = useCallback(async () => {
    if (!user || !restrictionReason.trim()) return;

    try {
      setRestricting(true);
      setError('');
      await blockAPI.restrictUser(user.uid, restrictionReason.trim());
      onBlockUser?.(user.uid, 'restricted');
      onHide();
    } catch (err) {
      setError(err.message);
    } finally {
      setRestricting(false);
    }
  }, [user, restrictionReason, onBlockUser, onHide]);

  const handleClose = useCallback(() => {
    if (!blocking && !restricting) {
      setError('');
      setRestrictionReason('');
      onHide();
    }
  }, [blocking, restricting, onHide]);

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Block User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <div className="mb-3">
          <h6>Block {user?.name || 'this user'}?</h6>
          <p className="text-muted small">
            When you block someone, they won't be able to see your posts, follow you, or send you messages.
          </p>
        </div>

        <div className="mb-3">
          <h6>Or restrict instead:</h6>
          <p className="text-muted small">
            Restricting limits their interaction with your content without fully blocking them.
          </p>
          <Form.Group>
            <Form.Label>Restriction Reason</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={restrictionReason}
              onChange={(e) => setRestrictionReason(e.target.value)}
              placeholder="Optional: Why are you restricting this user?"
            />
          </Form.Group>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={blocking || restricting}>
          Cancel
        </Button>
        <Button 
          variant="warning" 
          onClick={handleRestrict} 
          disabled={!restrictionReason.trim() || blocking || restricting}
        >
          {restricting ? <Spinner size="sm" /> : 'Restrict User'}
        </Button>
        <Button variant="danger" onClick={handleBlock} disabled={blocking || restricting}>
          {blocking ? <Spinner size="sm" /> : 'Block User'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserBlockModal;
