import { apiFetch, setToken } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const uploadForm = document.getElementById('upload-form');
  const uploadList = document.getElementById('upload-list');
  const progress = document.getElementById('upload-progress');
  const statusEl = document.getElementById('upload-status');

  document.getElementById('show-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-card').style.display = 'none';
    document.getElementById('register-card').style.display = 'block';
  });
  document.getElementById('show-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-card').style.display = 'block';
    document.getElementById('register-card').style.display = 'none';
  });

  if (getToken()) {
    document.getElementById('auth-section').style.display = 'none';
  } else {
    document.getElementById('upload-card').style.opacity = '0.5';
  }

  function getToken() { return localStorage.getItem('token'); }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      try {
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setToken(data.token);
        window.location.reload();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      try {
        await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        alert('Registered — log in now.');
        document.getElementById('show-login').click();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('file-input');
      if (!fileInput.files.length) return;

      const fd = new FormData();
      fd.append('file', fileInput.files[0]);
      progress.style.display = 'flex';
      statusEl.textContent = 'Uploading and importing...';

      try {
        const token = getToken();
        const res = await fetch('/api/uploads', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        const body = await res.json();
        if (!body.success) throw new Error(body.error?.message || 'Upload failed');
        alert(`Imported ${body.data.rowsImported} rows (${body.data.rowsSkipped} skipped)`);
        fileInput.value = '';
        loadUploads();
      } catch (err) {
        alert(err.message);
      } finally {
        progress.style.display = 'none';
      }
    });
  }

  async function loadUploads() {
    if (!uploadList) return;
    try {
      const data = await apiFetch('/api/uploads?pageSize=10');
      uploadList.innerHTML = data.items.map(u =>
        `<tr><td>${u.filename}</td><td>${u.fileType}</td><td>${u.rowsImported}</td><td>${new Date(u.importedAt).toLocaleDateString()}</td></tr>`
      ).join('');
    } catch (err) {
      uploadList.innerHTML = `<tr><td colspan="4">${err.message}</td></tr>`;
    }
  }

  loadUploads();
});
