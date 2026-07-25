import React, { useState } from 'react';
import useKyc from '../../hooks/useKyc';
import { validateFile } from '../../utils/validation';
import { DOCUMENT_TYPES } from '../../utils/constants';

const KycSubmitForm: React.FC = () => {
  const { submitKyc, loading } = useKyc();
  const [files, setFiles] = useState<File[]>([]);
  const [type, setType] = useState<string>(DOCUMENT_TYPES.CITIZENSHIP_FRONT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAdd = (f?: File | null) => {
    if (!f) return;
    setFiles(prev => [...prev, f]);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (files.length === 0) e.files = 'At least one document is required';
    else {
      const fileErr = validateFile(files[0]);
      if (fileErr) e.files = fileErr;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const form = new FormData();
    form.append('documents', files[0]);
    form.append('type', type);
    try {
      await submitKyc(form);
    } catch (err: unknown) {
      setErrors({ form: (err as Error)?.message || 'Submission failed' });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 8, flexDirection: 'column' }}>
      <label>Document Type</label>
      <select value={type} onChange={e => setType(e.target.value)}>
        {Object.values(DOCUMENT_TYPES).map(v => (<option key={v} value={v}>{v}</option>))}
      </select>

      <label>File</label>
      <input type="file" onChange={e => handleAdd(e.target.files?.[0] || null)} />
      {errors.files && <div style={{ color: 'red' }}>{errors.files}</div>}

      <button disabled={loading} type="submit">{loading ? 'Submitting...' : 'Submit KYC'}</button>
    </form>
  );
};

export default KycSubmitForm;
