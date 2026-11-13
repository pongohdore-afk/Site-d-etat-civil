import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { AppointmentPage } from '@/pages/AppointmentPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TrackingPage } from '@/pages/TrackingPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { AdminPortalPage } from '@/pages/AdminPortalPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin routes (no public layout) */}
          <Route path="/admin-portal/login" element={<AdminLoginPage />} />
          <Route path="/admin-portal" element={<AdminPortalPage />} />

          {/* Public + citizen routes (with layout) */}
          <Route
            path="*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/rendez-vous" element={<AppointmentPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/suivi" element={<TrackingPage />} />
                  <Route path="/suivi/:trackingId" element={<TrackingPage />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
