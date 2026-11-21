import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PatientHomePage } from '@/pages/patient/PatientHomePage'
import { FindDoctorsPage } from '@/pages/patient/FindDoctorsPage'
import { BookAppointmentPage } from '@/pages/patient/BookAppointmentPage'
import { MyAppointmentsPage } from '@/pages/patient/MyAppointmentsPage'
import { PatientProfilePage } from '@/pages/patient/PatientProfilePage'
import { DoctorHomePage } from '@/pages/doctor/DoctorHomePage'
import { DoctorAppointmentsPage } from '@/pages/doctor/DoctorAppointmentsPage'
import { DoctorAvailabilityPage } from '@/pages/doctor/DoctorAvailabilityPage'
import { DoctorTimeOffPage } from '@/pages/doctor/DoctorTimeOffPage'
import { DoctorProfilePage } from '@/pages/doctor/DoctorProfilePage'
import { AdminHomePage } from '@/pages/admin/AdminHomePage'
import { AdminDoctorsPage } from '@/pages/admin/AdminDoctorsPage'
import { AdminDepartmentsPage } from '@/pages/admin/AdminDepartmentsPage'
import { AdminAppointmentsPage } from '@/pages/admin/AdminAppointmentsPage'
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute allow={['patient']} />}>
          <Route path="/patient" element={<AppShell />}>
            <Route index element={<PatientHomePage />} />
            <Route path="doctors" element={<FindDoctorsPage />} />
            <Route path="book/:doctorId" element={<BookAppointmentPage />} />
            <Route path="appointments" element={<MyAppointmentsPage />} />
            <Route path="profile" element={<PatientProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allow={['doctor']} />}>
          <Route path="/doctor" element={<AppShell />}>
            <Route index element={<DoctorHomePage />} />
            <Route path="appointments" element={<DoctorAppointmentsPage />} />
            <Route path="availability" element={<DoctorAvailabilityPage />} />
            <Route path="time-off" element={<DoctorTimeOffPage />} />
            <Route path="profile" element={<DoctorProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allow={['admin']} />}>
          <Route path="/admin" element={<AppShell />}>
            <Route index element={<AdminHomePage />} />
            <Route path="doctors" element={<AdminDoctorsPage />} />
            <Route path="departments" element={<AdminDepartmentsPage />} />
            <Route path="appointments" element={<AdminAppointmentsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        <Route path="/app" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
