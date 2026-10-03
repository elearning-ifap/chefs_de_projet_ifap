/* =====================================================================
   MOTEUR DU SIMULATEUR — jauges, contaminations, effets différés,
   crises, incidents, recharges, scénario, jauge cachée, rapport.
   Modes : window.SIM_MODE = 'single' (prototype tout-en-un) | 'scorm'
   ===================================================================== */
(function () {
  'use strict';
  var C = window.SIM;
  var MODE = window.SIM_MODE || 'single';
  var HOOKS = window.SIM_HOOKS || {};

  var ORDER = ['intro', 's1', 's2', 's3', 's4', 's5', 's6', 'conclusion'];
  var FILES = { intro: 'index.html', s1: 'section-1.html', s2: 'section-2.html', s3: 'section-3.html', s4: 'section-4.html', s5: 'section-5.html', s6: 'section-6.html',
    conclusion: 'conclusion.html', credits: 'credits.html', 'fiche-cdc': 'fiche-cdc.html', 'fiche-kirk': 'fiche-kirkpatrick.html' };
  var G3 = ['budget', 'delai', 'qualite'];
  var G4 = ['budget', 'delai', 'qualite', 'confiance'];
  var PHASE_COLOR = { s1: '#63b8e8', s2: '#a59fce', s3: '#2fb6bc', s4: '#ed9c89', s5: '#ffcb00', s6: '#7c6eaf' };
  var MAX_RECHARGE = 2;

  /* ------------------------------------------------------------------ */
  /* STOCKAGE (sessionStorage + repli mémoire)                           */
  /* ------------------------------------------------------------------ */
  var MEM = {};
  var Store = {
    get: function (k, d) {
      var v = null;
      try { v = window.sessionStorage.getItem(k); } catch (e) { v = null; }
      if (v === null || v === undefined) return Object.prototype.hasOwnProperty.call(MEM, k) ? MEM[k] : d;
      try { return JSON.parse(v); } catch (e) { return v; }
    },
    set: function (k, v) {
      MEM[k] = v;
      try { window.sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) {}
    },
    clearAll: function () {
      MEM = {};
      try {
        var ks = [];
        for (var i = 0; i < sessionStorage.length; i++) ks.push(sessionStorage.key(i));
        ks.forEach(function (k) { if (ALL_KEYS.indexOf(k) > -1 || k.indexOf('sim_') === 0) sessionStorage.removeItem(k); });
      } catch (e) {}
    }
  };
  var ALL_KEYS = ['scenarioChoice', 'budget', 'delai', 'qualite', 'confiance_cmd',
    'contamination_budget_triggered', 'contamination_delai_triggered', 'contamination_qualite_triggered', 'contamination_confiance_triggered',
    'deferred_impacts', 'recharges_budget', 'recharges_delai', 'recharges_qualite', 'decisions_journal', 'incidents', 'diagnostic_score'];
  var CONTAM_FLAGS = ['contamination_budget_triggered', 'contamination_delai_triggered', 'contamination_qualite_triggered', 'contamination_confiance_triggered'];

  /* ------------------------------------------------------------------ */
  /* ÉTAT                                                                */
  /* ------------------------------------------------------------------ */
  var S;
  function fresh() {
    return { scenario: null, budget: 100, delai: 100, qualite: 100, confiance: 100,
      flags: { contamination_budget_triggered: false, contamination_delai_triggered: false, contamination_qualite_triggered: false, contamination_confiance_triggered: false,
        crisis_budget: false, crisis_delai: false, crisis_qualite: false, kpi_defined: false },
      recharges: { budget: 0, delai: 0, qualite: 0 }, deferred: [], journal: [], incidents: [], diag: null,
      history: [], done: [], feed: [], gates: [], moods: { mw: 0, nico: 0, lea: 0, sylvie: 0 }, week: 0 };
  }
  function load() {
    S = fresh();
    S.scenario = Store.get('scenarioChoice', null);
    S.budget = Store.get('budget', 100); S.delai = Store.get('delai', 100); S.qualite = Store.get('qualite', 100); S.confiance = Store.get('confiance_cmd', 100);
    var f = Store.get('sim_flags', null); if (f) S.flags = f;
    CONTAM_FLAGS.forEach(function (k) { S.flags[k] = !!Store.get(k, S.flags[k]); });
    G3.forEach(function (g) { S.recharges[g] = Store.get('recharges_' + g, 0); });
    S.deferred = Store.get('deferred_impacts', []); S.journal = Store.get('decisions_journal', []); S.incidents = Store.get('incidents', []);
    S.diag = Store.get('diagnostic_score', null);
    S.history = Store.get('sim_history', []); S.done = Store.get('sim_done', []); S.feed = Store.get('sim_feed', []);
    S.moods = Store.get('sim_moods', S.moods); S.week = Store.get('sim_week', 0); S.gates = Store.get('sim_gates', []);
  }
  function save() {
    if (S.scenario) Store.set('scenarioChoice', S.scenario);
    Store.set('budget', S.budget); Store.set('delai', S.delai); Store.set('qualite', S.qualite); Store.set('confiance_cmd', S.confiance);
    CONTAM_FLAGS.forEach(function (k) { Store.set(k, !!S.flags[k]); });
    Store.set('sim_flags', S.flags);
    G3.forEach(function (g) { Store.set('recharges_' + g, S.recharges[g]); });
    Store.set('deferred_impacts', S.deferred); Store.set('decisions_journal', S.journal); Store.set('incidents', S.incidents);
    if (S.diag !== null) Store.set('diagnostic_score', S.diag);
    Store.set('sim_history', S.history); Store.set('sim_done', S.done); Store.set('sim_feed', S.feed.slice(-30));
    Store.set('sim_moods', S.moods); Store.set('sim_week', S.week); Store.set('sim_gates', S.gates);
  }
  function snapshot() { return JSON.parse(JSON.stringify(S)); }
  function restore(cp) { S = JSON.parse(JSON.stringify(cp)); save(); }

  /* ------------------------------------------------------------------ */
  /* UTILITAIRES                                                         */
  /* ------------------------------------------------------------------ */
  function T(x) {
    if (x === null || x === undefined) return '';
    if (typeof x === 'function') return x(S);
    if (typeof x === 'object' && !Array.isArray(x)) { if (!S.scenario && x._ !== undefined) return x._; return x[S.scenario || 'A'] !== undefined ? x[S.scenario || 'A'] : (x._ !== undefined ? x._ : (x.A || '')); }
    return x;
  }
  function fr(s) { return String(s).replace(/ ([:;!?»])/g, ' $1').replace(/« /g, '« '); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }
  function sum(arr) { return arr.reduce(function (a, b) { return a + b; }, 0); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function order(n, seed) {
    var a = []; for (var i = 0; i < n; i++) a.push(i);
    var h = hash(seed);
    for (var j = n - 1; j > 0; j--) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = (h ^ (h >>> 13)) >>> 0; var k = h % (j + 1); var t = a[j]; a[j] = a[k]; a[k] = t; }
    return a;
  }
  function gColor(v) { return v >= 70 ? '#2fb6bc' : v >= 40 ? '#ffcb00' : '#ed9c89'; }
  function gName(g) { return C.gauges[g].short; }
  function signed(d) { return (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d); }
  function photoURL(p) { return p ? ((window.SIM_ASSETS && window.SIM_ASSETS[p]) || p) : null; }
  function ch(id) { var c = C.characters[id]; return { name: c.name, role: T(c.role), initials: c.initials, color: c.color, photo: photoURL(c.photo) }; }
  function avStyle(c) { return c.photo ? 'background:' + c.color + ' url(' + c.photo + ') center/cover no-repeat' : 'background:' + c.color; }
  function avatar(id, cls, inner) { var c = ch(id); return '<span class="av ' + (cls || '') + (c.photo ? ' ph' : '') + '" style="' + avStyle(c) + '" aria-hidden="true">' + (c.photo ? '' : c.initials) + (inner || '') + '</span>'; }
  function secById(id) { for (var i = 0; i < C.sections.length; i++) if (C.sections[i].id === id) return C.sections[i]; return null; }
  function filterScen(b) { if (b.when && !b.when(S)) return false; if (!b.scenario) return true; var a = Array.isArray(b.scenario) ? b.scenario : [b.scenario]; return a.indexOf(S.scenario) > -1; }
  function announce(msg) { var l = $('#sim-live'); if (l) { l.textContent = ''; setTimeout(function () { l.textContent = msg; }, 30); } }
  function phaseLabel(id) { var s = secById(id); return s ? 'Phase ' + s.letter + ' · ' + s.phase : ''; }

  /* ------------------------------------------------------------------ */
  /* MÉCANIQUE DES JAUGES                                                */
  /* ------------------------------------------------------------------ */
  var RULES = [
    { key: 'contamination_budget_triggered', g: 'budget', th: 40, eff: { delai: -10 }, txt: C.domino.budget },
    { key: 'contamination_delai_triggered', g: 'delai', th: 30, eff: { qualite: -15 }, txt: C.domino.delai },
    { key: 'contamination_qualite_triggered', g: 'qualite', th: 20, eff: { budget: -10 }, txt: C.domino.qualite },
    { key: 'contamination_confiance_triggered', g: 'confiance', th: 30, eff: { budget: -15, delai: -10 }, txt: C.domino.confiance }
  ];

  /* Applique des deltas. Les hausses de Budget/Délai/Qualité consomment une
     recharge (max 2 par jauge). Retourne [{g, d, want, blocked, full}] */
  function applyEffects(eff, opts) {
    opts = opts || {};
    var out = [];
    G4.forEach(function (g) {
      var d = eff[g]; if (!d) return;
      if (d > 0 && G3.indexOf(g) > -1 && !opts.noRecharge) {
        if (S[g] >= 100) { out.push({ g: g, d: 0, want: d, full: true }); return; }
        if (S.recharges[g] >= MAX_RECHARGE) { out.push({ g: g, d: 0, want: d, blocked: true }); return; }
        S.recharges[g]++;
      }
      var before = S[g]; S[g] = clamp(S[g] + d);
      out.push({ g: g, d: S[g] - before, want: d });
    });
    return out;
  }

  /* Contaminations (avec flags anti-cascade), incidents (jauge à 0),
     seuils critiques (< 25). Retourne les événements et les beats à insérer. */
  function settle() {
    var events = [], beats = [];
    for (var pass = 0; pass < 12; pass++) {
      var changed = false;
      RULES.forEach(function (r) {
        var below = S[r.g] < r.th;
        if (below && !S.flags[r.key]) {
          S.flags[r.key] = true;
          events.push({ type: 'domino', rule: r, applied: applyEffects(r.eff, { noRecharge: true }) });
          changed = true;
        } else if (!below && S.flags[r.key]) { S.flags[r.key] = false; }
      });
      G3.forEach(function (g) {
        if (S[g] <= 0 && S.incidents.filter(function (x) { return x.jauge === g; }).length >= 2) { S[g] = 5; return; }
        if (S[g] <= 0) {
          var inc = C.incidents[g];
          S[g] = inc.restore;
          var ap = applyEffects(inc.cost, { noRecharge: true });
          S.incidents.push({ section: P.page, jauge: g, penalty_applied: inc.cost, title: inc.title, week: S.week });
          events.push({ type: 'incident', g: g, applied: ap });
          beats.push({ type: 'incident', g: g, applied: ap });
          changed = true;
        }
      });
      if (!changed) break;
    }
    G3.forEach(function (g) {
      if (S[g] < 25 && !S.flags['crisis_' + g]) { S.flags['crisis_' + g] = true; beats.push({ type: 'crisis', g: g }); }
    });
    return { events: events, beats: beats };
  }

  function pushHistory(label) {
    S.history.push({ k: label, sec: P.page, w: S.week, budget: S.budget, delai: S.delai, qualite: S.qualite, confiance: S.confiance });
  }
  function feed(t, c) { S.feed.push({ t: t, c: c || '#d6d9e0', w: S.week }); renderFeed(); }

  /* Décision : effets immédiats + différés + journal */
  function decide(beat, opt, cfg) {
    var eff = {}; Object.keys(opt.effects || {}).forEach(function (k) { eff[k] = opt.effects[k]; });
    var bonus = null;
    if (opt.bonusIf && S.flags[opt.bonusIf.flag]) {
      Object.keys(opt.bonusIf.effects).forEach(function (k) { eff[k] = (eff[k] || 0) + opt.bonusIf.effects[k]; });
      bonus = opt.bonusIf.text;
    }
    var applied = applyEffects(eff);
    if (opt.set) Object.keys(opt.set).forEach(function (k) { S.flags[k] = opt.set[k]; });
    if (opt.setScenario) { S.scenario = opt.setScenario; Store.set('scenarioChoice', S.scenario); renderChip(); setTimeout(function () { renderDash(); }, 0); }
    if (opt.cancel) {
      S.deferred = S.deferred.filter(function (d) { return d.applied || opt.cancel.indexOf(d.from) === -1; });
      S.journal.forEach(function (j) { if (opt.cancel.indexOf(j.id) > -1 && j.deferred && j.deferred.length) j.recovered = cfg.title; });
    }
    var defs = (opt.deferred || []).map(function (d) { return { section: d.section, jauge: d.jauge, delta: d.delta, reason: d.reason, from: cfg.jid, fromSection: P.page, applied: false }; });
    S.deferred = S.deferred.concat(defs);
    var st = settle();
    var best = cfg.options.filter(function (o) { return o.id === cfg.best; })[0] || cfg.options.filter(function (o) { return o.quality === 'good'; })[0];
    var domSum = 0; st.events.forEach(function (e) { e.applied.forEach(function (a) { domSum += a.d; }); });
    S.journal.push({ section: P.page, id: cfg.jid, title: fr(T(cfg.title)), choice: fr(T(opt.label)), choiceId: opt.id, quality: opt.quality,
      impact: sum(applied.map(function (a) { return a.d; })) + domSum,
      applied: applied, domino: domSum, deferred: defs.map(function (d) { return { jauge: d.jauge, delta: d.delta, reason: d.reason, section: d.section }; }),
      deferredApplied: 0, conseil: cfg.conseil || '', best: best ? fr(T(best.label)) : '', week: S.week, crisis: !!cfg.crisis, gate: !!cfg.gate });
    if (cfg.gate) S.gates.push({ id: cfg.jid, title: fr(T(cfg.title)), choice: fr(T(opt.label)), quality: opt.quality });
    if (opt.reaction) S.moods[opt.reaction.who] = opt.reaction.mood || 0;
    pushHistory(T(cfg.short || cfg.title));
    feed('Décision · ' + T(cfg.title), opt.quality === 'good' ? '#2fb6bc' : opt.quality === 'mixed' ? '#ffcb00' : '#ed9c89');
    save();
    return { applied: applied, st: st, bonus: bonus };
  }

  function applyDeferred(secId) {
    var items = S.deferred.filter(function (d) { return d.section === secId && !d.applied; });
    var res = [];
    items.forEach(function (d) {
      d.applied = true;
      var e = {}; e[d.jauge] = d.delta;
      var ap = applyEffects(e);
      res.push({ d: d, ap: ap });
      S.journal.forEach(function (j) { if (j.id === d.from && j.section === d.fromSection) j.deferredApplied = (j.deferredApplied || 0) + sum(ap.map(function (a) { return a.d; })); });
    });
    var st = settle();
    if (items.length) { pushHistory('Effets différés'); feed('Effets différés appliqués', '#a59fce'); }
    save();
    return { res: res, st: st };
  }

  /* ------------------------------------------------------------------ */
  /* SHELL                                                               */
  /* ------------------------------------------------------------------ */
  var P = { page: 'intro', seq: [], i: 0, review: false, live: {} };

  function shell(page) {
    var app = $('#app');
    var wide = page === 'conclusion' || page === 'credits';
    app.innerHTML =
      '<header class="topbar" role="banner">' +
        '<a class="brand" ' + linkAttr('intro') + ' aria-label="LIANE — Bureau de projet, retour au briefing"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="brand-txt"><small>IFAP · LIANE</small><strong>Bureau de projet</strong></span></a>' +
        '<div class="timebar" id="timebar"></div>' +
        '<div class="top-right"><div id="scen-chip"></div>' + fsButton() + '</div>' +
      '</header>' +
      '<div class="layout' + (wide ? ' wide' : '') + '">' +
        '<nav class="rail" aria-label="Phases du projet" id="rail"></nav>' +
        '<main class="stage" id="stage" tabindex="-1"></main>' +
        (wide ? '' : '<aside class="dash" id="dash" aria-label="Tableau de bord du projet"></aside>') +
      '</div>' +
      '<div class="fx-layer" id="fx" aria-hidden="true"></div>' +
      '<footer class="site-foot" role="contentinfo">IFAP · LIANE — ' + C.meta.title + ' · CC BY-NC-SA 4.0</footer>' +
      '<div id="sim-live" class="sr-only" aria-live="polite"></div>';
    $('.brand').addEventListener('click', navHandler);
    wireFS();
    renderRail(); renderTimebar(); renderChip();
    if (!wide) renderDash();
  }
  function linkAttr(page) { return MODE === 'single' ? 'href="#' + page + '" data-go="' + page + '"' : 'href="' + FILES[page] + '"'; }
  function navHandler(e) {
    var go = e.currentTarget.getAttribute('data-go');
    if (MODE === 'single' && go) { e.preventDefault(); Sim.go(go); }
  }
  function current() { for (var i = 0; i < ORDER.length; i++) if (S.done.indexOf(ORDER[i]) === -1) return ORDER[i]; return 'conclusion'; }

  function renderRail() {
    var r = $('#rail'); if (!r) return;
    var items = [{ id: 'intro', L: '◎', t: 'Briefing', s: 'Prise de poste' }];
    C.sections.forEach(function (s) { items.push({ id: s.id, L: s.letter, t: s.title, s: s.phase }); });
    items.push({ id: 'conclusion', L: '✓', t: 'Rapport de mission', s: 'Bilan' });
    var cur = current();
    var html = '<h2>Processus IFAP</h2><ol>';
    items.forEach(function (it) {
      var inner = '<span class="L" aria-hidden="true">' + it.L + '</span><span class="t"><small>' + it.s + '</small>' + it.t + '</span>';
      if (it.id === P.page) html += '<li class="cur"><span aria-current="page">' + inner + '</span></li>';
      else if (S.done.indexOf(it.id) > -1) html += '<li class="done"><a ' + linkAttr(it.id) + ' title="Revoir : ' + esc(it.t) + '">' + inner + '<span class="sr-only"> (terminée, consultable)</span></a></li>';
      else if (it.id === cur) html += '<li><a ' + linkAttr(it.id) + '>' + inner + '<span class="sr-only"> (en cours)</span></a></li>';
      else html += '<li class="lock"><span>' + inner + '<span class="sr-only"> (verrouillée)</span></span></li>';
    });
    html += '</ol><p class="rail-foot">Les phases terminées restent consultables. Vos décisions, elles, sont définitives.</p>';
    r.innerHTML = html;
    $$('a[data-go]', r).forEach(function (a) { a.addEventListener('click', navHandler); });
  }

  function renderTimebar() {
    var tb = $('#timebar'); if (!tb) return;
    var label, idx = C.sections.map(function (s) { return s.id; }).indexOf(P.page);
    if (P.page === 'intro') label = '<b>Briefing</b><span class="sep">/</span>Prise de poste<span class="sep">/</span>Semaine 0';
    else if (idx > -1) label = '<b>Phase ' + C.sections[idx].pnum + ' / 5</b><span class="sep">—</span>' + C.sections[idx].phaseLong + '<span class="sep">—</span>Semaine ' + Math.max(1, S.week);
    else label = '<b>Rapport de mission</b><span class="sep">—</span>Projet clôturé<span class="sep">—</span>Semaine 12';
    var w = P.page === 'intro' ? 0 : (idx > -1 ? Math.max(1, S.week) : 12);
    var weeks = '';
    for (var k = 1; k <= 12; k++) {
      var sec = C.sections.filter(function (s) { return k >= s.weeks[0] && k <= s.weeks[1]; })[0];
      var col = sec ? PHASE_COLOR[sec.id] : '#63b8e8';
      weeks += '<span class="wk' + (k <= w ? ' on' : '') + (k === w ? ' now' : '') + '" style="--c:' + col + '" title="Semaine ' + k + '"></span>';
    }
    tb.innerHTML = '<div class="timebar-label" aria-live="polite">' + label + '</div><div class="weeks" aria-hidden="true">' + weeks + '</div>';
  }
  function renderChip() {
    var el = $('#scen-chip'); if (!el) return;
    if (!S.scenario) { el.innerHTML = '<span class="scen-chip empty">Modalité à décider</span>'; return; }
    var sc = C.scenarios[S.scenario];
    el.innerHTML = '<span class="scen-chip" title="Scénario ' + sc.code + '"><span class="dot" style="background:' + sc.accent + '">' + sc.code + '</span>' + sc.tag + '</span>';
  }

  /* ---- Tableau de bord ---- */
  var RC = 2 * Math.PI * 40;
  function ringSVG(v, hidden) {
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="40"/>' +
      (hidden ? '' : '<circle class="val" cx="50" cy="50" r="40" stroke="' + gColor(v) + '" stroke-dasharray="' + RC.toFixed(2) + '" stroke-dashoffset="' + (RC * (1 - v / 100)).toFixed(2) + '"/>') + '</svg>';
  }
  function renderDash() {
    var d = $('#dash'); if (!d) return;
    var g = '';
    G3.forEach(function (k) {
      g += '<div class="gauge" id="g-' + k + '" role="img" aria-label="' + C.gauges[k].label + ' : ' + S[k] + ' sur 100">' +
        '<div class="ring">' + ringSVG(S[k]) + '<span class="num">' + S[k] + '</span></div>' +
        '<span class="lbl">' + C.gauges[k].short + '</span>' +
        '<span class="recharges" title="Marges de rattrapage restantes"></span></div>';
    });
    g += '<div class="gauge hidden-g" role="img" aria-label="Indicateur masqué, révélé dans le rapport final"><div class="ring">' + ringSVG(0, true) + '<span class="num">?</span></div><span class="lbl">Indicateur masqué</span></div>';
    var team = '';
    C.team.forEach(function (id) {
      var c = ch(id);
      team += '<div class="member" id="m-' + id + '">' + avatar(id, 'sm', '<i class="mood"></i>') + '<span class="who"><strong>' + c.name + '</strong><span>' + c.role + '</span></span></div>';
    });
    d.innerHTML =
      '<section class="panel p-gauges"><h2>Jauges du projet <span class="mono" title="Seuil critique">◷ S' + Math.max(0, S.week) + '</span></h2><div class="gauges">' + g + '</div>' +
      '<div class="g-legend"><span><i style="background:#2fb6bc"></i>≥ 70</span><span><i style="background:#ffcb00"></i>40–69</span><span><i style="background:#ed9c89"></i>&lt; 40</span></div></section>' +
      '<section class="panel"><h2>Équipe projet</h2><div class="team">' + team + '</div></section>' +
      '<section class="panel"><h2>Journal de bord</h2><ul class="feed" id="feed"></ul></section>';
    updateDash(); renderFeed();
  }
  function updateDash(hit) {
    G3.forEach(function (k) {
      var el = $('#g-' + k); if (!el) return;
      var v = S[k], c = gColor(v);
      var val = $('.val', el); val.setAttribute('stroke', c); val.setAttribute('stroke-dashoffset', (RC * (1 - v / 100)).toFixed(2));
      countTo($('.num', el), v);
      el.setAttribute('aria-label', C.gauges[k].label + ' : ' + v + ' sur 100');
      el.classList.toggle('crit', v < 25);
      var r = ''; for (var i = 0; i < MAX_RECHARGE; i++) r += '<b class="' + (i < S.recharges[k] ? 'used' : '') + '"></b>';
      $('.recharges', el).innerHTML = r;
      $('.recharges', el).setAttribute('title', (MAX_RECHARGE - S.recharges[k]) + ' marge(s) de rattrapage restante(s)');
      if (hit && hit.indexOf(k) > -1) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
    });
    C.team.forEach(function (id) { var m = $('#m-' + id + ' .mood'); if (m) m.className = 'mood m' + (S.moods[id] || 0); });
    var wk = $('.p-gauges h2 .mono'); if (wk) wk.textContent = '◷ S' + Math.max(0, S.week);
  }
  function countTo(el, v) {
    var from = parseInt(el.textContent, 10); if (isNaN(from) || from === v) { el.textContent = v; return; }
    var t0 = performance.now(), dur = 700;
    (function step(t) { var p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(from + (v - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
  }
  function renderFeed() {
    var f = $('#feed'); if (!f) return;
    var items = S.feed.slice(-8).reverse();
    f.innerHTML = items.length ? items.map(function (x) { return '<li style="--c:' + x.c + '"><span><small>SEMAINE ' + (x.w || 0) + '</small>' + esc(x.t) + '</span></li>'; }).join('') : '<li><span>Aucun événement pour l\'instant.</span></li>';
  }
  function ping(id) { var a = $('#m-' + id + ' .av'); if (a) { a.classList.remove('ping'); void a.offsetWidth; a.classList.add('ping'); } }

  /* ---- Effets visuels ---- */
  function fx(text, cls) {
    var l = $('#fx'); if (!l) return;
    var d = document.createElement('div'); d.className = 'fx ' + cls; d.textContent = text; l.appendChild(d);
    setTimeout(function () { d.remove(); }, 2600);
  }
  function toast(icon, color, title, sub) {
    var l = $('#fx'); if (!l) return;
    var d = document.createElement('div'); d.className = 'toast';
    d.innerHTML = '<span class="ti" style="background:' + color + '">' + icon + '</span><span><strong>' + esc(title) + '</strong><span>' + esc(sub) + '</span></span>';
    l.appendChild(d); setTimeout(function () { d.remove(); }, 3800);
  }
  function showDeltas(applied, delay) {
    var hit = [], msgs = [];
    (applied || []).forEach(function (a, i) {
      if (a.g === 'confiance') return;
      setTimeout(function () {
        if (a.blocked) fx('Marges épuisées · ' + gName(a.g), 'info');
        else if (a.d) fx(signed(a.d) + ' ' + gName(a.g) + (a.d > 0 ? ' ▲' : ' ▼'), a.d > 0 ? 'up' : 'down');
      }, (delay || 0) + i * 140);
      if (a.d) { hit.push(a.g); msgs.push(gName(a.g) + ' ' + (a.d > 0 ? 'plus ' : 'moins ') + Math.abs(a.d)); }
    });
    setTimeout(function () { updateDash(hit); }, delay || 0);
    if (msgs.length) announce(msgs.join(', '));
  }
  function chipsHTML(applied, opts) {
    opts = opts || {};
    var vis = (applied || []).filter(function (a) { return opts.revealAll || a.g !== 'confiance'; });
    var html = vis.map(function (a) {
      if (a.blocked) return '<span class="chip flat">' + gName(a.g) + ' · marges de rattrapage épuisées</span>';
      if (a.full) return '<span class="chip flat">' + gName(a.g) + ' · déjà au maximum</span>';
      if (!a.d) return '';
      return '<span class="chip ' + (a.d > 0 ? 'up' : 'down') + '">' + signed(a.d) + ' ' + gName(a.g) + (a.d > 0 ? ' ▲' : ' ▼') + '</span>';
    }).join('');
    if (!html && !opts.noEmpty) html = '<span class="chip flat">Aucun impact visible sur vos jauges</span>';
    return html;
  }
  function eventsHTML(st) {
    var h = '';
    st.events.forEach(function (e) {
      if (e.type === 'domino') h += '<span class="chip domino" title="' + esc(e.rule.txt) + '">↯ Effet domino · ' + esc(e.rule.txt.split(':')[0]) + ' → ' + e.applied.filter(function (a) { return a.d; }).map(function (a) { return signed(a.d) + ' ' + gName(a.g); }).join(', ') + '</span>';
      if (e.type === 'incident') h += '<span class="chip domino">⚑ Incident critique · ' + gName(e.g) + ' à zéro</span>';
    });
    st.beats.forEach(function (b) { if (b.type === 'crisis') h += '<span class="chip domino">⚠ Seuil critique · ' + gName(b.g) + ' sous 25</span>'; });
    return h;
  }
  function allApplied(r) { var a = (r.applied || []).slice(); r.st.events.forEach(function (e) { a = a.concat(e.applied); }); return a; }


  /* ------------------------------------------------------------------ */
  /* PLEIN ÉCRAN (bouton systématique)                                   */
  /* ------------------------------------------------------------------ */
  var FS_IN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var FS_OUT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function fsAvailable() { var d = document.documentElement; return !!(d.requestFullscreen || d.webkitRequestFullscreen) && (document.fullscreenEnabled !== false || document.webkitFullscreenEnabled); }
  function fsButton() {
    var on = !!fsElement();
    return '<button class="fs-btn" id="fs-btn" type="button" aria-pressed="' + on + '" title="' + (on ? 'Quitter le plein écran (Échap)' : 'Afficher en plein écran') + '">' + (on ? FS_OUT : FS_IN) + '<span>' + (on ? 'Quitter' : 'Plein écran') + '</span></button>';
  }
  function refreshFS() { var b = $('#fs-btn'); if (b) b.outerHTML = fsButton(); wireFS(); }
  function toggleFS() {
    var d = document.documentElement;
    if (fsElement()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    if (!fsAvailable()) { toast('⛶', '#7c6eaf', 'Plein écran indisponible ici', 'Utilisez F11, ou ouvrez le module dans une nouvelle fenêtre.'); return; }
    var p = (d.requestFullscreen || d.webkitRequestFullscreen).call(d);
    if (p && p.catch) p.catch(function () { toast('⛶', '#7c6eaf', 'Plein écran refusé par le navigateur', 'Utilisez F11 pour passer en plein écran.'); });
  }
  function wireFS() { var b = $('#fs-btn'); if (b && !b._w) { b._w = 1; b.addEventListener('click', toggleFS); } }
  document.addEventListener('fullscreenchange', refreshFS);
  document.addEventListener('webkitfullscreenchange', refreshFS);

  /* ------------------------------------------------------------------ */
  /* ROUTAGE                                                             */
  /* ------------------------------------------------------------------ */
  var Sim = {};
  Sim.go = function (page) {
    if (MODE === 'single') { route(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else window.location.href = FILES[page];
  };
  function route(page) {
    if (P.page && /^s\d$/.test(P.page) && !P.review && P.seq.length && S.done.indexOf(P.page) === -1) P.live[P.page] = { seq: P.seq, i: P.i, sec: P.sec };
    if (MODE === 'single' && history.replaceState) { try { history.replaceState(null, '', '#' + page); } catch (e) {} }
    if (page === 'credits') { P.page = 'credits'; shell('credits'); renderCredits(); return; }
    if (page === 'fiche-cdc' || page === 'fiche-kirk') { renderFichePage(page.replace('fiche-', '')); return; }
    var cur = current();
    var reachable = page === cur || S.done.indexOf(page) > -1;
    if (!reachable) { if (MODE === 'scorm') { window.location.replace(FILES[cur]); return; } page = cur; }
    P.page = page; P.review = S.done.indexOf(page) > -1 && page !== 'conclusion' && page !== 'intro';
    if (HOOKS.page) HOOKS.page(page, ORDER.indexOf(page), ORDER.length - 1);
    if (page === 'conclusion') { shell(page); renderReport(); return; }
    if (page === 'intro') { shell(page); startIntro(); return; }
    var sec = secById(page);
    if (P.review) { S.week = sec.weeks[1]; shell(page); renderReview(sec); return; }
    if (P.live[page]) { var lv = P.live[page]; delete P.live[page]; P.seq = lv.seq; P.i = lv.i; P.sec = lv.sec; shell(page); play(); return; }
    var cp = Store.get('sim_cp_' + page, null);
    if (cp) restore(cp); else Store.set('sim_cp_' + page, snapshot());
    if (page === 's1' && !S.history.length) { S.week = 1; pushHistory('Départ'); save(); }
    P.seq = sec.beats.filter(filterScen).map(function (b) { return Object.assign({}, b); });
    P.i = 0; P.sec = sec;
    shell(page);
    play();
  }

  /* ------------------------------------------------------------------ */
  /* LECTEUR DE BEATS                                                    */
  /* ------------------------------------------------------------------ */
  function play() {
    var b = P.seq[P.i];
    while (b && b.type === 'deferred' && !b._r) {
      var pending = S.deferred.filter(function (d) { return d.section === P.page && !d.applied; });
      if (pending.length) break;
      P.seq.splice(P.i, 1); b = P.seq[P.i];
    }
    if (!b) return;
    if (b.week) S.week = b.week;
    renderTimebar(); updateDash();
    var stage = $('#stage');
    var html = '<article class="beat ' + (b.type === 'incident' ? 'incident' : '') + '" aria-labelledby="bt">' + renderBeat(b) + footHTML(b) + '</article>';
    var old = $('.beat', stage);
    var doRender = function () {
      stage.innerHTML = html;
      mountBeat(b, $('.beat', stage));
      wireFoot(b);
      var h = $('#bt'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      var top = stage.getBoundingClientRect().top + window.scrollY - 110;
      if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    };
    if (old) { old.classList.add('out'); setTimeout(doRender, 200); } else doRender();
  }
  function footHTML(b) {
    if (b.resume) return '';
    var dots = P.seq.map(function (x, k) { return '<i class="' + (k === P.i ? 'c' : k < P.i ? 'v' : '') + '"></i>'; }).join('');
    var label = b.type === 'summary' ? b.cta || 'Je continue' : (b.type === 'intro' ? 'Je commence' : 'Continuer');
    if (P.page === 'intro') label = b.cta || 'Continuer';
    return '<footer class="beat-foot"><div class="dots" aria-label="Étape ' + (P.i + 1) + ' sur ' + P.seq.length + '">' + dots + '</div>' +
      '<div class="foot-actions">' + (P.i > 0 ? '<button class="btn btn-ghost" id="b-prev">← Précédent</button>' : '') +
      '<button class="btn btn-primary" id="b-next"' + (isReady(b) ? '' : ' disabled') + '>' + label + ' <span class="arr" aria-hidden="true">→</span></button></div></footer>';
  }
  function isReady(b) { return !(b.type === 'decision' || b.type === 'gate' || b.type === 'crisis' || b.type === 'quiz' || b.type === 'scenario' || b.type === 'diag') || !!b._r; }
  function setReady(b) { b._r = b._r || true; var n = $('#b-next'); if (n) { n.disabled = false; } }
  function wireFoot(b) {
    var n = $('#b-next'), p = $('#b-prev');
    if (p) p.addEventListener('click', function () { P.i--; play(); });
    if (n) n.addEventListener('click', function () { next(b); });
  }
  function next(b) {
    if (b.type === 'summary') { finishSection(); return; }
    if (P.page === 'intro' && b.type === 'diagResult') { finishSection(); return; }
    if (P.i < P.seq.length - 1) { P.i++; play(); }
  }
  function finishSection() {
    if (S.done.indexOf(P.page) === -1) S.done.push(P.page);
    delete P.live[P.page];
    save();
    var nx = ORDER[ORDER.indexOf(P.page) + 1];
    Sim.go(nx);
  }
  function insertBeats(beats) { if (beats && beats.length) Array.prototype.splice.apply(P.seq, [P.i + 1, 0].concat(beats)); }

  /* ---- Rendu d'un beat ---- */
  function renderBeat(b) {
    switch (b.type) {
      case 'intro': return rIntro(b);
      case 'notif': return rNotif(b);
      case 'content': return rContent(b);
      case 'quiz': return rQuiz(b);
      case 'decision': return rDecision(b, b);
      case 'gate': return rGate(b);
      case 'process': return rProcessIntro(b);
      case 'crisis': return rCrisis(b);
      case 'incident': return rIncident(b);
      case 'deferred': return rDeferred(b);
      case 'fiche': return rFiche(b);
      case 'summary': return rSummary(b);
      case 'hero': return rHero(b);
      case 'rules': return rRules(b);
      case 'team': return rTeam(b);
      case 'scenario': return rScenario(b);
      case 'diag': return rDiag(b);
      case 'diagResult': return rDiagResult(b);
    }
    return '';
  }
  function mountBeat(b, root) {
    switch (b.type) {
      case 'notif': mNotif(b, root); break;
      case 'content': mComponent(b.component, root); break;
      case 'quiz': mQuiz(b, root); break;
      case 'decision': mDecision(b, root, b); break;
      case 'gate': mGate(b, root); break;
      case 'crisis': mDecision(b, root, crisisCfg(b)); break;
      case 'deferred': mDeferred(b, root); break;
      case 'fiche': mFiche(b, root); break;
      case 'summary': mSummary(b, root); break;
      case 'scenario': mScenario(b, root); break;
      case 'diag': mDiag(b, root); break;
      case 'incident': if (!b._shown) { b._shown = true; feed('Incident critique · ' + gName(b.g) + ' à zéro', '#ed9c89'); } break;
    }
  }
  function kicker(pill, extra, cls) { return '<div class="kicker"><span class="pill ' + (cls || '') + '">' + pill + '</span>' + (extra ? '<span>' + extra + '</span>' : '') + '</div>'; }

  /* Section intro */
  function rIntro(b) {
    var s = P.sec;
    return '<div class="sec-head"><div class="sec-num" aria-hidden="true">' + (s.letter.length === 1 ? '0' + s.letter : s.letter) + '</div><div>' +
      '<div class="sec-meta">' + s.phaseLong + ' · Semaine' + (s.weeks[1] !== s.weeks[0] ? 's ' : ' ') + s.weeks[0] + (s.weeks[1] !== s.weeks[0] ? '–' + s.weeks[1] : '') + '</div>' +
      '<h2 class="title" id="bt">' + fr(s.title) + '</h2></div></div>' +
      '<p class="hook">' + fr(T(b.hook)) + '</p>' +
      '<div class="obj-card"><div><h3>Objectif</h3><p>' + fr(T(b.objective)) + '</p></div><div><h3>Ce que vous allez apprendre</h3><ul>' +
      b.learn.map(function (l) { return '<li>' + fr(l) + '</li>'; }).join('') + '</ul></div></div>';
  }

  /* Notifications */
  function notifHTML(b, compact) {
    var f = b.format;
    if (f === 'email') {
      var who = b.fromName || b.from;
      return '<div class="mail"><div class="mail-chrome"><span class="lights"><i></i><i></i><i></i></span><span class="ttl">Messagerie · <b>' + esc(b.to || 'coordination@ifap.nc') + '</b></span></div>' +
        '<div class="mail-head">' + avatar(b.sender || 'mw') + '<div class="who"><strong>' + esc(who) + '</strong><span>De : ' + esc(b.from) + '<span class="to"> · À : ' + esc(b.to || 'coordination@ifap.nc') + '</span></span></div><time>' + esc(b.time || '') + '</time></div>' +
        '<div class="mail-subj">' + fr(esc(T(b.subject))) + '</div><div class="mail-body">' + fr(esc(T(b.body))) + '</div>' +
        (compact ? '' : '<div class="mail-tags"><span>Prioritaire</span></div>') + '</div>';
    }
    if (f === 'sms') {
      var c = ch(b.sender);
      return '<div class="phone buzz" aria-label="Message de ' + esc(c.name) + '"><div class="phone-screen"><span class="phone-island"></span>' +
        '<div class="phone-status"><span>' + esc((b.time || '').split(' ').pop()) + '</span><span aria-hidden="true">▂▄▆ ◔</span></div>' +
        '<div class="phone-contact">' + avatar(b.sender, 'sm') + '<strong>' + esc(c.name) + '</strong><span>' + esc(c.role) + '</span></div>' +
        '<div class="phone-thread"><div class="phone-time">' + esc(b.time || '') + '</div><div class="typing" aria-hidden="true"><i></i><i></i><i></i></div>' +
        '<div class="bubble" hidden>' + fr(esc(T(b.body))) + '</div></div></div></div>';
    }
    var body = b.adaptive ? (adaptiveLow() ? b.bodyLow : b.bodyHigh) : T(b.body);
    return '<div class="alert" role="alert"><div class="alert-top"><span class="alert-ico" aria-hidden="true">⚠</span><strong>' + esc(b.alertTitle || b.title || 'ALERTE') + '</strong><time>' + esc(b.time || '') + '</time></div>' +
      '<div class="alert-body">' + fr(esc(body)) + '</div></div>';
  }
  function adaptiveLow() {
    var bad = S.journal.filter(function (j) { return (j.id === 's1_reponse' || j.id === 's1_scope' || j.id === 's1_modalite') && j.quality === 'bad'; }).length;
    return S.qualite < 60 || bad > 0;
  }
  function rNotif(b) {
    var who = b.format === 'sms' ? ch(b.sender).name : b.format === 'email' ? ch(b.sender || 'mw').name : 'Système';
    var title = b.format === 'email' ? 'Nouveau message' : b.format === 'sms' ? 'Nouveau SMS' : 'Alerte';
    var head = kicker(title, (b.time || '') + ' · Semaine ' + (b.week || S.week));
    if (b.format === 'sms') {
      return head + '<div class="phone-scene">' + notifHTML(b) + '<div class="phone-side"><h2 class="title" id="bt">' + esc(who) + ' vous écrit</h2><p>' + esc(ch(b.sender).role) + '</p>' +
        '<p>Un message court, souvent envoyé dans l\'urgence. Lisez-le comme un signal : que vous apprend-il sur le projet ?</p></div></div>';
    }
    return head + '<h2 class="sr-only" id="bt">' + title + ' — ' + esc(who) + '</h2><div class="notif-wrap">' + notifHTML(b) + (b.note ? '<p class="notif-hint">' + fr(T(b.note)) + '</p>' : '') + '</div>';
  }
  function mNotif(b, root) {
    if (b.format === 'sms') {
      var bub = $('.bubble', root), ty = $('.typing', root);
      if (b._seen) { ty.remove(); bub.hidden = false; }
      else setTimeout(function () { if (ty) ty.remove(); bub.hidden = false; }, 1300);
      ping(b.sender);
    }
    if (!b._seen) {
      b._seen = true;
      if (b.set) { Object.keys(b.set).forEach(function (k) { S.flags[k] = b.set[k]; }); }
      if (b.format === 'email') { toast('✉', '#63b8e8', 'Nouveau message · ' + ch(b.sender || 'mw').name, T(b.subject)); ping(b.sender || 'mw'); feed('Mail · ' + T(b.subject), '#63b8e8'); }
      else if (b.format === 'sms') { toast('✆', '#a59fce', 'SMS · ' + ch(b.sender).name, T(b.body)); feed('SMS · ' + ch(b.sender).name, '#a59fce'); }
      else { toast('⚠', '#ed9c89', b.title || 'Alerte', (b.adaptive ? (adaptiveLow() ? b.bodyLow : b.bodyHigh) : T(b.body)).split('\n')[0]); feed(b.title || 'Alerte', '#ed9c89'); }
      save();
    }
  }

  /* Contenus */
  function rContent(b) {
    return kicker(b.kicker || 'Repère', phaseLabel(P.page)) + '<h2 class="title" id="bt">' + fr(T(b.title)) + '</h2>' +
      (b.lead ? '<p class="lead">' + fr(T(b.lead)) + '</p>' : '') + '<div class="comp">' + compHTML(b.component) + '</div>';
  }
  var uid = 0; function nid(p) { uid++; return (p || 'c') + uid; }
  function compHTML(c) {
    var k = c.kind, id = nid(k);
    if (k === 'flip') return '<div class="flips">' + c.cards.map(function (x, i) {
      return '<button class="flip" aria-pressed="false"><span class="flip-in"><span class="flip-f"><small><span>' + (c.frontLabel || 'Carte ' + (i + 1)) + '</span><span aria-hidden="true">↻</span></small><q>' + fr(x.front) + '</q><small><span>Cliquer pour retourner</span></small></span>' +
        '<span class="flip-b"><small><span>' + (c.backLabel || 'Au verso') + '</span></small><span>' + fr(x.back) + '</span><small></small></span></span></button>'; }).join('') + '</div>';
    if (k === 'accordion') return '<div class="acc">' + c.items.map(function (x, i) {
      return '<div class="acc-i"><button class="acc-b" aria-expanded="false" aria-controls="' + id + '-' + i + '"><span class="n">0' + (i + 1) + '</span><span>' + fr(x.t) + '</span><span class="pm" aria-hidden="true"></span></button>' +
        '<div class="acc-p" id="' + id + '-' + i + '" role="region"><div><p>' + fr(x.d) + '</p></div></div></div>'; }).join('') + '</div>';
    if (k === 'tabs') {
      var def = 0; if (c.defaultFromScenario) c.tabs.forEach(function (t, i) { if (t.key === S.scenario) def = i; });
      return '<div class="tabs-l" role="tablist">' + c.tabs.map(function (t, i) { return '<button class="tab" role="tab" id="' + id + 't' + i + '" aria-selected="' + (i === def) + '" aria-controls="' + id + 'p" tabindex="' + (i === def ? 0 : -1) + '">' + t.t + (c.defaultFromScenario && t.key === S.scenario ? '<span class="yours">Votre projet</span>' : '') + '</button>'; }).join('') +
        '</div><div class="tab-p" id="' + id + 'p" role="tabpanel" aria-labelledby="' + id + 't' + def + '">' + fr(c.tabs[def].d) + '</div>';
    }
    if (k === 'checklist') return '<div class="checks" role="group" aria-label="Rubriques possibles">' + c.items.map(function (x, i) { return '<button class="ck" aria-pressed="false" data-i="' + i + '"><span class="bx" aria-hidden="true"></span><span>' + fr(x.t) + '</span></button>'; }).join('') +
      '</div><div class="comp-actions"><button class="btn btn-soft" data-verify>Je vérifie</button></div><div class="comp-fb" aria-live="polite"></div>';
    if (k === 'smart') return '<div class="smart-l" role="tablist" aria-label="SMART">' + c.letters.map(function (x, i) { return '<button class="smart-b" role="tab" aria-selected="false" data-i="' + i + '"><span class="big">' + x.l + '</span><small>' + x.w + '</small></button>'; }).join('') +
      '</div><div class="smart-p" role="tabpanel" aria-live="polite"><span style="color:var(--ink-3)">Sélectionnez une lettre pour découvrir le critère.</span></div>';
    if (k === 'timeline') { var st = T(c.steps); return '<div class="tl" role="tablist">' + st.map(function (x, i) { return '<button class="tl-b" role="tab" aria-selected="' + (i === 0) + '" data-i="' + i + '"><span class="t">' + x.t + '</span><span class="p" aria-hidden="true"></span><span class="h">' + fr(x.h) + '</span></button>'; }).join('') +
      '</div><div class="tl-p" role="tabpanel" aria-live="polite"><strong>' + fr(st[0].h) + '</strong><br>' + fr(st[0].d) + '</div>'; }
    if (k === 'process') return '<ol class="proc" aria-live="polite"></ol><div class="comp-actions"><button class="btn btn-soft" data-step>Étape suivante ↓</button><span class="mono" style="font-size:12px;color:var(--ink-3)" data-count></span></div>';
    if (k === 'dashboard') return '<div class="tiles" role="tablist">' + c.tiles.map(function (x, i) { var p = parseFloat(String(x.v).replace(',', '.')); var pct = String(x.v).indexOf('/') > -1 ? (String(x.v).indexOf('/5') > -1 ? p / 5 * 100 : p / parseFloat(x.v.split('/')[1]) * 100) : p;
      return '<button class="tile" role="tab" aria-selected="false" data-i="' + i + '"><span class="v">' + x.v + '</span><span class="l">' + x.l + '</span><span class="bar"><i style="width:' + Math.round(pct) + '%"></i></span></button>'; }).join('') + '</div><div class="tile-p" aria-live="polite" hidden></div>';
    if (k === 'stairs') return '<div class="stairs" role="tablist" aria-label="Niveaux de Kirkpatrick">' + c.levels.map(function (x, i) { return '<button class="stair" role="tab" aria-selected="false" data-i="' + i + '"><span class="n">' + x.n + '</span><span class="h">' + x.h + '</span></button>'; }).join('') + '</div><div class="stair-slot" aria-live="polite"></div>';
    if (k === 'classify') return '<div class="cls">' + c.items.map(function (x, i) {
      return '<div class="cls-r" data-i="' + i + '"><p>' + fr(x.t) + '</p><div class="seg" role="radiogroup" aria-label="Niveau pour : ' + esc(x.t) + '">' + c.choices.map(function (ch2) { return '<button role="radio" aria-checked="false" data-v="' + ch2 + '">' + ch2 + '</button>'; }).join('') + '</div></div>'; }).join('') +
      '</div><div class="comp-actions"><button class="btn btn-soft" data-verify>Je vérifie</button></div><div class="comp-fb" aria-live="polite"></div>';
    if (k === 'investigate') return '<div class="inv"><div class="inv-src" role="tablist" aria-label="Sources">' + c.sources.map(function (x, i) {
        return '<button class="inv-b" role="tab" aria-selected="false" data-i="' + i + '">' + (x.char ? avatar(x.char, 'sm') : '<span class="av sm" style="background:' + x.color + '" aria-hidden="true">' + x.icon + '</span>') + '<span><strong>' + fr(x.who) + '</strong><small>À consulter</small></span></button>'; }).join('') +
      '</div><div class="inv-panel" role="tabpanel" aria-live="polite"><p class="inv-empty">Choisissez une source. Notez ce qu\'elle vous apprend sur les causes de l\'écart.</p></div></div>' +
      '<div class="inv-syn" hidden><span class="kicker"><span class="pill k-dec">Diagnostic</span></span><p>' + fr(c.synthesis) + '</p></div>';
    if (k === 'matrix') { var dots = function (v) { var h = ''; for (var i = 0; i < 3; i++) h += '<i class="' + (i < v ? 'on' : '') + '"></i>'; return '<span class="mxd" aria-label="' + ['', 'faible', 'moyen', 'fort'][v] + '">' + h + '</span>'; };
      return '<div class="comp-actions" style="margin:0 0 14px"><button class="btn btn-soft" data-filter aria-pressed="false">◎ Critères de ce dossier</button></div><div class="mx-wrap"><table class="mx"><thead><tr><th>Besoin ou contrainte</th>' + c.cols.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' +
        c.rows.map(function (r) { return '<tr class="' + (r.here ? 'here' : '') + '"><td>' + fr(r.crit) + (r.here ? ' <span class="here-tag">Ce dossier</span>' : '') + '</td>' + r.v.map(function (v) { return '<td>' + dots(v) + '</td>'; }).join('') + '</tr>'; }).join('') +
        '</tbody></table></div><p class="mx-note">●●● adapté · ●●○ possible · ●○○ peu adapté</p>'; }
    if (k === 'splist') return '<div class="sp"><div class="sp-top"><span class="sp-path">Site e-formation <b>›</b> Listes <b>›</b> ' + c.title + '</span><span class="sp-cmd"><span>＋ Nouveau</span><span>✎ Modifier</span><span>⇩ Exporter</span></span></div>' +
      '<div class="sp-grid" role="table"><div class="sp-r sp-h" role="row">' + c.cols.map(function (x) { return '<span role="columnheader">' + x + '</span>'; }).join('') + '</div>' +
      c.rows.map(function (r, i) { return '<button class="sp-r' + (r.fresh ? ' fresh' : '') + '" role="row" data-i="' + i + '"' + (r.fresh ? '' : ' tabindex="-1"') + '>' + r.c.map(function (x, j) { return '<span role="cell">' + (j === 0 && r.fresh ? '<em class="new">Nouveau</em>' : '') + fr(x) + '</span>'; }).join('') + '</button>'; }).join('') +
      '</div><div class="sp-detail" aria-live="polite" hidden></div></div>';
    return '';
  }
  function tablist(root, sel, onSel) {
    var tabs = $$(sel, root);
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { tabs.forEach(function (x) { x.setAttribute('aria-selected', 'false'); x.tabIndex = -1; }); t.setAttribute('aria-selected', 'true'); t.tabIndex = 0; t.classList.add('seen'); onSel(i, t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (k) { e.preventDefault(); var n = tabs[(i + k + tabs.length) % tabs.length]; n.focus(); n.click(); }
      });
    });
  }
  function mComponent(c, root) {
    var k = c.kind;
    if (k === 'flip') $$('.flip', root).forEach(function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); }); });
    if (k === 'accordion') $$('.acc-b', root).forEach(function (b) { b.addEventListener('click', function () { var o = b.getAttribute('aria-expanded') === 'true'; b.setAttribute('aria-expanded', !o); document.getElementById(b.getAttribute('aria-controls')).classList.toggle('open', !o); }); });
    if (k === 'tabs') { var p = $('.tab-p', root); tablist(root, '.tab', function (i, t) { p.innerHTML = fr(c.tabs[i].d); p.setAttribute('aria-labelledby', t.id); p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; }); }
    if (k === 'smart') { var sp = $('.smart-p', root); tablist(root, '.smart-b', function (i) { var x = c.letters[i]; sp.innerHTML = '<b>' + x.l + ' — ' + x.w + '</b>' + fr(x.d); sp.style.animation = 'none'; void sp.offsetWidth; sp.style.animation = ''; }); }
    if (k === 'timeline') { var st = T(c.steps), tp = $('.tl-p', root); $('.tl-b', root).classList.add('seen'); tablist(root, '.tl-b', function (i) { tp.innerHTML = '<strong>' + fr(st[i].h) + '</strong><br>' + fr(st[i].d); tp.style.animation = 'none'; void tp.offsetWidth; tp.style.animation = ''; }); }
    if (k === 'dashboard') { var dp = $('.tile-p', root); tablist(root, '.tile', function (i) { dp.hidden = false; dp.innerHTML = '<strong>' + c.tiles[i].l + ' — ' + c.tiles[i].v + '</strong><br>' + fr(c.tiles[i].d); }); }
    if (k === 'stairs') { var ss = $('.stair-slot', root); tablist(root, '.stair', function (i) { var x = c.levels[i];
      ss.innerHTML = '<div class="stair-p"><div class="q">Niveau ' + x.n + ' · ' + fr(x.q) + '</div><div><small>Outil de mesure</small>' + fr(x.tool) + '</div><div><small>Moment</small>' + fr(x.when) + '</div><div><small>Exemple SIRH</small>' + fr(x.ex) + '</div></div>'; }); }
    if (k === 'process') {
      var ol = $('.proc', root), btn = $('[data-step]', root), cnt = $('[data-count]', root), n = 0;
      var add = function () { if (n >= c.steps.length) return; $$('li', ol).forEach(function (l) { l.classList.remove('last'); }); var x = c.steps[n]; var li = document.createElement('li'); li.className = 'last'; li.innerHTML = '<span class="n">' + (n + 1) + '</span><div><strong>' + fr(x.h) + '</strong><p>' + fr(x.d) + '</p></div>'; ol.appendChild(li); n++; cnt.textContent = n + ' / ' + c.steps.length; if (n >= c.steps.length) { btn.remove(); } };
      add(); btn.addEventListener('click', add);
    }
    if (k === 'checklist') {
      $$('.ck', root).forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.locked) return; b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); }); });
      $('[data-verify]', root).addEventListener('click', function () {
        var good = 0;
        $$('.ck', root).forEach(function (b) { var x = c.items[+b.dataset.i], on = b.getAttribute('aria-pressed') === 'true'; b.dataset.locked = '1'; b.classList.remove('ok', 'ko');
          if (on === x.ok) { good++; if (on) b.classList.add('ok'); } else { b.classList.add('ko'); if (!x.ok && x.why) b.querySelector('span:last-child').innerHTML += '<span class="why">' + fr(x.why) + '</span>'; if (x.ok) b.querySelector('span:last-child').innerHTML += '<span class="why">À inclure</span>'; } });
        $('.comp-fb', root).innerHTML = '<strong>' + good + ' / ' + c.items.length + ' bien classées.</strong> ' + fr(c.feedback || '');
        this.disabled = true;
      });
    }
    if (k === 'classify') {
      $$('.seg', root).forEach(function (g) { $$('button', g).forEach(function (b) { b.addEventListener('click', function () { if (g.dataset.locked) return; $$('button', g).forEach(function (x) { x.setAttribute('aria-checked', 'false'); }); b.setAttribute('aria-checked', 'true'); }); }); });
      $('[data-verify]', root).addEventListener('click', function () {
        var good = 0;
        $$('.cls-r', root).forEach(function (r) { var x = c.items[+r.dataset.i], sel = $('[aria-checked="true"]', r), g = $('.seg', r); g.dataset.locked = '1';
          r.classList.remove('ok', 'ko'); if (sel && sel.dataset.v === x.a) { good++; r.classList.add('ok'); if (x.why) $('p', r).innerHTML += '<span class="ans ok">' + fr(x.why) + '</span>'; } else { r.classList.add('ko'); $('p', r).innerHTML += '<span class="ans">Réponse : ' + x.a + (x.why ? ' — ' + fr(x.why) : '') + '</span>'; } });
        $('.comp-fb', root).innerHTML = '<strong>' + good + ' / ' + c.items.length + '.</strong> ' + (c.feedback ? fr(c.feedback) : (good === c.items.length ? 'Parfait : vous savez placer chaque mesure au bon niveau.' : 'Retenez : N1 participation et ressenti, N2 acquis, N3 pratiques au travail, N4 résultats pour l\'organisation.'));
        this.disabled = true;
      });
    }
    if (k === 'investigate') {
      var seen = {}, panel = $('.inv-panel', root), syn = $('.inv-syn', root);
      tablist(root, '.inv-b', function (i, t) { var x = c.sources[i]; seen[i] = 1; $('small', t).textContent = '✓ Consulté'; t.classList.add('seen');
        panel.innerHTML = '<p class="inv-who">' + fr(x.who) + '</p><p class="inv-clue">' + fr(x.clue) + '</p>';
        if (Object.keys(seen).length === c.sources.length && syn.hidden) { syn.hidden = false; announce('Toutes les sources consultées. Diagnostic disponible.'); } });
    }
    if (k === 'matrix') { var fb = $('[data-filter]', root); fb.addEventListener('click', function () { var on = fb.getAttribute('aria-pressed') !== 'true'; fb.setAttribute('aria-pressed', on); $('.mx', root).classList.toggle('focus', on); }); }
    if (k === 'splist') { var det = $('.sp-detail', root); $$('.sp-r.fresh', root).forEach(function (r) { r.addEventListener('click', function () { r.classList.add('open'); det.hidden = false; det.innerHTML = fr(c.rows[+r.dataset.i].detail); }); }); }
  }

  /* Quiz formatif */
  function rQuiz(b) {
    return kicker('Je m\'entraîne', phaseLabel(P.page)) + '<h2 class="title" id="bt">' + fr(T(b.question)) + '</h2>' +
      '<div class="qz" role="radiogroup" aria-label="Réponses">' + b.options.map(function (o, i) { return '<button class="qz-o" role="radio" aria-checked="false" data-i="' + i + '"><span class="rd" aria-hidden="true"></span><span>' + fr(o.t) + '</span></button>'; }).join('') + '</div>' +
      '<div class="comp-actions"><button class="btn btn-soft" data-val disabled>Je valide</button></div><div class="comp-fb" aria-live="polite"></div>';
  }
  function mQuiz(b, root) {
    var sel = -1, opts = $$('.qz-o', root), val = $('[data-val]', root), fb = $('.comp-fb', root);
    var show = function (i) {
      opts.forEach(function (o, k) { o.disabled = true; if (b.options[k].ok) o.classList.add('ok'); else if (k === i) o.classList.add('ko'); if (k === i) o.setAttribute('aria-checked', 'true'); });
      fb.innerHTML = (b.options[i].ok ? '✓ ' + fr(b.fbOk) : '✕ ' + fr(b.fbKo)); val.disabled = true;
    };
    if (b._r) { show(b._r.i); return; }
    opts.forEach(function (o, i) { o.addEventListener('click', function () { sel = i; opts.forEach(function (x) { x.setAttribute('aria-checked', 'false'); }); o.setAttribute('aria-checked', 'true'); val.disabled = false; }); });
    val.addEventListener('click', function () { if (sel < 0) return; b._r = { i: sel }; show(sel); setReady(b); });
  }

  /* Décisions */
  function decCfg(b) { return { jid: b.id, title: b.title, context: b.context, options: b.options, best: b.best, conseil: b.conseil, time: b.time }; }
  function crisisCfg(b) {
    var c = C.crises[b.g];
    var best = c.options.filter(function (o) { return o.quality === 'good'; })[0];
    return { jid: 'crise_' + b.g, title: c.title, context: c.context, options: c.options, best: best && best.id, crisis: true,
      conseil: 'Anticiper : suivre ses jauges, alerter tôt et garder une marge de manœuvre avant le seuil critique.' };
  }
  function rDecision(b, raw, cfgOverride) {
    var cfg = cfgOverride || decCfg(raw);
    var ord = order(cfg.options.length, cfg.jid + (S.scenario || ''));
    return kicker('Décision', (cfg.time ? cfg.time + ' · ' : '') + 'Semaine ' + S.week, 'k-dec') +
      '<h2 class="title" id="bt">' + fr(T(cfg.title)) + '</h2><p class="dec-context">' + fr(T(cfg.context)) + '</p>' +
      '<div class="opts" role="group" aria-label="Choisissez une option">' + ord.map(function (k, pos) { var o = cfg.options[k];
        return '<button class="opt" data-k="' + k + '"><span class="lt" aria-hidden="true">' + 'ABC'[pos] + '</span><span><strong>' + fr(T(o.label)) + '</strong>' + (o.detail ? '<span class="d">' + fr(T(o.detail)) + '</span>' : '') + '</span></button>'; }).join('') + '</div>' +
      '<div class="result-slot" aria-live="polite"></div>';
  }
  function rCrisis(b) {
    var c = C.crises[b.g];
    var n = { format: c.format, sender: c.sender, from: c.from, fromName: c.fromName, to: 'coordination@ifap.nc', subject: c.subject, body: c.body, sender: c.sender, title: c.alertTitle, alertTitle: c.alertTitle, time: 'Urgent' };
    var notif = c.format === 'sms' ? '<div class="react-bubble" style="max-width:560px;margin-bottom:18px"><div class="nm">' + ch(c.sender).name + ' <span>· SMS urgent</span></div><p>« ' + fr(c.body) + ' »</p></div>' : '<div style="margin-bottom:22px">' + notifHTML(n, true) + '</div>';
    return kicker('Crise', gName(b.g) + ' sous le seuil critique', 'k-crisis') + notif + rDecision(b, b, crisisCfg(b)).replace(kicker('Décision', 'Semaine ' + S.week, 'k-dec'), '');
  }
  function mDecision(b, root, cfg) {
    var opts = $$('.opt', root), slot = $('.result-slot', root);
    if (b.type === 'crisis' && !b._seen) { b._seen = true; toast('⚠', '#ed9c89', C.crises[b.g].title, gName(b.g) + ' sous 25'); }
    var lock = function (k) { $('.opts', root).classList.add('locked'); opts.forEach(function (o) { o.disabled = true; if (+o.dataset.k === k) o.classList.add('chosen'); }); };
    if (b._r) { lock(b._r.k); slot.innerHTML = resultHTML(cfg, cfg.options[b._r.k], b._r, true); return; }
    opts.forEach(function (o) {
      o.addEventListener('click', function () {
        var k = +o.dataset.k, opt = cfg.options[k];
        lock(k);
        var r = decide(b, opt, cfg); r.k = k; r.opt = opt; r.cfg = cfg; b._r = r;
        insertBeats(r.st.beats);
        showDeltas(allApplied(r), 250);
        slot.innerHTML = resultHTML(cfg, opt, r, false);
        var rb = $('.react-bubble p', slot);
        if (rb) { var txt = rb.innerHTML; rb.innerHTML = '<span class="typing" aria-hidden="true"><i></i><i></i><i></i></span>'; setTimeout(function () { rb.innerHTML = txt; if (opt.reaction) ping(opt.reaction.who); }, 900); }
        setReady(b);
        // dots mis à jour si des beats ont été insérés
        var dots = $('.dots', root); if (dots && r.st.beats.length) dots.innerHTML = P.seq.map(function (x, j) { return '<i class="' + (j === P.i ? 'c' : j < P.i ? 'v' : '') + '"></i>'; }).join('');
        setTimeout(function () { var n = $('#b-next'); if (n && slot.getBoundingClientRect().top > window.innerHeight * .7) slot.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
      });
    });
  }
  function resultHTML(cfg, opt, r, review) {
    var q = opt.quality, tagTxt = q === 'good' ? '✓ Bon réflexe' : q === 'mixed' ? '≈ À nuancer' : '✕ Choix risqué';
    var h = '<div class="result"><div class="verdict"><span class="tag ' + q + '">' + tagTxt + '</span></div>' +
      '<div class="chips">' + chipsHTML(r.applied) + eventsHTML(r.st) + (opt.cost ? '<span class="chip flat">⏱ ' + fr(opt.cost) + '</span>' : '') + (opt.cancel ? '<span class="chip up">↺ Effet différé annulé</span>' : '') + '</div>' +
      '<div class="feedback">' + fr(T(opt.feedback)) + '</div>' +
      (r.bonus ? '<div class="feedback bonus">' + fr(r.bonus) + '</div>' : '');
    if (opt.reaction) {
      var c = ch(opt.reaction.who);
      h += '<div class="reaction">' + avatar(opt.reaction.who) + '<div class="react-bubble"><div class="nm">' + c.name + ' <span>· ' + esc(c.role) + '</span></div><p>« ' + fr(opt.reaction.text) + ' »</p></div></div>';
    }
    return h + '</div>';
  }


  /* Portes de décision GO / NO-GO */
  function condsHTML(b, snap, fixed) {
    return '<ul class="gate-conds">' + b.conds.map(function (c, i) {
      var ok = snap[i], st = ok ? 'ok' : (fixed ? 'fx' : (c.blocking ? 'ko' : 'warn'));
      var ic = { ok: '✓', ko: '✕', warn: '!', fx: '↺' }[st];
      return '<li class="gc ' + st + '"><span class="gi" aria-hidden="true">' + ic + '</span><span>' + fr(T(c.t)) + (st === 'fx' ? ' <em>— corrigé</em>' : '') + '</span>' + (c.blocking ? '<span class="blk">Bloquant</span>' : '<span class="blk soft">Vigilance</span>') +
        '<span class="sr-only">' + (ok ? 'conforme' : 'non conforme') + '</span></li>'; }).join('') + '</ul>';
  }
  function rGate(b) {
    if (!b._snap) b._snap = b.conds.map(function (c) { return !!c.ok(S); });
    return kicker('Porte de décision', (b.time ? b.time + ' · ' : '') + 'Semaine ' + S.week, 'k-gate') +
      '<h2 class="title" id="bt">' + fr(T(b.title)) + '</h2><p class="dec-context">' + fr(T(b.context)) + '</p>' +
      '<div class="gate-slot">' + condsHTML(b, b._snap, false) + '</div>' +
      '<div class="opts gate-opts" role="group" aria-label="Votre décision">' +
        '<button class="opt go" data-k="0"><span class="lt" aria-hidden="true">✓</span><span><strong>' + fr(b.goLabel) + '</strong>' + (b.goDetail ? '<span class="d">' + fr(b.goDetail) + '</span>' : '') + '</span></button>' +
        '<button class="opt nogo" data-k="1"><span class="lt" aria-hidden="true">✕</span><span><strong>' + fr(b.nogoLabel) + '</strong>' + (b.nogoDetail ? '<span class="d">' + fr(b.nogoDetail) + '</span>' : '') + '</span></button>' +
      '</div><div class="result-slot" aria-live="polite"></div>';
  }
  function gateCfg(b) {
    var allOk = b.conds.every(function (c, i) { return !c.blocking || b._snap[i]; });
    var go = { id: 'go', label: b.goLabel, quality: allOk ? 'good' : 'bad', effects: allOk ? b.okGo.effects : b.penaltyGo.effects,
      deferred: allOk ? [] : (b.penaltyGo.deferred || []), feedback: allOk ? b.okGo.feedback : b.penaltyGo.feedback };
    var nogo = { id: 'nogo', label: b.nogoLabel, quality: allOk ? 'mixed' : 'good', effects: allOk ? b.overcautious.effects : b.fix.effects,
      set: allOk ? null : b.fix.set, cancel: allOk ? null : b.fix.cancel, feedback: allOk ? b.overcautious.feedback : b.fix.feedback };
    return { jid: b.id, title: b.title, context: b.context, options: [go, nogo], best: allOk ? 'go' : 'nogo', conseil: b.conseil, gate: true, allOk: allOk };
  }
  function mGate(b, root) {
    var opts = $$('.opt', root), slot = $('.result-slot', root);
    var lock = function (k) { $('.opts', root).classList.add('locked'); opts.forEach(function (o) { o.disabled = true; if (+o.dataset.k === k) o.classList.add('chosen'); }); };
    if (b._r) {
      lock(b._r.k);
      if (b._r.review) { slot.innerHTML = '<div class="result"><div class="verdict"><span class="tag ' + b._r.q + '">' + (b._r.q === 'good' ? '✓ Bonne décision' : b._r.q === 'mixed' ? '≈ À nuancer' : '✕ Décision risquée') + '</span></div></div>'; return; }
      slot.innerHTML = resultHTML(b._r.cfg, b._r.opt, b._r, true);
      if (b._r.k === 1 && !b._r.cfg.allOk) $('.gate-slot', root).innerHTML = condsHTML(b, b._snap, true);
      return;
    }
    opts.forEach(function (o) {
      o.addEventListener('click', function () {
        var k = +o.dataset.k, cfg = gateCfg(b), opt = cfg.options[k];
        lock(k);
        var r = decide(b, opt, cfg); r.k = k; r.opt = opt; r.cfg = cfg; b._r = r;
        insertBeats(r.st.beats);
        showDeltas(allApplied(r), 250);
        slot.innerHTML = resultHTML(cfg, opt, r, false);
        if (k === 1 && !cfg.allOk) setTimeout(function () { $('.gate-slot', root).innerHTML = condsHTML(b, b._snap, true); }, 500);
        setReady(b);
        var dots = $('.dots', root); if (dots && r.st.beats.length) dots.innerHTML = P.seq.map(function (x, j) { return '<i class="' + (j === P.i ? 'c' : j < P.i ? 'v' : '') + '"></i>'; }).join('');
      });
    });
  }

  /* Incident critique */
  function rIncident(b) {
    var inc = C.incidents[b.g];
    return kicker('Incident critique', 'Semaine ' + S.week, 'k-crisis') +
      '<div class="incident-art"><span class="zero" aria-hidden="true">0</span><div><div class="mono" style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#b9b4d6">Jauge ' + gName(b.g) + ' à zéro</div>' +
      '<h2 class="title" id="bt">' + fr(inc.title) + '</h2></div></div>' +
      '<p class="lead">' + fr(inc.text) + '</p>' +
      '<div class="chips" style="margin-top:18px"><span class="chip up">' + gName(b.g) + ' remonte à ' + inc.restore + '</span>' + chipsHTML(b.applied, { noEmpty: true }) + '</div>' +
      '<p class="lead" style="margin-top:20px;font-size:15px">L\'incident est consigné dans votre journal et figurera dans le rapport de mission.</p>';
  }

  /* Effets différés */
  function rDeferred(b) {
    return kicker('Effets différés', phaseLabel(P.page)) + '<h2 class="title" id="bt">Le passé vous rattrape</h2>' +
      '<p class="lead">Certaines décisions prises plus tôt produisent leurs effets maintenant. C\'est le propre d\'un projet : tout se tient.</p><div class="backlash"></div><div class="chips" data-ev style="margin-top:14px"></div>';
  }
  function mDeferred(b, root) {
    if (!b._r) { b._r = applyDeferred(P.page); insertBeats(b._r.st.beats); showDeltas(allApplied({ applied: [].concat.apply([], b._r.res.map(function (x) { return x.ap; })), st: b._r.st }), 400); }
    var pos = b._r.res.every(function (x) { return x.d.delta > 0; });
    if (pos) $('#bt', root).textContent = 'Une décision passée porte ses fruits';
    $('.backlash', root).innerHTML = b._r.res.map(function (x, i) {
      var p = x.d.delta > 0;
      var chips = x.d.jauge === 'confiance' ? '<span class="chip ghost">Aucun effet visible sur vos jauges… en apparence</span>' : chipsHTML(x.ap);
      return '<div class="bl ' + (p ? 'pos' : '') + '" style="animation-delay:' + (i * .15) + 's"><span class="ic" aria-hidden="true">' + (p ? '✦' : '↺') + '</span><div><small>' + (p ? 'Bonne surprise' : 'Retour de bâton') + ' · décision de la ' + phaseLabel(x.d.fromSection).toLowerCase() + '</small><p>' + fr(x.d.reason) + '</p></div><div class="chips">' + chips + '</div></div>';
    }).join('');
    $('[data-ev]', root).innerHTML = eventsHTML(b._r.st);
    setReady(b);
  }

  /* Fiche outil */
  function a4mini() { return '<div class="a4" aria-hidden="true"><div class="hd"></div><div class="ln s"></div><div class="ln"></div><div class="ln"></div><div class="grid"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="ln"></div><div class="ln s"></div></div>'; }
  function rFiche(b) {
    var f = C.fiches[b.fiche], n = b.fiche === 'cdc' ? 1 : 2;
    return kicker('Fiche outil', 'Fiche ' + n + ' / 2 · PDF A4') + '<div class="fiche-blk">' + a4mini() + '<div><span class="badge-f">À garder sous le coude</span><h2 class="title" id="bt">' + fr(f.title) + '</h2><p class="lead">' + fr(b.text) + ' ' + fr(f.desc) + '</p>' +
      '<div class="comp-actions">' + ficheLink(b.fiche, 'btn btn-teal', '↓ J\'ouvre la fiche à imprimer') + '</div></div></div>';
  }
  function ficheLink(key, cls, label) {
    var page = 'fiche-' + key;
    return MODE === 'single' ? '<button class="' + cls + '" data-fiche="' + key + '">' + label + '</button>' : '<a class="' + cls + '" href="' + FILES[page] + '" target="_blank" rel="noopener">' + label + '</a>';
  }
  function mFiche(b, root) { wireFiches(root); }
  function wireFiches(root) { $$('[data-fiche]', root).forEach(function (x) { x.addEventListener('click', function () { openFicheOverlay(x.dataset.fiche); }); }); }

  /* Résumé */
  function rSummary(b) {
    var bars = G3.map(function (g) { return '<div class="bar-r"><span>' + gName(g) + '</span><span class="tr"><i style="width:0;background:' + gColor(S[g]) + '" data-w="' + S[g] + '"></i></span><b>' + S[g] + '</b></div>'; }).join('');
    return kicker('En résumé', phaseLabel(P.page)) + '<h2 class="sr-only" id="bt">En résumé</h2><div class="summary"><div class="sum-card"><h3>Ce qu\'il faut retenir</h3><ol>' + b.points.map(function (p) { return '<li><span>' + fr(p) + '</span></li>'; }).join('') + '</ol></div>' +
      '<div class="sum-side"><p class="transition">' + fr(b.transition) + '</p><div class="snap"><h4>Vos jauges · fin de semaine ' + S.week + '</h4><div class="bars">' + bars + '</div></div></div></div>';
  }
  function mSummary(b, root) { setTimeout(function () { $$('.bar-r i', root).forEach(function (i) { i.style.width = i.dataset.w + '%'; }); }, 100); }

  /* ------------------------------------------------------------------ */
  /* INTRODUCTION                                                        */
  /* ------------------------------------------------------------------ */
  function startIntro() {
    P.sec = null;
    var introDone = S.done.indexOf('intro') > -1;
    P.seq = introDone ? [{ type: 'hero', resume: true }] : [{ type: 'hero', cta: 'Je prends le dossier' }, { type: 'rules', cta: 'Je découvre le processus' }, { type: 'process', cta: 'Je rencontre l\'équipe' }, { type: 'team', cta: 'Je fais le point sur mes repères' },
      { type: 'diag', cta: 'Je découvre mon positionnement' }, { type: 'diagResult', cta: 'J\'ouvre le dossier' }];
    P.i = 0; S.week = 0;
    play();
  }
  function rHero(b) {
    var resume = b.resume ? '<div class="comp-actions"><button class="btn btn-primary" data-resume>Je reprends le projet <span class="arr">→</span></button><button class="btn btn-ghost" data-reset>Recommencer la simulation</button></div>' : '';
    return '<div class="hero"><div>' + kicker('Module LIANE · usage interne IFAP') +
      '<h1 id="bt">Chef de projet formation <em>dans le vif du sujet</em></h1>' +
      '<p class="mission">Une sollicitation vient d\'arriver, avec un cahier des charges déjà rédigé. <strong>Vous êtes chargé(e) du dossier.</strong> De l\'étude du besoin à la capitalisation : douze semaines, trois portes de décision, et des conséquences à assumer.</p>' +
      '<div class="meta-row"><span>⏱ 45–50 min</span><span>5 phases IFAP</span><span>3 portes GO / NO-GO</span><span>3 modalités possibles</span></div>' + resume + '</div>' +
      '<div class="collage" aria-hidden="true">' +
        '<div class="cl-mail"><div class="bar"></div><div class="c"><b>Sollicitation — Formation outils RH</b>« Vous trouverez en PJ notre cahier des charges… »</div></div>' +
        '<div class="cl-alert">◆ PORTE 2 · NO-GO</div>' +
        '<div class="cl-sms"><small>Nicolas · 08:52</small>Je suis bloqué en province Nord. La session de demain, c\'est compromis.</div>' +
        '<div class="cl-ring"><div class="ring">' + ringSVG(64) + '<span class="num">64</span></div></div>' +
        '<div class="cl-stamp"><span>DOSSIER<b>N°27</b>PARTENAIRE</span></div>' +
      '</div></div>';
  }
  function rRules(b) {
    var demo = G3.map(function (g) { var v = { budget: 100, delai: 62, qualite: 34 }[g];
      return '<div class="gd"><div class="ring" style="margin:0 auto">' + ringSVG(v) + '<span class="num">' + v + '</span></div><p><strong>' + C.gauges[g].label + '</strong><br>' + C.gauges[g].desc + '</p></div>'; }).join('') +
      '<div class="gd gauge hidden-g"><div class="ring" style="margin:0 auto">' + ringSVG(0, true) + '<span class="num">?</span></div><p><strong>Un indicateur masqué</strong><br>Il existe. Il bouge. Vous ne le verrez que dans votre rapport final.</p></div>';
    var rules = [
      ['◆', '#e8f4fb', 'Vous décidez', 'Chaque décision modifie vos jauges. Le delta s\'affiche quelques secondes.'],
      ['◇', '#fff7d6', 'Portes GO / NO-GO', 'Aux moments clés, vous décidez de passer ou non. Passer avec un point bloquant coûte cher. Bien tenue, une porte permet de rattraper une erreur.'],
      ['↺', '#efedf7', 'Effets différés', 'Certaines décisions produisent aussi leurs effets plus tard. Le projet a de la mémoire.'],
      ['↯', '#fcebe6', 'Effet domino', 'Une jauge trop basse en entraîne une autre : une équipe saturée fait glisser les jalons.'],
      ['⚠', '#fff7d6', 'Seuil critique', 'Sous 25, la jauge clignote et une crise se déclenche, avec une décision coûteuse.'],
      ['●●', '#e3f5f6', 'Marges limitées', 'Chaque jauge ne peut être rechargée que deux fois. Ensuite, les bonnes décisions ne la font plus remonter.']
    ].map(function (r) { return '<div class="rule"><span class="ic" style="background:' + r[1] + '">' + r[0] + '</span><div><strong>' + r[2] + '</strong><p>' + fr(r[3]) + '</p></div></div>'; }).join('');
    return kicker('Les règles du jeu') + '<h2 class="title" id="bt">Votre tableau de bord</h2><p class="lead">Trois jauges vous suivent en permanence. Elles démarrent toutes à 100. À vous de les garder dans le vert jusqu\'à la fin du projet.</p>' +
      '<div class="gauge-demo">' + demo + '</div><div class="color-key"><span><i style="background:#2fb6bc"></i>70 et plus : sous contrôle</span><span><i style="background:#ffcb00"></i>40 à 69 : vigilance</span><span><i style="background:#ed9c89"></i>Moins de 40 : danger</span></div>' +
      '<div class="rules">' + rules + '</div>';
  }

  function rTeam() {
    var lines = { mw: 'Pressé, exigeant, de bonne volonté. Il a déjà écrit sa solution.', nico: 'Expert de son sujet. Il vous dira quand quelque chose cloche — si vous l\'écoutez.', lea: 'Elle utilise le SIRH tous les jours. Elle sait ce qui se passe vraiment sur le terrain.', sylvie: 'Crédits, bons de commande, marchés. Sans elle, rien ne démarre — et c\'est normal.' };
    return kicker('Les personnages') + '<h2 class="title" id="bt">Ils vont réagir à vos décisions</h2><p class="lead">Quatre interlocuteurs vous accompagnent. Leurs réactions arrivent après vos décisions clés. Écoutez-les : ils en disent souvent plus que les jauges.</p>' +
      '<div class="team-intro">' + C.team.map(function (id) { var c = C.characters[id]; var role = typeof c.role === 'object' ? c.role._ : c.role;
        return '<div class="ti-card">' + avatar(id, 'lg') + '<strong>' + c.name + '</strong><span>' + role + '</span><p>' + fr(lines[id]) + '</p></div>'; }).join('') + '</div>';
  }
  function rProcessIntro() {
    var ph = [['', 'Sollicitation', 'Demande, parfois avec un cahier des charges', 'src'],
      ['1', 'Étude du besoin', 'Qualifier, analyser les causes, choisir la réponse', 's1'], ['P1', 'Décision d\'engagement', '', 'gate'],
      ['2', 'Engagement', 'Crédits, support juridique, rôles, validation', 's2'], ['P2', 'Lancement', '', 'gate'],
      ['3a', 'Réalisation · produire', 'Supports, validation, test', 's3'], ['P3', 'GO déploiement', '', 'gate'],
      ['3b', 'Réalisation · déployer', 'Accès, suivi, aléas', 's4'],
      ['4', 'Évaluation', 'Participation, apprentissage, usage, impact', 's5'], ['5', 'Capitalisation', 'RETEX, cycle de vie', 's6']];
    return kicker('Votre processus') + '<h2 class="title" id="bt">Le chemin d\'une demande à l\'IFAP</h2><p class="lead">Une demande n\'entre jamais directement en production. Elle est étudiée, engagée, réalisée, évaluée, puis capitalisée. Trois portes de décision jalonnent le parcours.</p>' +
      '<ol class="pflow">' + ph.map(function (x) {
        if (x[3] === 'gate') return '<li class="pf-gate"><span class="dm" aria-hidden="true">◆</span><span><b>Porte ' + x[0].slice(1) + '</b>' + x[1] + '</span></li>';
        return '<li class="pf-ph" style="--c:' + (PHASE_COLOR[x[3]] || '#d6d9e0') + '"><span class="n">' + (x[0] || '✉') + '</span><span><b>' + x[1] + '</b><small>' + x[2] + '</small></span></li>'; }).join('') + '</ol>' +
      '<p class="notif-hint" style="margin-top:22px">ADDIE reste votre boîte à outils d\'ingénierie pédagogique. Vous l\'utilisez pendant la réalisation. Le processus, lui, est celui de l\'IFAP.</p>';
  }

  function rScenario() {
    return kicker('Choix du projet') + '<h2 class="title" id="bt">Quel type de projet pilotez-vous ?</h2><p class="lead">Les cinq phases, les jauges et les contenus sont communs. Ce qui change : les aléas que vous allez rencontrer en production et en déploiement.</p>' +
      '<div class="scen" role="group" aria-label="Scénarios">' + ['A', 'B', 'C'].map(function (k) { var s = C.scenarios[k];
        var soft = { A: '#e8f4fb', B: '#e3f5f6', C: '#eeebf6' }[k], ink = { A: '#1d6f9e', B: '#137a7f', C: '#5d4f93' }[k];
        return '<button class="scen-c" data-s="' + k + '" aria-pressed="' + (S.scenario === k) + '" style="--acc:' + s.accent + ';--acc-soft:' + soft + ';--acc-ink:' + ink + '"><span class="art"><span class="lt">' + k + '</span>' + SCEN_ART[k] + '</span>' +
          '<span class="bd"><span class="tg">Option ' + k + ' · ' + s.tag + '</span><h3>' + s.name + '</h3><p>' + fr(s.pitch) + '</p><ul>' + s.facts.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul></span></button>'; }).join('') + '</div>';
  }
  function mScenario(b, root) {
    if (S.scenario) { b._r = true; setReady(b); }
    $$('.scen-c', root).forEach(function (c) {
      c.addEventListener('click', function () {
        $$('.scen-c', root).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); c.setAttribute('aria-pressed', 'true');
        S.scenario = c.dataset.s; save(); renderChip(); renderDash(); setReady(b);
        announce('Scénario ' + S.scenario + ' choisi : ' + C.scenarios[S.scenario].name);
      });
    });
  }
  function rDiag() {
    return '<div class="diag-top">' + kicker('Positionnement', '5 questions · sans enjeu') + '<div class="diag-prog" aria-hidden="true"></div></div><div class="diag-slot"></div>';
  }
  function mDiag(b, root) {
    var st = b._st || (b._st = { i: 0, ans: [] });
    var slot = $('.diag-slot', root), prog = $('.diag-prog', root);
    var draw = function () {
      prog.innerHTML = C.diagnostic.map(function (q, k) { return '<i class="' + (k < st.ans.length ? (st.ans[k] ? 'ok' : 'ko') : k === st.i ? 'cur' : '') + '"></i>'; }).join('');
      if (st.i >= C.diagnostic.length) {
        slot.innerHTML = '<h2 class="title" id="bt">Positionnement terminé</h2><p class="lead">Vous avez répondu aux 5 questions. Découvrez votre résultat et le conseil associé.</p>';
        S.diag = st.ans.filter(Boolean).length; save(); b._r = true; setReady(b); return;
      }
      var q = C.diagnostic[st.i];
      slot.innerHTML = '<p class="mono" style="font-size:12px;color:var(--ink-3);margin-bottom:6px">QUESTION ' + (st.i + 1) + ' / 5</p><h2 class="diag-q" id="bt">' + fr(q.q) + '</h2>' +
        '<div class="qz" role="radiogroup" aria-label="Réponses">' + q.options.map(function (o, k) { return '<button class="qz-o" role="radio" aria-checked="false" data-k="' + k + '"><span class="rd" aria-hidden="true"></span><span>' + fr(o) + '</span></button>'; }).join('') + '</div>' +
        '<div class="comp-fb" aria-live="polite"></div><div class="comp-actions"><button class="btn btn-soft" data-nx hidden>' + (st.i < 4 ? 'Question suivante →' : 'Terminer') + '</button></div>';
      $$('.qz-o', slot).forEach(function (o) {
        o.addEventListener('click', function () {
          var k = +o.dataset.k, ok = k === q.ok;
          $$('.qz-o', slot).forEach(function (x, j) { x.disabled = true; if (j === q.ok) x.classList.add('ok'); else if (j === k) x.classList.add('ko'); });
          o.setAttribute('aria-checked', 'true');
          $('.comp-fb', slot).innerHTML = (ok ? '✓ ' : '✕ ') + fr(q.fb);
          st.ans.push(ok); prog.innerHTML = C.diagnostic.map(function (qq, kk) { return '<i class="' + (kk < st.ans.length ? (st.ans[kk] ? 'ok' : 'ko') : '') + '"></i>'; }).join('');
          var nx = $('[data-nx]', slot); nx.hidden = false; nx.focus();
          nx.addEventListener('click', function () { st.i++; draw(); var h = $('#bt'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } });
        });
      });
    };
    draw();
  }
  function rDiagResult() {
    var sc = S.diag || 0, m = sc <= 2 ? C.diagnosticMessages.low : sc === 3 ? C.diagnosticMessages.mid : C.diagnosticMessages.high;
    return kicker('Votre positionnement') + '<div class="diag-res"><div class="diag-score" style="--p:' + (sc * 20) + '"><span>' + sc + '<small>/5</small></span></div><div>' +
      '<h2 class="title" id="bt">Avant d\'ouvrir le dossier</h2><p class="vigil">' + fr(m) + '</p>' +
      '<p class="lead" style="margin-top:18px">Votre dossier : une sollicitation de la <strong>DRH Province Sud</strong> sur son nouveau SIRH. La modalité n\'est pas choisie : c\'est à vous de la décider, après l\'étude du besoin.</p></div></div>';
  }

  /* ------------------------------------------------------------------ */
  /* MODE CONSULTATION                                                   */
  /* ------------------------------------------------------------------ */
  function renderReview(sec) {
    var stage = $('#stage');
    var beats = sec.beats.filter(filterScen).filter(function (b) { return ['deferred'].indexOf(b.type) === -1; });
    P.sec = sec;
    var html = '<div class="review"><div class="review-banner"><span aria-hidden="true">◉</span><span>Mode consultation — ' + sec.title + '. Vos décisions sont verrouillées.</span></div>';
    var mounts = [];
    beats.forEach(function (b0, idx) {
      var b = Object.assign({}, b0);
      if (b.type === 'decision') { var j = S.journal.filter(function (x) { return x.id === b.id && x.section === sec.id; })[0]; if (j) { var k = -1; b.options.forEach(function (o, i) { if (o.id === j.choiceId) k = i; }); b._r = { k: k, applied: j.applied, st: { events: [], beats: [] } }; } }
      if (b.type === 'gate') { var jg = S.journal.filter(function (x) { return x.id === b.id; })[0]; b._snap = b.conds.map(function (c) { return !!c.ok(S); }); if (jg) b._r = { k: jg.choiceId === 'go' ? 0 : 1, review: true, q: jg.quality }; }
      if (b.type === 'notif' || b.type === 'crisis') b._seen = true;
      if (b.week) S.week = b.week;
      html += '<article class="beat" data-ri="' + idx + '">' + renderBeat(b).replace(/id="bt"/g, '') + '</article>';
      mounts.push(b);
    });
    html += '<div class="end-actions"><span></span><a class="btn btn-primary" ' + linkAttr(current()) + '>Revenir à ma phase en cours <span class="arr">→</span></a></div></div>';
    stage.innerHTML = html;
    mounts.forEach(function (b, idx) { var root = $('[data-ri="' + idx + '"]', stage); if (b.type === 'gate') { if (b._r) mGate(b, root); else $$('.opt', root).forEach(function (o) { o.disabled = true; }); } else if (b.type === 'decision') { if (b._r) mDecision(b, root, decCfg(b)); else $$('.opt', root).forEach(function (o) { o.disabled = true; }); } else if (b.type !== 'summary') mountBeat(b, root); else mSummary(b, root); });
    $$('a[data-go]', stage).forEach(function (a) { a.addEventListener('click', navHandler); });
    S.week = sec.weeks[1]; renderTimebar(); updateDash();
    var h = $('h2', stage); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  /* ------------------------------------------------------------------ */
  /* RAPPORT DE MISSION                                                  */
  /* ------------------------------------------------------------------ */
  function finalScore() { var a = (S.budget + S.delai + S.qualite) / 3; return Math.round(a * 0.75 + S.confiance * 0.25); }
  function renderReport() {
    if (S.done.indexOf('conclusion') === -1) { S.done.push('conclusion'); save(); renderRail(); }
    if (HOOKS.complete) HOOKS.complete(finalScore());
    S.week = 12; renderTimebar();
    var score = finalScore(), tier = C.report.tiers.filter(function (t) { return score >= t.min; })[0];
    var circ = 2 * Math.PI * 88;
    var stage = $('#stage');

    // journal : pires décisions
    var bad = S.journal.filter(function (j) { return j.quality !== 'good'; }).map(function (j) {
      var defN = j.recovered ? 0 : sum((j.deferred || []).map(function (d) { return d.delta; }));
      return Object.assign({}, j, { total: j.impact + defN });
    }).sort(function (a, b) { return a.total - b.total; }).slice(0, 4);
    var journal = bad.length ? bad.map(function (j) {
      var imm = chipsHTML(j.applied, { revealAll: true, noEmpty: true }) || '<span class="chip flat">Aucun effet immédiat</span>';
      if (j.domino) imm += '<span class="chip domino">↯ Effet domino ' + signed(j.domino) + '</span>';
      var def = j.recovered ? '<span class="chip up">↺ Effet différé rattrapé · ' + esc(j.recovered) + '</span>' : (j.deferred || []).map(function (d) { return '<span class="chip ' + (d.delta > 0 ? 'up' : 'down') + '">⏳ ' + signed(d.delta) + ' ' + gName(d.jauge) + ' en ' + phaseLabel(d.section).toLowerCase() + '</span>'; }).join('');
      var why = (j.deferred || []).map(function (d) { return fr(d.reason); }).join(' ');
      return '<div class="jr-i ' + j.quality + '"><div class="jr-b"><div class="top"><span class="sec">' + (j.crisis ? 'Crise · ' : '') + phaseLabel(j.section) + ' · S' + j.week + '</span><span class="tag ' + j.quality + '">' + (j.quality === 'bad' ? '✕ Choix risqué' : '≈ À nuancer') + '</span></div>' +
        '<h3>' + j.title + '</h3>' +
        '<div class="row"><span>Votre choix</span><span>' + j.choice + '</span></div>' +
        '<div class="row"><span>Impact réel</span><span><span class="chips">' + imm + def + '</span>' + (why ? '<span style="display:block;margin-top:8px;font-size:14px;color:var(--ink-2)">' + why + '</span>' : '') + '</span></div>' +
        '<div class="row fix"><span>Il aurait fallu</span><span><strong>' + j.best + '</strong><br>' + fr(j.conseil) + '</span></div></div></div>';
    }).join('') : '<p class="lead">Aucune décision risquée dans votre parcours. Remarquable — et rare.</p>';

    var incidents = S.incidents.length ? '<div class="incid">' + S.incidents.map(function (x) { return '<div><b>0</b><span><strong>' + gName(x.jauge) + ' à zéro</strong> · ' + phaseLabel(x.section) + ' · semaine ' + x.week + ' — ' + fr(x.title) + ' (' + Object.keys(x.penalty_applied).map(function (g) { return signed(x.penalty_applied[g]) + ' ' + gName(g); }).join(', ') + ')</span></div>'; }).join('') + '</div>'
      : '<p class="lead" style="margin:0">Aucune jauge n\'est tombée à zéro. Le projet n\'a jamais déraillé.</p>';

    var weakA = S.journal.some(function (j) { return (j.section === 's1' || j.section === 's2') && j.quality !== 'good'; }) || S.qualite < 60;
    var weakE = S.journal.some(function (j) { return (j.section === 's5' || j.section === 's6') && j.quality !== 'good'; }) || !S.flags.kpi_defined || S.confiance < 60;
    var fiche = function (key, reco) { var f = C.fiches[key]; return '<div class="fiche-c ' + (reco ? 'reco' : '') + '">' + (reco ? '<span class="reco-b">Recommandée pour vous</span>' : '') + a4mini() + '<div><h3>' + fr(f.title) + '</h3><p>' + fr(f.desc) + '</p>' + ficheLink(key, 'btn btn-soft', '↓ Ouvrir la fiche') + '</div></div>'; };

    var confMsg = S.confiance >= 70 ? 'L\'employeur vous fait confiance : il reviendra vers l\'IFAP.' : S.confiance >= 40 ? 'La relation tient, mais elle s\'est usée en chemin. Regardez où la courbe a plongé.' : 'L\'employeur doute de l\'IFAP. Vos jauges ne l\'ont jamais montré — c\'est tout le problème.';

    stage.innerHTML = '<div class="report">' +
      '<section class="rp-hero"><div>' + kicker('Rapport de mission', 'Projet SIRH · DRH Province Sud · ' + (S.scenario ? C.scenarios[S.scenario].name : '')) +
        '<h1 id="bt">' + fr(tier.name) + '</h1><span class="tier">Score global ' + score + ' / 100</span><p>' + fr(tier.text) + '</p></div>' +
        '<div class="big-score" role="img" aria-label="Score global ' + score + ' sur 100"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" fill="none" stroke="#f2f3f6" stroke-width="14"/><circle id="bs" cx="100" cy="100" r="88" fill="none" stroke="' + gColor(score) + '" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + circ.toFixed(1) + '" style="transition:stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1)"/></svg><div class="v"><span><b data-count="' + score + '">0</b><small>Score global</small></span></div></div></section>' +

      '<section class="rp-card"><h2>Vos trois jauges visibles</h2><p class="sub">Elles comptent pour 75 % du score global.</p><div class="rp-gauges">' +
        G3.map(function (g) { return '<div class="rp-g"><div class="top"><span>' + C.gauges[g].label + '</span><b>' + S[g] + '</b></div><div class="tr"><i data-w="' + S[g] + '" style="background:' + gColor(S[g]) + '"></i></div><small>Marges de rattrapage utilisées : ' + S.recharges[g] + ' / 2</small></div>'; }).join('') + '</div></section>' +

      '<section class="reveal" aria-labelledby="rv-t"><div class="curtain" id="curtain"><div style="text-align:center"><p class="mono" style="color:#b9b4d6;letter-spacing:.16em;font-size:12px;margin-bottom:14px">INDICATEUR MASQUÉ · 25 % DU SCORE</p><button class="btn" id="b-reveal">Je révèle l\'indicateur masqué</button></div></div>' +
        '<span class="stamp">RÉVÉLÉ</span><div class="k">Jauge cachée</div><h2 id="rv-t">' + C.report.confianceTitle + '</h2>' +
        '<div class="val"><b data-count2="' + S.confiance + '">0</b><span>/ 100 · ' + fr(confMsg) + '</span></div>' + curveSVG() +
        '<div class="legend"><span><i style="background:#ffcb00"></i>' + C.report.confianceTitle + '</span><span><i style="background:#63b8e8;opacity:.6"></i>Ressources</span><span><i style="background:#ed9c89;opacity:.6"></i>Délai</span><span><i style="background:#2fb6bc;opacity:.6"></i>Pertinence</span></div>' +
        '<p class="msg">' + fr(C.report.confianceMessage) + '</p></section>' +

      '<section class="rp-card"><h2>Vos portes de décision</h2><p class="sub">Passer une porte avec un point bloquant coûte cher. Bien tenue, elle permet de rattraper une erreur.</p><div class="gates-r">' +
        (S.gates.length ? S.gates.map(function (g) { return '<div class="gr ' + g.quality + '"><span class="dm" aria-hidden="true">◆</span><span><strong>' + g.title + '</strong><small>' + g.choice + '</small></span><span class="tag ' + g.quality + '">' + (g.quality === 'good' ? '✓ Bonne décision' : g.quality === 'mixed' ? '≈ Prudence inutile' : '✕ Point bloquant ignoré') + '</span></div>'; }).join('') : '<p class="lead">Aucune porte franchie.</p>') + '</div></section>' +
      '<section class="rp-card"><h2>Les décisions qui ont pesé</h2><p class="sub">Vos ' + (bad.length || '') + ' décisions les plus coûteuses, effets immédiats et différés compris — confiance de l\'employeur incluse.</p><div class="jr">' + journal + '</div></section>' +
      '<section class="rp-card"><h2>Incidents critiques</h2><p class="sub">Les moments où une jauge est tombée à zéro.</p>' + incidents + '</section>' +
      '<section class="rp-card"><h2>Vos fiches outils</h2><p class="sub">À imprimer ou enregistrer en PDF. Celles qui correspondent à vos points faibles sont signalées.</p><div class="fiches">' + fiche('cdc', weakA) + fiche('kirk', weakE) + '</div></section>' +
      '<section class="moodle"><span class="ic" aria-hidden="true">✓</span><p>' + fr(C.report.moodle) + '<small>Votre parcours dans le simulateur est enregistré comme terminé.</small></p></section>' +
      '<div class="end-actions"><button class="btn btn-ghost" data-reset>↺ Recommencer avec un autre scénario</button><a class="btn btn-primary" ' + linkAttr('credits') + '>Crédits et conformité <span class="arr">→</span></a></div>' +
      '<footer class="sources" role="contentinfo"><hr><p>Sources</p><ul>' + C.sources.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></footer></div>';

    var h = $('#bt'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    setTimeout(function () { var bs = $('#bs'); if (bs) bs.style.strokeDashoffset = (circ * (1 - score / 100)).toFixed(1); countUp($('[data-count]'), score); $$('.rp-g .tr i').forEach(function (i) { i.style.width = i.dataset.w + '%'; }); }, 200);
    $('#b-reveal').addEventListener('click', function () {
      $('#curtain').classList.add('open'); countUp($('[data-count2]'), S.confiance);
      var ln = $('.curve .line'); if (ln) { var L = ln.getTotalLength(); ln.style.strokeDasharray = L; ln.style.strokeDashoffset = L; ln.getBoundingClientRect(); ln.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(.2,.8,.2,1) .5s'; ln.style.strokeDashoffset = 0; }
      $$('.curve .pt').forEach(function (p, i) { p.style.opacity = 0; setTimeout(function () { p.style.transition = 'opacity .3s'; p.style.opacity = 1; }, 600 + i * 90); });
      announce(C.report.confianceTitle + ' : ' + S.confiance + ' sur 100');
      setTimeout(function () { $('#rv-t').setAttribute('tabindex', '-1'); $('#rv-t').focus(); }, 900);
    });
    wireFiches(stage); wireReset(stage);
    $$('a[data-go]', stage).forEach(function (a) { a.addEventListener('click', navHandler); });
  }
  function countUp(el, v) { if (!el) return; var t0 = performance.now(); (function st(t) { var p = Math.min(1, (t - t0) / 1500); el.textContent = Math.round(v * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(st); })(t0); }
  function curveSVG() {
    var H = S.history.length ? S.history : [{ k: 'Départ', confiance: 100, budget: 100, delai: 100, qualite: 100, sec: 's1' }];
    var W = 680, Ht = 230, L = 34, R = 12, Tp = 14, B = 34;
    var x = function (i) { return L + (H.length === 1 ? 0 : i * (W - L - R) / (H.length - 1)); };
    var y = function (v) { return Tp + (100 - v) * (Ht - Tp - B) / 100; };
    var path = function (g) { return H.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p[g]).toFixed(1); }).join(' '); };
    var grid = [0, 25, 50, 75, 100].map(function (v) { return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 3) + '" text-anchor="end">' + v + '</text>'; }).join('');
    var marks = '', seen = {};
    H.forEach(function (p, i) { if (p.sec && !seen[p.sec] && /^s\d$/.test(p.sec)) { seen[p.sec] = 1; marks += '<text x="' + x(i) + '" y="' + (Ht - 10) + '" text-anchor="middle">P' + (secById(p.sec) ? secById(p.sec).letter : p.sec.slice(1)) + '</text><line x1="' + x(i) + '" x2="' + x(i) + '" y1="' + Tp + '" y2="' + (Ht - B) + '" stroke-dasharray="2 4"/>'; } });
    var area = path('confiance') + ' L' + x(H.length - 1).toFixed(1) + ' ' + y(0) + ' L' + x(0) + ' ' + y(0) + ' Z';
    var pts = H.map(function (p, i) { return '<circle class="pt" cx="' + x(i).toFixed(1) + '" cy="' + y(p.confiance).toFixed(1) + '" r="4"><title>' + esc(p.k) + ' — confiance ' + p.confiance + '</title></circle>'; }).join('');
    return '<svg class="curve" viewBox="0 0 ' + W + ' ' + Ht + '" role="img" aria-label="Évolution de la confiance du commanditaire au fil du projet, de 100 à ' + S.confiance + '"><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcb00" stop-opacity=".35"/><stop offset="1" stop-color="#ffcb00" stop-opacity="0"/></linearGradient></defs>' +
      '<rect class="zone" x="' + L + '" y="' + y(30) + '" width="' + (W - L - R) + '" height="' + (y(0) - y(30)) + '"/>' +
      '<g class="grid">' + grid + marks + '</g>' +
      '<path class="ghost" stroke="#63b8e8" d="' + path('budget') + '"/><path class="ghost" stroke="#ed9c89" d="' + path('delai') + '"/><path class="ghost" stroke="#2fb6bc" d="' + path('qualite') + '"/>' +
      '<path class="area" d="' + area + '"/><path class="line" d="' + path('confiance') + '"/>' + pts + '</svg>';
  }

  /* ------------------------------------------------------------------ */
  /* FICHES & CRÉDITS                                                    */
  /* ------------------------------------------------------------------ */
  function sheetHTML(key) {
    var f = C.fiches[key], n = key === 'cdc' ? 1 : 2;
    var head = '<div class="sheet-hd"><small>Fiche outil ' + n + ' / 2 · IFAP</small><h1>' + fr(f.title) + '</h1><p>' + fr(key === 'cdc' ? 'Les questions à poser pendant l\'entretien, dans l\'ordre de la fiche de cadrage. À garder à côté de la fiche, pas à sa place.' : 'À construire avec l\'employeur dès le cadrage — pas après la formation.') + '</p></div>';
    var body;
    if (key === 'cdc') {
      var rows = [
        ['2 · Besoin à traiter', 'Pourquoi maintenant ? Quels faits, quelles erreurs, quels écarts ? Qu\'est-ce qui doit changer dans les pratiques ? <b>L\'écart vient-il des compétences, de l\'outil, de l\'information ou de l\'organisation ?</b>'],
        ['3 · Public et portée', 'Qui exactement, combien, où (Nouméa, brousse, îles) ? Niveau de départ ? Contraintes : connexion, temps, accessibilité ? Mutualisable avec d\'autres employeurs ?'],
        ['4 · Réponse envisagée', 'La formation est-elle la réponse, en totalité ou en partie ? Quelles autres réponses combiner ? Objectifs observables (verbe d\'action). Format et durée.'],
        ['5 · Diffusion et suivi', 'Place dans le dispositif ? Qui inscrit ? Obligatoire, avant quand ? Quel suivi : global, nominatif, progression ? L\'employeur est-il informé, et quand ?'],
        ['6 · Faisabilité', 'Expert contenu et disponibilité ? Ressources existantes ? Date souhaitée et échéance réelle ? Qui valide, sous quel délai ? Contenu stable ou évolutif ? RGPD ?'],
        ['7 · Éligibilité LIANE', 'Intérêt commun ? Public mutualisable ? Contenu stable ? Compatible avec l\'asynchrone ? Durée compatible ? Expert disponible ? Pas de doublon ?'],
        ['8 · Décision', 'Filière, priorité, décision d\'engagement (engagée, programmée, portefeuille, autre réponse, non retenue), décideur, date.'],
        ['Avant de lancer', 'Crédits disponibles vérifiés · bon de commande ou convention signé · rôles répartis · valideur métier et délai fixés · planning avec marges · indicateurs et valeur de départ.']];
      body = '<table><thead><tr><th>Partie</th><th>Questions à poser</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr><td class="lbl">' + fr(r[0]) + '</td><td>' + fr(r[1]) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<div class="tip"><strong>Règle d\'or :</strong> décrire le problème avant la solution. Une sollicitation, même accompagnée d\'un cahier des charges, reste une hypothèse.</div>';
    } else {
      var lv = [['1 · Réaction', 'Participation, satisfaction', 'Conversion, complétion, émargement, questionnaire à chaud', 'Pendant et fin'], ['2 · Apprentissage', 'Compétences acquises', 'Quiz avant / après, mise en situation', 'Début et fin'], ['3 · Comportement', 'Usage au poste de travail', 'Observation, données d\'usage, entretien manager', 'J+30 à J+90'], ['4 · Résultats', 'Changement pour l\'organisation', 'Indicateurs métier fixés au cadrage', '3 à 6 mois']];
      body = '<table><thead><tr><th>Niveau</th><th>Indicateur</th><th>Source de données</th><th>Moment</th><th>Responsable</th></tr></thead><tbody>' + lv.map(function (r) { return '<tr><td class="lbl">' + r[0] + '</td><td>' + fr('<span class="hint">Ex. : ' + r[1] + '</span>') + '<div style="height:16mm"></div></td><td><span class="hint">Ex. : ' + fr(r[2]) + '</span></td><td><span class="hint">' + fr(r[3]) + '</span></td><td></td></tr>'; }).join('') + '</tbody></table>' +
        '<div class="tip"><strong>Point clé :</strong> le dispositif d\'évaluation se définit avec l\'employeur <strong>au moment du cadrage</strong>. Sans situation de départ mesurée, les niveaux 3 et 4 sont impossibles à démontrer.</div>';
    }
    return '<div class="sheet">' + head + '<div class="sheet-bd">' + body + '</div><div class="sheet-ft"><span>IFAP — Chef de projet formation : dans le vif du sujet</span><span>CC BY-NC-SA 4.0</span></div></div>';
  }

  function openFicheOverlay(key) {
    var o = document.createElement('div'); o.className = 'overlay'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', C.fiches[key].title);
    o.innerHTML = '<div class="doc-tools"><button class="btn btn-soft" data-close>← Fermer</button><button class="btn btn-teal" data-print>Imprimer / Enregistrer en PDF</button></div>' + sheetHTML(key);
    document.body.appendChild(o);
    var close = function () { o.remove(); document.removeEventListener('keydown', esck); };
    var esck = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esck);
    $('[data-close]', o).addEventListener('click', close); $('[data-close]', o).focus();
    $('[data-print]', o).addEventListener('click', function () { document.body.classList.add('printing'); window.print(); setTimeout(function () { document.body.classList.remove('printing'); }, 500); });
  }
  function renderFichePage(key) {
    var app = $('#app');
    app.innerHTML = '<main><div class="doc-tools no-print"><button class="btn btn-soft" onclick="window.close()">← Fermer</button>' + fsButton() + '<button class="btn btn-teal" onclick="window.print()">Imprimer / Enregistrer en PDF</button></div>' + sheetHTML(key) + '</main>'; wireFS();
  }
  function renderCredits() {
    var stage = $('#stage'), now = new Date();
    var mois = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    stage.innerHTML = '<div class="beat"><div class="credits">' + kicker('Étape finale') + '<h1 id="bt" style="font-size:40px;margin-bottom:30px">Crédits et conformité</h1>' +
      '<section><h2>Conception et développement</h2><dl><dt>Module :</dt><dd> ' + fr(C.meta.title) + '</dd><br><dt>Conception pédagogique et rédaction :</dt><dd> IFAP – Institut de formation de l\'administration publique</dd><br><dt>Conception multimédia et développement :</dt><dd> réalisé avec <strong>Claude (Anthropic)</strong> — HTML, CSS, JavaScript</dd><br><dt>Date de création :</dt><dd> octobre 2026</dd><br><dt>Date de dernière modification :</dt><dd> ' + mois + '</dd></dl></section>' +
      '<section><h2>Ressources visuelles</h2><ul><li>Illustrations, icônes et interfaces simulées réalisées en code (SVG, CSS) par l\'équipe conceptrice.</li><li>Polices Fraunces, Inter et JetBrains Mono sous licence SIL Open Font License.</li><li>Aucun média externe sous licence tierce n\'a été utilisé.</li></ul></section>' +
      '<section><h2>Conformité juridique et éthique</h2><ul><li>Ce module respecte les principes du <strong>RGPD</strong> : aucune donnée personnelle n\'est collectée directement par la ressource.</li><li>Les informations relatives aux apprenants (progression, durée de consultation) sont éventuellement suivies via le <strong>LMS</strong> de diffusion, conformément à la politique de confidentialité en vigueur.</li><li>Les personnages et situations du simulateur sont fictifs.</li></ul></section>' +
      '<section><h2>Droits d\'auteur et licence de diffusion</h2><p>Ce module est protégé par le droit d\'auteur.</p><p>Il est diffusé sous <strong>licence Creative Commons BY-NC-SA 4.0</strong><br><em>(Attribution – Pas d\'utilisation commerciale – Partage dans les mêmes conditions)</em>.</p><p>© IFAP, ' + now.getFullYear() + ' – Toute reproduction ou adaptation est autorisée à condition de citer la source et de ne pas en faire un usage commercial.</p></section>' +
      '<section><h2>Accessibilité</h2><p>Ce module est conçu pour être consultable sur ordinateur, tablette et mobile. Navigation au clavier, contrastes renforcés, animations réduites si le système le demande.</p><p>Des ajustements complémentaires sont en cours pour garantir une conformité renforcée au RGAA.</p></section>' +
      '<section><h2>Contact</h2><p>Pour toute question ou réutilisation du module :</p><p><a href="mailto:elearning@ifap.nc">elearning@ifap.nc</a><br><a href="https://www.ifap.nc" target="_blank" rel="noopener">https://www.ifap.nc</a></p></section>' +
      '<div class="end-actions"><a class="btn btn-ghost" ' + linkAttr('conclusion') + '>← Retour au rapport</a></div></div></div>';
    $$('a[data-go]', stage).forEach(function (a) { a.addEventListener('click', navHandler); });
  }

  /* ------------------------------------------------------------------ */
  /* RESET & BOOT                                                        */
  /* ------------------------------------------------------------------ */
  function wireReset(root) { $$('[data-reset]', root).forEach(function (b) { b.addEventListener('click', function () { if (HOOKS.reset) HOOKS.reset(); Store.clearAll(); load(); P.live = {}; Sim.go('intro'); }); }); }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-resume]');
    if (t) { Sim.go(current()); }
    var r = e.target.closest && e.target.closest('.hero [data-reset]');
    if (r) { if (HOOKS.reset) HOOKS.reset(); Store.clearAll(); load(); P.live = {}; Sim.go('intro'); }
  });

  Sim.boot = function (page) {
    load();
    if (MODE === 'single') {
      var h = (location.hash || '').replace('#', '');
      route(h && (ORDER.indexOf(h) > -1 || h === 'credits') ? h : current());
      window.addEventListener('hashchange', function () { var h2 = location.hash.replace('#', ''); if (h2 && h2 !== P.page && (ORDER.indexOf(h2) > -1 || h2 === 'credits')) route(h2); });
    } else route(page);
  };
  /* Accès de test */
  Sim._state = function () { return S; };
  Sim._P = function () { return P; };
  window.Sim = Sim;
})();
