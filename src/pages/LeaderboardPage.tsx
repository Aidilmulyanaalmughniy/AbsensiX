import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useLeaderboard } from '@/hooks/useFirestore';
import { Trophy, Clock, TrendingDown, Loader2 } from 'lucide-react';

const LeaderboardPage = () => {
  const { user } = useAuthStore();
  const isClassOnly = user?.role === 'wakel' || user?.role === 'km' || user?.role === 'absensi';
  const { entries: leaderboard, loading } = useLeaderboard(isClassOnly ? user?.kelas : undefined);
  const slowest = [...leaderboard].reverse();

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{isClassOnly ? `Kelas ${user?.kelas}` : 'Seluruh sekolah'}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : leaderboard.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground text-sm">Belum ada data leaderboard hari ini</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-warning" /> Paling Cepat Datang
            </h3>
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map(entry => (
                <div key={entry.rank} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    entry.rank === 1 ? 'bg-warning/20 text-warning' :
                    entry.rank === 2 ? 'bg-muted-foreground/20 text-muted-foreground' :
                    entry.rank === 3 ? 'bg-warning/10 text-warning/70' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {entry.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{entry.nama}</p>
                    <p className="text-xs text-muted-foreground">{entry.kelas}</p>
                  </div>
                  <span className="text-xs font-mono text-success flex items-center gap-1">
                    <Clock size={12} /> {entry.jam}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingDown size={16} className="text-destructive" /> Paling Siang Datang
            </h3>
            <div className="space-y-2">
              {slowest.slice(0, 10).map((entry, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{entry.nama}</p>
                    <p className="text-xs text-muted-foreground">{entry.kelas}</p>
                  </div>
                  <span className="text-xs font-mono text-destructive flex items-center gap-1">
                    <Clock size={12} /> {entry.jam}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
