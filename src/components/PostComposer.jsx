
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, Form, Button, Image, Alert, Spinner } from 'react-bootstrap';
import { Camera, Globe, Lock, PersonFill } from 'react-bootstrap-icons';
import { postAPI, imageAPI } from '../config/ApiConfig';
import MentionDropdown from './MentionDropdown';
import { extractHashtags, extractMentions } from '../utils/dope-api-utils';

const PostComposer = ({ currentUser, onPostCreated, placeholder = "What's happening?" }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [privacy, setPrivacy] = useState('public');
  const [postType, setPostType] = useState('text');
  const [liveVideoUrl, setLiveVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleContentChange = useCallback((e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    
    setContent(value);
    setCursorPosition(position);

    // Check for mention trigger
    const textBeforeCursor = value.substring(0, position);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      
      // Calculate position for dropdown
      const textarea = textareaRef.current;
      if (textarea) {
        const rect = textarea.getBoundingClientRect();
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length - 1;
        const lineHeight = 20; // Approximate line height
        
        setMentionPosition({
          top: rect.top + (currentLine * lineHeight) + 25,
          left: rect.left + (mentionMatch[0].length * 8) // Approximate character width
        });
      }
      
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, []);

  const handleMentionSelect = useCallback((user) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const newText = textBeforeCursor.replace(mentionMatch[0], `@${user.username} `) + textAfterCursor;
      setContent(newText);
      
      // Set cursor position after the mention
      const newCursorPos = textBeforeCursor.replace(mentionMatch[0], `@${user.username} `).length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
    
    setShowMentions(false);
    setMentionQuery('');
  }, [content, cursorPosition]);

  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadPromises = files.map(file => imageAPI.uploadImage(file));
      const uploadedImages = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...uploadedImages.map(img => img.secure_url)]);
    } catch (err) {
      setError('Failed to upload images');
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0) {
      setError('Post must contain text or images');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const postData = {
        content: content.trim(),
        imageUrls: images,
        privacy,
        postType,
        hashtags: extractHashtags(content),
        mentions: extractMentions(content)
      };

      if (postType === 'live_video' && liveVideoUrl) {
        postData.liveVideoUrl = liveVideoUrl;
      }

      const response = await postAPI.createPost(postData);
      
      // Reset form
      setContent('');
      setImages([]);
      setLiveVideoUrl('');
      setPrivacy('public');
      setPostType('text');
      
      onPostCreated?.(response.post);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [content, images, privacy, postType, liveVideoUrl, onPostCreated]);

  const removeImage = useCallback((index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getPrivacyIcon = () => {
    switch (privacy) {
      case 'public': return <Globe size={16} />;
      case 'private': return <Lock size={16} />;
      case 'followers': return <PersonFill size={16} />;
      default: return <Globe size={16} />;
    }
  };

  return (
    <Card className="border-0 border-bottom rounded-0">
      <Card.Body className="px-3 py-3">
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <div className="d-flex gap-3">
            <Image
              src={currentUser?.photoURL || "https://i.pravatar.cc/150?img=10"}
              alt="avatar"
              roundedCircle
              width="40"
              height="40"
              style={{ objectFit: "cover", minWidth: "40px", minHeight: "40px" }}
            />
            <div className="flex-grow-1">
              <Form.Control
                ref={textareaRef}
                as="textarea"
                rows={3}
                value={content}
                onChange={handleContentChange}
                placeholder={placeholder}
                className="border-0 shadow-none resize-none"
                style={{ fontSize: "1.1rem" }}
                maxLength={2000}
              />

              {postType === 'live_video' && (
                <Form.Control
                  type="url"
                  value={liveVideoUrl}
                  onChange={(e) => setLiveVideoUrl(e.target.value)}
                  placeholder="Live stream URL"
                  className="border-0 shadow-none mt-2"
                />
              )}

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {images.map((image, index) => (
                    <div key={index} className="position-relative">
                      <Image
                        src={image}
                        thumbnail
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 end-0 rounded-circle"
                        style={{ width: '20px', height: '20px', fontSize: '12px' }}
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="d-flex gap-2">
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary p-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={20} />
                  </Button>
                  
                  <Form.Select
                    size="sm"
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    style={{ width: 'auto' }}
                  >
                    <option value="text">Text Post</option>
                    <option value="live_video">Live Video</option>
                  </Form.Select>
                  
                  <Form.Select
                    size="sm"
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                    style={{ width: 'auto' }}
                  >
                    <option value="public">Public</option>
                    <option value="followers">Followers</option>
                    <option value="private">Private</option>
                  </Form.Select>
                </div>

                <div className="d-flex align-items-center gap-2">
                  {getPrivacyIcon()}
                  <small className="text-muted">{content.length}/2000</small>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={(!content.trim() && images.length === 0) || submitting}
                    className="rounded-pill px-3"
                  >
                    {submitting ? <Spinner size="sm" /> : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Form>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
      </Card.Body>

      <MentionDropdown
        show={showMentions}
        position={mentionPosition}
        query={mentionQuery}
        onSelect={handleMentionSelect}
        onClose={() => setShowMentions(false)}
      />
    </Card>
  );
};

export default PostComposer;
