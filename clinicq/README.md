# Clinic Q— | Smart Queue Management System

A role-based clinic queue management website built with HTML, CSS, and JavaScript.

## Project Structure

```
clinicq/
├── index.html          ← Main HTML (all screens)
├── css/
│   └── style.css       ← All styling
└── js/
    ├── utils.js        ← Shared state, constants, helpers
    ├── email.js        ← EmailJS — OTP & email notifications
    ├── auth.js         ← Login, register, forgot password
    ├── patient.js      ← Patient booking dashboard
    ├── nurse.js        ← Nurse queue management
    └── doctor.js       ← Doctor history & follow-ups
```

## Features

- 3 Role-Based Dashboards: Patient, Nurse, Doctor
- Patient registration & login with Gmail
- High-priority queue sorting (urgent patients move to front)
- Forgot Password via OTP email (EmailJS)
- Booking confirmation emails
- Follow-up scheduling with email reminders
- Doctor availability with live progress bars

## Staff Demo Credentials

| Role   | Username | Password   |
|--------|----------|------------|
| Nurse  | nurse    | nurse123   |
| Doctor | doctor   | doctor123  |

Patients register with their Gmail on the Register tab.

---

## EmailJS Setup (Free — 200 emails/month)

Follow these steps to enable real email OTP and notifications.

### Step 1 — Create a free EmailJS account

1. Go to https://www.emailjs.com
2. Click **Sign Up** — it's free, no credit card needed
3. Verify your email

### Step 2 — Add an Email Service

1. In the EmailJS dashboard, click **Email Services** in the left sidebar
2. Click **Add New Service**
3. Choose **Gmail**
4. Click **Connect Account** and sign in with your Gmail
5. Give it a name like `clinic_q_service`
6. Click **Create Service**
7. Copy the **Service ID** (looks like `service_xxxxxxx`) — you'll need this

### Step 3 — Create Template 1: OTP Email

1. Click **Email Templates** → **Create New Template**
2. Set the **Template Name**: `OTP Reset`
3. Set the **Subject**: `Your Clinic Q— Password Reset OTP`
4. In the **Body**, paste this:

```
Hello {{to_name}},

Your OTP for password reset is:

{{otp_code}}

This OTP is valid for {{expiry_min}} minutes.

If you did not request this, please ignore this email.

— {{clinic_name}}
```

5. In the **To Email** field (top right), set it to: `{{to_email}}`
6. Click **Save**
7. Copy the **Template ID** (looks like `template_xxxxxxx`)

### Step 4 — Create Template 2: Booking Confirmation

1. Create another new template
2. **Template Name**: `Booking Confirmation`
3. **Subject**: `Appointment Confirmed — Clinic Q—`
4. **Body**:

```
Hello {{to_name}},

Your appointment has been confirmed!

Queue Number : #{{queue_no}}
Doctor       : {{doctor_name}} ({{specialty}})
Priority     : {{priority}}
Booked At    : {{booked_time}}
Estimated Wait: ~{{est_wait}} minutes

Please arrive at the clinic and wait for your number to be called.

— {{clinic_name}}
```

5. **To Email**: `{{to_email}}`
6. Save and copy the **Template ID**

### Step 5 — Create Template 3: Follow-up Reminder

1. Create another template
2. **Template Name**: `Follow-up Reminder`
3. **Subject**: `Follow-up Appointment Scheduled — Clinic Q—`
4. **Body**:

```
Hello {{to_name}},

Your follow-up appointment has been scheduled.

Doctor : {{doctor_name}}
Date   : {{followup_date}}
Reason : {{reason}}

Please contact the clinic if you need to reschedule.

— {{clinic_name}}
```

5. **To Email**: `{{to_email}}`
6. Save and copy the **Template ID**

### Step 6 — Get Your Public Key

1. In EmailJS dashboard, click your account name (top right)
2. Go to **Account** → **General**
3. Copy your **Public Key** (looks like `aBcDeFgHiJkLmNo`)

### Step 7 — Paste into email.js

Open `js/email.js` and replace the placeholder values:

```javascript
const EMAILJS_PUBLIC_KEY         = 'aBcDeFgHiJkLmNo';       // ← Your public key
const EMAILJS_SERVICE_ID         = 'service_xxxxxxx';        // ← Step 2
const EMAILJS_TEMPLATE_OTP       = 'template_xxxxxxx';       // ← Step 3
const EMAILJS_TEMPLATE_BOOKING   = 'template_yyyyyyy';       // ← Step 4
const EMAILJS_TEMPLATE_FOLLOWUP  = 'template_zzzzzzz';       // ← Step 5
```

Save the file. That's it — emails will now work!

---

## Running Without EmailJS (Demo Mode)

If EmailJS is not configured, the app runs in **demo mode**:
- Forgot password OTP will be shown directly in a popup toast notification on screen
- Booking and follow-up emails will silently fail (no crash)
- Everything else works normally

---

## How to Run

Just open `index.html` in any browser — no server needed.

For GitHub Pages: push the folder and enable GitHub Pages on the `main` branch.
