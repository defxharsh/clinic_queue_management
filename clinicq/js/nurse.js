/* =============================================
   Clinic Q— | nurse.js
   Nurse dashboard — queue management, admit,
   cancel patients, stats
   ============================================= */

function initNurseDashboard() {
  renderNurseQueue();
  // ✅ Auto-refresh every 3s — picks up new patients booked in other tabs
  startAutoRefresh(renderNurseQueue);
}

function updateNurseStats() {
  document.getElementById('ns_wait').textContent  = queue.length;
  document.getElementById('ns_high').textContent  = queue.filter(p => p.priority === 'High').length;
  document.getElementById('ns_admit').textContent = admittedCount;
  document.getElementById('ns_avg').textContent   = queue.length > 0 ? `~${queue.length * 7}m` : '—';
}

function renderNurseQueue() {
  const tbody   = document.getElementById('nQBody');
  const emptyEl = document.getElementById('nEmpty');
  updateNurseStats();

  if (queue.length === 0) {
    tbody.innerHTML = '';
    emptyEl.classList.remove('hidden');
    renderDocGrid('nDocLoad');
    return;
  }

  emptyEl.classList.add('hidden');
  tbody.innerHTML = queue.map((p, i) => {
    const doc = DOCTORS.find(d => d.id === p.docId);
    return `<tr>
      <td><div class="qno">${p.qno}</div></td>
      <td><strong>${p.name}</strong><br><small style="color:var(--muted);font-size:0.75rem;">${p.email || ''}</small></td>
      <td>${doc ? doc.name : '—'}<br><small style="color:var(--muted)">${doc ? doc.spec : ''}</small></td>
      <td><span class="badge ${p.priority === 'High' ? 'b-red' : 'b-green'}">${p.priority}</span></td>
      <td style="max-width:160px;font-size:0.8rem;">${p.sym.substring(0,50)}${p.sym.length>50?'…':''}</td>
      <td style="font-size:0.8rem;color:var(--muted);">${p.time}</td>
      <td>
        <button class="btn-admit" onclick="admitPatient(${i})">Admit</button>
        <button class="btn-del"   onclick="cancelPatient(${i})">Cancel</button>
      </td>
    </tr>`;
  }).join('');

  renderDocGrid('nDocLoad');
}

window.admitPatient = function(idx) {
  // Re-read fresh from localStorage before admitting (avoid stale index)
  queue = JSON.parse(localStorage.getItem(LS_QUEUE)) || [];

  const patient = queue.splice(idx, 1)[0];
  if (!patient) { toast('Patient not found — queue may have changed.', 'error'); return; }

  const doc = DOCTORS.find(d => d.id === patient.docId);

  // ✅ Goes to doctor's waiting room first — NOT directly to treatedHistory
  admittedPatients = JSON.parse(localStorage.getItem(LS_ADMITTED)) || [];
  admittedPatients.push({
    name:       patient.name,
    email:      patient.email,
    sym:        patient.sym,
    docId:      patient.docId,
    doctor:     doc ? doc.name : 'Unknown',
    spec:       doc ? doc.spec : '',
    priority:   patient.priority,
    admittedAt: new Date().toLocaleString()
  });

  admittedCount++;
  queue.forEach((q, i) => q.qno = i + 1);

  saveQueue();
  saveAdmitted();
  saveCounts();

  renderNurseQueue();
  toast(`✓ ${patient.name} admitted to ${doc ? doc.name : 'doctor'}.`, 'success');
};

window.cancelPatient = function(idx) {
  // Re-read fresh from localStorage
  queue = JSON.parse(localStorage.getItem(LS_QUEUE)) || [];

  const name = queue[idx]?.name;
  if (!name) { toast('Patient not found — queue may have changed.', 'error'); return; }
  if (!confirm(`Cancel appointment for ${name}?`)) return;

  queue.splice(idx, 1);
  queue.forEach((q, i) => q.qno = i + 1);

  // ✅ Save updated queue
  saveQueue();

  renderNurseQueue();
  toast(`Appointment for ${name} cancelled.`, 'info');
};