
import React, { useState, useRef, useCallback } from 'react';
import { Card, Form, Button, Image, Alert, Spinner, Modal, InputGroup } from 'react-bootstrap';
import { Camera, Globe, Lock, PersonFill, EmojiSmile, X, Search, CameraVideo } from 'react-bootstrap-icons';
import { postAPI, imageAPI } from '../config/ApiConfig';
import MentionDropdown from './MentionDropdown';
import LiveStudioModal from './LiveStudioModal';
import { extractHashtags, extractMentions } from '../utils/dope-api-utils';
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import heic2any from "heic2any";

const PostComposer = ({ currentUser, onPostCreated, placeholder = "What's happening?" }) => {
  const [showComposerModal, setShowComposerModal] = useState(false);
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
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLiveStudioModal, setShowLiveStudioModal] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const gf = new GiphyFetch("BXvRq8D03IHvybiQ6Fjls2pkPJLXjx9x");
  const fetchGifs = (offset) =>
    searchTerm
      ? gf.search(searchTerm, { offset, limit: 12 })
      : gf.trending({ offset, limit: 12 });

  const getImageUploadLimit = (subscription) => {
    switch (subscription) {
      case "premium":
        return 10;
      case "pro":
        return Infinity;
      default:
        return 3;
    }
  };

  const handleContentChange = useCallback((e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    
    setContent(value);
    setCursorPosition(position);

    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }

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
        const lineHeight = 20;
        
        setMentionPosition({
          top: rect.top + (currentLine * lineHeight) + 25,
          left: rect.left + (mentionMatch[0].length * 8)
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

  const uploadImage = async (file) => {
    let finalFile = file;
    if (
      file.type === "image/heic" ||
      file.name.toLowerCase().endsWith(".heic")
    ) {
      try {
        const blob = await heic2any({ blob: file, toType: "image/jpeg" });
        finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
          type: "image/jpeg",
        });
      } catch (err) {
        console.error("Error converting HEIC:", err);
        return null;
      }
    }

    const formData = new FormData();
    formData.append("images", finalFile);

    try {
      const response = await imageAPI.uploadImages(formData);
      if (response && response.imageUrls && response.imageUrls.length > 0) {
        return response.imageUrls[0];
      }
      return null;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    const imageLimit = getImageUploadLimit(currentUser?.subscription);

    if (files.length > imageLimit) {
      alert(
        `You can only upload ${imageLimit === Infinity ? "unlimited" : imageLimit} images per post. ${imageLimit === 3 ? "Upgrade to Premium or Pro for more uploads." : ""}`
      );
      e.target.value = "";
      return;
    }

    const currentImages = images || [];
    const remainingSlots = imageLimit - currentImages.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (filesToUpload.length < files.length) {
      alert(
        `You can only upload up to ${imageLimit} images. Only the first ${filesToUpload.length} will be uploaded.`
      );
    }

    const uploadedUrls = [];
    for (const file of filesToUpload) {
      try {
        const url = await uploadImage(file);
        if (url) {
          uploadedUrls.push(url);
        }
      } catch (err) {
        console.error("Error processing file:", err);
        setError("Failed to process one or more images.");
      }
    }
    setImages((prev) => [...(prev || []), ...uploadedUrls]);
  }, [images, currentUser]);

  const handleSelectGif = (gif) => {
    const currentImages = images || [];
    const imageLimit = getImageUploadLimit(currentUser?.subscription);

    if (currentImages.length >= imageLimit) {
      alert(
        `You can only add up to ${imageLimit === Infinity ? "unlimited" : imageLimit} images/GIFs. ${imageLimit === 3 ? "Upgrade to Premium or Pro for more uploads." : ""}`
      );
      return;
    }

    const imageUrl = gif.images.fixed_height.url;
    setImages((prev) => [...(prev || []), imageUrl]);
    setShowStickerModal(false);
  };

  const handleStartLiveStream = async (streamData) => {
    try {
      setIsStreaming(true);
      setShowLiveStudioModal(false);
      
      // Create a live post when stream starts
      const postData = {
        content: streamData.description || streamData.title,
        postType: 'live_video',
        liveVideoUrl: streamData.streamUrl || '',
        privacy: streamData.privacy?.toLowerCase() || 'public',
        hashtags: extractHashtags(streamData.description || streamData.title),
        mentions: extractMentions(streamData.description || streamData.title)
      };

      const response = await postAPI.createPost(postData);
      onPostCreated?.(response.post);
      
    } catch (error) {
      console.error('Error starting live stream:', error);
      setError('Failed to start live stream');
      setIsStreaming(false);
    }
  };

  const handleStopLiveStream = () => {
    setIsStreaming(false);
    setShowLiveStudioModal(false);
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const cleanContent = content.replace(/(\r\n|\n|\r){2,}/g, "$1$2").trim();
    
    if (!cleanContent.trim() && images.length === 0) {
      setError('Post must contain text or images');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      let uploadedImageUrls = [];
      if (images.length > 0) {
        if (typeof images[0] === "object") {
          const formData = new FormData();
          images.forEach((file) => {
            formData.append("images", file);
          });
          const response = await imageAPI.uploadImages(formData);
          uploadedImageUrls = response.imageUrls || [];
        } else {
          uploadedImageUrls = images;
        }
      }

      const postData = {
        content: cleanContent,
        imageUrls: uploadedImageUrls,
        privacy: privacy.toLowerCase(),
        postType,
        hashtags: extractHashtags(cleanContent),
        mentions: extractMentions(cleanContent)
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
      setShowComposerModal(false);
      
      onPostCreated?.(response.post);
    } catch (err) {
      setError(err.message || 'Failed to create post');
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const privacyOptions = {
    public: <Globe size={14} className="me-1" />,
    followers: <PersonFill size={14} className="me-1" />,
    private: <Lock size={14} className="me-1" />,
  };

  return (
    <>
      {/* Inline Post Composer */}
      <Card className="border-0 border-bottom rounded-0">
        <Card.Body className="px-3 py-3">
          <div className="d-flex gap-3">
            <Image
              src={currentUser?.photoURL || "https://i.pravatar.cc/150?img=10"}
              alt="avatar"
              roundedCircle
              width="40"
              height="40"
              style={{ objectFit: "cover", minWidth: "40px", minHeight: "40px" }}
            />
            <div 
              className="flex-grow-1 bg-light rounded-pill px-3 py-2 cursor-pointer"
              onClick={() => setShowComposerModal(true)}
              style={{ cursor: 'pointer' }}
            >
              <span className="text-muted">{placeholder}</span>
            </div>
            <Button
              variant="primary"
              className="rounded-pill px-3"
              onClick={() => setShowComposerModal(true)}
            >
              Post
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Full Post Composer Modal */}
      <Modal
        show={showComposerModal}
        size="md"
        fullscreen="md-down"
        backdrop="static"
        onHide={() => setShowComposerModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Create Post</Modal.Title>
        </Modal.Header>

        <Modal.Body className="overflow-x-hidden">
          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <div className="d-flex gap-3 mb-3">
              <Image
                src={currentUser?.photoURL || "https://i.pravatar.cc/150?img=10"}
                alt="avatar"
                roundedCircle
                width="48"
                height="48"
                style={{
                  objectFit: "cover",
                  minWidth: "48px",
                  minHeight: "48px",
                }}
              />
              <div className="flex-grow-1">
                <Form.Control
                  ref={textareaRef}
                  as="textarea"
                  rows={4}
                  value={content}
                  onChange={handleContentChange}
                  placeholder={placeholder}
                  className="border-0 shadow-none resize-none fs-5"
                  maxLength={2000}
                  style={{ fontSize: "1.25rem" }}
                />

                {postType === 'live_video' && (
                  <Form.Control
                    type="url"
                    value={liveVideoUrl}
                    onChange={(e) => setLiveVideoUrl(e.target.value)}
                    placeholder="Live video stream URL (optional)"
                    className="form-control-sm mt-2"
                  />
                )}

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="mt-3">
                    <div className="d-flex flex-wrap gap-2">
                      {images.map((image, index) => (
                        <div key={index} className="position-relative">
                          <Image
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="rounded"
                            style={{
                              width: "120px",
                              height: "120px",
                              objectFit: "cover",
                            }}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0 m-1 rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: "24px", height: "24px" }}
                            onClick={() => removeImage(index)}
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex gap-2">
                <Button
                  variant="link"
                  size="sm"
                  className="text-primary p-1"
                  onClick={() => fileInputRef.current?.click()}
                  title="Add Photos"
                >
                  <Camera size={20} />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                />
                <Button
                  variant="link"
                  size="sm"
                  className="text-primary p-1"
                  onClick={() => setShowStickerModal(true)}
                  title="Add GIF/Sticker"
                >
                  <EmojiSmile size={18} />
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  className={isStreaming ? "text-danger p-1" : "text-primary p-1"}
                  onClick={() => setShowLiveStudioModal(true)}
                  title={isStreaming ? "Manage Live Stream" : "Go Live"}
                >
                  <CameraVideo size={18} />
                  {isStreaming && <span className="ms-1 text-danger fw-bold">LIVE</span>}
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
              </div>

              <div className="d-flex align-items-center gap-2">
                <Form.Select
                  size="sm"
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="public">
                    {privacyOptions.public} Public
                  </option>
                  <option value="followers">
                    {privacyOptions.followers} Followers
                  </option>
                  <option value="private">
                    {privacyOptions.private} Only Me
                  </option>
                </Form.Select>
                <small className="text-muted">{content.length}/2000</small>
              </div>
            </div>
          </Form>
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            {getPrivacyIcon()}
            <small className="text-muted">
              {privacy === 'public' ? 'Anyone can see this' : 
               privacy === 'followers' ? 'Only followers can see this' : 
               'Only you can see this'}
            </small>
          </div>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={
              submitting || (!content.trim() && images.length === 0)
            }
            className="rounded-pill px-4"
          >
            {submitting ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "Post"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Sticker/GIF Modal */}
      <Modal
        show={showStickerModal}
        onHide={() => setShowStickerModal(false)}
        fullscreen="md-down"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Stickers & GIFs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <Search />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search stickers and GIFs..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="shadow-none"
            />
          </InputGroup>

          <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <Grid
              columns={3}
              width={window.innerWidth - 40}
              fetchGifs={fetchGifs}
              onGifClick={(gif, e) => {
                e.preventDefault();
                handleSelectGif(gif);
              }}
            />
          </div>
        </Modal.Body>
      </Modal>

      <MentionDropdown
        show={showMentions}
        position={mentionPosition}
        query={mentionQuery}
        onSelect={handleMentionSelect}
        onClose={() => setShowMentions(false)}
      />

      {/* Live Studio Modal */}
      <LiveStudioModal
        show={showLiveStudioModal}
        onHide={() => setShowLiveStudioModal(false)}
        onStartStream={handleStartLiveStream}
        onStopStream={handleStopLiveStream}
        isStreaming={isStreaming}
        currentUser={currentUser}
      />
    </>
  );
};

export default PostComposer;
