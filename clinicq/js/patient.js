/* =============================================
   Clinic Q— | patient.js
   Patient dashboard — booking form, doctor
   availability, email confirmation, fixed
   high-priority queue position display
   ============================================= */

// ─── INIT ────────────────────────────────────
function initPatientDashboard() {
  updatePatientStats();
  fillDoctorSelect();
  renderDocGrid('pDocGrid');
  prefillIfLoggedIn();
}

// ─── PRE-FILL for logged-in patients ─────────
function prefillIfLoggedIn() {
  if (currentRole === 'patient' && currentUser) {
    document.getElementById('pName').value  = currentUser.name  || '';
    document.getElementById('pEmail').value = currentUser.email || '';
  }
}

// ─── STATS ───────────────────────────────────
function updatePatientStats() {
  document.getElementById('ps_total').textContent = queue.length;
  document.getElementById('ps_high').textContent  = queue.filter(p => p.priority === 'High').length;
  document.getElementById('ps_avail').textContent = DOCTORS.filter(
    d => queue.filter(q => q.docId === d.id).length < d.max
  ).length;
}

// ─── DOCTOR SELECT ────────────────────────────
function fillDoctorSelect() {
  const sel = document.getElementById('pDoc');
  sel.innerHTML = '<option value="">-- Choose a doctor --</option>';
  DOCTORS.forEach(doc => {
    const count = queue.filter(q => q.docId === doc.id).length;
    const full  = count >= doc.max;
    sel.innerHTML += `<option value="${doc.id}" ${full ? 'disabled' : ''}>
      ${doc.name} — ${doc.spec}${full ? ' (Full)' : ''}
    </option>`;
  });
  sel.onchange = updateDoctorStatus;
}

function updateDoctorStatus() {
  const docId    = parseInt(document.getElementById('pDoc').value);
  const statusEl = document.getElementById('pDocStatus');
  const doc      = DOCTORS.find(d => d.id === docId);

  if (!doc) {
    statusEl.textContent = 'Select a doctor to see availability';
    return;
  }
  const count = queue.filter(q => q.docId === docId).length;
  const left  = doc.max - count;

  statusEl.innerHTML = left > 0
    ? `<span style="color:var(--green);font-weight:600;">✓ Available</span> — ${count}/${doc.max} patients, ${left} slot${left > 1 ? 's' : ''} open`
    : `<span style="color:var(--red);font-weight:600;">✗ Queue Full</span> — No slots available`;
}

// ─── SORT QUEUE — High priority first ────────
function sortQueue() {
  queue.sort((a, b) => {
    const aHigh = a.priority === 'High' ? 0 : 1;
    const bHigh = b.priority === 'High' ? 0 : 1;
    if (aHigh !== bHigh) return aHigh - bHigh; // High comes first
    return a._insertTime - b._insertTime;       // Then by arrival time
  });
  // Re-assign qno after sort
  queue.forEach((p, i) => p.qno = i + 1);
}

// ─── BOOK APPOINTMENT ────────────────────────
async function bookAppointment() {
  const name      = document.getElementById('pName').value.trim();
  const email     = document.getElementById('pEmail').value.trim().toLowerCase();
  const sym       = document.getElementById('pSym').value.trim();
  const docId     = parseInt(document.getElementById('pDoc').value);
  const priority  = document.getElementById('pPriority').value;
  const sendEmail = document.getElementById('emailToggle').checked;

  // Validation
  if (!name)  { toast('Please enter your name.', 'error');                          return; }
  if (!email || !email.includes('@')) { toast('Please enter a valid email address.', 'error'); return; }
  if (!sym)   { toast('Please describe your symptoms.', 'error');                   return; }
  if (!docId) { toast('Please select a doctor.', 'error');                          return; }

  const doc = DOCTORS.find(d => d.id === docId);
  if (queue.filter(q => q.docId === docId).length >= doc.max) {
    toast(`${doc.name}'s queue is full. Please choose another doctor.`, 'error');
    return;
  }

  // Build entry with unique ID and insert timestamp for stable sorting
  const uid = Date.now() + Math.random();
  const newEntry = {
    _uid: uid,
    _insertTime: Date.now(),
    name, email, sym, docId, priority,
    time: timeNow(),
    date: todayStr()
  };

  queue.push(newEntry);

  // Sort queue — High priority goes to top, Normal stays in order
  sortQueue();

  // Find real position using unique ID
  const realPosition = queue.findIndex(q => q._uid === uid) + 1;

  // Clear form fields (keep name/email for logged-in patients)
  if (currentRole !== 'patient') {
    document.getElementById('pName').value  = '';
    document.getElementById('pEmail').value = '';
  }
  document.getElementById('pSym').value      = '';
  document.getElementById('pDoc').value      = '';
  document.getElementById('pDocStatus').textContent = 'Select a doctor to see availability';
  document.getElementById('pPriority').value = 'Normal';

  // Update UI
  updatePatientStats();
  renderDocGrid('pDocGrid');
  fillDoctorSelect();

  // If nurse is also viewing, refresh their queue immediately
  if (currentRole === 'nurse') renderNurseQueue();

  const estWait = realPosition * 7;
  toast(
    `✓ Booked! You are #${realPosition} in queue.${priority === 'High' ? ' 🔴 High priority — moved to top!' : ''} Est. wait: ~${estWait} min.`,
    'success'
  );

  // Send email confirmation
  if (sendEmail) {
    try {
      await sendBookingEmail(newEntry, realPosition, doc.name, doc.spec);
      setTimeout(() => toast(`📧 Confirmation sent to ${email}`, 'info'), 1500);
    } catch {
      setTimeout(() => toast('Email not sent — check EmailJS setup.', 'info'), 1500);
    }
  }
}

// ─── EVENT LISTENER ───────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('bookBtn').addEventListener('click', bookAppointment);
});