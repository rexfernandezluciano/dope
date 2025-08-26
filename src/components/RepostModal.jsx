
import React, { useState, useCallback } from 'react';
import { Modal, Form, Button, Spinner, Image } from 'react-bootstrap';
import { MentionsInput, Mention } from "react-mentions";
import { userAPI } from "../config/ApiConfig";

const RepostModal = ({ show, onHide, onRepost, post, currentUser, loading = false }) => {
  const [content, setContent] = useState('');

  // Function to search for users for mentions
  const searchMentionUsers = useCallback(async (query, callback) => {
    if (!query) {
      callback([]);
      return;
    }

    try {
      const users = await userAPI.searchUsers(query);

      const mentionData = users.map((user) => ({
        id: user.uid,
        display: user.username || user.name,
        name: user.name,
        username: user.username,
        photoURL: user.photoURL,
      }));

      callback(mentionData);
    } catch (error) {
      console.error("Error searching users:", error);
      callback([]);
    }
  }, []);

  const handleContentChange = useCallback(
    (event, newValue, newPlainTextValue, mentions) => {
      setContent(newValue);
    },
    [],
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onRepost(content);
  };

  const handleClose = () => {
    setContent('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" className="d-md-flex">
      <style>
        {`
          @media (min-width: 768px) {
            .modal.d-md-flex .modal-dialog {
              max-width: 100% !important;
              width: 100% !important;
              height: 100vh !important;
              margin: 0 !important;
            }
            .modal.d-md-flex .modal-content {
              height: 100% !important;
              border-radius: 0 !important;
            }
          }
        `}
      </style>
      <Modal.Header closeButton>
        <Modal.Title>Repost</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Add a comment <span className="text-danger">*</span></Form.Label>
            <div style={{ border: '1px solid #ced4da', borderRadius: '0.375rem', padding: '0.375rem 0.75rem', minHeight: '76px' }}>
              <MentionsInput
                value={content}
                onChange={handleContentChange}
                placeholder="What do you think about this? (Required)"
                style={{
                  control: {
                    backgroundColor: "transparent",
                    fontSize: "14px",
                    lineHeight: "20px",
                    minHeight: "60px",
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                  },
                  "&multiLine": {
                    control: {
                      fontFamily: "inherit",
                      minHeight: "60px",
                      border: "none",
                      outline: "none",
                    },
                    highlighter: {
                      padding: 0,
                      border: "none",
                    },
                    input: {
                      padding: 0,
                      border: "none",
                      outline: "none",
                      fontSize: "14px",
                      lineHeight: "20px",
                      resize: "none",
                      maxHeight: "100px",
                      overflowY: "auto",
                    },
                  },
                  suggestions: {
                    list: {
                      backgroundColor: "white",
                      border: "1px solid #dee2e6",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      fontSize: "14px",
                      maxHeight: "200px",
                      overflowY: "auto",
                    },
                    item: {
                      padding: "8px 12px",
                      borderBottom: "1px solid #f8f9fa",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      "&focused": {
                        backgroundColor: "#e3f2fd",
                      },
                    },
                  },
                }}
                allowSpaceInQuery={true}
              >
                <Mention
                  trigger="@"
                  data={searchMentionUsers}
                  displayTransform={(id, display) => `@${display}`}
                  markup="@[__display__](__id__)"
                  renderSuggestion={(entry, search, highlightedDisplay, index, focused) => (
                    <div className="d-flex align-items-center gap-2">
                      <Image
                        src={entry.photoURL || "https://i.pravatar.cc/150?img=10"}
                        alt="avatar"
                        roundedCircle
                        width="24"
                        height="24"
                        style={{ objectFit: "cover" }}
                      />
                      <div className="flex-grow-1">
                        <div className="fw-bold small">{entry.name}</div>
                        <small className="text-muted">@{entry.username}</small>
                      </div>
                    </div>
                  )}
                  style={{
                    backgroundColor: "#e3f2fd",
                    color: "#1976d2",
                    fontWeight: "bold",
                  }}
                />
              </MentionsInput>
            </div>
            <Form.Text className="text-muted">
              {content.replace(/@\[[^\]]+\]\([^)]+\)/g, (match) => {
                const display = match.match(/@\[([^\]]+)\]/)?.[1];
                return `@${display}`;
              }).length}/280 characters
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
              disabled={loading || !content.trim() || content.replace(/@\[[^\]]+\]\([^)]+\)/g, '').trim().length === 0}
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
