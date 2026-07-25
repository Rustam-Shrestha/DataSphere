import React from 'react';

const SuccessAlert: React.FC<{ message?: string }> = ({ message = 'Success' }) => (
  <div style={{ background: '#e6ffec', color: '#064', padding: 12, borderRadius: 6 }}>{message}</div>
);

export default SuccessAlert;
