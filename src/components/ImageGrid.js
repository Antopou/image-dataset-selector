import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import './ImageGrid.css';
import ImageCard from './ImageCard';

const ITEM_HEIGHT = 200; // adjust this value based on your image card height
const BUFFER_SIZE = 10; // adjust this value based on your performance needs

const ImageGrid = forwardRef(function ImageGrid({
  images,
  selectedImages,
  lockedImages,
  onToggleImage,
  onToggleLock,
  onSetRangeSelected,
  onShiftSelectRange,
  onPreview,
  dragSelectEnabled,
  previewSize,
  imageFitMode,
  loading,
  isDeleting,
  deleteProgress,
}, ref) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const viewportRef = useRef(null);
  const [anchorIndex, setAnchorIndex] = useState(null);
  const dragRef = useRef({ active: false, startIndex: -1, mode: 'select', snapshot: null, moved: false });
  const [isDragging, setIsDragging] = useState(false);

  useImperativeHandle(ref, () => ({
    scrollToTop() {
      if (viewportRef.current) viewportRef.current.scrollTop = 0;
    },
    getViewport() {
      return viewportRef.current;
    },
    scrollBy(options) {
      if (viewportRef.current && typeof viewportRef.current.scrollBy === 'function') {
        viewportRef.current.scrollBy(options);
      }
    },
  }));

  useEffect(() => {
    const handleMouseUp = () => {
      if (dragRef.current.active) {
        dragRef.current.active = false;
        setIsDragging(false);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleCardMouseDown = useCallback((imagePath, imageIndex, isSelected, mouseButton) => {
    if (!dragSelectEnabled || mouseButton !== 0) return;
    const mode = isSelected ? 'deselect' : 'select';
    const snapshot = new Set(selectedImages);
    dragRef.current = { active: true, startIndex: imageIndex, mode, snapshot, moved: false };
    setIsDragging(true);
  }, [dragSelectEnabled, selectedImages]);

  const handleCardMouseEnter = useCallback((imagePath, imageIndex) => {
    const ds = dragRef.current;
    if (!dragSelectEnabled || !ds.active) return;
    if (imageIndex !== ds.startIndex) ds.moved = true;
    onSetRangeSelected(ds.startIndex, imageIndex, ds.mode, ds.snapshot);
  }, [dragSelectEnabled, onSetRangeSelected]);

  const handleCardClick = useCallback((imagePath, imageIndex, shiftKey) => {
    if (dragSelectEnabled && dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    if (shiftKey && anchorIndex !== null) {
      onShiftSelectRange(anchorIndex, imageIndex);
    } else {
      setAnchorIndex(imageIndex);
      onToggleImage(imagePath);
    }
  }, [dragSelectEnabled, onToggleImage, onShiftSelectRange, anchorIndex]);

  const visibleGrid = useMemo(() => images.map((image, index) => (
    <ImageCard
      key={image.path}
      image={image}
      imageIndex={index}
      isSelected={selectedImages.has(image.path)}
      isLocked={lockedImages.has(image.path)}
      isAnchor={index === anchorIndex}
      onCardClick={handleCardClick}
      onToggleLock={onToggleLock}
      onDragMouseDown={dragSelectEnabled ? handleCardMouseDown : undefined}
      onDragMouseEnter={dragSelectEnabled ? handleCardMouseEnter : undefined}
      onPreview={onPreview}
      size={previewSize}
      imageFitMode={imageFitMode}
    />
  )), [images, selectedImages, lockedImages, anchorIndex, handleCardClick, onToggleLock, dragSelectEnabled, handleCardMouseDown, handleCardMouseEnter, onPreview, previewSize, imageFitMode]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🖼️</div>
        <h3>No images loaded</h3>
        <p>Select a folder to get started.</p>
      </div>
    );
  }

  return (
    <div ref={viewportRef} className={`image-grid-viewport${isDragging ? ' selecting' : ''}`}>
      {isDeleting && (
        <div className="delete-overlay">
          <div className="delete-indicator">
            <div className="delete-spinner"></div>
            <div className="delete-text">
              {deleteProgress && deleteProgress.total > 0 
                ? `Deleting ${deleteProgress.current} / ${deleteProgress.total} images...`
                : 'Deleting images...'}
            </div>
            {deleteProgress && deleteProgress.total > 0 && (
              <div className="delete-progress-bar-container">
                <div 
                  className="delete-progress-bar-fill" 
                  style={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      )}
      <div
        className="image-grid"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${previewSize}px, 1fr))`,
          gap: '10px',
        }}
      >
        {visibleGrid}
      </div>
    </div>
  );
});

export default ImageGrid;
