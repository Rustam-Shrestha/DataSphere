import React from 'react';

const PaginationControls: React.FC<{ page: number; limit: number; total: number; onPageChange: (p: number) => void }> = ({ page, limit, total, onPageChange }) => {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</button>
      <span>{page} / {pages}</span>
      <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Next</button>
    </div>
  );
};

export default PaginationControls;
