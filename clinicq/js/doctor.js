/* =============================================
   Clinic Q— | doctor.js
   Doctor dashboard — admitted patients waiting,
   treat/skip, patient history, follow-ups, archive
   ============================================= */

function initDoctorDashboard() {
  admittedPatients = JSON.parse(localStorage.getItem(LS_ADMITTED)) || [];
  treatedHistory   = JSON.parse(localStorage.getItem(LS_HISTORY))  || [];
  updateDoctorStats();
  renderAdmittedPatients();
  fillHistorySelect();
  renderFollowupList();
  startAutoRefresh(() => {
    updateDoctorStats();
    renderAdmittedPatients();
    fillHistorySelect();
  });
}

function updateDoctorStats() {
  document.getElementById('ds_treated').textContent = treatedHistory.length;
  document.getElementById('ds_fu').textContent      = followups.length;
  document.getElementById('ds_arch').textContent    = archivedCount;
}

// ─── ADMITTED PATIENTS (nurse sent these) ─────
function renderAdmittedPatients() {
  const container = document.getElementById('admittedList');
  const emptyEl   = document.getElementById('admittedEmpty');
  if (!container) return;

  admittedPatients = JSON.parse(localStorage.getItem(LS_ADMITTED)) || [];

  if (admittedPatients.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');
  container.innerHTML = admittedPatients.map((p, i) => `
    <div class="admitted-card" style="
      background:var(--surface);border:1px solid var(--border);border-radius:12px;
      padding:16px 20px;margin-bottom:12px;display:flex;align-items:center;
      justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--teal-light);
          display:flex;align-items:center;justify-content:center;font-weight:700;
          font-size:1rem;color:var(--teal);">${initials(p.name)}</div>
        <div>
          <div style="font-weight:700;font-size:0.97rem;">
            ${p.name}
            <span class="badge ${p.priority === 'High' ? 'b-red' : 'b-green'}" style="font-size:0.68rem;margin-left:6px;">${p.priority}</span>
          </div>
          <div style="font-size:0.78rem;color:var(--muted);">👨‍⚕️ ${p.doctor} &nbsp;·&nbsp; ${p.spec}</div>
          <div style="font-size:0.78rem;color:var(--muted);margin-top:2px;">🕐 Admitted: ${p.admittedAt}</div>
          <div style="font-size:0.82rem;margin-top:4px;"><strong>Symptoms:</strong> ${p.sym}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button class="btn-admit" onclick="markTreated(${i})" style="padding:7px 16px;">✓ Treated</button>
        <button class="btn-del"   onclick="markNotTreated(${i})" style="padding:7px 16px;">✗ Not Treated</button>
      </div>
    </div>`).join('');
}

// ─── DOCTOR MARKS TREATED ─────────────────────
window.markTreated = function(idx) {
  admittedPatients = JSON.parse(localStorage.getItem(LS_ADMITTED)) || [];
  const patient = admittedPatients.splice(idx, 1)[0];
  if (!patient) return;

  treatedHistory = JSON.parse(localStorage.getItem(LS_HISTORY)) || [];
  treatedHistory.push({
    name:      patient.name,
    email:     patient.email,
    sym:       patient.sym,
    doctor:    patient.doctor,
    spec:      patient.spec,
    priority:  patient.priority,
    treatedAt: new Date().toLocaleString()
  });

  saveAdmitted();
  saveHistory();

  renderAdmittedPatients();
  fillHistorySelect();
  updateDoctorStats();
  toast(`✓ ${patient.name} marked as Treated — added to history.`, 'success');
};

// ─── DOCTOR MARKS NOT TREATED ─────────────────
window.markNotTreated = function(idx) {
  admittedPatients = JSON.parse(localStorage.getItem(LS_ADMITTED)) || [];
  const patient = admittedPatients.splice(idx, 1)[0];
  if (!patient) return;

  queue = JSON.parse(localStorage.getItem(LS_QUEUE)) || [];
  queue.push({
    name:        patient.name,
    email:       patient.email,
    sym:         patient.sym,
    docId:       patient.docId,
    priority:    patient.priority,
    time:        timeNow(),
    date:        todayStr(),
    _insertTime: Date.now(),
    _uid:        Date.now() + Math.random()
  });
  queue.forEach((q, i) => q.qno = i + 1);

  saveQueue();
  saveAdmitted();

  renderAdmittedPatients();
  updateDoctorStats();
  toast(`${patient.name} sent back to queue.`, 'info');
};

// ─── TABS ─────────────────────────────────────
function docTab(tab) {
  document.getElementById('th').classList.toggle('active', tab === 'h');
  document.getElementById('tf').classList.toggle('active', tab === 'f');
  document.getElementById('ph').classList.toggle('hidden', tab !== 'h');
  document.getElementById('pf').classList.toggle('hidden', tab !== 'f');
  if (tab === 'h') fillHistorySelect(); else renderFollowupList();
}

// ─── PATIENT HISTORY SELECT ───────────────────
function fillHistorySelect() {
  const sel     = document.getElementById('dHistSel');
  const detail  = document.getElementById('dDetail');
  const emptyEl = document.getElementById('dHistEmpty');

  treatedHistory = JSON.parse(localStorage.getItem(LS_HISTORY)) || [];
  sel.innerHTML = '<option value="">-- Select patient --</option>';

  if (treatedHistory.length === 0) {
    emptyEl.classList.remove('hidden');
    detail.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  treatedHistory.forEach((p, i) => {
    sel.innerHTML += `<option value="${i}">${p.name} — ${p.doctor} (${p.treatedAt.split(',')[0]})</option>`;
  });
}

function loadHist() {
  const idx    = parseInt(document.getElementById('dHistSel').value);
  const detail = document.getElementById('dDetail');

  if (isNaN(idx) || !treatedHistory[idx]) {
    detail.classList.add('hidden');
    selectedHistIdx = -1;
    return;
  }

  selectedHistIdx = idx;
  const p = treatedHistory[idx];

  document.getElementById('dContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--teal-light);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;color:var(--teal);">
        ${initials(p.name)}
      </div>
      <div>
        <div style="font-weight:700;font-size:1.05rem;">
          ${p.name}
          <span class="badge ${p.priority === 'High' ? 'b-red' : 'b-green'}" style="font-size:0.7rem;margin-left:6px;">${p.priority}</span>
        </div>
        <div style="font-size:0.78rem;color:var(--muted);">${p.treatedAt}</div>
      </div>
    </div>
    <div class="drow"><strong>Doctor:</strong> ${p.doctor} (${p.spec})</div>
    <div class="drow"><strong>Symptoms:</strong> ${p.sym}</div>
    ${p.email ? `<div class="drow"><strong>Email:</strong> <span style="color:var(--teal);">${p.email}</span></div>` : ''}
  `;

  document.getElementById('dFuDate').valueAsDate = tomorrowDate();
  document.getElementById('dFuReason').value      = '';
  detail.classList.remove('hidden');
}

async function schedFU() {
  if (selectedHistIdx < 0) { toast('Please select a patient first.', 'error'); return; }

  const date   = document.getElementById('dFuDate').value;
  const reason = document.getElementById('dFuReason').value.trim();

  if (!date)   { toast('Please select a follow-up date.', 'error');    return; }
  if (!reason) { toast('Please enter a reason for follow-up.', 'error'); return; }

  const patient   = treatedHistory[selectedHistIdx];
  const dateLabel = new Date(date).toLocaleDateString();

  followups.push({
    patientName: patient.name,
    email:       patient.email,
    doctor:      patient.doctor,
    reason,
    date:        dateLabel,
    scheduledAt: new Date().toLocaleString()
  });

  renderFollowupList();
  updateDoctorStats();
  document.getElementById('dFuReason').value = '';
  toast(`Follow-up scheduled for ${patient.name} on ${dateLabel}.`, 'success');

  if (patient.email) {
    try {
      await sendFollowUpEmail(patient.email, patient.name, patient.doctor, dateLabel, reason);
      setTimeout(() => toast(`📧 Follow-up email sent to ${patient.email}`, 'info'), 1200);
    } catch {
      setTimeout(() => toast('Follow-up email failed — check EmailJS setup.', 'info'), 1200);
    }
  }
}

function archiveRec() {
  if (selectedHistIdx < 0) return;
  const name = treatedHistory[selectedHistIdx].name;
  if (!confirm(`Archive record for ${name}?`)) return;
  treatedHistory.splice(selectedHistIdx, 1);
  archivedCount++;

  saveHistory();
  saveCounts();

  selectedHistIdx = -1;
  document.getElementById('dDetail').classList.add('hidden');
  fillHistorySelect();
  updateDoctorStats();
  toast(`Record for ${name} archived.`, 'info');
}

function renderFollowupList() {
  const container = document.getElementById('fuList');
  const emptyEl   = document.getElementById('dFUEmpty');

  if (followups.length === 0) {
    container.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  container.innerHTML = followups.map((f, i) => `
    <div class="fu-item">
      <div>
        <strong>${f.patientName}</strong><br>
        <span style="font-size:0.78rem;color:var(--muted);">👨‍⚕️ ${f.doctor}</span><br>
        <span class="badge b-amber" style="margin-top:6px;font-size:0.7rem;">📅 ${f.date}</span>
        <span style="font-size:0.8rem;margin-left:8px;">— ${f.reason}</span>
        ${f.email
          ? `<br><span style="font-size:0.75rem;color:var(--teal);cursor:pointer;" onclick="resendFUEmail(${i})">📧 Resend reminder</span>`
          : ''}
      </div>
      <div class="fu-actions">
        <button class="btn-admit" onclick="completeFU(${i})">Complete</button>
        <button class="btn-del"   onclick="cancelFU(${i})">Cancel</button>
      </div>
    </div>`).join('');

  updateDoctorStats();
}

window.completeFU = function(i) {
  const name = followups[i].patientName;
  followups.splice(i, 1);
  renderFollowupList();
  toast(`Follow-up for ${name} completed.`, 'success');
};

window.cancelFU = function(i) {
  const name = followups[i].patientName;
  followups.splice(i, 1);
  renderFollowupList();
  toast(`Follow-up for ${name} cancelled.`, 'info');
};

window.resendFUEmail = async function(i) {
  const f = followups[i];
  if (!f.email) return;
  try {
    await sendFollowUpEmail(f.email, f.patientName, f.doctor, f.date, f.reason);
    toast(`📧 Reminder sent to ${f.patientName}.`, 'success');
  } catch {
    toast('Email failed — check EmailJS setup.', 'error');
  }
};