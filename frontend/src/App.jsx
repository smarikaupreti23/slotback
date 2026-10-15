import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import CancelSlotPage from './pages/CancelSlotPage'
import WaitlistPage from './pages/WaitlistPage'
import ConfirmationPage from './pages/ConfirmationPage'
import TopNav from './components/TopNav'
import { getToken } from './lib/api'

// Screens 2-4 require a signed-in coordinator and show the top nav.
function ProtectedLayout() {
  const location = useLocation()
  if (!getToken()) return <Navigate to="/login" replace state={{ from: location }} />
  return (
    <>
      <TopNav />
      <Outlet />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/cancel"    element={<CancelSlotPage />} />
          <Route path="/waitlist"  element={<WaitlistPage />} />
          <Route path="/confirmed" element={<ConfirmationPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
