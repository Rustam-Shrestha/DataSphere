import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { validateEmail, validatePassword, validateMinLength } from '../../utils/validation';

const RegisterForm: React.FC = () => {
  const { register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    const em = validateEmail(email); if (em) e.email = em;
    const pw = validatePassword(password); if (pw) e.password = pw;
    const fn = validateMinLength(fullName, 2); if (fn) e.fullName = fn;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await register({ email, password, fullName });
    } catch (err: unknown) {
      setErrors({ form: (err as Error)?.message || 'Registration failed' });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {errors.form && <div style={{ color: 'red' }}>{errors.form}</div>}
      <label>Full name</label>
      <input value={fullName} onChange={e => setFullName(e.target.value)} />
      {errors.fullName && <div style={{ color: 'red' }}>{errors.fullName}</div>}

      <label>Email</label>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      {errors.email && <div style={{ color: 'red' }}>{errors.email}</div>}

      <label>Password</label>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      {errors.password && <div style={{ color: 'red' }}>{errors.password}</div>}

      <button disabled={loading} type="submit">{loading ? 'Registering...' : 'Register'}</button>
    </form>
  );
};

export default RegisterForm;
