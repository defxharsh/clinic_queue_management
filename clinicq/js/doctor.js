/* =============================================
   Clinic Q— | doctor.js
   Doctor dashboard — patient history,
   follow-up scheduling, archive, email notify
   ============================================= */

function initDoctorDashboard() {
  updateDoctorStats();
  fillHistorySelect();
  renderFollowupList();
}

function updateDoctorStats() {
  document.getElementById('ds_treated').textContent = treatedHistory.length;
  document.getElementById('ds_fu').textContent       = followups.length;
  document.getElementById('ds_arch').textContent     = archivedCount;
}

function docTab(tab) {
  document.getElementById('th').classList.toggle('active', tab === 'h');
  document.getElementById('tf').classList.toggle('active', tab === 'f');
  document.getElementById('ph').classList.toggle('hidden', tab !== 'h');
  document.getElementById('pf').classList.toggle('hidden', tab !== 'f');
  if (tab === 'h') fillHistorySelect(); else renderFollowupList();
}

function fillHistorySelect() {
  const sel     = document.getElementById('dHistSel');
  const detail  = document.getElementById('dDetail');
  const emptyEl = document.getElementById('dHistEmpty');

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

  if (!date)   { toast('Please select a follow-up date.', 'error');   return; }
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

  // Send follow-up email
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
