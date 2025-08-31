import React, { useState, useCallback } from 'react';
import { Modal, Form, Button, Spinner, Image, Alert } from 'react-bootstrap';
import { MentionsInput, Mention } from "react-mentions";
import { userAPI } from "../config/ApiConfig";

const RepostModal = ({ show, onHide, onRepost, post, currentUser, loading = false }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Get the actual post to repost - if it's already a repost, use the original
  const actualPostToRepost = post?.isRepost && post?.originalPost ? post.originalPost : post;

  // Function to search for users for mentions
  const searchMentionUsers = useCallback(async (query, callback) => {
    if (!query) {
      callback([]);
      return;
    }

    try {
      const users = await userAPI.searchUsers(query);
      let foundUsers = users || [];

      // Include current user in results if they match the query and currentUser exists
      if (window.currentUser && window.currentUser.username && window.currentUser.name) {
        const queryLower = query.toLowerCase();
        const matchesUsername = window.currentUser.username.toLowerCase().includes(queryLower);
        const matchesName = window.currentUser.name.toLowerCase().includes(queryLower);

        if ((matchesUsername || matchesName) && !foundUsers.some(u => u.uid === window.currentUser.uid)) {
          foundUsers = [window.currentUser, ...foundUsers];
        }
      }

      const mentionData = foundUsers.map((user) => ({
        id: user.uid,
        display: user.name || user.displayName || user.username || 'Unknown User',
        name: user.name || user.displayName || 'Unknown User',
        username: user.username,
        photoURL: user.photoURL,
        hasBlueCheck: user.hasBlueCheck || false
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.replace(/@\[[^\]]+\]\([^)]+\)/g, '').trim().length === 0) {
      setError('Content is required to repost');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      // Pass the actual post ID to repost (original post if this is a repost)
      await onRepost(content, actualPostToRepost?.id);
      handleClose();
    } catch (err) {
      console.error('Repost failed:', err);
      setError(err.message || 'Failed to repost. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setError('');
    setSubmitting(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered fullscreen="md-down" size="lg" className="d-md-flex" style={{ zIndex: 1080 }}>
      <Modal.Header closeButton>
        <Modal.Title>Repost</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
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
                      {entry.hasBlueCheck && (
                        <img
                          src="path/to/check-circle-fill.svg" // Replace with actual path to the icon
                          alt="Verified"
                          width="16"
                          height="16"
                        />
                      )}
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
                src={actualPostToRepost?.author?.photoURL || "https://i.pravatar.cc/150?img=10"}
                alt="avatar"
                className="rounded-circle"
                width="24"
                height="24"
                style={{ objectFit: "cover" }}
              />
              <span className="fw-bold small">{actualPostToRepost?.author?.name}</span>
              <span className="text-muted small">@{actualPostToRepost?.author?.username}</span>
            </div>
            
            {/* Post content */}
            {actualPostToRepost?.content && (
              <div className="small mb-2">
                {actualPostToRepost.content.length > 100 
                  ? `${actualPostToRepost.content.substring(0, 100)}...` 
                  : actualPostToRepost.content}
              </div>
            )}

            {/* Images preview */}
            {actualPostToRepost?.imageUrls && actualPostToRepost.imageUrls.length > 0 && (
              <div className="mb-2">
                {actualPostToRepost.imageUrls.length === 1 ? (
                  <Image
                    src={actualPostToRepost.imageUrls[0]}
                    className="rounded w-100"
                    style={{
                      height: "150px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div className="d-flex gap-1" style={{ height: "150px" }}>
                    <div style={{ flex: "2" }}>
                      <Image
                        src={actualPostToRepost.imageUrls[0]}
                        className="rounded w-100 h-100"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    {actualPostToRepost.imageUrls.length > 1 && (
                      <div className="d-flex flex-column gap-1" style={{ flex: "1" }}>
                        <div style={{ height: actualPostToRepost.imageUrls.length > 2 ? "calc(50% - 2px)" : "100%" }}>
                          <Image
                            src={actualPostToRepost.imageUrls[1]}
                            className="rounded w-100 h-100"
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        {actualPostToRepost.imageUrls.length > 2 && (
                          <div style={{ height: "calc(50% - 2px)" }} className="position-relative">
                            <Image
                              src={actualPostToRepost.imageUrls[2]}
                              className="rounded w-100 h-100"
                              style={{ objectFit: "cover" }}
                            />
                            {actualPostToRepost.imageUrls.length > 3 && (
                              <div
                                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded"
                                style={{
                                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                                  color: "white",
                                  fontWeight: "bold",
                                  fontSize: "0.8rem",
                                }}
                              >
                                +{actualPostToRepost.imageUrls.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Poll preview */}
            {actualPostToRepost?.poll && (
              <div className="border rounded p-2 mb-2 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <small className="fw-bold text-muted">📊 Poll</small>
                  <small className="text-muted">
                    {actualPostToRepost.poll.isExpired ? 'Ended' : 
                     actualPostToRepost.poll.expiresAt ? 
                     `${Math.max(0, Math.floor((new Date(actualPostToRepost.poll.expiresAt) - new Date()) / (1000 * 60 * 60)))}h left` : 
                     'Active'}
                  </small>
                </div>
                {actualPostToRepost.poll.options?.slice(0, 2).map((option, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-truncate" style={{ maxWidth: "70%" }}>
                      {option.text}
                    </small>
                    <small className="text-muted">
                      {option.percentage || 0}%
                    </small>
                  </div>
                ))}
                {actualPostToRepost.poll.options?.length > 2 && (
                  <small className="text-muted">
                    +{actualPostToRepost.poll.options.length - 2} more options
                  </small>
                )}
                <div className="text-muted small mt-1">
                  {actualPostToRepost.poll.totalVotes || 0} votes
                </div>
              </div>
            )}

            {post?.isRepost && (
              <div className="mt-2 pt-2 border-top">
                <small className="text-muted">
                  <i>Originally posted by {actualPostToRepost?.author?.name}</i>
                </small>
              </div>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={submitting || loading}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={submitting || loading || !content.trim() || content.replace(/@\[[^\]]+\]\([^)]+\)/g, '').trim().length === 0}
            >
              {(submitting || loading) ? (
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