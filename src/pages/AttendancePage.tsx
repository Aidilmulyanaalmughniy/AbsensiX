import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useAttendance, useKelasList } from '@/hooks/useFirestore';
import { logAudit } from '@/hooks/useAuditLog';
import { PERMISSIONS, type AttendanceStatus } from '@/types';
import { Download, Filter, Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_BADGE: Record<AttendanceStatus, string> = {
  hadir: 'badge-hadir', sakit: 'badge-sakit', izin: 'badge-izin', alpha: 'badge-alpha', belum: 'badge-belum',
};

const AttendancePage = () => {
  const { user } = useAuthStore();
  const isClassOnly = user?.role === 'wakel' || user?.role === 'km' || user?.role === 'absensi';
  const [filterKelas, setFilterKelas] = useState(isClassOnly ? user?.kelas || '' : '');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const kelasList = useKelasList();

  const queryKelas = isClassOnly ? user?.kelas : (filterKelas || undefined);
  const { records: data, loading, updateStatus } = useAttendance(queryKelas, filterDate);

  const canEdit = user && PERMISSIONS[user.role].includes('edit_attendance');
  const canExport = user && PERMISSIONS[user.role].includes('export');

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 15;
  const totalPages = Math.ceil(data.length / perPage);
  const pagedData = useMemo(() => data.slice((page - 1) * perPage, page * perPage), [data, page]);

  const handleStatusChange = async (id: string, status: AttendanceStatus) => {
    try {
      await updateStatus(id, status);
      const record = data.find(r => r.id === id);
      await logAudit('update_status', user?.nama_lengkap || '', user?.role || '', record?.nama || id, `Status → ${status}`);
      toast.success(`Status diubah menjadi ${status}`);
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const handleExportPDF = () => {
    if (data.length === 0) { toast.error('Tidak ada data untuk diekspor'); return; }
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.text('Laporan Data Absensi', 14, 20);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${filterDate}`, 14, 28);
    doc.text(`Kelas: ${filterKelas || 'Semua Kelas'}`, 14, 34);
    doc.text(`Total Data: ${data.length}`, 14, 40);

    const tableData = data.map((r, i) => [
      i + 1,
      r.nama,
      r.kelas,
      r.tanggal,
      r.jam,
      r.status.charAt(0).toUpperCase() + r.status.slice(1),
      r.late_seconds > 0 ? `${Math.round(r.late_seconds / 60)} menit` : '-',
    ]);

    autoTable(doc, {
      startY: 46,
      head: [['No', 'Nama', 'Kelas', 'Tanggal', 'Jam', 'Status', 'Terlambat']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      theme: 'grid',
    });

    doc.save(`absensi_${filterDate}_${filterKelas || 'semua'}.pdf`);
    logAudit('export', user?.nama_lengkap || '', user?.role || '', '', `PDF export ${filterDate}`);
    toast.success('File PDF berhasil diunduh');
  };

  const handleExportExcel = () => {
    if (data.length === 0) { toast.error('Tidak ada data untuk diekspor'); return; }
    const wsData = data.map((r, i) => ({
      'No': i + 1,
      'Nama': r.nama,
      'Kelas': r.kelas,
      'Tanggal': r.tanggal,
      'Jam': r.jam,
      'Status': r.status,
      'Terlambat (menit)': r.late_seconds > 0 ? Math.round(r.late_seconds / 60) : 0,
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
    XLSX.writeFile(wb, `absensi_${filterDate}_${filterKelas || 'semua'}.xlsx`);
    logAudit('export', user?.nama_lengkap || '', user?.role || '', '', `Excel export ${filterDate}`);
    toast.success('File Excel berhasil diunduh');
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Absensi</h1>
          <p className="text-muted-foreground text-sm mt-1">{isClassOnly ? `Kelas ${user?.kelas}` : 'Seluruh kelas'}</p>
        </div>
        {canExport && (
          <div className="flex gap-2">
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors">
              <FileText size={16} /> PDF
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              <FileSpreadsheet size={16} /> Excel
            </button>
          </div>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 flex flex-wrap items-center gap-4">
        <Filter size={16} className="text-muted-foreground" />
        {!isClassOnly && (
          <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">Semua Kelas</option>
            {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        )}
        <input type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]" />
        <span className="text-xs text-muted-foreground ml-auto">{data.length} data</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Tidak ada data absensi</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['No', 'Nama', 'Kelas', 'Tanggal', 'Jam', 'Status', 'Terlambat', ...(canEdit ? ['Aksi'] : [])].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedData.map((row, i) => (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground">{(page - 1) * perPage + i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{row.nama}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{row.kelas}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{row.tanggal}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{row.jam}</td>
                      <td className="px-4 py-3"><span className={STATUS_BADGE[row.status]}>{row.status}</span></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {row.late_seconds > 0 ? `${Math.round(row.late_seconds / 60)} menit` : '-'}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {(['sakit', 'izin', 'alpha'] as AttendanceStatus[]).map(s => (
                              <button key={s} onClick={() => handleStatusChange(row.id, s)}
                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  s === 'sakit' ? 'bg-warning/10 text-warning hover:bg-warning/20' :
                                  s === 'izin' ? 'bg-info/10 text-info hover:bg-info/20' :
                                  'bg-destructive/10 text-destructive hover:bg-destructive/20'
                                }`}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </button>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 rounded-lg text-xs bg-secondary text-foreground disabled:opacity-40 hover:bg-secondary/80 transition-colors">Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-1 rounded-lg text-xs bg-secondary text-foreground disabled:opacity-40 hover:bg-secondary/80 transition-colors">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AttendancePage;
