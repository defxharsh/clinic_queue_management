/* =============================================
   Clinic Q— | email.js
   All EmailJS logic — OTP, booking confirm,
   follow-up reminders
   https://www.emailjs.com (free tier: 200/month)
   ============================================= */

const EMAILJS_PUBLIC_KEY         = 'YOUR_PUBLIC_KEY';
const EMAILJS_SERVICE_ID         = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_OTP       = 'YOUR_OTP_TEMPLATE_ID';
const EMAILJS_TEMPLATE_BOOKING   = 'YOUR_BOOKING_TEMPLATE_ID';
const EMAILJS_TEMPLATE_FOLLOWUP  = 'YOUR_FOLLOWUP_TEMPLATE_ID';

function initEmailJS() {
  if (typeof emailjs === 'undefined') {
    console.warn('[EmailJS] SDK not loaded.');
    return;
  }
  if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
    console.warn('[EmailJS] Not configured — demo mode active.');
    return;
  }
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

// ─── OTP ──────────────────────────────────────
let otpStore = { code: null, email: null, expiry: null };

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(toEmail, toName) {
  const otp = generateOTP();
  otpStore  = { code: otp, email: toEmail, expiry: Date.now() + 10 * 60 * 1000 };
  await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_OTP, {
    to_email: toEmail, to_name: toName || 'Patient',
    otp_code: otp, expiry_min: '10', clinic_name: 'Clinic Q—'
  });
}

function verifyOTP(entered, email) {
  if (!otpStore.code)                   return { ok: false, msg: 'No OTP sent. Please request one.' };
  if (Date.now() > otpStore.expiry)     return { ok: false, msg: 'OTP expired. Request a new one.' };
  if (otpStore.email !== email)         return { ok: false, msg: 'Email mismatch. Try again.' };
  if (otpStore.code !== entered.trim()) return { ok: false, msg: 'Incorrect OTP. Check your email.' };
  otpStore = { code: null, email: null, expiry: null };
  return { ok: true };
}

// ─── BOOKING EMAIL ────────────────────────────
async function sendBookingEmail(patient, queuePos, doctorName, spec) {
  if (!patient.email) return;
  await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_BOOKING, {
    to_email: patient.email, to_name: patient.name,
    queue_no: String(queuePos), doctor_name: doctorName,
    specialty: spec, priority: patient.priority,
    est_wait: String(queuePos * 7), booked_time: patient.time,
    clinic_name: 'Clinic Q—'
  });
}

// ─── FOLLOW-UP EMAIL ──────────────────────────
async function sendFollowUpEmail(patientEmail, patientName, doctorName, followUpDate, reason) {
  if (!patientEmail) return;
  await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_FOLLOWUP, {
    to_email: patientEmail, to_name: patientName,
    doctor_name: doctorName, followup_date: followUpDate,
    reason, clinic_name: 'Clinic Q—'
  });
}
