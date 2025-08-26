
import React, { useState } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';

const RepostModal = ({ show, onHide, onRepost, post, currentUser, loading = false }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onRepost(content);
  };

  const handleClose = () => {
    setContent('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Repost</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Add a comment <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you think about this? (Required)"
              maxLength={280}
            />
            <Form.Text className="text-muted">
              {content.length}/280 characters
            </Form.Text>
          </Form.Group>
          
          {/* Original post preview */}
          <div className="border rounded p-3 mb-3 bg-light">
            <div className="d-flex align-items-center gap-2 mb-2">
              <img
                src={post?.author?.photoURL || "https://i.pravatar.cc/150?img=10"}
                alt="avatar"
                className="rounded-circle"
                width="24"
                height="24"
                style={{ objectFit: "cover" }}
              />
              <span className="fw-bold small">{post?.author?.name}</span>
              <span className="text-muted small">@{post?.author?.username}</span>
            </div>
            <div className="small">
              {post?.content && post.content.length > 100 
                ? `${post.content.substring(0, 100)}...` 
                : post?.content}
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading || !content.trim()}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Reposting...
                </>
              ) : (
                'Repost'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default RepostModal;
