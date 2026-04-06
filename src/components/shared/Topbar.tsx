import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { ROLE_LABELS } from '@/types';
import NotificationPanel from './NotificationPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';

const formatSchedule = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const Topbar = () => {
  const { user, maintenance } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  if (!user) return null;

  const initials = user.nama_lengkap
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const showBanner = maintenance.scheduledAt && !bannerDismissed && !maintenance.enabled;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden sticky top-0 z-30">
            <div className="bg-warning/[0.12] border-b border-warning/20 px-4 py-2.5 flex items-center justify-center gap-3">
              <AlertTriangle size={14} className="text-warning flex-shrink-0" />
              <p className="text-xs text-foreground text-center">
                <span className="font-semibold">Maintenance terjadwal:</span>{' '}
                {formatSchedule(maintenance.scheduledAt)}
                {maintenance.scheduledEnd && <> — {formatSchedule(maintenance.scheduledEnd)}</>}
              </p>
              <button onClick={() => setBannerDismissed(true)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-16 border-b border-border bg-card/30 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-4 md:px-6">
        <div className="pl-12 md:pl-0">
          <h2 className="text-sm font-semibold text-foreground">Selamat datang,</h2>
          <p className="text-xs text-muted-foreground">{user.nama_lengkap}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <NotificationPanel />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user.nama_lengkap}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}{user.kelas ? ` · ${user.kelas}` : ''}</p>
            </div>
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">{initials}</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Topbar;
