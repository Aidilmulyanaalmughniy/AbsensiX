import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, School, Users, UserCheck, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useClasses, type ClassData } from '@/hooks/useFirestore';

const emptyForm = { nama: '', waliKelas: '', tahunAjaran: '2025/2026' };

const ManageKelasPage = () => {
  const { classes: kelasList, loading, addClass, updateClass, deleteClass } = useClasses();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = kelasList.filter(k =>
    k.nama.toLowerCase().includes(search.toLowerCase()) ||
    k.waliKelas.toLowerCase().includes(search.toLowerCase())
  );

  const totalSiswa = kelasList.reduce((sum, k) => sum + k.totalSiswa, 0);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (k: ClassData) => {
    setEditId(k.id);
    setForm({ nama: k.nama, waliKelas: k.waliKelas, tahunAjaran: k.tahunAjaran });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim() || !form.waliKelas.trim()) {
      toast.error('Nama kelas dan wali kelas wajib diisi');
      return;
    }
    try {
      if (editId) {
        await updateClass(editId, form);
        toast.success('Kelas berhasil diperbarui');
      } else {
        await addClass({ ...form, totalSiswa: 0 });
        toast.success('Kelas baru berhasil ditambahkan');
      }
      setShowModal(false);
    } catch {
      toast.error('Gagal menyimpan data');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClass(id);
      setDeleteConfirm(null);
      toast.success('Kelas berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus kelas');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Manage Kelas</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola data kelas dan wali kelas</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Kelas', value: kelasList.length, icon: School, gradient: 'gradient-primary' },
          { label: 'Total Siswa', value: totalSiswa, icon: Users, gradient: 'gradient-success' },
          { label: 'Rata-rata/Kelas', value: kelasList.length ? Math.round(totalSiswa / kelasList.length) : 0, icon: UserCheck, gradient: 'gradient-warning' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${s.gradient} flex items-center justify-center flex-shrink-0`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{s.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kelas atau wali kelas..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(217_91%_60%_/_0.1)] transition-all duration-300 text-sm" />
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={openAdd}
          className="gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 justify-center hover:shadow-[0_0_24px_hsl(217_91%_60%_/_0.3)] transition-shadow duration-300">
          <Plus size={16} /> Tambah Kelas
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Kelas</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Wali Kelas</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Siswa</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Tahun Ajaran</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((k, i) => (
                <motion.tr key={k.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors duration-200">
                  <td className="px-5 py-3.5 font-semibold text-foreground">{k.nama}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{k.waliKelas}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary tabular-nums">{k.totalSiswa}</span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{k.tahunAjaran}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(k)} className="p-2 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors duration-200"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteConfirm(k.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors duration-200"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden divide-y divide-white/[0.04]">
          {filtered.map((k, i) => (
            <motion.div key={k.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{k.nama}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary tabular-nums">{k.totalSiswa} siswa</span>
              </div>
              <p className="text-sm text-muted-foreground">{k.waliKelas}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/60">{k.tahunAjaran}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(k)} className="p-2 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteConfirm(k.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && <div className="p-12 text-center text-muted-foreground/50 text-sm">Tidak ada kelas ditemukan</div>}
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-md glass-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">{editId ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Nama Kelas', key: 'nama' as const, placeholder: 'contoh: 10-A' },
                  { label: 'Wali Kelas', key: 'waliKelas' as const, placeholder: 'Nama wali kelas' },
                  { label: 'Tahun Ajaran', key: 'tahunAjaran' as const, placeholder: '2025/2026' },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="block text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">{f.label}</label>
                    <input value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(217_91%_60%_/_0.1)] transition-all duration-300 text-sm" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-muted-foreground hover:bg-white/[0.04] transition-colors duration-200">Batal</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:shadow-[0_0_24px_hsl(217_91%_60%_/_0.3)] transition-shadow duration-300">
                  {editId ? 'Simpan' : 'Tambah'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-sm glass-card p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto"><Trash2 className="w-5 h-5 text-destructive" /></div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Hapus Kelas?</h3>
                <p className="text-sm text-muted-foreground mt-1">Kelas <strong>{kelasList.find(k => k.id === deleteConfirm)?.nama}</strong> akan dihapus permanen.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-muted-foreground hover:bg-white/[0.04] transition-colors">Batal</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors">Hapus</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageKelasPage;
