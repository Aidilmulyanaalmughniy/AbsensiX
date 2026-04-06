import { useState } from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';
import {
  LayoutDashboard, ClipboardList, UserX, School, Users, Upload,
  Settings, ChevronLeft, ChevronRight, LogOut, Trophy, User as UserIcon,
  CalendarDays, ScrollText, UserCog, Menu, X, AlertTriangle,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: UserRole[];
  requireStudent?: boolean;
  requireOsis?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['dev', 'kepsek', 'wakel', 'km', 'absensi'] },
  { label: 'Data Absensi', path: '/attendance', icon: ClipboardList, roles: ['dev', 'kepsek', 'wakel', 'km', 'absensi'] },
  { label: 'Belum Absen', path: '/not-present', icon: UserX, roles: ['dev', 'kepsek', 'wakel', 'km', 'absensi'] },
  { label: 'Leaderboard', path: '/leaderboard', icon: Trophy, roles: ['dev', 'kepsek', 'wakel', 'km', 'absensi'] },
  { label: 'Rekap Bulanan', path: '/rekap', icon: CalendarDays, roles: ['dev', 'kepsek', 'wakel', 'km', 'absensi'] },
  { label: 'Data Terlambat', path: '/late-data', icon: AlertTriangle, roles: ['dev'], requireOsis: true },
  { label: 'Manage Kelas', path: '/manage-class', icon: School, roles: ['dev', 'kepsek'] },
  { label: 'Import User', path: '/import', icon: Upload, roles: ['dev'] },
  { label: 'Developer Panel', path: '/dev-panel', icon: Settings, roles: ['dev'] },
  { label: 'Audit Log', path: '/audit-log', icon: ScrollText, roles: ['dev', 'kepsek'] },
  { label: 'Dashboard Siswa', path: '/student-dashboard', icon: UserIcon, roles: ['siswa', 'km', 'absensi'], requireStudent: true },
  { label: 'Riwayat', path: '/history', icon: ClipboardList, roles: ['siswa'] },
  { label: 'Profil', path: '/profile', icon: UserCog, roles: ['dev', 'kepsek', 'wakel', 'km', 'absensi', 'siswa'] },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();

  if (!user) return null;

  const filteredItems = NAV_ITEMS.filter(item => {
    if (item.requireOsis && user.isOsis) return true;
    if (item.requireOsis && !item.roles.includes(user.role)) return false;
    if (item.requireStudent && user.isStudent && !item.roles.includes(user.role)) return true;
    return item.roles.includes(user.role);
  });

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border justify-between">
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="ml-3 font-bold text-foreground text-lg tracking-tight whitespace-nowrap overflow-hidden"
              >
                AbsensiX
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {filteredItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <RouterNavLink key={item.path} to={item.path} onClick={() => isMobile && setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: (collapsed && !isMobile) ? 0 : 4 }}
                className={`sidebar-item ${active ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
              >
                <item.icon size={20} className="flex-shrink-0" />
                <AnimatePresence>
                  {(!collapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </RouterNavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button onClick={logout} className="sidebar-item sidebar-item-inactive w-full">
          <LogOut size={20} className="flex-shrink-0" />
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                Keluar
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-item sidebar-item-inactive w-full"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                  Tutup
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-card border border-border text-foreground md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] z-50 flex flex-col bg-sidebar border-r border-sidebar-border md:hidden"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="h-screen sticky top-0 hidden md:flex flex-col bg-sidebar border-r border-sidebar-border z-30"
      >
        {sidebarContent(false)}
      </motion.aside>
    </>
  );
};

export default AppSidebar;
