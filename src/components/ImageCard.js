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
          <div className="error-icon">⚠️</div>
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
        <div className="checkbox">{isSelected && '✓'}</div>
        {isAnchor && (
          <div className="anchor-indicator" title="Selection start point (Shift+Click to select range)">
            ●
          </div>
        )}
        {isLocked && (
          <div className="lock-indicator" onClick={handleLockClick} title="Click to unlock">
            🔒
          </div>
        )}
      </div>
      <div className="image-card-name">{image.name}</div>
    </div>
  );
}

export default memo(ImageCard);
