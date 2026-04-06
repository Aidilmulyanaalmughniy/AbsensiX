import { motion } from 'framer-motion';
import { useAuditLog } from '@/hooks/useAuditLog';
import { ROLE_LABELS, type UserRole } from '@/types';
import { ScrollText, Loader2, Clock } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  'login': 'badge-hadir',
  'logout': 'badge-belum',
  'update_status': 'badge-izin',
  'add_user': 'badge-hadir',
  'delete_user': 'badge-alpha',
  'reset_password': 'badge-sakit',
  'toggle_maintenance': 'badge-sakit',
  'export': 'badge-izin',
};

const AuditLogPage = () => {
  const { entries, loading } = useAuditLog(100);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">Catatan aktivitas sistem</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <ScrollText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Belum ada aktivitas tercatat</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {entries.map((entry, i) => (
              <motion.div key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                className="px-4 py-3 hover:bg-secondary/20 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={ACTION_COLORS[entry.action] || 'badge-belum'}>{entry.action}</span>
                      <span className="text-sm font-medium text-foreground">{entry.actor}</span>
                      <span className="text-xs text-muted-foreground">({ROLE_LABELS[entry.actorRole as UserRole] || entry.actorRole})</span>
                    </div>
                    {entry.target && <p className="text-xs text-muted-foreground mt-1">Target: {entry.target}</p>}
                    {entry.details && <p className="text-xs text-muted-foreground/70 mt-0.5">{entry.details}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                    <Clock size={10} />
                    {entry.timestamp.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} {entry.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AuditLogPage;
