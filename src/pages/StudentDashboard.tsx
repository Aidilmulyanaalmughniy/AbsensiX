import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useAttendance } from '@/hooks/useFirestore';
import { UserCheck, Clock, Calendar, TrendingUp, Loader2 } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];
  const { records: allRecords, loading } = useAttendance(undefined, user?.uid);

  const myRecords = allRecords.filter(r => r.nama === user?.nama_lengkap || r.student_id === user?.uid);
  
  const recentRecords = [...myRecords].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 5);

  const totalHari = new Set(myRecords.map(r => r.tanggal)).size || 0;
  const hadir = myRecords.filter(r => r.status === 'hadir').length;
  const percentage = totalHari > 0 ? Math.round((hadir / totalHari) * 100) : 0;

  const avgJam = (() => {
    const hadirRecords = myRecords.filter(r => r.status === 'hadir' && r.jam !== '-');
    if (hadirRecords.length === 0) return '--:--';
    const totalMinutes = hadirRecords.reduce((sum, r) => {
      const [h, m] = r.jam.split(':').map(Number);
      return sum + h * 60 + m;
    }, 0);
    const avg = Math.round(totalMinutes / hadirRecords.length);
    return `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`;
  })();

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Siswa</h1>
        <p className="text-muted-foreground text-sm mt-1">Halo, {user?.nama_lengkap}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Hari', value: totalHari, icon: Calendar, gradient: 'gradient-primary' },
          { label: 'Hadir', value: hadir, icon: UserCheck, gradient: 'gradient-success' },
          { label: 'Kehadiran', value: `${percentage}%`, icon: TrendingUp, gradient: 'gradient-warning' },
          { label: 'Rata-rata Jam', value: avgJam, icon: Clock, gradient: 'gradient-primary' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{card.label}</span>
              <div className={`w-9 h-9 rounded-xl ${card.gradient} flex items-center justify-center`}>
                <card.icon size={18} className="text-primary-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : card.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-foreground font-medium">Kehadiran Bulan Ini</span>
          <span className="text-primary font-bold">{percentage}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1 }}
            className="h-full gradient-primary rounded-full"
          />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Riwayat Terakhir</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : recentRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Belum ada riwayat</div>
        ) : (
          <div className="divide-y divide-border/50">
            {recentRecords.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.tanggal}</p>
                  <p className="text-xs text-muted-foreground font-mono">{r.jam}</p>
                </div>
                <span className={`badge-${r.status}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentDashboard;
