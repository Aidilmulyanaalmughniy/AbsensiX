import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { logAudit } from '@/hooks/useAuditLog';
import type { UserRole } from '@/types';
import { ROLE_LABELS } from '@/types';
import { Users, Plus, Trash2, Key, Power, AlertTriangle, X, Calendar, Clock, Send, Loader2, Search, UserPlus, Mail, CreditCard, Shield, School, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const formatSchedule = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const DevPanelPage = () => {
  const { user: currentUser, getAllUsers, updateUser, resetPassword, addUser, deleteUser, maintenance, setMaintenance, fetchAllUsers } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const users = getAllUsers();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [maintenanceMsg, setMaintenanceMsg] = useState(maintenance.message);
  const [schedDate, setSchedDate] = useState(maintenance.scheduledAt ? maintenance.scheduledAt.slice(0, 16) : '');
  const [schedEndDate, setSchedEndDate] = useState(maintenance.scheduledEnd ? maintenance.scheduledEnd.slice(0, 16) : '');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [addingUser, setAddingUser] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '', nama_lengkap: '', email: '', role: 'siswa' as UserRole, kelas: '', isStudent: true, isOsis: false, rfid_uid: '', password: ''
  });

  useEffect(() => {
    setLoadingUsers(true);
    fetchAllUsers().finally(() => setLoadingUsers(false));
  }, [fetchAllUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.nama_lengkap.toLowerCase().includes(q) ||
      ROLE_LABELS[u.role].toLowerCase().includes(q) ||
      (u.kelas || '').toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const pagedUsers = filteredUsers.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [searchQuery]);

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.nama_lengkap || !newUser.password) {
      toast.error('Username, nama lengkap, dan password wajib diisi');
      return;
    }
    if (newUser.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setAddingUser(true);
    try {
      const showRfid = ['siswa', 'km', 'absensi'].includes(newUser.role);
      await addUser({
        uid: '',
        username: newUser.username,
        nama_lengkap: newUser.nama_lengkap,
        role: newUser.role,
        kelas: newUser.kelas || undefined,
        isStudent: newUser.isStudent,
        isOsis: newUser.isOsis,
        enabled: true,
        password: newUser.password,
        email: newUser.email || undefined,
        rfid_uid: showRfid && newUser.rfid_uid ? newUser.rfid_uid : undefined,
      });
      await logAudit('add_user', currentUser?.nama_lengkap || '', currentUser?.role || '', newUser.username);
      toast.success('User berhasil ditambahkan');
      setShowAddModal(false);
      setNewUser({ username: '', nama_lengkap: '', email: '', role: 'siswa', kelas: '', isStudent: true, isOsis: false, rfid_uid: '', password: '' });
      setShowNewPw(false);
      await fetchAllUsers();
    } catch (e: any) {
      toast.error(e?.code === 'auth/email-already-in-use' ? 'Username/email sudah digunakan' : 'Gagal menambahkan user');
    } finally {
      setAddingUser(false);
    }
  };

  const handleResetPassword = async (uid: string) => {
    if (!newPassword) { toast.error('Password baru wajib diisi'); return; }
    await resetPassword(uid, newPassword);
    const target = users.find(u => u.uid === uid);
    await logAudit('reset_password', currentUser?.nama_lengkap || '', currentUser?.role || '', target?.username || uid);
    toast.success('Password berhasil direset');
    setShowResetModal(null);
    setNewPassword('');
  };

  const handleDeleteUser = async (uid: string) => {
    const target = users.find(u => u.uid === uid);
    await deleteUser(uid);
    await logAudit('delete_user', currentUser?.nama_lengkap || '', currentUser?.role || '', target?.username || uid);
    toast.success('User berhasil dihapus');
    setDeleteConfirm(null);
    await fetchAllUsers();
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pw = '';
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setNewPassword(pw);
  };

  const toggleMaintenance = async () => {
    setMaintenance({ enabled: !maintenance.enabled, message: maintenanceMsg, scheduledAt: maintenance.scheduledAt, scheduledEnd: maintenance.scheduledEnd });
    await logAudit('toggle_maintenance', currentUser?.nama_lengkap || '', currentUser?.role || '', '', maintenance.enabled ? 'Disabled' : 'Enabled');
    toast.success(maintenance.enabled ? 'Maintenance dinonaktifkan' : 'Maintenance diaktifkan');
  };

  const handleScheduleMaintenance = () => {
    if (!schedDate) { toast.error('Pilih tanggal & waktu mulai maintenance'); return; }
    const startDate = new Date(schedDate);
    const endDate = schedEndDate ? new Date(schedEndDate) : null;
    if (endDate && endDate <= startDate) { toast.error('Waktu selesai harus setelah waktu mulai'); return; }

    const config = { ...maintenance, message: maintenanceMsg, scheduledAt: startDate.toISOString(), scheduledEnd: endDate ? endDate.toISOString() : undefined };
    setMaintenance(config);

    const formattedStart = formatSchedule(startDate.toISOString());
    const formattedEnd = endDate ? formatSchedule(endDate.toISOString()) : null;
    const notifMsg = formattedEnd
      ? `Maintenance terjadwal pada ${formattedStart} sampai ${formattedEnd}. ${maintenanceMsg}`
      : `Maintenance terjadwal pada ${formattedStart}. ${maintenanceMsg}`;

    addNotification({ type: 'warning', title: '⚠️ Maintenance Terjadwal', message: notifMsg, roles: ['dev', 'kepsek', 'wakel', 'km', 'absensi', 'siswa'] });
    toast.success('Jadwal maintenance berhasil disimpan & notifikasi terkirim');
  };

  const cancelSchedule = () => {
    setMaintenance({ ...maintenance, scheduledAt: undefined, scheduledEnd: undefined });
    setSchedDate(''); setSchedEndDate('');
    toast.success('Jadwal maintenance dibatalkan');
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Developer Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola sistem dan pengguna</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} /> Tambah User
        </button>
      </div>

      {/* Maintenance Section */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-warning" /> Maintenance Mode
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button onClick={toggleMaintenance}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${maintenance.enabled
                ? 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20'
                : 'bg-success/10 text-success border border-success/20 hover:bg-success/20'}`}>
              {maintenance.enabled ? 'Nonaktifkan' : 'Aktifkan Sekarang'}
            </button>
            <span className={`text-xs font-medium ${maintenance.enabled ? 'text-destructive' : 'text-success'}`}>
              {maintenance.enabled ? '● Aktif' : '○ Nonaktif'}
            </span>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Pesan Maintenance</label>
            <input value={maintenanceMsg} onChange={e => setMaintenanceMsg(e.target.value)}
              onBlur={() => setMaintenance({ ...maintenance, message: maintenanceMsg })}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="border-t border-border/50 pt-4">
            <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar size={14} className="text-primary" /> Jadwalkan Maintenance
            </h4>
            {maintenance.scheduledAt && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-3 rounded-xl bg-warning/[0.08] border border-warning/20 flex items-start gap-3">
                <Clock size={16} className="text-warning mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">Maintenance Terjadwal</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Mulai: {formatSchedule(maintenance.scheduledAt)}</p>
                  {maintenance.scheduledEnd && <p className="text-[11px] text-muted-foreground">Selesai: {formatSchedule(maintenance.scheduledEnd)}</p>}
                </div>
                <button onClick={cancelSchedule} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </motion.div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Clock size={12} /> Waktu Mulai</label>
                <input type="datetime-local" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Clock size={12} /> Waktu Selesai (opsional)</label>
                <input type="datetime-local" value={schedEndDate} onChange={e => setSchedEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]" />
              </div>
            </div>
            <button onClick={handleScheduleMaintenance}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl gradient-warning text-warning-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              <Send size={14} /> Jadwalkan & Kirim Notifikasi
            </button>
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Daftar Pengguna ({filteredUsers.length})</h3>
          </div>
          <div className="relative sm:ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari user..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-48" />
          </div>
        </div>
        {loadingUsers ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Username', 'Nama', 'Role', 'Kelas', 'Status', 'Aksi'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map(u => (
                    <tr key={u.uid} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-foreground">{u.username}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{u.nama_lengkap}</td>
                      <td className="px-4 py-3"><span className="badge-izin">{ROLE_LABELS[u.role]}</span></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{u.kelas || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={u.enabled ? 'badge-hadir' : 'badge-alpha'}>{u.enabled ? 'Aktif' : 'Nonaktif'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={async () => { await updateUser(u.uid, { enabled: !u.enabled }); await logAudit('toggle_user', currentUser?.nama_lengkap || '', currentUser?.role || '', u.username, u.enabled ? 'Disabled' : 'Enabled'); toast.success('Status diubah'); await fetchAllUsers(); }}
                            className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors" title={u.enabled ? 'Nonaktifkan' : 'Aktifkan'}>
                            <Power size={14} />
                          </button>
                          <button onClick={() => setShowResetModal(u.uid)}
                            className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Reset Password">
                            <Key size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirm(u.uid)}
                            className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="glass-card p-6 w-full max-w-sm mx-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto"><Trash2 className="w-5 h-5 text-destructive" /></div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Hapus User?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  User <strong>{users.find(u => u.uid === deleteConfirm)?.nama_lengkap}</strong> akan dihapus permanen.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">Batal</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleDeleteUser(deleteConfirm)}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors">Hapus</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><Key size={18} /> Reset Password</h3>
              <button onClick={() => setShowResetModal(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Password Baru</label>
                <input value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Masukkan password baru" />
              </div>
              <div className="flex gap-2">
                <button onClick={generatePassword} className="px-3 py-2 rounded-xl bg-secondary text-foreground text-sm hover:bg-secondary/80 transition-colors">Generate</button>
                <button onClick={() => handleResetPassword(showResetModal)} className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Reset</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add User Modal — Premium Design */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setShowAddModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[hsl(240_5%_8%)] shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              {/* Header with gradient accent */}
              <div className="relative px-6 pt-6 pb-4">
                <div className="absolute top-0 left-0 right-0 h-[2px] gradient-primary" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
                      <UserPlus size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Tambah User Baru</h3>
                      <p className="text-[11px] text-muted-foreground/60">Isi data pengguna di bawah</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddModal(false)}
                    className="p-2 rounded-xl hover:bg-white/[0.06] text-muted-foreground/50 hover:text-foreground transition-all duration-200">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable form body */}
              <div className="px-6 pb-6 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="space-y-4">
                  {/* Username & Nama row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        <Users size={11} /> Username <span className="text-destructive">*</span>
                      </label>
                      <input value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                        placeholder="contoh: budi.santoso"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-sm placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(217_91%_60%_/_0.1)] transition-all duration-200" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        <Users size={11} /> Nama Lengkap <span className="text-destructive">*</span>
                      </label>
                      <input value={newUser.nama_lengkap} onChange={e => setNewUser({ ...newUser, nama_lengkap: e.target.value })}
                        placeholder="contoh: Budi Santoso"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-sm placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(217_91%_60%_/_0.1)] transition-all duration-200" />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                      <Mail size={11} /> Email <span className="text-muted-foreground/40 normal-case font-normal">(opsional)</span>
                    </label>
                    <input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                      type="email" placeholder="user@email.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-sm placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(217_91%_60%_/_0.1)] transition-all duration-200" />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                      <Key size={11} /> Password <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <input value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                        type={showNewPw ? 'text' : 'password'} placeholder="Minimal 6 karakter"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-sm font-mono placeholder:text-muted-foreground/25 placeholder:font-sans focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(217_91%_60%_/_0.1)] transition-all duration-200" />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
                        {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {newUser.password && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-1 flex-1">
                          {[1, 2, 3].map(i => {
                            const strength = newUser.password.length < 6 ? 1 : newUser.password.length < 10 ? 2 : 3;
                            return <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? (strength === 1 ? 'bg-destructive' : strength === 2 ? 'bg-warning' : 'bg-success') : 'bg-white/[0.06]'}`} />;
                          })}
                        </div>
                        <span className="text-[10px] text-muted-foreground/50">
                          {newUser.password.length < 6 ? 'Lemah' : newUser.password.length < 10 ? 'Sedang' : 'Kuat'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-[10px] text-muted-foreground/30 uppercase tracking-widest">Detail</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  {/* Role & Kelas row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        <Shield size={11} /> Role
                      </label>
                      <select value={newUser.role} onChange={e => {
                        const role = e.target.value as UserRole;
                        setNewUser({ ...newUser, role, isStudent: ['siswa', 'km', 'absensi'].includes(role) });
                      }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-sm focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(217_91%_60%_/_0.1)] transition-all duration-200 appearance-none cursor-pointer">
                        {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        <School size={11} /> Kelas
                      </label>
                      <input value={newUser.kelas} onChange={e => setNewUser({ ...newUser, kelas: e.target.value })}
                        placeholder="contoh: 10-A"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-sm placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(217_91%_60%_/_0.1)] transition-all duration-200" />
                    </div>
                  </div>

                  {/* RFID UID - conditional */}
                  <AnimatePresence>
                    {['siswa', 'km', 'absensi'].includes(newUser.role) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                            <CreditCard size={11} /> RFID UID <span className="text-muted-foreground/40 normal-case font-normal">(opsional)</span>
                          </label>
                          <input value={newUser.rfid_uid} onChange={e => setNewUser({ ...newUser, rfid_uid: e.target.value.toUpperCase() })}
                            placeholder="A3 B2 C1 D0"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-sm font-mono placeholder:text-muted-foreground/25 placeholder:font-mono focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(217_91%_60%_/_0.1)] transition-all duration-200 tracking-widest" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Toggle switches */}
                  <div className="flex items-center gap-5 py-1">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" checked={newUser.isStudent} onChange={e => setNewUser({ ...newUser, isStudent: e.target.checked })}
                          className="sr-only peer" />
                        <div className="w-9 h-5 rounded-full bg-white/[0.08] peer-checked:bg-primary/60 transition-colors duration-200" />
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white/50 peer-checked:bg-white peer-checked:translate-x-4 transition-all duration-200 shadow-sm" />
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Siswa</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" checked={newUser.isOsis} onChange={e => setNewUser({ ...newUser, isOsis: e.target.checked })}
                          className="sr-only peer" />
                        <div className="w-9 h-5 rounded-full bg-white/[0.08] peer-checked:bg-primary/60 transition-colors duration-200" />
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white/50 peer-checked:bg-white peer-checked:translate-x-4 transition-all duration-200 shadow-sm" />
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">OSIS</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.02] flex gap-3">
                <button onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200">
                  Batal
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAddUser}
                  disabled={addingUser || !newUser.username || !newUser.nama_lengkap || !newUser.password}
                  className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:shadow-[0_0_24px_hsl(217_91%_60%_/_0.3)] transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {addingUser ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><UserPlus size={15} /> Tambah User</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DevPanelPage;
