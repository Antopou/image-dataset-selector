import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ count = 12 }) => {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-image"></div>
          <div className="skeleton-text"></div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
