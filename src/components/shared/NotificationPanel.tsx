import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, AlertTriangle, Info, CheckCircle2, XCircle, X, Sparkles } from 'lucide-react';
import { useNotificationStore, type Notification } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

const typeConfig: Record<Notification['type'], { icon: React.ElementType; gradient: string; glow: string }> = {
  info: {
    icon: Info,
    gradient: 'from-[hsl(var(--info))] to-[hsl(217,80%,50%)]',
    glow: 'shadow-[0_0_12px_hsl(var(--info)/0.3)]',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-[hsl(var(--warning))] to-[hsl(25,90%,50%)]',
    glow: 'shadow-[0_0_12px_hsl(var(--warning)/0.3)]',
  },
  success: {
    icon: CheckCircle2,
    gradient: 'from-[hsl(var(--success))] to-[hsl(160,60%,45%)]',
    glow: 'shadow-[0_0_12px_hsl(var(--success)/0.3)]',
  },
  error: {
    icon: XCircle,
    gradient: 'from-[hsl(var(--destructive))] to-[hsl(330,80%,55%)]',
    glow: 'shadow-[0_0_12px_hsl(var(--destructive)/0.3)]',
  },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  return `${days}h lalu`;
}

const NotificationPanel = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { markAsRead, markAllAsRead, removeNotification, clearAll, getForRole, unreadCountForRole, listenForRole } = useNotificationStore();

  const role = user?.role;
  const notifications = role ? getForRole(role) : [];
  const count = role ? unreadCountForRole(role) : 0;

  // Subscribe to Firestore notifications for current role
  useEffect(() => {
    if (!role) return;
    const unsub = listenForRole(role);
    return () => unsub();
  }, [role, listenForRole]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!role) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="group relative w-10 h-10 rounded-xl bg-secondary/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-secondary transition-all duration-300"
      >
        <Bell size={18} className="group-hover:rotate-12 transition-transform duration-300" />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background"
            >
              {count > 9 ? '9+' : count}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:hidden"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="fixed inset-x-3 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-14 sm:w-[400px] max-h-[75vh] bg-card/95 backdrop-blur-2xl border border-border/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 flex flex-col"
            >
              {/* Header */}
              <div className="relative p-4 border-b border-border/50">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                      <Sparkles size={14} className="text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Notifikasi</h3>
                      <p className="text-[10px] text-muted-foreground">
                        {count > 0 ? `${count} belum dibaca` : 'Semua sudah dibaca'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {count > 0 && (
                      <button
                        onClick={() => markAllAsRead(role)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                        title="Tandai semua dibaca"
                      >
                        <CheckCheck size={15} />
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={() => clearAll(role)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                        title="Hapus semua"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => setOpen(false)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 sm:hidden"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                      <Bell size={24} className="text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground/60">Tidak ada notifikasi</p>
                    <p className="text-[11px] text-muted-foreground/40 mt-1">Kamu sudah up to date! ✨</p>
                  </div>
                ) : (
                  notifications.map((n, i) => {
                    const cfg = typeConfig[n.type];
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        className={`group relative flex gap-3 p-3 mx-2 my-0.5 rounded-xl cursor-pointer transition-all duration-200 ${
                          n.read
                            ? 'opacity-60 hover:opacity-100 hover:bg-secondary/40'
                            : 'bg-primary/[0.04] hover:bg-primary/[0.08] border border-transparent hover:border-primary/10'
                        }`}
                        onClick={() => !n.read && markAsRead(n.id)}
                      >
                        {/* Unread indicator line */}
                        {!n.read && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full gradient-primary" />
                        )}

                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0 ${!n.read ? cfg.glow : ''}`}>
                          <Icon size={16} className="text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-semibold leading-tight ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {n.title}
                            </p>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <p className={`text-[11px] leading-relaxed mt-0.5 line-clamp-2 ${n.read ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                            {n.message}
                          </p>
                          <span className="text-[10px] text-muted-foreground/40 mt-1.5 block">{timeAgo(n.timestamp)}</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-border/50">
                  <p className="text-[10px] text-center text-muted-foreground/40">
                    {notifications.length} notifikasi · {count} belum dibaca
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPanel;
