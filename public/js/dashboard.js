import { apiFetch } from './api.js';

function fmtDate(v) {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString();
}

function drawBar(selector, labels, values, color = '#1a73e8') {
  const el = document.querySelector(selector);
  if (!el || !labels.length) return;
  el.innerHTML = '';
  const w = Math.min(500, el.parentElement?.clientWidth - 40 || 460), h = 250;
  const margin = { top: 20, right: 20, bottom: 60, left: 50 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  const svg = d3.select(selector).append('svg').attr('width', w).attr('height', h)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(labels).range([0, innerW]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(values) * 1.1 || 1]).range([innerH, 0]);

  svg.append('g').call(d3.axisLeft(y).ticks(5));
  svg.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x))
    .selectAll('text').attr('transform', 'rotate(-25)').style('text-anchor', 'end').attr('dx', '-.5em').attr('dy', '.3em');

  svg.selectAll('rect').data(values).enter().append('rect')
    .attr('x', (_, i) => x(labels[i]))
    .attr('y', d => y(d))
    .attr('width', x.bandwidth())
    .attr('height', d => innerH - y(d))
    .attr('fill', color)
    .attr('rx', 3);
}

function drawPie(selector, labels, values) {
  const el = document.querySelector(selector);
  if (!el || !labels.length) return;
  el.innerHTML = '';
  const w = Math.min(350, el.parentElement?.clientWidth - 40 || 310), h = 280, r = Math.min(w, h) / 2 - 30;
  const colors = d3.scaleOrdinal(d3.schemeSet2);
  const pie = d3.pie().value(d => d[1]);
  const arc = d3.arc().innerRadius(0).outerRadius(r);

  const svg = d3.select(selector).append('svg').attr('width', w).attr('height', h)
    .append('g').attr('transform', `translate(${w / 2},${h / 2})`);

  const arcs = svg.selectAll('path').data(pie(labels.map((l, i) => [l, values[i]]))).enter();
  arcs.append('path').attr('d', arc).attr('fill', (_, i) => colors(i));
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const records = await apiFetch('/api/records?pageSize=5');
    document.getElementById('stat-total').textContent = records.total;

    const cities = new Set(records.items.map(r => r.city));
    const totalResp = await apiFetch('/api/records?pageSize=1');
    const allItems = [];
    const pages = Math.ceil(totalResp.total / 100);
    for (let p = 1; p <= pages; p++) {
      const d = await apiFetch(`/api/records?page=${p}&pageSize=100`);
      d.items.forEach(r => cities.add(r.city));
      allItems.push(...d.items);
    }
    document.getElementById('stat-cities').textContent = cities.size;

    const tbody = document.getElementById('recent-records');
    if (tbody) {
      tbody.innerHTML = records.items.map(r => `
        <tr>
          <td>${r.storeNumber}</td>
          <td>${r.city}</td>
          <td>${r.streetName}</td>
          <td>${r.corrosionTestStatus || '-'}</td>
          <td>${r.spillBucketTestStatus || '-'}</td>
          <td>${r.overfillProtectionDeviceTestStatus || '-'}</td>
        </tr>
      `).join('');
    }

    const statusCounts = { PASS: 0, FAIL: 0, PENDING: 0 };
    const testTypes = ['corrosionTestStatus', 'spillBucketTestStatus', 'overfillProtectionDeviceTestStatus',
      'lldLineTightnessTestStatus', 'atgProbesTestStatus', 'sumpTestStatus', 'stage1TestStatus'];
    const testLabels = ['Corrosion', 'Spill Buckets', 'Overfill', 'LLD', 'ATG', 'Sump', 'Stage 1'];
    const testPassFail = testTypes.map(() => ({ pass: 0, fail: 0, other: 0 }));

    allItems.forEach(r => {
      testTypes.forEach((col, i) => {
        const v = r[col];
        if (v === 'PASS') { statusCounts.PASS++; testPassFail[i].pass++; }
        else if (v === 'FAIL') { statusCounts.FAIL++; testPassFail[i].fail++; }
        else { statusCounts.PENDING++; testPassFail[i].other++; }
      });
    });

    const distLabels = Object.keys(statusCounts).filter(k => statusCounts[k] > 0);
    const distValues = distLabels.map(k => statusCounts[k]);
    if (distLabels.length) drawPie('#chart-distribution', distLabels, distValues);
    else document.getElementById('chart-distribution').innerHTML = '<p class="text-sm">No data yet. Upload a file to get started.</p>';

    const barLabels = testLabels;
    const barValues = testPassFail.map(t => t.pass + t.fail);
    if (barValues.some(v => v > 0)) drawBar('#chart-test-breakdown', barLabels, barValues, '#1a73e8');
    else document.getElementById('chart-test-breakdown').innerHTML = '<p class="text-sm">No data yet.</p>';

    const expiryEl = document.getElementById('expiry-overview');
    const now = new Date();
    const soon30 = [];
    const overdue = [];
    allItems.forEach(r => {
      ['deliveryCertificateExpiredDate', 'insuranceExpiredDate'].forEach(col => {
        if (!r[col]) return;
        const d = new Date(r[col]);
        if (isNaN(d.getTime())) return;
        const diff = (d - now) / (1000 * 60 * 60 * 24);
        if (diff < 0) overdue.push({ store: r.storeNumber, city: r.city, type: col, date: d });
        else if (diff <= 30) soon30.push({ store: r.storeNumber, city: r.city, type: col, date: d });
      });
    });
    document.getElementById('stat-expiring').textContent = soon30.length;
    document.getElementById('stat-overdue').textContent = overdue.length;

    let expiryHtml = '';
    if (soon30.length) {
      expiryHtml += `<h3>Expiring within 30 days (${soon30.length})</h3><ul>${soon30.slice(0, 10).map(i => `<li>Store #${i.store} (${i.city}) — ${i.type.replace(/([A-Z])/g, ' $1').trim()} — ${i.date.toLocaleDateString()}</li>`).join('')}</ul>`;
    }
    if (overdue.length) {
      expiryHtml += `<h3>Overdue (${overdue.length})</h3><ul>${overdue.slice(0, 10).map(i => `<li>Store #${i.store} (${i.city}) — ${i.type.replace(/([A-Z])/g, ' $1').trim()} — ${i.date.toLocaleDateString()}</li>`).join('')}</ul>`;
    }
    if (!expiryHtml) expiryHtml = '<p class="text-sm">No upcoming or overdue expirations.</p>';
    expiryEl.innerHTML = expiryHtml;
  } catch (err) {
    document.querySelectorAll('.chart-box').forEach(el => el.innerHTML = `<p class="text-sm">Error: ${err.message}</p>`);
  }
});
