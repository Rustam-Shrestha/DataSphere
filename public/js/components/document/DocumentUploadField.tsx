import React, { useState } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../shared/hooks/useToast';

type Props = {
  kycId: string;
  type: string;
  onSuccess?: (data: unknown) => void;
};

const DocumentUploadField: React.FC<Props> = ({ kycId, type, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const api = useApi();
  const toast = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      toast.error('File must be < 10 MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(selected.type)) {
      toast.error('Only JPEG, PNG, WebP, PDF allowed');
      return;
    }

    setFile(selected);
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Select a file first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('kycId', kycId);
      formData.append('type', type);

      const response = await api.post('/documents/upload', formData);
      toast.success('Document uploaded successfully');
      onSuccess?.(response.data ?? response);
      setFile(null);
      setPreview(null);
    } catch (error: unknown) {
      toast.error(error?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-upload-field">
      <input
        type="file"
        onChange={handleFileSelect}
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        disabled={uploading}
      />
      {preview && <img src={preview} alt="preview" style={{ maxWidth: 160, maxHeight: 160 }} />}
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

export default DocumentUploadField;
