import React from 'react';
import { User } from '../../types/user';

const UsersTable: React.FC<{ data: User[]; onEdit?: (u: User) => void; onDelete?: (id: string) => void }> = ({ data = [], onEdit, onDelete }) => {
  if (!data.length) return <div>No users</div>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>Email</th>
          <th>Name</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map(u => (
          <tr key={u.id}>
            <td>{u.email}</td>
            <td>{u.fullName}</td>
            <td>{u.role}</td>
            <td>
              <button onClick={() => onEdit?.(u)}>Edit</button>
              <button onClick={() => onDelete?.(u.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UsersTable;
