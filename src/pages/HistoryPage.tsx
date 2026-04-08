import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useAttendance } from '@/hooks/useFirestore';
import { Calendar, Clock, TrendingUp, UserCheck, Filter, Loader2 } from 'lucide-react';
import type { AttendanceStatus } from '@/types';

const STATUS_BADGE: Record<AttendanceStatus, string> = {
  hadir: 'badge-hadir', sakit: 'badge-sakit', izin: 'badge-izin', alpha: 'badge-alpha', belum: 'badge-belum',
};

const HistoryPage = () => {
  const { user } = useAuthStore();
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterStatus, setFilterStatus] = useState<string>('');

  const { records: allRecords, loading } = useAttendance(undefined, undefined, user?.uid);

const myRecords = useMemo(() => {
  let records = [...allRecords]; // ✅ FIX DI SINI

  if (filterMonth) {
    records = records.filter(r => r.tanggal.startsWith(filterMonth));
  }

  if (filterStatus) {
    records = records.filter(r => r.status === filterStatus);
  }

  return records.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}, [allRecords, filterMonth, filterStatus]);
  const stats = useMemo(() => {
    const total = myRecords.length;
    const hadir = myRecords.filter(r => r.status === 'hadir').length;
    const sakit = myRecords.filter(r => r.status === 'sakit').length;
    const izin = myRecords.filter(r => r.status === 'izin').length;
    const alpha = myRecords.filter(r => r.status === 'alpha').length;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;
    const totalLate = myRecords.filter(r => r.late_seconds > 0).length;
    return { total, hadir, sakit, izin, alpha, percentage, totalLate };
  }, [myRecords]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Riwayat Absensi</h1>
        <p className="text-muted-foreground text-sm mt-1">Riwayat kehadiran Anda</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Hari', value: stats.total, icon: Calendar, gradient: 'gradient-primary' },
          { label: 'Hadir', value: stats.hadir, icon: UserCheck, gradient: 'gradient-success' },
          { label: 'Kehadiran', value: `${stats.percentage}%`, icon: TrendingUp, gradient: 'gradient-warning' },
          { label: 'Terlambat', value: stats.totalLate, icon: Clock, gradient: 'gradient-destructive' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{card.label}</span>
              <div className={`w-9 h-9 rounded-xl ${card.gradient} flex items-center justify-center`}>
                <card.icon size={18} className="text-primary-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Status summary */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4">
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Hadir', value: stats.hadir, cls: 'badge-hadir' },
            { label: 'Sakit', value: stats.sakit, cls: 'badge-sakit' },
            { label: 'Izin', value: stats.izin, cls: 'badge-izin' },
            { label: 'Alpha', value: stats.alpha, cls: 'badge-alpha' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className={s.cls}>{s.label}</span>
              <span className="text-sm font-bold text-foreground">{s.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-4 flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-muted-foreground" />
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">Semua Status</option>
          <option value="hadir">Hadir</option>
          <option value="sakit">Sakit</option>
          <option value="izin">Izin</option>
          <option value="alpha">Alpha</option>
        </select>
      </motion.div>

      {/* Records table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : myRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Tidak ada riwayat absensi</div>
        ) : (
          <div className="divide-y divide-border/50">
            {myRecords.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <Calendar size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.tanggal}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {r.jam !== '-' ? r.jam : 'Tidak hadir'}
                      {r.late_seconds > 0 && <span className="text-destructive ml-2">+{Math.round(r.late_seconds / 60)} menit</span>}
                    </p>
                  </div>
                </div>
                <span className={STATUS_BADGE[r.status]}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HistoryPage;
