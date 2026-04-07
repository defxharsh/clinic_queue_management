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

// Global state
let queue = [
  { qno:1, name:'Olivia Chen',  email:'olivia@example.com', sym:'Chest discomfort and shortness of breath', docId:1, priority:'High',   time:'10:15 AM', date: new Date().toLocaleDateString() },
  { qno:2, name:'James Miller', email:'james@example.com',  sym:'Persistent lower back pain',               docId:3, priority:'Normal', time:'10:45 AM', date: new Date().toLocaleDateString() }
];

let treatedHistory = [
  { name:'Ethan Wu', email:'ethan@example.com', sym:'Routine annual checkup', doctor:'Dr. Khan', spec:'General Medicine', priority:'Normal', treatedAt: new Date().toLocaleString() }
];

let followups     = [];
let archivedCount = 0;
let admittedCount = 0;

let currentRole = null;
let currentUser = null;
let selectedHistIdx = -1;

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
