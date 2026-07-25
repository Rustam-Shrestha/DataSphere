import React from 'react';

const ErrorAlert: React.FC<{ message?: string }> = ({ message = 'An error occurred' }) => (
  <div style={{ background: '#ffe6e6', color: '#a00', padding: 12, borderRadius: 6 }}>{message}</div>
);

export default ErrorAlert;
