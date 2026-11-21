# MediBook: Hospital & Clinic Appointment System

## Overview

MediBook is a web application where patients book appointments with doctors in available time slots, doctors manage their schedules and appointments, and admins manage doctors, departments and reports. It removes phone-based booking and queue confusion for small hospitals and clinics. Patients get automatic email reminders before their appointment, which reduces no-shows. Built as a B.Tech CSE final year project.

## Goals

1. A patient can find a doctor and book a slot in 4 steps or fewer
2. Double booking of a doctor's slot is impossible, enforced at the database level
3. Patients, doctors and admins each see only the data they are allowed to see
4. Patients receive an email reminder about 24 hours before every confirmed appointment
5. Admin can view reports: appointments per doctor, per day, cancellation rate and busiest hours

## Core User Flow

1. Patient registers and signs in
2. Patient browses doctors by department or specialization
3. Patient picks a doctor and a date, and sees the free slots
4. Patient books a slot; the appointment starts as `pending`
5. Doctor confirms or rejects it from the doctor dashboard
6. Patient gets a confirmation email, then a reminder 24 hours before
7. After the visit, doctor marks the appointment `completed` and can add notes
8. Admin reviews reports and manages doctors and departments

## Features

### Authentication and Roles

- Email and password sign up and login through Supabase Auth
- Three roles: patient, doctor, admin
- Protected routes per role

### Doctor and Department Management

- Admin creates departments and doctor accounts
- Doctor profile: specialization, fees, bio, photo
- Patients can search and filter doctors by department and name

### Availability and Slots

- Doctor sets weekly availability (weekday, start time, end time, slot duration)
- Doctor can block specific dates (leave or holiday)
- Free slots are calculated from availability minus booked appointments

### Appointment Booking

- Patient books, views and cancels own appointments
- Doctor confirms, rejects, completes and adds notes
- Status flow: pending, confirmed, completed, cancelled, rejected
- Live slot updates so a slot disappears once someone books it

### Notifications

- Email on booking, confirmation and cancellation
- Scheduled reminder email 24 hours before the appointment
- Every sent notification is logged to prevent duplicates

### Reports (Admin)

- Appointments per doctor and per day
- Cancellation rate
- Busiest hours and departments
- Charts and a table view

## Scope

### In Scope

- Patient, doctor and admin dashboards
- Slot booking with double-booking prevention
- Email reminders
- Admin reports with charts
- Deployed live demo, ER diagram and project report

### Out of Scope

- Online payments
- Video consultation
- Mobile app
- Multi-hospital or multi-branch support
- Insurance and billing
- SMS reminders (stretch goal after email works)
- Prescriptions and medical records (stretch goal)

## Success Criteria

1. A new patient can register, book a slot and see it on their dashboard
2. Two users trying to book the same slot at the same time: only one succeeds
3. A doctor sees only their own appointments, and a patient sees only their own
4. A confirmed appointment tomorrow triggers exactly one reminder email
5. Admin dashboard shows correct counts that match the database
6. The app is deployed and works on mobile screen sizes
