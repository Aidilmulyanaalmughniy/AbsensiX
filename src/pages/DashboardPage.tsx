import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useClassStats, useWeeklyData, useLeaderboard } from '@/hooks/useFirestore';
import { Users, UserCheck, UserX, Clock, TrendingUp, Award, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const anim = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05, duration: 0.3 } });

const DashboardPage = () => {
  const { user } = useAuthStore();
  const isClassOnly = user?.role === 'wakel' || user?.role === 'km' || user?.role === 'absensi';
  const { stats, loading: statsLoading } = useClassStats(isClassOnly ? user?.kelas : undefined);
  const { data: weeklyData, loading: weeklyLoading } = useWeeklyData();
  const { entries: leaderboard, loading: lbLoading } = useLeaderboard(isClassOnly ? user?.kelas : undefined);

  const totalSiswa = stats.reduce((a, b) => a + b.total, 0);
  const totalHadir = stats.reduce((a, b) => a + b.hadir, 0);
  const totalAlpha = stats.reduce((a, b) => a + b.alpha, 0);
  const percentage = totalSiswa > 0 ? Math.round((totalHadir / totalSiswa) * 100) : 0;

  const pieData = [
    { name: 'Hadir', value: totalHadir, color: 'hsl(142, 71%, 45%)' },
    { name: 'Sakit', value: stats.reduce((a, b) => a + b.sakit, 0), color: 'hsl(38, 92%, 50%)' },
    { name: 'Izin', value: stats.reduce((a, b) => a + b.izin, 0), color: 'hsl(217, 91%, 60%)' },
    { name: 'Alpha', value: totalAlpha, color: 'hsl(0, 84%, 60%)' },
  ];

  const cards = [
    { label: 'Total Siswa', value: totalSiswa, icon: Users, gradient: 'gradient-primary' },
    { label: 'Hadir Hari Ini', value: totalHadir, icon: UserCheck, gradient: 'gradient-success' },
    { label: 'Tidak Hadir', value: totalAlpha, icon: UserX, gradient: 'gradient-destructive' },
    { label: 'Kehadiran', value: `${percentage}%`, icon: TrendingUp, gradient: 'gradient-warning' },
  ];

  const belum = stats.reduce((a, b) => a + b.belum, 0);
  let insight = '';
  if (statsLoading) insight = '⏳ Memuat data...';
  else if (belum === 0 && totalAlpha === 0 && totalSiswa > 0) insight = '🎉 Semua siswa hadir hari ini! Kehadiran sempurna.';
  else if (totalSiswa === 0) insight = '📋 Belum ada data absensi hari ini.';
  else if (belum > 0) insight = `⏳ Masih ada ${belum} siswa yang belum absen hari ini.`;
  else if (percentage >= 90) insight = '✅ Kehadiran sangat baik! Pertahankan!';
  else insight = `⚠️ Kehadiran ${percentage}%. Perlu perhatian lebih.`;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard {isClassOnly ? user?.kelas : 'Sekolah'}</h1>
        <p className="text-muted-foreground text-sm mt-1">Ringkasan kehadiran hari ini</p>
      </div>

      <motion.div {...anim(0)} className="glass-card p-4 border-l-4 border-l-primary">
        <p className="text-sm text-foreground">{insight}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.label} {...anim(i + 1)} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{card.label}</span>
              <div className={`w-9 h-9 rounded-xl ${card.gradient} flex items-center justify-center`}>
                <card.icon size={18} className="text-primary-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...anim(5)} className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Kehadiran Mingguan</h3>
          <div className="h-64">
            {weeklyLoading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
                  <XAxis dataKey="day" stroke="hsl(240 5% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(240 5% 55%)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(240 5% 7%)', border: '1px solid hsl(240 4% 16%)', borderRadius: 12, color: 'hsl(0 0% 95%)' }} />
                  <Bar dataKey="hadir" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="sakit" fill="hsl(38 92% 50%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="alpha" fill="hsl(0 84% 60%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div {...anim(6)} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Distribusi Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(240 5% 7%)', border: '1px solid hsl(240 4% 16%)', borderRadius: 12, color: 'hsl(0 0% 95%)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {!isClassOnly && (
          <motion.div {...anim(7)} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award size={16} className="text-primary" /> Ranking Kelas
            </h3>
            <div className="space-y-3">
              {[...stats].sort((a, b) => b.percentage - a.percentage).map((s, i) => (
                <div key={s.kelas} className="flex items-center gap-3">
                  <span className="w-6 text-xs font-bold text-muted-foreground">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground font-medium">{s.kelas}</span>
                      <span className="text-muted-foreground">{s.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${s.percentage}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div {...anim(8)} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock size={16} className="text-success" /> Paling Cepat Datang
          </h3>
          <div className="space-y-2">
            {lbLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
            ) : (
              leaderboard.slice(0, 5).map(entry => (
                <div key={entry.rank} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/30 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    entry.rank <= 3 ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {entry.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{entry.nama}</p>
                    <p className="text-xs text-muted-foreground">{entry.kelas}</p>
                  </div>
                  <span className="text-xs font-mono text-success">{entry.jam}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
