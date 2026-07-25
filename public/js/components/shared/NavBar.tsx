import React from 'react';
import { Link } from 'react-router-dom';
import ROUTES from '../../config/routes';
import useAuth from '../../hooks/useAuth';

const NavBar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee' }}>
      <Link to={ROUTES.HOME}>Home</Link>
      {user ? (
        <>
          <Link to={ROUTES.DASHBOARD}>Dashboard</Link>
          <Link to={ROUTES.PROFILE.VIEW}>Profile</Link>
          <Link to={ROUTES.KYC.STATUS}>KYC</Link>
          <Link to={ROUTES.DOCUMENTS.LIST}>Documents</Link>
          {(user.role === 'ADMIN' || user.role === 'REVIEWER') && (<Link to={ROUTES.ADMIN.DASHBOARD}>Admin</Link>)}
          <button onClick={() => logout()}>Logout</button>
        </>
      ) : (
        <>
          <Link to={ROUTES.AUTH.LOGIN}>Login</Link>
          <Link to={ROUTES.AUTH.REGISTER}>Register</Link>
        </>
      )}
    </nav>
  );
};

export default NavBar;
