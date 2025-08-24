
import React, { useState, useCallback } from 'react';
import { Image, Button, Form, Collapse, Badge, Modal, InputGroup } from 'react-bootstrap';
import { Heart, HeartFill, ChatDots, CheckCircleFill, PencilSquare, Trash, Gift, CurrencyDollar } from 'react-bootstrap-icons';
import { formatTimeAgo } from '../utils/common-utils';
import { parseTextContent } from '../utils/text-utils';
import { commentAPI } from '../config/ApiConfig';

const CommentItem = ({
  comment,
  currentUser,
  onLike,
  onReply,
  onUpdateComment,
  onDeleteComment,
  onHashtagClick,
  onMentionClick,
  onLinkClick,
  navigate,
  isLast = false,
  level = 0
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const handleLikeComment = useCallback(async (e) => {
    e.stopPropagation();
    if (onLike && currentUser) {
      await onLike(comment.id);
    }
  }, [onLike, comment.id, currentUser]);

  const handleReplySubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !onReply) return;

    try {
      setSubmittingReply(true);
      await onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setShowReplyForm(false);
      setShowReplies(true);
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  }, [replyContent, onReply, comment.id]);

  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    try {
      await commentAPI.updateComment(comment.id, { content: editContent.trim() });
      if (onUpdateComment) {
        onUpdateComment(comment.id, editContent.trim());
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  }, [editContent, comment.id, onUpdateComment]);

  const handleTipSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!tipAmount || !currentUser) return;

    try {
      setSubmittingPayment(true);
      const response = await commentAPI.createComment(comment.postId, {
        content: tipMessage || `Sent a tip of ₱${(parseInt(tipAmount) / 100).toFixed(2)}!`,
        tipAmount: parseInt(tipAmount),
        receiverId: comment.author.uid
      });
      
      setShowTipModal(false);
      setTipAmount('');
      setTipMessage('');
      
      // Refresh comments or show success message
      if (onReply) {
        await onReply(comment.id, response.content, 'tip');
      }
    } catch (error) {
      console.error('Failed to send tip:', error);
    } finally {
      setSubmittingPayment(false);
    }
  }, [tipAmount, tipMessage, currentUser, comment, onReply]);

  const handleDonationSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!donationAmount || !currentUser) return;

    try {
      setSubmittingPayment(true);
      const response = await commentAPI.createComment(comment.postId, {
        content: donationMessage || `Sent a donation of ₱${(parseInt(donationAmount) / 100).toFixed(2)}!`,
        donationAmount: parseInt(donationAmount),
        receiverId: comment.author.uid,
        isAnonymous
      });
      
      setShowDonationModal(false);
      setDonationAmount('');
      setDonationMessage('');
      setIsAnonymous(false);
      
      // Refresh comments or show success message
      if (onReply) {
        await onReply(comment.id, response.content, 'donation');
      }
    } catch (error) {
      console.error('Failed to send donation:', error);
    } finally {
      setSubmittingPayment(false);
    }
  }, [donationAmount, donationMessage, isAnonymous, currentUser, comment, onReply]);

  const isLiked = comment.likes?.some(like => like.user?.uid === currentUser?.uid) || comment.isLiked;
  const likesCount = comment.likes?.length || comment.stats?.likes || 0;
  const repliesCount = comment.replies?.length || comment.stats?.replies || 0;
  const isCommentOwner = comment.author?.uid === currentUser?.uid;

  // Calculate total tips received for this comment author
  const totalTipsReceived = comment.tipsReceived || 0;

  return (
    <div className={`comment-item ${isLast && level === 0 ? "mb-0" : "mb-2"} ${level > 0 ? "ms-3 ps-3 border-start" : ""}`}>
      <div className="d-flex gap-2">
        <Image
          src={comment.author?.photoURL || "https://i.pravatar.cc/150?img=10"}
          alt="avatar"
          roundedCircle
          width={level > 0 ? "28" : "32"}
          height={level > 0 ? "28" : "32"}
          className="comment-avatar"
          style={{
            objectFit: "cover",
            minWidth: level > 0 ? "28px" : "32px",
            minHeight: level > 0 ? "28px" : "32px",
          }}
        />
        <div className="comment-content flex-grow-1">
          <div className="d-flex align-items-center gap-1">
            <span
              className="fw-bold small"
              style={{ cursor: "pointer", color: "inherit" }}
              onClick={(e) => {
                e.stopPropagation();
                if (comment.author?.username) {
                  navigate(`/${comment.author.username}`);
                }
              }}
            >
              {comment.author?.name || 'Unknown User'}
            </span>
            {comment.author?.hasBlueCheck && (
              <CheckCircleFill className="text-primary" size={12} />
            )}
            
            {/* Display membership badge */}
            {comment.author?.membership?.subscription && comment.author.membership.subscription !== 'free' && (
              <Badge 
                bg={comment.author.membership.subscription === 'premium' ? 'warning' : 'primary'} 
                className="text-dark"
                style={{ fontSize: '0.6rem' }}
              >
                {comment.author.membership.subscription.toUpperCase()}
              </Badge>
            )}
            
            <span className="text-muted small">·</span>
            <span className="text-muted small">
              {formatTimeAgo(comment.createdAt)}
            </span>
            
            {/* Show if comment was edited */}
            {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
              <>
                <span className="text-muted small">·</span>
                <span className="text-muted small">edited</span>
              </>
            )}
          </div>

          {/* Tips/Donations received display */}
          {totalTipsReceived > 0 && (
            <div className="mb-1">
              <Badge bg="success" className="small">
                <CurrencyDollar size={10} className="me-1" />
                ₱{(totalTipsReceived / 100).toFixed(2)} received
              </Badge>
            </div>
          )}

          {/* Comment content or edit form */}
          {isEditing ? (
            <Form onSubmit={handleEditSubmit} className="mb-2">
              <Form.Control
                as="textarea"
                rows={2}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="border-0 shadow-none resize-none small"
              />
              <div className="d-flex justify-content-end gap-2 mt-1">
                <Button
                  variant="link"
                  size="sm"
                  className="text-muted p-1"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!editContent.trim()}
                  className="px-3"
                >
                  Save
                </Button>
              </div>
            </Form>
          ) : (
            <div className="mb-1 small">
              {parseTextContent(comment.content, {
                onHashtagClick,
                onMentionClick,
                onLinkClick,
              })}
            </div>
          )}

          {/* Payment indicators */}
          {comment.tipAmount && (
            <div className="mb-1">
              <Badge bg="warning" text="dark" className="small">
                <Gift size={10} className="me-1" />
                Tip: ₱{(comment.tipAmount / 100).toFixed(2)}
              </Badge>
            </div>
          )}
          
          {comment.donationAmount && (
            <div className="mb-1">
              <Badge bg="info" className="small">
                <CurrencyDollar size={10} className="me-1" />
                Donation: ₱{(comment.donationAmount / 100).toFixed(2)}
              </Badge>
            </div>
          )}

          {/* Comment Actions */}
          <div className="d-flex align-items-center gap-3 mt-1">
            <Button
              variant="link"
              size="sm"
              className="p-0 border-0 d-flex align-items-center gap-1"
              style={{
                color: isLiked ? "#dc3545" : "#6c757d",
                fontSize: "0.75rem",
              }}
              onClick={handleLikeComment}
            >
              {isLiked ? <HeartFill size={12} /> : <Heart size={12} />}
              {likesCount > 0 && <span>{likesCount}</span>}
            </Button>

            <Button
              variant="link"
              size="sm"
              className="p-0 border-0 d-flex align-items-center gap-1 text-muted"
              style={{ fontSize: "0.75rem" }}
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <ChatDots size={12} />
              Reply
            </Button>

            {/* Tip button (only for others' comments) */}
            {!isCommentOwner && currentUser && (
              <Button
                variant="link"
                size="sm"
                className="p-0 border-0 d-flex align-items-center gap-1 text-muted"
                style={{ fontSize: "0.75rem" }}
                onClick={() => setShowTipModal(true)}
              >
                <Gift size={12} />
                Tip
              </Button>
            )}

            {/* Donation button (only for others' comments) */}
            {!isCommentOwner && currentUser && (
              <Button
                variant="link"
                size="sm"
                className="p-0 border-0 d-flex align-items-center gap-1 text-muted"
                style={{ fontSize: "0.75rem" }}
                onClick={() => setShowDonationModal(true)}
              >
                <CurrencyDollar size={12} />
                Donate
              </Button>
            )}

            {/* Edit button (only for comment owner) */}
            {isCommentOwner && (
              <Button
                variant="link"
                size="sm"
                className="p-0 border-0 d-flex align-items-center gap-1 text-muted"
                style={{ fontSize: "0.75rem" }}
                onClick={() => setIsEditing(true)}
              >
                <PencilSquare size={12} />
                Edit
              </Button>
            )}

            {/* Delete button (only for comment owner) */}
            {isCommentOwner && onDeleteComment && (
              <Button
                variant="link"
                size="sm"
                className="p-0 border-0 d-flex align-items-center gap-1 text-danger"
                style={{ fontSize: "0.75rem" }}
                onClick={() => onDeleteComment(comment.id)}
              >
                <Trash size={12} />
                Delete
              </Button>
            )}

            {repliesCount > 0 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 border-0 text-muted"
                style={{ fontSize: "0.75rem" }}
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? 'Hide' : 'Show'} {repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>

          {/* Reply Form */}
          <Collapse in={showReplyForm}>
            <div className="mt-2">
              <Form onSubmit={handleReplySubmit}>
                <div className="d-flex gap-2 align-items-start">
                  <Image
                    src={currentUser?.photoURL || "https://i.pravatar.cc/150?img=10"}
                    alt="avatar"
                    roundedCircle
                    width="24"
                    height="24"
                    style={{ objectFit: "cover" }}
                  />
                  <div className="flex-grow-1">
                    <Form.Control
                      as="textarea"
                      rows={1}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="border-0 shadow-none resize-none"
                      style={{ fontSize: "0.875rem" }}
                    />
                    <div className="d-flex justify-content-end gap-2 mt-1">
                      <Button
                        variant="link"
                        size="sm"
                        className="text-muted p-1"
                        onClick={() => {
                          setShowReplyForm(false);
                          setReplyContent('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!replyContent.trim() || submittingReply}
                        className="px-3"
                      >
                        {submittingReply ? 'Replying...' : 'Reply'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Form>
            </div>
          </Collapse>

          {/* Replies */}
          <Collapse in={showReplies}>
            <div className="mt-2">
              {comment.replies?.map((reply, index) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUser={currentUser}
                  onLike={onLike}
                  onReply={onReply}
                  onUpdateComment={onUpdateComment}
                  onDeleteComment={onDeleteComment}
                  onHashtagClick={onHashtagClick}
                  onMentionClick={onMentionClick}
                  onLinkClick={onLinkClick}
                  navigate={navigate}
                  isLast={index === comment.replies.length - 1}
                  level={level + 1}
                />
              ))}
            </div>
          </Collapse>
        </div>
      </div>

      {/* Tip Modal */}
      <Modal show={showTipModal} onHide={() => setShowTipModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Send Tip</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleTipSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Amount (in PHP)</Form.Label>
              <InputGroup>
                <InputGroup.Text>₱</InputGroup.Text>
                <Form.Control
                  type="number"
                  min="1"
                  max="1000"
                  step="0.01"
                  value={tipAmount ? (parseInt(tipAmount) / 100).toFixed(2) : ''}
                  onChange={(e) => setTipAmount(Math.round(parseFloat(e.target.value || 0) * 100).toString())}
                  placeholder="0.00"
                />
              </InputGroup>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Message (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={tipMessage}
                onChange={(e) => setTipMessage(e.target.value)}
                placeholder="Add a nice message..."
              />
            </Form.Group>
            
            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={() => setShowTipModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!tipAmount || submittingPayment}>
                {submittingPayment ? 'Sending...' : `Send Tip`}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Donation Modal */}
      <Modal show={showDonationModal} onHide={() => setShowDonationModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Send Donation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleDonationSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Amount (in PHP)</Form.Label>
              <InputGroup>
                <InputGroup.Text>₱</InputGroup.Text>
                <Form.Control
                  type="number"
                  min="1"
                  max="5000"
                  step="0.01"
                  value={donationAmount ? (parseInt(donationAmount) / 100).toFixed(2) : ''}
                  onChange={(e) => setDonationAmount(Math.round(parseFloat(e.target.value || 0) * 100).toString())}
                  placeholder="0.00"
                />
              </InputGroup>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Message (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={donationMessage}
                onChange={(e) => setDonationMessage(e.target.value)}
                placeholder="Add a nice message..."
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Send anonymously"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
            </Form.Group>
            
            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={() => setShowDonationModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!donationAmount || submittingPayment}>
                {submittingPayment ? 'Sending...' : `Send Donation`}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CommentItem;
