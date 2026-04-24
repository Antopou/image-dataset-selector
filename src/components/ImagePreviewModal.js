import React, { useState, useEffect, useCallback } from 'react';
import './ImagePreviewModal.css';

function ImagePreviewModal({ image, images, currentIndex, onClose, onNext, onPrev, onLock, onDelete }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSrc, setImageSrc] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });

  // Load image data when image changes
  useEffect(() => {
    if (!image) return;
    
    const loadImage = async () => {
      if (image.previewSrc && image.previewSrc !== '') {
        setImageSrc(image.previewSrc);
        return;
      }
      
      if (!window.electronAPI || !image.path) {
        setImageSrc('');
        return;
      }
      
      try {
        const base64 = await window.electronAPI.getImageData(image.path);
        if (!base64) return;
        
        const ext = (image.name || '').toLowerCase().split('.').pop();
        const mime = ext === 'png' ? 'image/png'
          : ext === 'gif' ? 'image/gif'
          : ext === 'webp' ? 'image/webp'
          : ext === 'bmp' ? 'image/bmp'
          : ext === 'svg' ? 'image/svg+xml'
          : 'image/jpeg';
        
        const dataUrl = `data:${mime};base64,${base64}`;
        setImageSrc(dataUrl);
      } catch (err) {
        console.error('Failed to load preview image:', err);
        setImageSrc('');
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

  const handleCropImage = useCallback(() => {
    // TODO: Implement actual crop functionality
    console.log('Crop image:', cropArea);
    setCropMode(false);
  }, [cropArea]);

  const handleCropMouseDown = useCallback((e) => {
    if (!cropMode) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setIsCropping(true);
    setCropStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setCropArea({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: 0,
      height: 0
    });
  }, [cropMode]);

  const handleCropMouseMove = useCallback((e) => {
    if (!isCropping || !cropMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    setCropArea({
      x: Math.min(cropStart.x, currentX),
      y: Math.min(cropStart.y, currentY),
      width: Math.abs(currentX - cropStart.x),
      height: Math.abs(currentY - cropStart.y)
    });
  }, [isCropping, cropMode, cropStart]);

  const handleCropMouseUp = useCallback(() => {
    setIsCropping(false);
  }, []);

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
          className={`preview-image-container ${cropMode ? 'crop-mode' : ''}`}
          onWheel={handleWheel}
          onMouseDown={cropMode ? handleCropMouseDown : handleMouseDown}
          onMouseMove={cropMode ? handleCropMouseMove : undefined}
          onMouseUp={cropMode ? handleCropMouseUp : undefined}
          style={{ cursor: cropMode ? 'crosshair' : (zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default') }}
        >
          <img
            src={imageSrc}
            alt={image.name}
            className="preview-image"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              cursor: cropMode ? 'crosshair' : (zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default')
            }}
            draggable={false}
          />
          {cropMode && (
            <div 
              className="crop-overlay"
              style={{
                left: `${cropArea.x}px`,
                top: `${cropArea.y}px`,
                width: `${cropArea.width}px`,
                height: `${cropArea.height}px`
              }}
            >
              <div className="crop-corners">
                <div className="crop-corner top-left"></div>
                <div className="crop-corner top-right"></div>
                <div className="crop-corner bottom-left"></div>
                <div className="crop-corner bottom-right"></div>
              </div>
            </div>
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
              ⟲
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

        {showShortcuts && (
          <div className="preview-shortcuts">
            <span>ESC: Close | ←→: Navigate | +/-: Zoom | 0: Reset | Drag: Pan</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImagePreviewModal;
