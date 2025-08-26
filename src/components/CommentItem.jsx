import React, { useState, useCallback } from 'react';
import { Image, Button, Form, Collapse, Badge, InputGroup } from 'react-bootstrap';
import { Heart, HeartFill, ChatDots, CheckCircleFill, PencilSquare, Trash, Gift, CurrencyDollar } from 'react-bootstrap-icons';
import { formatTimeAgo } from '../utils/common-utils';
import { parseTextContent } from '../utils/text-utils';
import { commentAPI, userAPI } from '../config/ApiConfig'; // Assuming userAPI is imported here

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

  const isLiked = comment.likes?.some(like => like.user?.uid === currentUser?.uid) || comment.isLiked;
  const likesCount = comment.likes?.length || comment.stats?.likes || 0;
  const repliesCount = comment.replies?.length || comment.stats?.replies || 0;
  const isCommentOwner = comment.author?.uid === currentUser?.uid;

  // Calculate total tips received for this comment author
  const totalTipsReceived = comment.tipsReceived || 0;

  // Fetch user data with caching
  const userCache = new Map();

	const fetchUserData = async (uid) => {
		// Check cache first
		if (userCache.has(uid)) {
			return userCache.get(uid);
		}

		try {
			const userData = await userAPI.getUserById(uid);
			// Cache successful results
			userCache.set(uid, userData);
			return userData;
		} catch (error) {
			console.error(`Failed to fetch user data for ${uid}:`, error);
			// Cache null result to prevent repeated failed requests
			userCache.set(uid, null);
			return null;
		}
	};

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
          {comment.tip && comment.tip.amount && comment.tip.amount > 0 && (
            <div className="mb-1">
              <Badge bg="warning" text="dark" className="small">
                <Gift size={10} className="me-1" />
                Tip: ${(comment.tip.amount / 100).toFixed(2)}
              </Badge>
            </div>
          )}

          {comment.donation && comment.donation.amount && comment.donation.amount > 0 && (
            <div className="mb-1">
              <Badge bg="info" className="small">
                <CurrencyDollar size={10} className="me-1" />
                Donation: ${(comment.donation.amount / 100).toFixed(2)}
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
    </div>
  );
};

export default CommentItem;