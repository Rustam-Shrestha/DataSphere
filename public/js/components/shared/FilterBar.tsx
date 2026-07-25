import React from 'react';

const FilterBar: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', gap: 8, padding: 12, alignItems: 'center' }}>{children}</div>
);

export default FilterBar;
