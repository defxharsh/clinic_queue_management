/* =============================================
   Clinic Q— | utils.js
   Shared state, constants, and helper functions
   ============================================= */

const DOCTORS = [
  { id:1, name:'Dr. Sharma', spec:'Cardiology',      max:5 },
  { id:2, name:'Dr. Mehta',  spec:'Neurology',       max:5 },
  { id:3, name:'Dr. Singh',  spec:'Orthopedics',     max:5 },
  { id:4, name:'Dr. Rao',    spec:'Dermatology',     max:5 },
  { id:5, name:'Dr. Khan',   spec:'General Medicine', max:5 }
];

// ─── localStorage KEYS ────────────────────────
const LS_QUEUE    = 'clinicq_queue';
const LS_HISTORY  = 'clinicq_history';
const LS_COUNTS   = 'clinicq_counts';
const LS_ADMITTED = 'clinicq_admitted'; // ✅ nurse admits → doctor sees here first

// ─── LOAD from localStorage (no hardcoded data) ─
let queue            = JSON.parse(localStorage.getItem(LS_QUEUE))    || [];
let treatedHistory   = JSON.parse(localStorage.getItem(LS_HISTORY))  || [];
let admittedPatients = JSON.parse(localStorage.getItem(LS_ADMITTED)) || [];

const _counts      = JSON.parse(localStorage.getItem(LS_COUNTS)) || {};
let archivedCount  = _counts.archived  || 0;
let admittedCount  = _counts.admitted  || 0;

let followups       = [];
let currentRole     = null;
let currentUser     = null;
let selectedHistIdx = -1;

// ─── SAVE helpers ─────────────────────────────
function saveQueue() {
  localStorage.setItem(LS_QUEUE, JSON.stringify(queue));
}

function saveHistory() {
  localStorage.setItem(LS_HISTORY, JSON.stringify(treatedHistory));
}

function saveAdmitted() {
  localStorage.setItem(LS_ADMITTED, JSON.stringify(admittedPatients));
}

function saveCounts() {
  localStorage.setItem(LS_COUNTS, JSON.stringify({ archived: archivedCount, admitted: admittedCount }));
}

// ─── DOCTOR GRID ──────────────────────────────
function renderDocGrid(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = DOCTORS.map(doc => {
    const count = queue.filter(q => q.docId === doc.id).length;
    const pct   = Math.round((count / doc.max) * 100);
    const full  = count >= doc.max;
    return `<div class="doc-card">
      <div class="dc-name">${doc.name}</div>
      <div class="dc-spec">${doc.spec}</div>
      <div class="dc-bar-wrap"><div class="dc-bar${full?' full':''}" style="width:${pct}%"></div></div>
      <div class="dc-slots">${count} / ${doc.max} patients</div>
      <div class="${full?'dc-full':'dc-ok'}">${full?'Queue Full':'Available'}</div>
    </div>`;
  }).join('');
}

// ─── HELPERS ──────────────────────────────────
function todayStr() { return new Date().toLocaleDateString(); }
function timeNow()  { return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
function tomorrowDate() { const d = new Date(); d.setDate(d.getDate()+1); return d; }
function initials(name) { return name.trim().charAt(0).toUpperCase(); }
function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id) { document.getElementById(id)?.classList.add('hidden'); }

// ─── TOAST ────────────────────────────────────
let toastTimer;
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 3600);
}

// ─── AUTO-REFRESH every 3 seconds ─────────────
// Reloads queue & history from localStorage so all open tabs stay in sync
function startAutoRefresh(refreshFn) {
  setInterval(() => {
    queue            = JSON.parse(localStorage.getItem(LS_QUEUE))    || [];
    treatedHistory   = JSON.parse(localStorage.getItem(LS_HISTORY))  || [];
    admittedPatients = JSON.parse(localStorage.getItem(LS_ADMITTED)) || [];
    const c = JSON.parse(localStorage.getItem(LS_COUNTS)) || {};
    admittedCount  = c.admitted  || 0;
    archivedCount  = c.archived  || 0;
    if (typeof refreshFn === 'function') refreshFn();
  }, 3000);
}