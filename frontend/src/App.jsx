import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth, ROLE_HOME } from './store/auth';
import useTheme from './hooks/useTheme';
import Home from './pages/public/Home';
import PGDetails from './pages/public/PGDetails';
import BookingRegister from './pages/public/BookingRegister';
import Payment from './pages/public/Payment';
import Login from './pages/public/Login';
import OwnerSignup from './pages/public/OwnerSignup';
import UserPortal from './pages/user/UserPortal';
import OwnerPortal from './pages/owner/OwnerPortal';
import SuperAdminPortal from './pages/superadmin/SuperAdminPortal';

function RequireRole({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return children;
}

export default function App() {
  useTheme(); // apply saved light/dark theme on every page
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pg/:id" element={<PGDetails />} />
      <Route path="/book/:pgId" element={<BookingRegister />} />
      <Route path="/payment/:bookingId" element={<Payment />} />
      <Route path="/login" element={<Login />} />
      <Route path="/owner-signup" element={<OwnerSignup />} />
      <Route path="/user/*" element={<RequireRole role="user"><UserPortal /></RequireRole>} />
      <Route path="/owner/*" element={<RequireRole role="owner"><OwnerPortal /></RequireRole>} />
      <Route path="/super-admin/*" element={<RequireRole role="superadmin"><SuperAdminPortal /></RequireRole>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
