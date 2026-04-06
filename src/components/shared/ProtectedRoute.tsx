import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, maintenance, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (maintenance.enabled && user?.role !== 'dev') return <Navigate to="/maintenance" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
