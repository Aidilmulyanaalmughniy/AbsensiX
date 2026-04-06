import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useAttendance, useKelasList } from '@/hooks/useFirestore';
import { Calendar, Users, TrendingUp, Filter, Loader2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RekapBulananPage = () => {
  const { user } = useAuthStore();
  const isClassOnly = user?.role === 'wakel' || user?.role === 'km' || user?.role === 'absensi';
  const kelasList = useKelasList();

  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterKelas, setFilterKelas] = useState(isClassOnly ? user?.kelas || '' : '');

  const queryKelas = isClassOnly ? user?.kelas : (filterKelas || undefined);
  const { records, loading } = useAttendance(queryKelas, undefined);

  const monthRecords = useMemo(() => {
    return records.filter(r => r.tanggal.startsWith(filterMonth));
  }, [records, filterMonth]);

  const studentSummary = useMemo(() => {
    const map = new Map<string, { nama: string; kelas: string; hadir: number; sakit: number; izin: number; alpha: number; total: number; lateDays: number }>();
    monthRecords.forEach(r => {
      const key = r.student_id || r.nama;
      if (!map.has(key)) {
        map.set(key, { nama: r.nama, kelas: r.kelas, hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0, lateDays: 0 });
      }
      const s = map.get(key)!;
      s.total++;
      if (r.status === 'hadir') s.hadir++;
      else if (r.status === 'sakit') s.sakit++;
      else if (r.status === 'izin') s.izin++;
      else if (r.status === 'alpha') s.alpha++;
      if (r.late_seconds > 0) s.lateDays++;
    });
    return Array.from(map.values()).sort((a, b) => (b.hadir / b.total) - (a.hadir / a.total));
  }, [monthRecords]);

  const totalHadir = studentSummary.reduce((a, b) => a + b.hadir, 0);
  const totalRecords = studentSummary.reduce((a, b) => a + b.total, 0);
  const overallPct = totalRecords > 0 ? Math.round((totalHadir / totalRecords) * 100) : 0;

  const dailyChart = useMemo(() => {
    const map = new Map<string, { date: string; hadir: number; sakit: number; izin: number; alpha: number }>();
    monthRecords.forEach(r => {
      if (!map.has(r.tanggal)) map.set(r.tanggal, { date: r.tanggal.slice(8), hadir: 0, sakit: 0, izin: 0, alpha: 0 });
      const d = map.get(r.tanggal)!;
      if (r.status === 'hadir') d.hadir++;
      else if (r.status === 'sakit') d.sakit++;
      else if (r.status === 'izin') d.izin++;
      else if (r.status === 'alpha') d.alpha++;
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [monthRecords]);

  const monthLabel = filterMonth ? new Date(filterMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '';

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rekap Bulanan</h1>
        <p className="text-muted-foreground text-sm mt-1">Ringkasan kehadiran bulan {monthLabel}</p>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-muted-foreground" />
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]" />
        {!isClassOnly && (
          <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)}
            className="px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">Semua Kelas</option>
            {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        )}
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Data', value: totalRecords, icon: Calendar, gradient: 'gradient-primary' },
          { label: 'Total Siswa', value: studentSummary.length, icon: Users, gradient: 'gradient-success' },
          { label: 'Kehadiran', value: `${overallPct}%`, icon: TrendingUp, gradient: 'gradient-warning' },
          { label: 'Hari Aktif', value: dailyChart.length, icon: BarChart3, gradient: 'gradient-primary' },
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

      {/* Daily chart */}
      {dailyChart.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Kehadiran Harian</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
                <XAxis dataKey="date" stroke="hsl(240 5% 55%)" fontSize={11} />
                <YAxis stroke="hsl(240 5% 55%)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(240 5% 7%)', border: '1px solid hsl(240 4% 16%)', borderRadius: 12, color: 'hsl(0 0% 95%)' }} />
                <Bar dataKey="hadir" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sakit" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alpha" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Student table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Rekap Per Siswa</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : studentSummary.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Tidak ada data bulan ini</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['No', 'Nama', 'Kelas', 'Hadir', 'Sakit', 'Izin', 'Alpha', 'Terlambat', '%'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentSummary.map((s, i) => {
                  const pct = s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0;
                  return (
                    <tr key={i} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{s.nama}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{s.kelas}</td>
                      <td className="px-4 py-3"><span className="badge-hadir">{s.hadir}</span></td>
                      <td className="px-4 py-3"><span className="badge-sakit">{s.sakit}</span></td>
                      <td className="px-4 py-3"><span className="badge-izin">{s.izin}</span></td>
                      <td className="px-4 py-3"><span className="badge-alpha">{s.alpha}</span></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{s.lateDays}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${pct >= 80 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive'}`}>{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RekapBulananPage;
