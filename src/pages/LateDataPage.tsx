import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useAttendance, useKelasList } from '@/hooks/useFirestore';
import { Clock, AlertTriangle, Search, Download } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const LateDataPage = () => {
  const { user } = useAuthStore();
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterKelas, setFilterKelas] = useState('');
  const [search, setSearch] = useState('');
  const kelasList = useKelasList();
  const { records, loading } = useAttendance(filterKelas || undefined, filterDate);

  const lateRecords = useMemo(() => {
    return records
      .filter(r => r.late_seconds > 0)
      .filter(r => !search || r.nama.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.late_seconds - a.late_seconds);
  }, [records, search]);

  // Guard: only isOsis users or dev
  if (!user?.isOsis && user?.role !== 'dev') {
    return <Navigate to="/dashboard" replace />;
  }

  const formatLate = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m} menit ${s > 0 ? `${s} detik` : ''}` : `${s} detik`;
  };

  const getLateLevel = (seconds: number) => {
    if (seconds > 1800) return { label: 'Sangat Terlambat', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    if (seconds > 600) return { label: 'Terlambat', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    return { label: 'Sedikit Terlambat', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
  };

  const totalLate = lateRecords.length;
  const avgLate = totalLate > 0 ? Math.round(lateRecords.reduce((a, r) => a + r.late_seconds, 0) / totalLate) : 0;
  const worstLate = totalLate > 0 ? Math.max(...lateRecords.map(r => r.late_seconds)) : 0;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Laporan Data Keterlambatan', 14, 20);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${filterDate} | Kelas: ${filterKelas || 'Semua'}`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [['No', 'Nama', 'Kelas', 'Jam', 'Terlambat', 'Level']],
      body: lateRecords.map((r, i) => [
        i + 1, r.nama, r.kelas, r.jam,
        formatLate(r.late_seconds), getLateLevel(r.late_seconds).label,
      ]),
    });
    doc.save(`keterlambatan_${filterDate}.pdf`);
  };

  const handleExportExcel = () => {
    const data = lateRecords.map((r, i) => ({
      No: i + 1, Nama: r.nama, Kelas: r.kelas, Jam: r.jam,
      'Terlambat (detik)': r.late_seconds,
      'Terlambat': formatLate(r.late_seconds),
      Level: getLateLevel(r.late_seconds).label,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Keterlambatan');
    XLSX.writeFile(wb, `keterlambatan_${filterDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Data Keterlambatan</h1>
            <p className="text-sm text-muted-foreground">Monitor siswa terlambat — Akses OSIS</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Terlambat', value: totalLate, icon: AlertTriangle, color: 'text-orange-400' },
          { label: 'Rata-rata', value: formatLate(avgLate), icon: Clock, color: 'text-yellow-400' },
          { label: 'Terlama', value: formatLate(worstLate), icon: Clock, color: 'text-red-400' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className="px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm" />
        <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)}
          className="px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm">
          <option value="">Semua Kelas</option>
          {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari nama..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm" />
        </div>
        <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm hover:bg-red-500/20 transition">
          <Download size={16} /> PDF
        </button>
        <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-sm hover:bg-green-500/20 transition">
          <Download size={16} /> Excel
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat data...</div>
      ) : lateRecords.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Clock className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-foreground font-medium">Tidak ada siswa terlambat!</p>
          <p className="text-sm text-muted-foreground">Semua hadir tepat waktu 🎉</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-muted-foreground font-medium">No</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Nama</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Kelas</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Jam</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Terlambat</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Level</th>
              </tr>
            </thead>
            <tbody>
              {lateRecords.map((r, i) => {
                const level = getLateLevel(r.late_seconds);
                return (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-t border-border hover:bg-muted/30 transition">
                    <td className="px-4 py-3 text-foreground">{i + 1}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{r.nama}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.kelas}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.jam}</td>
                    <td className="px-4 py-3 text-foreground">{formatLate(r.late_seconds)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs border ${level.color}`}>{level.label}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
};

export default LateDataPage;
