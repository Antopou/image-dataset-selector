import React, { useState, useRef, useEffect } from 'react';

function IconBtn({ active, onClick, disabled, title, children }) {
  return (
    <button
      className={`icon-btn${active ? ' active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

function Controls({
  folderPath,
  lastFolderPath,
  recentFolders,
  showRecentFolders,
  onFolderPathEdit,
  onRecentFolderClick,
  onSelectFolder,
  onOpenLastFolder,
  onDeleteSelected,
  showShortcuts,
  onToggleShortcuts,
  onKeepSelected,
  onSelectAll,
  onDeselectAll,
  selectedCount,
  totalCount,
  previewSize,
  onPreviewSizeChange,
  onPreviewPresetChange,
  imageFitMode,
  onImageFitModeChange,
  dragSelectEnabled,
  onDragSelectEnabledChange,
  confirmRequired,
  onConfirmRequiredChange,
  loading,
  browserMode,
  currentPage,
  totalPages,
  pageSize,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
  showingCount,
  lockedCount,
  onLockSelected,
  onUnlockSelected,
}) {
  const [editPath, setEditPath] = useState(folderPath || '');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setEditPath(folderPath || '');
  }, [folderPath]);

  const handlePathSubmit = () => {
    if (editPath.trim() && editPath !== folderPath) {
      onFolderPathEdit(editPath.trim());
    }
    setIsEditing(false);
  };

  const handlePathKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePathSubmit();
    } else if (e.key === 'Escape') {
      setEditPath(folderPath || '');
      setIsEditing(false);
    }
  };

  const handlePathFocus = () => {
    setIsEditing(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsEditing(false);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing]);

  return (
    <div className="controls">
      {/* ── Row 1: Folder + Selection + Actions ── */}
      <div className="control-group">
        <button onClick={onSelectFolder} className="btn btn-primary btn-sm" disabled={loading}>
          📁 Open
        </button>
        {!browserMode && lastFolderPath && (
          <button onClick={onOpenLastFolder} className="btn btn-secondary btn-sm" disabled={loading} title={lastFolderPath}>
            ↺
          </button>
        )}
        {folderPath && (
          <div className="folder-path-container" ref={dropdownRef}>
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editPath}
                onChange={(e) => setEditPath(e.target.value)}
                onKeyDown={handlePathKeyDown}
                onBlur={handlePathSubmit}
                className="folder-path-input"
                placeholder="Enter folder path..."
                autoFocus
              />
            ) : (
              <div 
                className="folder-path" 
                onClick={handlePathFocus}
                title="Click to edit path or show recent folders"
              >
                {folderPath.length > 50 ? '…' + folderPath.slice(-47) : folderPath}
              </div>
            )}
            {isEditing && recentFolders && recentFolders.length > 0 && (
              <div className="recent-folders-dropdown">
                <div className="recent-folders-header">Recent Folders</div>
                {recentFolders.slice(0, 8).map((folder, index) => (
                  <div
                    key={index}
                    className="recent-folder-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setEditPath(folder);
                      onFolderPathEdit(folder);
                      setIsEditing(false);
                    }}
                    title={folder}
                  >
                    {folder.length > 60 ? '…' + folder.slice(-57) : folder}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {totalCount > 0 && (
          <>
            <div className="ctrl-sep" />
            <span className="info">{selectedCount}/{totalCount}</span>
            <button onClick={onSelectAll} className="btn btn-secondary btn-sm" disabled={loading} title="Select All">✓ All</button>
            <button onClick={onDeselectAll} className="btn btn-secondary btn-sm" disabled={loading} title="Deselect All">✗</button>
            <div className="ctrl-sep" />
            <button
              onClick={onLockSelected}
              className="btn btn-secondary btn-sm"
              disabled={loading || selectedCount === 0}
              title="Lock selected images (L)"
            >
              🔒 Lock
            </button>
            <button
              onClick={onUnlockSelected}
              className="btn btn-secondary btn-sm"
              disabled={loading || selectedCount === 0}
              title="Unlock selected images (Shift+L)"
            >
              🔓 Unlock
            </button>
            {lockedCount > 0 && (
              <span className="info" title={`${lockedCount} locked image${lockedCount !== 1 ? 's' : ''} will be preserved during deletion`}>
                🔒 {lockedCount}
              </span>
            )}
            <div className="ctrl-sep" />
            <button
              onClick={onDeleteSelected}
              className="btn btn-danger btn-sm"
              disabled={loading || selectedCount === 0 || browserMode}
              title="Delete selected images"
            >
              🗑️ Del
            </button>
            <button
              onClick={onKeepSelected}
              className="btn btn-success btn-sm"
              disabled={loading || selectedCount === 0 || browserMode}
              title="Keep selected, delete rest on this page"
            >
              ✔️ Keep
            </button>
          </>
        )}
        {loading && (
          <div className="loading-dots-mini">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>

      {/* ── Row 2: Size + View + Pagination + Toggles ── */}
      {totalCount > 0 && (
        <div className="control-group">
          {/* Size slider */}
          <input
            id="preview-size"
            type="range"
            min="80"
            max="300"
            value={previewSize}
            onChange={(e) => onPreviewSizeChange(Number(e.target.value))}
            disabled={loading}
            title={`Preview size: ${previewSize}px`}
          />
          {/* Size preset icon buttons */}
          <div className="icon-group" title="Preview size preset">
            {[{ label: 'S', val: 120 }, { label: 'M', val: 170 }, { label: 'L', val: 230 }, { label: 'XL', val: 280 }].map(
              (p) => (
                <IconBtn key={p.label} active={previewSize === p.val} onClick={() => onPreviewPresetChange(p.val)} disabled={loading} title={`${p.label} (${p.val}px)`}>
                  {p.label}
                </IconBtn>
              )
            )}
          </div>

          <div className="ctrl-sep" />

          {/* View mode icon toggle */}
          <div className="icon-group" title="Image fit mode">
            <IconBtn active={imageFitMode === 'contain'} onClick={() => onImageFitModeChange('contain')} disabled={loading} title="Full image (contain)">
              ⊡
            </IconBtn>
            <IconBtn active={imageFitMode === 'cover'} onClick={() => onImageFitModeChange('cover')} disabled={loading} title="Crop to fill (cover)">
              ⊞
            </IconBtn>
          </div>

          <div className="ctrl-sep" />

          {/* Toggles as icon buttons */}
          <IconBtn active={dragSelectEnabled} onClick={() => onDragSelectEnabledChange(!dragSelectEnabled)} disabled={loading} title="Drag select">
            ☐
          </IconBtn>
          <IconBtn active={!confirmRequired} onClick={() => onConfirmRequiredChange(!confirmRequired)} disabled={loading} title={confirmRequired ? 'Confirm before delete: ON' : 'Confirm before delete: OFF'}>
            {confirmRequired ? '🔔' : '🔕'}
          </IconBtn>

          <div className="ctrl-sep" />

          {/* Pagination */}
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={loading}
            className="page-size-select"
            title="Images per page"
          >
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={300}>300</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={99999}>All</option>
          </select>
          <button onClick={onPrevPage} className="btn btn-secondary btn-sm" disabled={loading || currentPage <= 1} title="Previous page">◀</button>
          <span className="page-indicator">{currentPage}/{totalPages}</span>
          <button onClick={onNextPage} className="btn btn-secondary btn-sm" disabled={loading || currentPage >= totalPages} title="Next page">▶</button>

          {!browserMode && (
            <>
              <div className="ctrl-sep" />
              <button 
                className={`help-btn ${showShortcuts ? 'active' : ''}`}
                onClick={onToggleShortcuts}
                title="Show/Hide keyboard shortcuts (?)"
              >
                ?
              </button>
              {showShortcuts && (
                <span className="shortcut-hint">Ctrl+A · ESC · Del · Shift+Del · L · Shift+L · Shift+Click · Ctrl+Wheel</span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Controls;
