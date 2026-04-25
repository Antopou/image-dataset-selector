import React, { useState, useEffect, useCallback } from 'react';
import './ImagePreviewModal.css';

function ImagePreviewModal({ image, images, currentIndex, onClose, onNext, onPrev, onLock, onDelete }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSrc, setImageSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load image data when image changes
  useEffect(() => {
    if (!image) return;

    const loadImage = async () => {
      setImageSrc('');
      setIsLoading(true);

      // Defer so the browser paints the shimmer before the heavy load blocks the thread
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const minLoadTime = new Promise(resolve => setTimeout(resolve, 250));

      if (image.previewSrc && image.previewSrc !== '') {
        setImageSrc(image.previewSrc);
        await minLoadTime;
        setIsLoading(false);
        return;
      }

      if (!window.electronAPI || !image.path) {
        await minLoadTime;
        setIsLoading(false);
        return;
      }

      try {
        const base64 = await window.electronAPI.getImageData(image.path);
        if (!base64) {
          await minLoadTime;
          setIsLoading(false);
          return;
        }

        const ext = (image.name || '').toLowerCase().split('.').pop();
        const mime = ext === 'png' ? 'image/png'
          : ext === 'gif' ? 'image/gif'
          : ext === 'webp' ? 'image/webp'
          : ext === 'bmp' ? 'image/bmp'
          : ext === 'svg' ? 'image/svg+xml'
          : 'image/jpeg';

        setImageSrc(`data:${mime};base64,${base64}`);
        await minLoadTime;
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load preview image:', err);
        await minLoadTime;
        setIsLoading(false);
      }
    };

    loadImage();
  }, [image]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prevZoom => Math.max(0.5, Math.min(3, prevZoom + delta)));
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleKeydown = useCallback((e) => {
    switch(e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        onPrev();
        break;
      case 'ArrowRight':
        onNext();
        break;
      case '=':
      case '+':
        setZoom(prev => Math.min(3, prev + 0.1));
        break;
      case '-':
        setZoom(prev => Math.max(0.5, prev - 0.1));
        break;
      case '0':
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        break;
    }
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!image) return null;

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
        <div className="preview-header">
          <div className="preview-info">
            <span className="preview-filename">{image.name}</span>
            <span className="preview-index">{currentIndex + 1} / {images.length}</span>
          </div>
          <button className="preview-close" onClick={onClose}>×</button>
        </div>

        <div
          className="preview-image-container"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {isLoading ? (
            <div className="preview-loading">
              <div className="preview-spinner" />
            </div>
          ) : (
            <img
              src={imageSrc}
              alt={image.name}
              className="preview-image"
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              draggable={false}
            />
          )}
        </div>

        <div className="preview-controls">
          <button
            className="preview-nav-btn"
            onClick={onPrev}
            disabled={currentIndex === 0}
            title="Previous image (←)"
          >
            ‹
          </button>

          <div className="preview-zoom-controls">
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              disabled={zoom <= 0.5}
              title="Zoom out (-)"
            >
              −
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
              disabled={zoom >= 3}
              title="Zoom in (+)"
            >
              +
            </button>
            <button
              onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }}
              title="Reset zoom (0)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
          </div>

          <button
            className="preview-nav-btn"
            onClick={onNext}
            disabled={currentIndex === images.length - 1}
            title="Next image (→)"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImagePreviewModal;
