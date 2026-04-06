import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/authStore";
import LoginPage from "./pages/LoginPage";
import MaintenancePage from "./pages/MaintenancePage";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import MainLayout from "./components/shared/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import AttendancePage from "./pages/AttendancePage";
import NotPresentPage from "./pages/NotPresentPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import DevPanelPage from "./pages/DevPanelPage";
import StudentDashboard from "./pages/StudentDashboard";
import ManageKelasPage from "./pages/ManageKelasPage";
import ImportUserPage from "./pages/ImportUserPage";
import ProfilePage from "./pages/ProfilePage";
import HistoryPage from "./pages/HistoryPage";
import RekapBulananPage from "./pages/RekapBulananPage";
import AuditLogPage from "./pages/AuditLogPage";
import LateDataPage from "./pages/LateDataPage";
import RoleGuard from "./components/shared/RoleGuard";
import NotFound from "./pages/NotFound";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated, user, initializing, initAuth, listenMaintenance } = useAuthStore();

  useEffect(() => {
    const unsubAuth = initAuth();
    const unsubMaint = listenMaintenance();
    return () => { unsubAuth(); unsubMaint(); };
  }, [initAuth, listenMaintenance]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={
          user?.role === 'siswa' ? <StudentDashboard /> : <DashboardPage />
        } />
        <Route path="/attendance" element={
          <RoleGuard allowedRoles={['dev', 'kepsek', 'wakel', 'km', 'absensi']}>
            <AttendancePage />
          </RoleGuard>
        } />
        <Route path="/not-present" element={
          <RoleGuard allowedRoles={['dev', 'kepsek', 'wakel', 'km', 'absensi']}>
            <NotPresentPage />
          </RoleGuard>
        } />
        <Route path="/leaderboard" element={
          <RoleGuard allowedRoles={['dev', 'kepsek', 'wakel', 'km', 'absensi']}>
            <LeaderboardPage />
          </RoleGuard>
        } />
        <Route path="/rekap" element={
          <RoleGuard allowedRoles={['dev', 'kepsek', 'wakel', 'km', 'absensi']}>
            <RekapBulananPage />
          </RoleGuard>
        } />
        <Route path="/manage-class" element={
          <RoleGuard allowedRoles={['dev', 'kepsek']}>
            <ManageKelasPage />
          </RoleGuard>
        } />
        <Route path="/import" element={
          <RoleGuard allowedRoles={['dev']}>
            <ImportUserPage />
          </RoleGuard>
        } />
        <Route path="/dev-panel" element={
          <RoleGuard allowedRoles={['dev']}>
            <DevPanelPage />
          </RoleGuard>
        } />
        <Route path="/audit-log" element={
          <RoleGuard allowedRoles={['dev', 'kepsek']}>
            <AuditLogPage />
          </RoleGuard>
        } />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/late-data" element={<LateDataPage />} />
        <Route path="/student-dashboard" element={
          <RoleGuard allowedRoles={['siswa', 'km', 'absensi']} allowStudents>
            <StudentDashboard />
          </RoleGuard>
        } />
        <Route path="/history" element={
          <RoleGuard allowedRoles={['siswa']}>
            <HistoryPage />
          </RoleGuard>
        } />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
