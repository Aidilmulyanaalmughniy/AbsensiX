import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import * as XLSX from 'xlsx';
import type { UserRole } from '@/types';

interface ImportRow {
  username: string;
  nama_lengkap: string;
  password: string;
  role: UserRole;
  kelas?: string;
  isStudent: boolean;
  valid: boolean;
  errors: string[];
}

const REQUIRED_COLS = ['username', 'nama_lengkap', 'password', 'role'];
const VALID_ROLES: UserRole[] = ['dev', 'kepsek', 'wakel', 'km', 'absensi', 'siswa'];

const ImportUserPage = () => {
  const { addUser, getAllUsers } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const validateRow = useCallback((row: Record<string, unknown>, existingUsernames: string[]): ImportRow => {
    const errors: string[] = [];
    const username = String(row.username || '').trim();
    const nama = String(row.nama_lengkap || '').trim();
    const password = String(row.password || '').trim();
    const role = String(row.role || '').trim().toLowerCase() as UserRole;
    const kelas = String(row.kelas || '').trim() || undefined;
    const isStudent = String(row.is_student || row.isStudent || 'false').toLowerCase();

    if (!username) errors.push('Username kosong');
    if (username && existingUsernames.includes(username)) errors.push('Username sudah ada');
    if (!nama) errors.push('Nama kosong');
    if (!password) errors.push('Password kosong');
    if (password && password.length < 6) errors.push('Password min 6 karakter (Firebase)');
    if (!VALID_ROLES.includes(role)) errors.push(`Role "${role}" tidak valid`);

    return {
      username, nama_lengkap: nama, password, role,
      kelas, isStudent: isStudent === 'true' || isStudent === '1' || isStudent === 'ya',
      valid: errors.length === 0, errors,
    };
  }, []);

  const processFile = useCallback((file: File) => {
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        if (json.length === 0) { toast.error('File kosong'); return; }

        const headers = Object.keys(json[0]).map(h => h.toLowerCase().trim());
        const missing = REQUIRED_COLS.filter(c => !headers.includes(c));
        if (missing.length > 0) { toast.error(`Kolom wajib tidak ditemukan: ${missing.join(', ')}`); return; }

        const existingUsernames = getAllUsers().map(u => u.username);
        const rows = json.map(row => {
          const normalized: Record<string, unknown> = {};
          Object.entries(row).forEach(([k, v]) => { normalized[k.toLowerCase().trim()] = v; });
          return validateRow(normalized, existingUsernames);
        });

        setPreview(rows);
        toast.success(`${json.length} baris ditemukan, ${rows.filter(r => r.valid).length} valid`);
      } catch {
        toast.error('Gagal membaca file.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, [getAllUsers, validateRow]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    const validRows = preview.filter(r => r.valid);
    if (validRows.length === 0) { toast.error('Tidak ada data valid'); return; }

    setImporting(true);
    let success = 0;
    let failed = 0;

    for (const row of validRows) {
      try {
        await addUser({
          uid: '',
          username: row.username,
          nama_lengkap: row.nama_lengkap,
          password: row.password,
          role: row.role,
          kelas: row.kelas,
          isStudent: row.isStudent,
          isOsis: false,
          enabled: true,
        });
        success++;
      } catch {
        failed++;
      }
    }

    setResult({ success, failed });
    setImporting(false);
    toast.success(`${success} user berhasil diimpor${failed > 0 ? `, ${failed} gagal` : ''}`);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['username', 'nama_lengkap', 'password', 'role', 'kelas', 'is_student'],
      ['siswa01', 'Andi Pratama', 'pass123456', 'siswa', '10-A', 'true'],
      ['wakel10a', 'Siti Rahmawati', 'pass123456', 'wakel', '10-A', 'false'],
    ]);
    ws['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_import_user.xlsx');
    toast.success('Template berhasil diunduh');
  };

  const clearPreview = () => { setPreview([]); setFileName(''); setResult(null); };
  const validCount = preview.filter(r => r.valid).length;
  const invalidCount = preview.filter(r => !r.valid).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Import User</h1>
        <p className="text-muted-foreground text-sm mt-1">Import data user dari file Excel atau CSV</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Download Template</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Gunakan template untuk memastikan format data sesuai</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-foreground hover:bg-white/[0.04] transition-colors duration-200">
          <Download size={16} /> Download .xlsx
        </motion.button>
      </motion.div>

      {preview.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`glass-card p-12 sm:p-16 text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
              dragActive ? 'border-primary/50 bg-primary/[0.04]' : 'border-white/[0.06] hover:border-white/[0.12]'}`}>
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">{dragActive ? 'Lepaskan file di sini' : 'Upload File'}</h3>
            <p className="text-sm text-muted-foreground">Drag & drop atau <span className="text-primary font-medium">klik untuk pilih file</span></p>
            <p className="text-xs text-muted-foreground/50 mt-2">Format: .xlsx, .xls, .csv · Password minimal 6 karakter</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {preview.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {preview.length} baris · <span className="text-green-400">{validCount} valid</span>
                    {invalidCount > 0 && <span className="text-destructive ml-1">· {invalidCount} error</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={clearPreview} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] text-xs font-medium text-muted-foreground hover:bg-white/[0.04] transition-colors">
                  <Trash2 size={13} /> Hapus
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleImport} disabled={importing || validCount === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg gradient-primary text-white text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none">
                  {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={13} />}
                  {importing ? 'Mengimpor...' : `Import ${validCount} User`}
                </motion.button>
              </div>
            </div>

            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-green-500/60">
                    <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Import selesai</p>
                      <p className="text-xs text-muted-foreground">{result.success} berhasil, {result.failed} gagal</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="glass-card overflow-hidden">
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Status', 'Username', 'Nama', 'Role', 'Kelas', 'Error'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className={`border-b border-white/[0.03] ${!row.valid ? 'bg-destructive/[0.03]' : ''}`}>
                        <td className="px-4 py-3">{row.valid ? <CheckCircle2 size={15} className="text-green-400" /> : <AlertCircle size={15} className="text-destructive" />}</td>
                        <td className="px-4 py-3 font-mono text-xs text-foreground">{row.username || '-'}</td>
                        <td className="px-4 py-3 text-foreground">{row.nama_lengkap || '-'}</td>
                        <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-white/[0.06] text-muted-foreground">{row.role || '-'}</span></td>
                        <td className="px-4 py-3 text-muted-foreground">{row.kelas || '-'}</td>
                        <td className="px-4 py-3 text-xs text-destructive">{row.errors.join(', ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden divide-y divide-white/[0.04]">
                {preview.map((row, i) => (
                  <div key={i} className={`p-4 space-y-1.5 ${!row.valid ? 'bg-destructive/[0.03]' : ''}`}>
                    <div className="flex items-center gap-2">
                      {row.valid ? <CheckCircle2 size={14} className="text-green-400" /> : <AlertCircle size={14} className="text-destructive" />}
                      <span className="font-medium text-sm text-foreground">{row.nama_lengkap || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">{row.username}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/[0.06]">{row.role}</span>
                      {row.kelas && <span>{row.kelas}</span>}
                    </div>
                    {row.errors.length > 0 && <p className="text-xs text-destructive">{row.errors.join(', ')}</p>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImportUserPage;
