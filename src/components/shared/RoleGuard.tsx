import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  allowStudents?: boolean; // allow any user with isStudent=true
}

const RoleGuard = ({ children, allowedRoles = [], allowStudents }: RoleGuardProps) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  const roleAllowed = allowedRoles.includes(user.role);
  const studentAllowed = allowStudents && user.isStudent;

  if (!roleAllowed && !studentAllowed) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export default RoleGuard;
