
import React, { useState, useRef, useCallback } from 'react';
import { Card, Form, Button, Image, Alert, Spinner, Modal, InputGroup, Row, Col } from 'react-bootstrap';
import { Camera, Globe, Lock, PersonFill, EmojiSmile, X, Search, CameraVideo, GeoAlt, Calendar3, BarChart } from 'react-bootstrap-icons';
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
  const [uploadingImages, setUploadingImages] = useState(false);
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
        return 4;
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
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
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
      const uid = user.uid || user.username;
      const newText = textBeforeCursor.replace(mentionMatch[0], `@${uid} `) + textAfterCursor;
      setContent(newText);

      const newCursorPos = textBeforeCursor.replace(mentionMatch[0], `@${uid} `).length;
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
        throw new Error("Failed to convert HEIC image");
      }
    }

    const formData = new FormData();
    formData.append("images", finalFile);

    try {
      const response = await imageAPI.uploadImages(formData);
      if (response && response.imageUrls && response.imageUrls.length > 0) {
        return response.imageUrls[0];
      }
      throw new Error("No image URL returned");
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const imageLimit = getImageUploadLimit(currentUser?.subscription);
    const currentImages = images || [];
    const remainingSlots = imageLimit - currentImages.length;

    if (files.length > remainingSlots) {
      setError(`You can only upload ${remainingSlots} more image(s). ${imageLimit === 4 ? "Upgrade to Premium or Pro for more uploads." : ""}`);
      e.target.value = "";
      return;
    }

    setUploadingImages(true);
    setError('');

    const uploadedUrls = [];
    
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not a valid image file`);
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`${file.name} is too large. Maximum size is 10MB`);
        }

        const url = await uploadImage(file);
        uploadedUrls.push(url);
      }
      
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error("Error processing files:", err);
      setError(err.message || "Failed to upload one or more images");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  }, [images, currentUser]);

  const handleSelectGif = (gif) => {
    const currentImages = images || [];
    const imageLimit = getImageUploadLimit(currentUser?.subscription);

    if (currentImages.length >= imageLimit) {
      setError(`You can only add up to ${imageLimit === Infinity ? "unlimited" : imageLimit} images/GIFs. ${imageLimit === 4 ? "Upgrade to Premium or Pro for more uploads." : ""}`);
      return;
    }

    const imageUrl = gif.images.fixed_height.url;
    setImages(prev => [...prev, imageUrl]);
    setShowStickerModal(false);
  };

  const handleStartLiveStream = async (streamData) => {
    try {
      setIsStreaming(true);
    } catch (error) {
      console.error('Error starting live stream:', error);
      setError('Failed to start live stream');
      setIsStreaming(false);
    }
  };

  const handleStopLiveStream = () => {
    setIsStreaming(false);
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

      const postData = {
        content: cleanContent,
        imageUrls: images,
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

  const isPostDisabled = submitting || uploadingImages || (!content.trim() && images.length === 0);
  const characterCount = content.length;
  const characterLimit = 280;
  const isOverLimit = characterCount > characterLimit;

  return (
    <>
      {/* Inline Post Composer */}
      <Card className="border-0 border-bottom rounded-0 shadow-none">
        <Card.Body className="px-4 py-3">
          <div className="d-flex gap-3">
            <Image
              src={currentUser?.photoURL || "https://i.pravatar.cc/150?img=10"}
              alt="avatar"
              roundedCircle
              width="48"
              height="48"
              style={{ objectFit: "cover", minWidth: "48px", minHeight: "48px" }}
            />
            <div 
              className="flex-grow-1 d-flex align-items-center bg-light rounded-pill px-4 py-0 mb-3 fs-6 cursor-pointer border"
              onClick={() => setShowComposerModal(true)}
              style={{ cursor: 'pointer', minHeight: '52px' }}
            >
              <span className="text-muted fs-5">{placeholder}</span>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Full Post Composer Modal */}
      <Modal
        show={showComposerModal}
        size="lg"
        fullscreen="md-down"
        backdrop="static"
        onHide={() => setShowComposerModal(false)}
        centered
      >
        <Modal.Header className="border-0 pb-0">
          <div className="d-flex align-items-center w-100">
            <Button
              variant="link"
              className="p-0 me-3 text-dark"
              onClick={() => setShowComposerModal(false)}
            >
              <X size={35} />
            </Button>
            <h5 className="mb-0 flex-grow-1">Create Post</h5>
            <Button
              onClick={handleSubmit}
              disabled={isPostDisabled || isOverLimit}
              className="rounded-pill px-4 fw-bold"
              style={{ 
                backgroundColor: isPostDisabled || isOverLimit ? '#ccc' : '#1DA1F2',
                border: 'none',
                opacity: isPostDisabled || isOverLimit ? 0.5 : 1
              }}
            >
              {submitting ? (
                <Spinner size="sm" animation="border" />
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </Modal.Header>

        <Modal.Body className="pt-2">
          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <div className="d-flex gap-3">
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
                {/* Privacy Selector */}
                <div className="mb-2">
                  <Form.Select
                    size="sm"
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                    style={{ width: 'auto', fontSize: '14px' }}
                    className="border-0 bg-light rounded-pill px-3"
                  >
                    <option value="public">🌍 Everyone can reply</option>
                    <option value="followers">👥 Followers can reply</option>
                    <option value="private">🔒 Only you can see</option>
                  </Form.Select>
                </div>

                {/* Text Input */}
                <Form.Control
                  ref={textareaRef}
                  as="textarea"
                  rows={3}
                  value={content}
                  onChange={handleContentChange}
                  placeholder={placeholder}
                  className="border-0 shadow-none resize-none"
                  style={{ 
                    fontSize: "20px", 
                    lineHeight: "24px",
                    minHeight: "120px",
                    maxHeight: "200px"
                  }}
                  maxLength={characterLimit}
                />

                {/* Live Video URL Input */}
                {postType === 'live_video' && (
                  <Form.Control
                    type="url"
                    value={liveVideoUrl}
                    onChange={(e) => setLiveVideoUrl(e.target.value)}
                    placeholder="Live video stream URL (optional)"
                    className="border-0 shadow-none mt-2"
                    style={{ fontSize: "16px" }}
                  />
                )}

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="mt-3">
                    <div className="border rounded-3 p-2" style={{ backgroundColor: '#f8f9fa' }}>
                      {images.length === 1 ? (
                        // Single image
                        <div className="position-relative">
                          <Image
                            src={images[0]}
                            alt="Upload"
                            className="rounded-3 w-100"
                            style={{
                              height: "300px",
                              objectFit: "cover",
                            }}
                          />
                          <Button
                            variant="dark"
                            size="sm"
                            className="position-absolute top-0 end-0 m-2 rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px", opacity: 0.8 }}
                            onClick={() => removeImage(0)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : images.length === 2 ? (
                        // Two images side by side
                        <Row className="g-2">
                          {images.map((image, index) => (
                            <Col key={index} xs={6}>
                              <div className="position-relative">
                                <Image
                                  src={image}
                                  alt={`Upload ${index + 1}`}
                                  className="rounded-3 w-100"
                                  style={{
                                    height: "200px",
                                    objectFit: "cover",
                                  }}
                                />
                                <Button
                                  variant="dark"
                                  size="sm"
                                  className="position-absolute top-0 end-0 m-2 rounded-circle d-flex align-items-center justify-content-center"
                                  style={{ width: "28px", height: "28px", opacity: 0.8 }}
                                  onClick={() => removeImage(index)}
                                >
                                  <X size={12} />
                                </Button>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        // Three or four images in grid
                        <Row className="g-2">
                          <Col xs={6}>
                            <div className="position-relative">
                              <Image
                                src={images[0]}
                                alt="Upload 1"
                                className="rounded-3 w-100"
                                style={{
                                  height: images.length === 3 ? "260px" : "150px",
                                  objectFit: "cover",
                                }}
                              />
                              <Button
                                variant="dark"
                                size="sm"
                                className="position-absolute top-0 end-0 m-2 rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "28px", height: "28px", opacity: 0.8 }}
                                onClick={() => removeImage(0)}
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          </Col>
                          <Col xs={6}>
                            <div className="d-flex flex-column gap-2">
                              {images.slice(1).map((image, index) => (
                                <div key={index + 1} className="position-relative">
                                  <Image
                                    src={image}
                                    alt={`Upload ${index + 2}`}
                                    className="rounded-3 w-100"
                                    style={{
                                      height: images.length === 3 ? (index === 0 ? "125px" : "125px") : "72px",
                                      objectFit: "cover",
                                    }}
                                  />
                                  <Button
                                    variant="dark"
                                    size="sm"
                                    className="position-absolute top-0 end-0 m-1 rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: "24px", height: "24px", opacity: 0.8 }}
                                    onClick={() => removeImage(index + 1)}
                                  >
                                    <X size={10} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </Col>
                        </Row>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {uploadingImages && (
                  <div className="mt-3 p-3 bg-light rounded-3 text-center">
                    <Spinner size="sm" animation="border" className="me-2" />
                    <span className="text-muted">Uploading images...</span>
                  </div>
                )}
              </div>
            </div>
          </Form>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <div className="d-flex justify-content-between align-items-center w-100">
            <div className="d-flex gap-1">
              <Button
                variant="link"
                size="sm"
                className="text-primary p-2 rounded-circle d-flex align-items-center justify-content-center"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImages || images.length >= getImageUploadLimit(currentUser?.subscription)}
                title="Add Photos"
                style={{ width: "36px", height: "36px" }}
              >
                <Camera size={18} />
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
                className="text-primary p-2 rounded-circle d-flex align-items-center justify-content-center"
                onClick={() => setShowStickerModal(true)}
                title="Add GIF"
                style={{ width: "36px", height: "36px" }}
              >
                <EmojiSmile size={18} />
              </Button>
              <Button
                variant="link"
                size="sm"
                className={`p-2 rounded-circle d-flex align-items-center justify-content-center ${isStreaming ? "text-danger" : "text-primary"}`}
                onClick={() => setShowLiveStudioModal(true)}
                title={isStreaming ? "Manage Live Stream" : "Go Live"}
                style={{ width: "36px", height: "36px" }}
              >
                <CameraVideo size={18} />
              </Button>
            </div>

            <div className="d-flex align-items-center gap-3">
              {/* Character Count */}
              {characterCount > 0 && (
                <div className="d-flex align-items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      fill="none"
                      stroke={isOverLimit ? "#ff6b6b" : characterCount > characterLimit * 0.8 ? "#ffb347" : "#e1e8ed"}
                      strokeWidth="2"
                    />
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      fill="none"
                      stroke={isOverLimit ? "#ff6b6b" : "#1DA1F2"}
                      strokeWidth="2"
                      strokeDasharray={`${(characterCount / characterLimit) * 50.26} 50.26`}
                      strokeLinecap="round"
                      transform="rotate(-90 10 10)"
                    />
                  </svg>
                  <small className={`fw-bold ${isOverLimit ? "text-danger" : "text-muted"}`}>
                    {characterLimit - characterCount}
                  </small>
                </div>
              )}

              {/* Privacy Indicator */}
              <div className="d-flex align-items-center text-muted">
                {getPrivacyIcon()}
              </div>
            </div>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Sticker/GIF Modal */}
      <Modal
        show={showStickerModal}
        onHide={() => setShowStickerModal(false)}
        fullscreen="md-down"
        centered
        size="lg"
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Choose a GIF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <InputGroup.Text className="bg-light border-0">
              <Search />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search for GIFs"
              value={searchTerm}
              onChange={handleSearchChange}
              className="shadow-none border-0 bg-light"
            />
          </InputGroup>

          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <Grid
              columns={3}
              width={window.innerWidth > 768 ? 500 : window.innerWidth - 40}
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
