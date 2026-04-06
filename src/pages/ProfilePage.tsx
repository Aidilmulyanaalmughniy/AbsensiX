import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LABELS } from '@/types';
import { User, Mail, Shield, School, Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const ProfilePage = () => {
  const { user } = useAuthStore();

  // Change password
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  if (!user) return null;

  const handleChangePassword = async () => {
    if (!currentPw) { toast.error('Masukkan password lama'); return; }
    if (newPw.length < 6) { toast.error('Password baru minimal 6 karakter'); return; }
    if (newPw !== confirmPw) { toast.error('Konfirmasi password tidak cocok'); return; }

    setChangingPw(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) throw new Error('Not authenticated');
      const cred = EmailAuthProvider.credential(firebaseUser.email, currentPw);
      await reauthenticateWithCredential(firebaseUser, cred);
      await updatePassword(firebaseUser, newPw);
      toast.success('Password berhasil diubah');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setShowPwSection(false);
    } catch (e: any) {
      if (e?.code === 'auth/wrong-password' || e?.code === 'auth/invalid-credential') {
        toast.error('Password lama salah');
      } else {
        toast.error('Gagal mengubah password');
      }
    } finally {
      setChangingPw(false);
    }
  };

  const infoItems = [
    { icon: User, label: 'Username', value: user.username },
    { icon: Mail, label: 'Nama Lengkap', value: user.nama_lengkap },
    { icon: Shield, label: 'Role', value: ROLE_LABELS[user.role] },
    { icon: School, label: 'Kelas', value: user.kelas || '-' },
  ];

  const pwStrength = newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : 3;
  const pwColors = ['', 'bg-destructive', 'bg-warning', 'bg-success'];
  const pwLabels = ['', 'Lemah', 'Sedang', 'Kuat'];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profil Saya</h1>
        <p className="text-muted-foreground text-sm mt-1">Informasi akun Anda</p>
      </div>

      {/* Profile Info (read-only) */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">
              {user.nama_lengkap.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{user.nama_lengkap}</h2>
            <span className="badge-izin">{ROLE_LABELS[user.role]}</span>
          </div>
        </div>

        <div className="space-y-4">
          {infoItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <button onClick={() => setShowPwSection(!showPwSection)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground w-full">
          <Lock size={16} className="text-primary" />
          Ubah Password
          <span className="ml-auto text-xs text-muted-foreground">{showPwSection ? '▲' : '▼'}</span>
        </button>

        {showPwSection && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-3">
            {/* Current password */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Password Lama</label>
              <div className="relative">
                <input type={showCurrentPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10" />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {/* New password */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Password Baru</label>
              <div className="relative">
                <input type={showNewPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10" />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {newPw && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= pwStrength ? pwColors[pwStrength] : 'bg-secondary'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{pwLabels[pwStrength]}</span>
                </div>
              )}
            </div>
            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Konfirmasi Password Baru</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              {confirmPw && confirmPw === newPw && (
                <p className="text-xs text-success flex items-center gap-1"><CheckCircle size={12} /> Password cocok</p>
              )}
            </div>
            <button onClick={handleChangePassword} disabled={changingPw}
              className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock size={14} />}
              Ubah Password
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;
