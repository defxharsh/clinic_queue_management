/* =============================================
   Clinic Q— | auth.js
   Login, Register (with security question),
   Forgot Password via security answer
   Zero API — pure localStorage
   ============================================= */

// ─── STAFF CREDENTIALS ────────────────────────
const STAFF_CREDS = {
  nurse:  { password: 'nurse123',  role: 'nurse'  },
  doctor: { password: 'doctor123', role: 'doctor' }
};

// ─── SECURITY QUESTIONS LIST ──────────────────
const SECURITY_QUESTIONS = [
  "What is your mother's middle name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was the name of your first school?",
  "What is your favourite childhood movie?",
  "What is your oldest sibling's middle name?",
  "What street did you grow up on?",
  "What was your childhood nickname?"
];

// ─── LOCALSTORAGE ─────────────────────────────
const PATIENTS_KEY = 'clinicq_patients_v3';

function getPatients() {
  try { return JSON.parse(localStorage.getItem(PATIENTS_KEY)) || {}; }
  catch { return {}; }
}
function savePatients(p) {
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(p));
}

// ─── FORGOT PASSWORD STATE ────────────────────
let fpEmail = '';
let fpStep  = 1;

// ─── POPULATE SECURITY QUESTION DROPDOWNS ─────
function populateSecurityQuestions() {
  const regSel = document.getElementById('regSecQ');
  const fpSel  = document.getElementById('fpSecQ');

  SECURITY_QUESTIONS.forEach((q, i) => {
    const opt1 = `<option value="${i}">${q}</option>`;
    if (regSel) regSel.innerHTML += opt1;
  });
}

// ─── AUTH TAB SWITCHER ────────────────────────
function showAuthTab(tab) {
  ['loginPanel','registerPanel','forgotPanel'].forEach(id => hide(id));
  ['tabLogin','tabRegister'].forEach(id =>
    document.getElementById(id)?.classList.remove('active')
  );

  if (tab === 'login') {
    show('loginPanel');
    document.getElementById('tabLogin').classList.add('active');
  } else if (tab === 'register') {
    show('registerPanel');
    document.getElementById('tabRegister').classList.add('active');
  } else if (tab === 'forgot') {
    show('forgotPanel');
    showForgotStep(1);
  }

  // Clear all errors
  ['loginErr','regErr','fpErr'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

// ─── LOGIN ────────────────────────────────────
function attemptLogin() {
  const username = document.getElementById('loginUser').value.trim().toLowerCase();
  const password = document.getElementById('loginPass').value;
  const errEl    = document.getElementById('loginErr');
  errEl.textContent = '';

  if (!username) { errEl.textContent = 'Please enter your email or username.'; return; }

  // Staff check
  if (STAFF_CREDS[username]) {
    if (STAFF_CREDS[username].password === password) {
      launchApp(STAFF_CREDS[username].role, null);
    } else {
      errEl.textContent = 'Wrong password for staff account.';
    }
    return;
  }

  // Patient check
  const patients = getPatients();
  const patient  = patients[username];
  if (!patient)                    { errEl.textContent = 'No account found. Please register first.'; return; }
  if (patient.password !== password) { errEl.textContent = 'Wrong password. Use "Forgot Password" below.'; return; }

  launchApp('patient', patient);
}

// ─── REGISTER ─────────────────────────────────
function attemptRegister() {
  const name    = document.getElementById('regName').value.trim();
  const email   = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass    = document.getElementById('regPass').value;
  const pass2   = document.getElementById('regPass2').value;
  const secQIdx = document.getElementById('regSecQ').value;
  const secAns  = document.getElementById('regSecAns').value.trim();
  const errEl   = document.getElementById('regErr');
  errEl.textContent = '';

  // Validation
  if (!name)   { errEl.textContent = 'Please enter your full name.';       return; }
  if (!email || !email.includes('@')) { errEl.textContent = 'Enter a valid email address.'; return; }
  if (!pass)   { errEl.textContent = 'Please create a password.';          return; }
  if (pass.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }
  if (pass !== pass2)  { errEl.textContent = 'Passwords do not match.';    return; }
  if (secQIdx === '')  { errEl.textContent = 'Please select a security question.'; return; }
  if (!secAns) { errEl.textContent = 'Please enter your security answer.'; return; }
  if (secAns.length < 2) { errEl.textContent = 'Security answer is too short.'; return; }

  const patients = getPatients();
  if (patients[email]) { errEl.textContent = 'This email is already registered. Please sign in.'; return; }

  // Save patient with security question
  patients[email] = {
    name,
    email,
    password: pass,
    securityQuestion: SECURITY_QUESTIONS[parseInt(secQIdx)],
    securityAnswer:   secAns.toLowerCase().trim(), // store lowercase for easy matching
    registeredAt: new Date().toISOString()
  };
  savePatients(patients);

  toast(`Account created for ${name}! Please sign in.`, 'success');
  showAuthTab('login');
  document.getElementById('loginUser').value = email;
  document.getElementById('loginPass').value  = '';
}

// ─── GUEST ────────────────────────────────────
function continueAsGuest() { launchApp('guest', null); }

// ─── FORGOT PASSWORD — 3 STEPS ────────────────

function showForgotStep(step) {
  fpStep = step;
  [1, 2, 3].forEach(n => {
    document.getElementById(`fpStep${n}`)?.classList.add('hidden');
  });
  document.getElementById(`fpStep${step}`)?.classList.remove('hidden');

  // Update step dots
  [1, 2, 3].forEach(n => {
    const dot = document.getElementById(`fpDot${n}`);
    if (dot) dot.classList.toggle('active', n <= step);
  });

  const errEl = document.getElementById('fpErr');
  if (errEl) errEl.textContent = '';
}

// Step 1 — Enter email, show security question
function fpCheckEmail() {
  const email = document.getElementById('fpEmail').value.trim().toLowerCase();
  const errEl = document.getElementById('fpErr');
  errEl.textContent = '';

  if (!email || !email.includes('@')) {
    errEl.textContent = 'Please enter a valid email address.';
    return;
  }

  const patients = getPatients();
  const patient  = patients[email];

  if (!patient) {
    errEl.textContent = 'No account found with this email.';
    return;
  }

  if (!patient.securityQuestion) {
    errEl.textContent = 'This account has no security question set. Please contact support.';
    return;
  }

  // Store email for next steps
  fpEmail = email;

  // Show the security question in step 2
  document.getElementById('fpQuestionText').textContent = patient.securityQuestion;
  document.getElementById('fpSecAns').value = '';
  showForgotStep(2);
}

// Step 2 — Verify security answer
function fpVerifyAnswer() {
  const answer  = document.getElementById('fpSecAns').value.trim().toLowerCase();
  const errEl   = document.getElementById('fpErr');
  errEl.textContent = '';

  if (!answer) { errEl.textContent = 'Please enter your security answer.'; return; }

  const patients = getPatients();
  const patient  = patients[fpEmail];

  if (!patient) { errEl.textContent = 'Something went wrong. Please start over.'; showForgotStep(1); return; }

  if (patient.securityAnswer !== answer) {
    errEl.textContent = 'Incorrect answer. Please try again.';
    // Shake animation on input
    const inp = document.getElementById('fpSecAns');
    inp.style.borderColor = 'var(--red)';
    setTimeout(() => inp.style.borderColor = '', 1500);
    return;
  }

  // Correct! Move to step 3
  toast('Answer verified! Set your new password.', 'success');
  showForgotStep(3);
}

// Step 3 — Set new password
function fpResetPassword() {
  const newPass  = document.getElementById('fpNewPass').value;
  const newPass2 = document.getElementById('fpNewPass2').value;
  const errEl    = document.getElementById('fpErr');
  errEl.textContent = '';

  if (!newPass)             { errEl.textContent = 'Please enter a new password.'; return; }
  if (newPass.length < 6)   { errEl.textContent = 'Password must be at least 6 characters.'; return; }
  if (newPass !== newPass2) { errEl.textContent = 'Passwords do not match.'; return; }

  const patients = getPatients();
  if (!patients[fpEmail]) { errEl.textContent = 'Something went wrong. Please start over.'; showForgotStep(1); return; }

  // Update password
  patients[fpEmail].password = newPass;
  savePatients(patients);

  toast('🎉 Password reset successfully! Please sign in.', 'success');
  showAuthTab('login');
  document.getElementById('loginUser').value = fpEmail;
  document.getElementById('loginPass').value  = '';
  fpEmail = '';
}

// ─── LAUNCH APP ───────────────────────────────
function launchApp(role, user) {
  currentRole = role;
  currentUser = user;

  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('mainApp').classList.remove('hidden');

  const pill     = document.getElementById('rolePill');
  const userSpan = document.getElementById('topbarUser');

  const config = {
    patient: { text:'Patient', cls:'rp-patient', label: user ? `👤 ${user.name}` : '', init: initPatientDashboard, dash:'dPatient' },
    guest:   { text:'Guest',   cls:'rp-guest',   label: '',                              init: initPatientDashboard, dash:'dPatient' },
    nurse:   { text:'Nurse',   cls:'rp-nurse',   label: '🩺 Staff',                      init: initNurseDashboard,   dash:'dNurse'   },
    doctor:  { text:'Doctor',  cls:'rp-doctor',  label: '👨‍⚕️ Staff',                     init: initDoctorDashboard,  dash:'dDoctor'  }
  };

  const c = config[role];
  pill.textContent     = c.text;
  pill.className       = `role-pill ${c.cls}`;
  userSpan.textContent = c.label;
  c.init();
  show(c.dash);
}

// ─── EVENT LISTENERS ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initEmailJS();
  populateSecurityQuestions();

  document.getElementById('staffLoginBtn').addEventListener('click', attemptLogin);
  document.getElementById('registerBtn').addEventListener('click', attemptRegister);
  document.getElementById('patientGuestBtn').addEventListener('click', continueAsGuest);
  document.getElementById('exitBtn').addEventListener('click', () => location.reload());

  // Enter key shortcuts
  document.getElementById('loginPass').addEventListener('keydown',  e => { if (e.key === 'Enter') attemptLogin(); });
  document.getElementById('regPass2').addEventListener('keydown',   e => { if (e.key === 'Enter') attemptRegister(); });
  document.getElementById('fpEmail').addEventListener('keydown',    e => { if (e.key === 'Enter') fpCheckEmail(); });
  document.getElementById('fpSecAns').addEventListener('keydown',   e => { if (e.key === 'Enter') fpVerifyAnswer(); });
  document.getElementById('fpNewPass2').addEventListener('keydown', e => { if (e.key === 'Enter') fpResetPassword(); });

  // Forgot password buttons
  document.getElementById('fpStep1Btn').addEventListener('click', fpCheckEmail);
  document.getElementById('fpStep2Btn').addEventListener('click', fpVerifyAnswer);
  document.getElementById('fpStep3Btn').addEventListener('click', fpResetPassword);
});
