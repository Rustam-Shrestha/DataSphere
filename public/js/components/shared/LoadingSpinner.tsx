import React from 'react';

const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
    <div style={{ width: size, height: size, border: '4px solid #ddd', borderTop: '4px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default LoadingSpinner;
