import React, { useState } from 'react';

const RejectKycModal: React.FC<{ open: boolean; onClose: () => void; onConfirm: (reason: string) => Promise<void>; loading?: boolean }> = ({ open, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 6, width: 500 }}>
        <h3>Reject KYC</h3>
        <p>Please provide a reason for rejection (min 10 chars)</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)} style={{ width: '100%', minHeight: 120 }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onClose}>Cancel</button>
          <button disabled={loading || reason.length < 10} onClick={() => onConfirm(reason)}>{loading ? 'Rejecting...' : 'Reject'}</button>
        </div>
      </div>
    </div>
  );
};

export default RejectKycModal;
