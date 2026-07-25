import { apiFetch } from './api.js';

let currentMode = 'nlu';

function fmtDate(v) {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString();
}

function drawBar(selector, labels, values, color = '#1a73e8') {
  const el = document.querySelector(selector);
  if (!el || !labels.length) return;
  el.innerHTML = '';
  const w = Math.min(400, el.parentElement?.clientWidth - 40 || 360), h = 220;
  const margin = { top: 20, right: 20, bottom: 50, left: 45 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  const svg = d3.select(selector).append('svg').attr('width', w).attr('height', h)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(labels).range([0, innerW]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(values) * 1.1 || 1]).range([innerH, 0]);

  svg.append('g').call(d3.axisLeft(y).ticks(4));
  svg.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x))
    .selectAll('text').attr('transform', 'rotate(-20)').style('text-anchor', 'end').attr('dx', '-.3em').attr('dy', '.3em');

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
  const w = 260, h = 260, r = Math.min(w, h) / 2 - 30;
  const colors = d3.scaleOrdinal(d3.schemeSet2);
  const pie = d3.pie().value(d => d[1]);
  const arc = d3.arc().innerRadius(0).outerRadius(r);

  const svg = d3.select(selector).append('svg').attr('width', w).attr('height', h)
    .append('g').attr('transform', `translate(${w / 2},${h / 2})`);

  const arcs = svg.selectAll('path').data(pie(labels.map((l, i) => [l, values[i]]))).enter();
  arcs.append('path').attr('d', arc).attr('fill', (_, i) => colors(i));
  arcs.append('text').attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('text-anchor', 'middle').style('font-size', '10px').text(d => d.data[0]);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  const chartContainer = document.getElementById('chat-chart-container');
  const chartEl = document.getElementById('chat-chart');
  const sqlContainer = document.getElementById('chat-sql-container');
  const sqlEl = document.getElementById('chat-sql');

  function addMessage(text, isUser = false) {
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user' : 'bot'}`;
    div.innerHTML = `<div class="msg-text">${text.replace(/\n/g, '<br>')}</div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.id === 'mode-gemini' ? 'gemini' : 'nlu';
      addMessage(`Switched to <strong>${currentMode === 'gemini' ? 'Gemini AI' : 'NLU Engine'}</strong> mode.`);
    });
  });

  document.querySelectorAll('#example-list a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      input.value = a.dataset.q;
      form.dispatchEvent(new Event('submit'));
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, true);
    input.value = '';
    chartContainer.style.display = 'none';
    sqlContainer.style.display = 'none';

    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'message bot';
    thinkingMsg.innerHTML = '<div class="msg-text"><em>Thinking...</em></div>';
    messages.appendChild(thinkingMsg);
    messages.scrollTop = messages.scrollHeight;

    try {
      const data = await apiFetch('/api/chatbot/query', {
        method: 'POST',
        body: JSON.stringify({ question, mode: currentMode }),
      });

      messages.removeChild(thinkingMsg);

      if (data.answer) {
        addMessage(data.answer);
      }

      if (data.rows && data.rows.length) {
        let tableHtml = '<table class="compact-table"><thead><tr>' +
          Object.keys(data.rows[0]).map(k => `<th>${k}</th>`).join('') +
          '</tr></thead><tbody>';
        tableHtml += data.rows.map(r => '<tr>' + Object.values(r).map(v => `<td>${v ?? '-'}</td>`).join('') + '</tr>').join('');
        tableHtml += '</tbody></table>';
        addMessage(tableHtml);
      }

      if (data.chart && data.chart.labels?.length) {
        chartContainer.style.display = 'block';
        chartEl.innerHTML = '';
        setTimeout(() => {
          if (data.chart.type === 'pie') drawPie('#chat-chart', data.chart.labels, data.chart.values);
          else drawBar('#chat-chart', data.chart.labels, data.chart.values);
        }, 50);
      }

      if (data.sql) {
        sqlContainer.style.display = 'block';
        sqlEl.textContent = data.sql;
      }
    } catch (err) {
      messages.removeChild(thinkingMsg);
      addMessage(`Error: ${err.message}`);
    }
  });
});
