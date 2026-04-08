import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useAttendance, useClassStats, useKelasList } from '@/hooks/useFirestore';
import { Users, UserCheck, UserX, AlertCircle, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const NotPresentPage = () => {
  const { user } = useAuthStore();
  const isClassOnly = user?.role === 'wakel' || user?.role === 'km' || user?.role === 'absensi';
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState(isClassOnly ? user?.kelas || '' : '');
  const kelasList = useKelasList();
  const now = new Date();
const offset = now.getTimezoneOffset() * 60000;
const local = new Date(now.getTime() - offset);
const today = local.toISOString().split('T')[0];

  const queryKelas = isClassOnly ? user?.kelas : (filterKelas || undefined);
  const { stats, loading: statsLoading } = useClassStats(queryKelas);
  const { records: allRecords, loading: recLoading, updateStatus } = useAttendance(queryKelas, today);

  const belumAbsen = useMemo(() => {
    let records = allRecords.filter(r => r.status === 'belum');
    if (search) records = records.filter(r => r.nama.toLowerCase().includes(search.toLowerCase()));
    return records;
  }, [allRecords, search]);

  const sudahAbsen = allRecords.filter(r => r.status !== 'belum');
  const totalSiswa = stats.reduce((a, b) => a + b.total, 0);
  const totalHadir = stats.reduce((a, b) => a + b.hadir, 0);
  const totalTidakHadir = stats.reduce((a, b) => a + b.alpha + b.sakit + b.izin, 0);
  const totalBelum = belumAbsen.length;
  const percentage = totalSiswa > 0 ? Math.round((totalHadir / totalSiswa) * 100) : 0;

  const canEdit = user && (user.role === 'wakel' || user.role === 'absensi' || user.role === 'dev');

  const handleMarkStatus = async (id: string, nama: string, status: string) => {
    try {
      await updateStatus(id, status as any);
      toast.success(`${nama} ditandai ${status}`);
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const now = new Date();
  const jamSekarang = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const loading = statsLoading || recLoading;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitoring Kehadiran</h1>
          <p className="text-muted-foreground text-sm mt-1">Pantau status absensi real-time · {jamSekarang}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
          <span className="text-xs text-success font-medium">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Siswa', value: totalSiswa, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Sudah Absen', value: sudahAbsen.length, icon: UserCheck, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Tidak Hadir', value: totalTidakHadir, icon: UserX, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Belum Absen', value: totalBelum, icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
              <card.icon size={20} className={card.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Kehadiran Hari Ini</p>
            <p className="text-4xl font-bold text-foreground mt-1">{percentage}<span className="text-lg text-muted-foreground">%</span></p>
          </div>
          <p className="text-sm text-muted-foreground">{totalHadir} dari {totalSiswa} siswa</p>
        </div>
        <div className="h-4 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className={`h-full rounded-full ${percentage >= 80 ? 'gradient-success' : percentage >= 50 ? 'gradient-warning' : 'gradient-destructive'}`}
          />
        </div>
      </motion.div>

      {!isClassOnly && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Progress Per Kelas</h3>
          <div className="space-y-3">
            {stats.map(cs => (
              <div key={cs.kelas} className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-10">{cs.kelas}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full gradient-success rounded-full" style={{ width: `${cs.percentage}%` }} />
                </div>
                <span className="text-xs font-medium text-foreground w-10 text-right">{cs.percentage}%</span>
                <span className="text-xs text-muted-foreground w-20 text-right">{cs.belum} belum</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertCircle size={16} className="text-warning" />
            Belum Absen ({totalBelum})
          </h3>
          <div className="flex gap-2">
            {!isClassOnly && (
              <select
                value={filterKelas}
                onChange={e => setFilterKelas(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Semua Kelas</option>
                {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            )}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 w-36"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : totalBelum === 0 ? (
          <div className="p-10 text-center">
            <UserCheck className="w-10 h-10 text-success mx-auto mb-3 opacity-50" />
            <p className="text-foreground font-medium">Semua siswa sudah absen!</p>
            <p className="text-muted-foreground text-xs mt-1">Tidak ada yang perlu ditindak</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {belumAbsen.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.03 }}
                className="px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-warning">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.nama}</p>
                    <p className="text-xs text-muted-foreground">{s.kelas}</p>
                  </div>
                </div>
                {canEdit ? (
                  <div className="flex gap-1">
                    {(['Sakit', 'Izin', 'Alpha'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => handleMarkStatus(s.id, s.nama, status.toLowerCase())}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          status === 'Sakit' ? 'bg-warning/10 text-warning hover:bg-warning/20' :
                          status === 'Izin' ? 'bg-info/10 text-info hover:bg-info/20' :
                          'bg-destructive/10 text-destructive hover:bg-destructive/20'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="badge-belum">Belum</span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NotPresentPage;
