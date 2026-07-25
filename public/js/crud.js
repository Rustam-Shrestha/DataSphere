import { apiFetch } from './api.js';

let currentPage = 1;
let currentSearch = '';
const PAGE_SIZE = 25;

const FIELD_LABELS = {
  storeNumber: 'Store #',
  city: 'City',
  streetName: 'Street Name',
  facilityId: 'Facility ID',
  channelOfTrade: 'Channel of Trade',
  deliveryCertificateExpiredDate: 'Delivery Cert Expiry',
  insuranceExpiredDate: 'Insurance Expiry',
  corrosionTestDate: 'Corrosion Date',
  corrosionTestStatus: 'Corrosion Status',
  spillBucketsTestDate: 'Spill Buckets Date',
  spillBucketTestStatus: 'Spill Buckets Status',
  overfillProtectionDeviceTestDate: 'Overfill Date',
  overfillProtectionDeviceTestStatus: 'Overfill Status',
  lldLineTightnessTestDate: 'LLD Date',
  lldLineTightnessTestStatus: 'LLD Status',
  atgProbesTestDate: 'ATG Date',
  atgProbesTestStatus: 'ATG Status',
  sumpTestDate: 'Sump Date',
  sumpTestStatus: 'Sump Status',
  stage1TestDate: 'Stage 1 Date',
  stage1TestStatus: 'Stage 1 Status',
};

function fmtDate(v) {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString();
}

function statusBadge(s) {
  if (!s) return '<span class="badge badge-pending">-</span>';
  const cls = s === 'PASS' ? 'badge-pass' : s === 'FAIL' ? 'badge-fail' : 'badge-pending';
  return `<span class="badge ${cls}">${s}</span>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('records-body');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const pageInfo = document.getElementById('page-info');
  const countEl = document.getElementById('record-count');

  async function load() {
    if (!tbody) return;
    try {
      const params = new URLSearchParams({ page: currentPage, pageSize: PAGE_SIZE });
      if (currentSearch) params.set('search', currentSearch);
      const data = await apiFetch('/api/records?' + params.toString());
      countEl.textContent = `${data.total} record(s)`;
      pageInfo.textContent = `Page ${data.page} of ${Math.ceil(data.total / PAGE_SIZE) || 1}`;
      prevBtn.disabled = data.page <= 1;
      nextBtn.disabled = data.page * PAGE_SIZE >= data.total;

      tbody.innerHTML = data.items.map(r => `
        <tr>
          <td>${r.storeNumber}</td>
          <td>${r.city}</td>
          <td>${r.streetName}</td>
          <td>${r.facilityId ?? '-'}</td>
          <td>${statusBadge(r.corrosionTestStatus)}</td>
          <td>${statusBadge(r.spillBucketTestStatus)}</td>
          <td>${statusBadge(r.overfillProtectionDeviceTestStatus)}</td>
          <td>${statusBadge(r.lldLineTightnessTestStatus)}</td>
          <td>${statusBadge(r.atgProbesTestStatus)}</td>
          <td>${statusBadge(r.sumpTestStatus)}</td>
          <td>${statusBadge(r.stage1TestStatus)}</td>
          <td><button class="edit-btn" data-id="${r.id}">Edit</button></td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEdit(btn.dataset.id));
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="12">Error: ${err.message}</td></tr>`;
    }
  }

  searchBtn?.addEventListener('click', () => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    load();
  });
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBtn.click();
  });
  refreshBtn?.addEventListener('click', () => {
    currentSearch = '';
    searchInput.value = '';
    currentPage = 1;
    load();
  });
  prevBtn?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; load(); }
  });
  nextBtn?.addEventListener('click', () => {
    currentPage++; load();
  });

  load();
});

async function openEdit(id) {
  const modal = document.getElementById('edit-modal');
  const fields = document.getElementById('edit-form-fields');
  const form = document.getElementById('edit-form');

  try {
    const record = await apiFetch(`/api/records/${id}`);
    fields.innerHTML = Object.entries(FIELD_LABELS).map(([key, label]) => {
      const val = record[key];
      const strVal = val instanceof Date ? val.toISOString().split('T')[0] : (val ?? '');
      const isDate = key.includes('Date');
      return `
        <div class="form-field">
          <label>${label}</label>
          <input type="${isDate ? 'date' : 'text'}" name="${key}" value="${strVal}" class="${isDate ? 'date-input' : ''}">
        </div>
      `;
    }).join('');
    modal.style.display = 'flex';

    form.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const body = {};
      fd.forEach((v, k) => {
        if (v) body[k] = v;
        else body[k] = null;
      });
      try {
        await apiFetch(`/api/records/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
        modal.style.display = 'none';
        location.reload();
      } catch (err) {
        alert(err.message);
      }
    };

    document.getElementById('delete-btn').onclick = async () => {
      if (!confirm('Delete this record?')) return;
      try {
        await apiFetch(`/api/records/${id}`, { method: 'DELETE' });
        modal.style.display = 'none';
        location.reload();
      } catch (err) {
        alert(err.message);
      }
    };

    modal.querySelector('.modal-close').onclick = () => { modal.style.display = 'none'; };
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
  } catch (err) {
    alert(err.message);
  }
}
