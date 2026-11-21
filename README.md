<div align="center">

# 🏥 MediBook

### Hospital & Clinic Appointment System

Book doctor appointments online, manage schedules, and cut no-shows with automatic email reminders.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Status](https://img.shields.io/badge/status-in%20development-orange)

[Live Demo](#) · [Report a Bug](../../issues) · [Request a Feature](../../issues)

</div>

---

## 📖 About

MediBook is a full-stack web application that replaces phone-based appointment booking in small hospitals and clinics. Patients find a doctor, pick a free time slot and book in a few clicks. Doctors manage their own availability and appointments. Admins manage doctors and departments and view reports.

The system guarantees that **a time slot can never be double booked**, and it sends **automatic email reminders** 24 hours before each appointment.

> Built as a B.Tech Computer Science final year project at GEC Autonomous College, Bhubaneswar.

## ✨ Features

### 👤 Patient
- Register, log in and manage profile
- Search doctors by name, department or specialization
- View free slots for a chosen date and book instantly
- View upcoming and past appointments, and cancel when needed
- Email confirmation and reminder before the visit

### 🩺 Doctor
- Set weekly availability and slot duration
- Block dates for leave or holidays
- Confirm, reject or complete appointments
- Add notes after a visit

### 🛠️ Admin
- Create and manage departments and doctor accounts
- View all appointments
- Reports: appointments per doctor and per day, cancellation rate, busiest hours
- Dashboard with charts

### ⚙️ System
- Role-based access (patient, doctor, admin) enforced with Row Level Security
- Database-level double-booking prevention
- Live slot updates with Supabase Realtime
- Scheduled reminder emails with `pg_cron` and Edge Functions
- Responsive layout that works from 360px mobile screens up

## 🧰 Tech Stack

| Layer          | Technology                                   |
| -------------- | -------------------------------------------- |
| Frontend       | React 18, Vite, TypeScript                   |
| Styling        | Tailwind CSS, shadcn/ui, Lucide icons        |
| Routing        | React Router                                 |
| Data fetching  | TanStack Query, supabase-js                  |
| Forms          | React Hook Form, Zod                         |
| Charts         | Recharts                                     |
| Backend        | Supabase (Auth, Postgres, Realtime, Storage) |
| Server code    | Supabase Edge Functions (Deno)               |
| Scheduling     | pg_cron                                      |
| Email          | Resend                                       |
| Hosting        | Vercel (frontend), Supabase Cloud            |

## 🏗️ How It Works

```
 React App ──► Supabase Auth ──► JWT with user role
     │
     ├──► Supabase Postgres (RLS policies decide who sees what)
     │         └─ unique index prevents double booking
     │
     ├──► Supabase Realtime (live slot updates)
     │
 pg_cron (hourly) ──► Edge Function ──► Resend ──► Patient email
```

Free slots are **calculated** from the doctor's availability rules, time off and existing appointments, so no slot rows need to be stored or cleaned up.

## 🗄️ Database Design

| Table                | Purpose                                                        |
| -------------------- | -------------------------------------------------------------- |
| `profiles`           | Every user: name, phone, role (`patient`, `doctor`, `admin`)   |
| `departments`        | Hospital departments                                           |
| `doctors`            | Doctor details: department, specialization, fees, bio          |
| `doctor_availability`| Weekly working hours and slot length per doctor                |
| `doctor_time_off`    | Dates a doctor is unavailable                                  |
| `appointments`       | Bookings with date, time, status and notes                     |
| `notifications_log`  | Record of sent emails to prevent duplicate reminders           |

**Appointment status flow:** `pending` → `confirmed` → `completed` (or `cancelled` / `rejected`)

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or newer
- A free [Supabase](https://supabase.com) account
- A free [Resend](https://resend.com) account (for emails)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/medibook.git
cd medibook
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> Only the **anon** key goes in the frontend. Never put the service role key or the Resend key here.

### 4. Set up the database

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

This applies all migration files in `supabase/migrations/`, including tables, the unique index and RLS policies.

### 5. Deploy the Edge Functions and set secrets

```bash
supabase secrets set RESEND_API_KEY=your-resend-key CRON_SECRET=your-random-secret
supabase functions deploy send-appointment-email
supabase functions deploy send-reminders
```

### 6. Create the first admin

Sign up through the app, then in the Supabase SQL editor run:

```sql
update profiles set role = 'admin' where id = '<your-user-id>';
```

### 7. Run the app

```bash
npm run dev
```

Open `http://localhost:5173`.

## 📜 Available Scripts

| Command           | What it does                    |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start the development server    |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview the production build    |
| `npm run lint`    | Run the linter                  |

## 📁 Project Structure

```
medibook/
├── src/
│   ├── pages/            # Route-level screens
│   ├── features/         # auth, doctors, availability, appointments, reports
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   └── layout/       # Sidebar, navbar, dashboard shell
│   ├── lib/              # Supabase client, query client, utilities
│   └── types/            # Shared and generated types
├── supabase/
│   ├── migrations/       # SQL schema, indexes, RLS policies
│   └── functions/        # Edge Functions (emails, reminders)
├── docs/                 # Project context and design notes
└── README.md
```

## 🔒 Security

- Row Level Security on every table: patients see only their own appointments, doctors only theirs, admins everything
- Users cannot change their own role
- Secrets live only in Edge Function environment variables
- Double-booking is blocked by a database constraint, not just the UI

## 🗺️ Roadmap

- [ ] Project setup (Vite, Tailwind, shadcn/ui, Supabase client)
- [ ] Authentication and role-based routes
- [ ] Departments and doctor management
- [ ] Doctor availability and time off
- [ ] Slot generation and booking
- [ ] Patient and doctor dashboards
- [ ] Realtime slot updates
- [ ] Email notifications
- [ ] 24-hour reminder job
- [ ] Admin reports and charts
- [ ] Deployment and documentation

**Future ideas:** SMS reminders, prescriptions and medical records, online payments, video consultation.


## 🤝 Contributing

This is an academic project, but suggestions are welcome. Open an issue to discuss a change, or fork the repo and submit a pull request.

## 👨‍💻 Author

**Rakesh Rout**
B.Tech CSE, GEC Autonomous College, Bhubaneswar


## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

---

<div align="center">

⭐ If you find this project useful, consider giving it a star.

</div>
