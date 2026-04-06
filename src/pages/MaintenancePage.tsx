import { useAuthStore } from '@/store/authStore';
import { Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const formatSchedule = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const MaintenancePage = () => {
  const { maintenance } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full gradient-warning opacity-5 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-12 text-center max-w-md mx-4"
      >
        <div className="w-16 h-16 rounded-2xl gradient-warning flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-[hsl(var(--warning-foreground))]" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Maintenance</h1>
        <p className="text-muted-foreground">{maintenance.message}</p>

        {maintenance.scheduledEnd && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-3 rounded-xl bg-[hsl(var(--warning)/0.08)] border border-[hsl(var(--warning)/0.2)]"
          >
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock size={14} className="text-[hsl(var(--warning))]" />
              <span>Estimasi selesai: {formatSchedule(maintenance.scheduledEnd)}</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default MaintenancePage;
