import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * Wraps protected routes. Redirects to /login if no token is present.
 */
export default function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
