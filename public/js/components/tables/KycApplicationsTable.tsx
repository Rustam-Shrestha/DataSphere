import React from 'react';
import { KycApplication } from '../../types/kyc';

const KycApplicationsTable: React.FC<{ data: KycApplication[]; onApprove?: (id: string) => void; onReject?: (id: string) => void }> = ({ data = [], onApprove, onReject }) => {
  if (!data.length) return <div>No applications</div>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>User</th>
          <th>Status</th>
          <th>Submitted</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map(k => (
          <tr key={k.id}>
            <td>{k.userId}</td>
            <td>{k.status}</td>
            <td>{new Date(k.submittedAt).toLocaleString()}</td>
            <td>
              <button onClick={() => onApprove?.(k.id)}>Approve</button>
              <button onClick={() => onReject?.(k.id)}>Reject</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default KycApplicationsTable;
