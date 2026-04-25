import React, { useEffect, useState, memo } from 'react';
import './ImageCard.css';

const imageCache = new Map();

function ImageCard({ image, imageIndex, isSelected, isLocked, isAnchor, onCardClick, onToggleLock, onDragMouseDown, onDragMouseEnter, onPreview, size, imageFitMode }) {
  const [src, setSrc] = useState(image.previewSrc || '');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (image.previewSrc) { setSrc(image.previewSrc); return; }
      if (!window.electronAPI || !image.path) { setSrc(''); return; }

      const cached = imageCache.get(image.path);
      if (cached) { setSrc(cached); return; }

      try {
        const base64 = await window.electronAPI.getImageData(image.path);
        if (!base64 || cancelled) return;

        const ext = (image.name || '').toLowerCase().split('.').pop();
        const mime = ext === 'png' ? 'image/png'
          : ext === 'gif' ? 'image/gif'
          : ext === 'webp' ? 'image/webp'
          : ext === 'bmp' ? 'image/bmp'
          : ext === 'svg' ? 'image/svg+xml'
          : 'image/jpeg';

        const dataUrl = `data:${mime};base64,${base64}`;
        imageCache.set(image.path, dataUrl);
        setSrc(dataUrl);
      } catch (err) {
        if (!cancelled) console.error('Failed to load image:', err);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [image.path, image.previewSrc, image.name]);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const handleClick = (event) => {
    if (event.detail === 2) { // Double click
      onPreview(image, imageIndex);
    } else {
      onCardClick(image.path, imageIndex, event.shiftKey);
    }
  };

  const handleMouseDown = (event) => {
    if (!onDragMouseDown) return;
    onDragMouseDown(image.path, imageIndex, isSelected, event.button);
  };

  const handleMouseEnter = () => {
    if (!onDragMouseEnter) return;
    onDragMouseEnter(image.path, imageIndex);
  };

  const handleLockClick = (event) => {
    event.stopPropagation();
    if (onToggleLock) {
      onToggleLock(image.path);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleRetryLoad = () => {
    setImageError(false);
    // Force reload by clearing cache for this image
    if (image.path) {
      imageCache.delete(image.path);
    }
  };

  return (
    <div
      className={`image-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''} ${imageFitMode === 'contain' ? 'fit-contain' : 'fit-cover'}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      title={`${image.name}${isLocked ? ' (locked)' : ''}`}
    >
      {!src ? (
        <div className="image-loading-placeholder">
        </div>
      ) : imageError ? (
        <div className="image-error-placeholder" onClick={handleRetryLoad}>
          <div className="error-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="error-text">Click to retry</div>
        </div>
      ) : (
        <img 
          src={src} 
          alt={image.name} 
          loading="lazy" 
          decoding="async" 
          onError={handleImageError}
        />
      )}
      <div className="image-card-overlay">
        <div className="checkbox">
          {isSelected && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
        {isLocked && (
          <div className="lock-indicator" onClick={handleLockClick} title="Click to unlock">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
        )}
      </div>
      <div className="image-card-name">{image.name}</div>
    </div>
  );
}

export default memo(ImageCard);
