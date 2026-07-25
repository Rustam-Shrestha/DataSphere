import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../utils/validation';

const LoginForm: React.FC = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    const em = validateEmail(email); if (em) e.email = em;
    const pw = validatePassword(password); if (pw) e.password = pw;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login({ email, password });
    } catch (err: unknown) {
      setErrors({ form: (err as Error)?.message || 'Login failed' });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {errors.form && <div style={{ color: 'red' }}>{errors.form}</div>}
      <label>Email</label>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      {errors.email && <div style={{ color: 'red' }}>{errors.email}</div>}

      <label>Password</label>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      {errors.password && <div style={{ color: 'red' }}>{errors.password}</div>}

      <button disabled={loading} type="submit">{loading ? 'Logging...' : 'Login'}</button>
    </form>
  );
};

export default LoginForm;
