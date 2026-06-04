/* ============================================================
   PS Tools — shared front-end logic for domain pages.
   Reads window.DOMAIN, renders a tool-card grid (chips + search),
   and a focused single-tool workspace (form -> Generate -> output).
   Streams from the backend /generate SSE endpoint.
   ============================================================ */
(function () {
  'use strict';

  /* ---- API base: default :8000, override with ?api=http://host:port (persists) ---- */
  var qp = new URLSearchParams(location.search).get('api');
  if (qp) localStorage.setItem('ps_api_base', qp);
  var API_BASE = (qp || localStorage.getItem('ps_api_base') || 'http://localhost:8000').replace(/\/$/, '');
  var API_GENERATE = API_BASE + '/generate';

  /* ---- colorful icons without authoring 130 of them ---- */
  var PALETTE = ['#0d9488', '#2563eb', '#4f46e5', '#7c3aed', '#ea580c', '#e11d48', '#16a34a', '#ca8a04'];
  // ordered: first substring match wins, so put specific phrases before generic words
  var ICONS = [
    ['job description', '📝'], ['case study', '📚'], ['cover letter', '✍️'], ['red flag', '🚩'],
    ['due diligence', '🔎'], ['social media', '📱'], ['family health', '👪'], ['health report', '🧾'],
    ['self-care', '💆'], ['mock', '🎭'], ['resume', '📄'], [' cv', '📄'], ['ats', '🎯'],
    ['interview', '🎤'], ['offer', '📜'], ['onboard', '🎒'], ['outreach', '✉️'], ['cold', '✉️'],
    ['email', '✉️'], ['policy', '📑'], ['exit', '🚪'], ['performance', '⭐'], ['review', '⭐'],
    ['background', '🔍'], ['verification', '🔍'], ['skill', '🧩'], ['career', '🧭'], ['learning', '📚'],
    ['linkedin', '💼'], ['salary', '💰'], ['negotiation', '💰'], ['voice', '📞'], ['call', '📞'],
    ['shortlist', '📊'], ['rank', '📊'], ['candidate', '🧑'], ['lesson', '🏫'], ['quiz', '❓'],
    ['assessment', '❓'], ['exam', '❓'], ['rubric', '📏'], ['feedback', '💬'], ['flashcard', '🃏'],
    ['study', '📖'], ['parent', '👨‍👩‍👧'], ['curriculum', '🗂️'], ['syllabus', '🗂️'], ['progress', '📈'],
    ['detector', '🕵️'], ['tutor', '👩‍🏫'], ['research', '🔬'], ['adaptive', '🎚️'], ['personalised', '🎯'],
    ['meeting', '🗒️'], ['sop', '⚙️'], ['process', '⚙️'], ['business case', '💼'], ['project', '📋'],
    ['risk', '⚠️'], ['kpi', '📊'], ['stakeholder', '🤝'], ['vendor', '🏷️'], ['incident', '🚨'],
    ['change', '🔄'], ['budget', '💵'], ['pitch', '🪧'], ['deck', '🪧'], ['demo', '🖥️'],
    ['objection', '🛡️'], ['proposal', '📃'], ['persona', '🧑'], ['competit', '♟️'], ['playbook', '📓'],
    ['pricing', '🏷️'], ['discovery', '🧭'], ['lead', '🎯'], ['sequence', '🔁'], ['intelligence', '🧠'],
    ['executive', '🎩'], ['audit', '🔍'], ['maintenance', '🔧'], ['contract', '📜'], ['clause', '⚖️'],
    ['nda', '🤐'], ['privacy', '🔒'], ['terms', '📋'], ['rfp', '📨'], ['bid', '📨'],
    ['compliance', '✅'], ['brief', '📑'], ['employment', '🖋️'], ['agreement', '🖋️'], ['gdpr', '🛡️'],
    ['grant', '💰'], ['impact', '🌍'], ['donor', '🤝'], ['volunteer', '🙌'], ['fundrais', '📣'],
    ['campaign', '📣'], ['beneficiary', '📖'], ['story', '📖'], ['evaluation', '📐'], ['partnership', '🤝'],
    ['annual', '📅'], ['symptom', '🩺'], ['nutrition', '🥗'], ['medication', '💊'], ['wellness', '🌿'],
    ['appointment', '📆'], ['discharge', '🏥'], ['fitness', '🏃'], ['goal', '🎯'], ['coaching', '🧑‍🏫'],
    ['affirmation', '✨'], ['gratitude', '🙏'], ['stress', '😮‍💨'], ['mindful', '🧘'], ['cbt', '📝'],
    ['worksheet', '📝'], ['coping', '🧰'], ['sleep', '😴'], ['boundary', '🚧'], ['therapy', '🛋️'],
    ['mood', '📔'], ['journal', '📔'], ['check-in', '📔'], ['summar', '📝'], ['generator', '⚡'],
    ['report', '📈'], ['plan', '🗺️'], ['guide', '🧭'], ['document', '📄'], ['bot', '🤖'], ['agent', '🤖']
  ];
  function iconFor(name, fallback) {
    var n = ' ' + String(name).toLowerCase() + ' ';
    for (var i = 0; i < ICONS.length; i++) { if (n.indexOf(ICONS[i][0]) !== -1) return ICONS[i][1]; }
    return fallback || '🛠️';
  }

  /* ---- helpers ---- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function attr(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
  var SEARCH_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  /* ---- state ---- */
  var DOMAIN, all = [], tools = [], agents = [], filter = 'all', query = '', app;

  function filtered() {
    var list = filter === 'tools' ? tools : filter === 'agents' ? agents : all;
    var q = query.trim().toLowerCase();
    if (q) list = list.filter(function (t) { return (t.name + ' ' + (t.description || '')).toLowerCase().indexOf(q) !== -1; });
    return list;
  }

  function cardHTML(t) {
    return '<button class="card' + (t.isAgent ? ' agent' : '') + '" style="--accent:' + t._accent + '" onclick="PSApp.open(\'' + t.id + '\')">' +
      '<div class="card-top"><div class="card-icon">' + t._icon + '</div>' +
      (t.isAgent ? '<span class="pill pill-agent">Agent</span>' : '') + '</div>' +
      '<div class="card-title">' + esc(t.name) + '</div>' +
      '<div class="card-desc">' + esc(t.description || '') + '</div>' +
      '<div class="card-foot"><span class="card-open">Open <span class="arr">→</span></span></div>' +
      '</button>';
  }

  function resultsHTML() {
    var list = filtered();
    if (!list.length) return '<div class="grid-empty">No tools match “' + esc(query) + '”.</div>';
    return '<div class="grid">' + list.map(cardHTML).join('') + '</div>';
  }

  function gridView() {
    app.innerHTML =
      '<section class="page-head"><div class="wrap">' +
        '<div class="crumb"><a href="index.html">← All domains</a></div>' +
        '<div class="page-head-row">' +
          '<div class="page-head-icon">' + DOMAIN.icon + '</div>' +
          '<div><h1>' + esc(DOMAIN.name) + '</h1><div class="meta">' + tools.length + ' tools · ' + agents.length + ' agents</div></div>' +
        '</div>' +
      '</div></section>' +
      '<div class="wrap section">' +
        '<div class="toolbar"><div class="chips">' +
          chip('all', 'All', all.length) + chip('tools', 'Tools', tools.length) + chip('agents', 'Agents', agents.length) +
        '</div>' +
        '<label class="search">' + SEARCH_SVG + '<input type="text" placeholder="Search ' + attr(DOMAIN.name) + ' tools…" value="' + attr(query) + '" oninput="PSApp.search(this.value)"></label>' +
        '</div>' +
        '<div id="results">' + resultsHTML() + '</div>' +
      '</div>';
  }
  function chip(key, label, n) {
    return '<button class="chip' + (filter === key ? ' active' : '') + '" onclick="PSApp.filter(\'' + key + '\')">' + label + '<span class="chip-n">' + n + '</span></button>';
  }

  function fieldHTML(f) {
    var req = f.required ? ' required' : '', inp = '';
    if (f.type === 'text') inp = '<input type="text" id="f_' + f.id + '" placeholder="' + attr(f.placeholder) + '"' + req + '>';
    else if (f.type === 'select') inp = '<select id="f_' + f.id + '">' + (f.options || []).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
    else inp = '<textarea id="f_' + f.id + '" rows="' + (f.rows || 4) + '" placeholder="' + attr(f.placeholder) + '"' + req + '></textarea>' +
      '<label class="btn-upload">📎 Upload file<input type="file" accept=".txt,.pdf,.docx,.md,.csv" onchange="PSApp.upload(\'f_' + f.id + '\',this)"></label>';
    return '<div class="field"><label class="field-label" for="f_' + f.id + '">' + esc(f.label) + (f.required ? '' : ' <span class="field-opt">(optional)</span>') + '</label>' + inp + '</div>';
  }

  function focusedView(t) {
    app.innerHTML =
      '<div class="focused">' +
        '<a class="back-link" href="#" onclick="PSApp.back();return false;">← Back to ' + esc(DOMAIN.name) + ' tools</a>' +
        '<div class="focused-head" style="--accent:' + t._accent + '">' +
          '<div class="f-icon">' + t._icon + '</div><h2>' + esc(t.name) + '</h2><p>' + esc(t.description || '') + '</p>' +
        '</div>' +
        '<div class="form-card">' + t.fields.map(fieldHTML).join('') +
          '<button class="btn-primary" onclick="PSApp.run(\'' + t.id + '\')">✨ Generate</button>' +
        '</div>' +
        '<div class="output-card"><div class="output-head"><span class="lbl">Output</span>' +
          '<div class="output-actions"><button class="btn-mini" onclick="PSApp.download()">↓ Save</button><button class="btn-mini" onclick="PSApp.copy()">Copy</button></div></div>' +
          '<div class="output-body empty" id="out"><div class="e-icon">✨</div><p>Fill in the form and click Generate.</p></div>' +
        '</div>' +
      '</div>';
  }

  async function run(id) {
    var t = byId(id); if (!t) return;
    var data = {}, ok = true;
    t.fields.forEach(function (f) {
      var el = document.getElementById('f_' + f.id); if (!el) return;
      var v = (el.value || '').trim();
      if (f.required && !v) { el.classList.add('err'); ok = false; } else { el.classList.remove('err'); data[f.id] = v; }
    });
    if (!ok) return;
    var out = document.getElementById('out'), btn = document.querySelector('.btn-primary');
    out.className = 'output-body streaming'; out.style.color = '';
    out.innerHTML = '<span style="color:var(--muted)">Generating<span class="dots"><span>.</span><span>.</span><span>.</span></span></span>';
    btn.disabled = true; var bt = btn.innerHTML; btn.textContent = 'Generating…';
    try {
      var res = await fetch(API_GENERATE, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt: t.systemPrompt, user_message: t.buildUserMessage(data) })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var reader = res.body.getReader(), dec = new TextDecoder(), acc = '';
      out.textContent = '';
      while (true) {
        var r = await reader.read(); if (r.done) break;
        var lines = dec.decode(r.value).split('\n');
        for (var i = 0; i < lines.length; i++) {
          if (lines[i].indexOf('data: ') !== 0) continue;
          var d = lines[i].slice(6); if (d === '[DONE]') break;
          try { var p = JSON.parse(d); if (p.error) { out.className = 'output-body'; out.style.color = '#ef4444'; out.textContent = 'Error: ' + p.error; } else if (p.text) { acc += p.text; out.textContent = acc; out.scrollTop = out.scrollHeight; } } catch (e) {}
        }
      }
      if (acc && typeof marked !== 'undefined') { out.className = 'output-body'; out.innerHTML = marked.parse(acc); }
      else if (acc) { out.className = 'output-body'; }
    } catch (e) {
      out.className = 'output-body'; out.style.color = '#ef4444';
      out.textContent = 'Connection error: ' + e.message + '\n\nStart the backend:\n  cd backend\n  python -m uvicorn main:app --port 8000';
    }
    btn.disabled = false; btn.innerHTML = bt;
  }

  function copy() {
    var el = document.getElementById('out'); if (!el) return;
    var text = el.innerText || ''; if (!text || text.indexOf('Fill in the form') !== -1) return;
    navigator.clipboard.writeText(text).then(function () {
      var b = document.querySelector('.output-actions .btn-mini:last-child'); if (!b) return;
      var o = b.textContent; b.textContent = 'Copied!'; setTimeout(function () { b.textContent = o; }, 1600);
    });
  }
  function download() {
    var el = document.getElementById('out'); if (!el) return;
    var text = el.innerText || ''; if (!text || text.indexOf('Fill in the form') !== -1) return;
    var a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text); a.download = 'output.txt'; a.click();
  }
  async function upload(fieldId, input) {
    var file = input.files[0]; if (!file) return;
    var ext = file.name.split('.').pop().toLowerCase(), ta = document.getElementById(fieldId);
    var prev = ta.placeholder; ta.placeholder = 'Reading file…'; ta.disabled = true;
    try {
      if (ext === 'txt' || ext === 'md' || ext === 'csv') { ta.value = await file.text(); }
      else if (ext === 'pdf') {
        if (typeof pdfjsLib === 'undefined') { alert('PDF library not loaded yet, please retry.'); }
        else {
          var buf = await file.arrayBuffer(), pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise, text = '';
          for (var i = 1; i <= pdf.numPages; i++) { var pg = await pdf.getPage(i), c = await pg.getTextContent(); text += c.items.map(function (it) { return it.str; }).join(' ') + '\n\n'; }
          ta.value = text.trim();
        }
      } else if (ext === 'docx') {
        if (typeof mammoth === 'undefined') { alert('DOCX library not loaded yet, please retry.'); }
        else { var b2 = await file.arrayBuffer(), rr = await mammoth.extractRawText({ arrayBuffer: b2 }); ta.value = rr.value; }
      }
    } catch (e) { alert('Could not read file: ' + e.message); }
    ta.disabled = false; ta.placeholder = prev; input.value = '';
  }

  function byId(id) { for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i]; return null; }

  function route() {
    var id = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    var t = id && byId(id);
    if (t) focusedView(t); else gridView();
    window.scrollTo(0, 0);
  }

  function init() {
    DOMAIN = window.DOMAIN; app = document.getElementById('app');
    if (!DOMAIN || !app) return;
    all = DOMAIN.tools || [];
    tools = all.filter(function (t) { return !t.isAgent; });
    agents = all.filter(function (t) { return t.isAgent; });
    all.forEach(function (t, i) { t._icon = iconFor(t.name, DOMAIN.icon); t._accent = t.isAgent ? 'var(--agent)' : PALETTE[i % PALETTE.length]; });
    document.title = DOMAIN.name + ' · AI Tool Kit';
    window.addEventListener('hashchange', route);
    route();
  }

  window.PSApp = {
    open: function (id) { location.hash = encodeURIComponent(id); },
    back: function () { location.hash = ''; },
    filter: function (f) { filter = f; gridView(); },
    search: function (v) { query = v; var r = document.getElementById('results'); if (r) r.innerHTML = resultsHTML(); },
    run: run, copy: copy, download: download, upload: upload
  };

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
