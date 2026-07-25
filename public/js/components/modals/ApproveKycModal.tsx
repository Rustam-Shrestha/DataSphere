import React from 'react';

const ApproveKycModal: React.FC<{ open: boolean; onClose: () => void; onConfirm: () => Promise<void>; loading?: boolean }> = ({ open, onClose, onConfirm, loading }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 6, width: 400 }}>
        <h3>Approve KYC</h3>
        <p>Are you sure you want to approve this KYC application?</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Cancel</button>
          <button disabled={loading} onClick={onConfirm}>{loading ? 'Approving...' : 'Approve'}</button>
        </div>
      </div>
    </div>
  );
};

export default ApproveKycModal;
