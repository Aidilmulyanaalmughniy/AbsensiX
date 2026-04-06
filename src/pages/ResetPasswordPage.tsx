import { useState, useEffect } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [codeInvalid, setCodeInvalid] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setCodeInvalid(true);
      setVerifying(false);
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then(email => {
        setEmail(email);
        setVerifying(false);
      })
      .catch(() => {
        setCodeInvalid(true);
        setVerifying(false);
      });
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/expired-action-code') {
        setError('Link sudah kedaluwarsa. Silakan minta link reset baru.');
      } else if (code === 'auth/invalid-action-code') {
        setError('Link tidak valid atau sudah digunakan.');
      } else if (code === 'auth/weak-password') {
        setError('Password terlalu lemah. Gunakan minimal 6 karakter.');
      } else {
        setError('Gagal mereset password. Coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (verifying) {
      return (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memverifikasi link...</p>
        </div>
      );
    }

    if (codeInvalid) {
      return (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-destructive/10 border border-destructive/20">
            <ShieldAlert className="w-10 h-10 text-destructive" />
            <div className="text-center">
              <p className="text-sm font-medium text-destructive">Link Tidak Valid</p>
              <p className="text-xs text-muted-foreground mt-1">
                Link reset password sudah kedaluwarsa atau tidak valid. Silakan minta link baru.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/forgot-password"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium text-white overflow-hidden gradient-primary hover:shadow-[0_0_30px_hsl(217_91%_60%_/_0.3)] transition-shadow"
            >
              Minta Link Baru
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} /> Kembali ke Login
            </Link>
          </div>
        </div>
      );
    }

    if (success) {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
          <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-emerald-300">Password Berhasil Direset!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Silakan login dengan password baru Anda.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium text-white overflow-hidden gradient-primary hover:shadow-[0_0_30px_hsl(217_91%_60%_/_0.3)] transition-shadow"
          >
            Masuk Sekarang
          </Link>
        </motion.div>
      );
    }

    return (
      <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
        {email && (
          <p className="text-xs text-muted-foreground text-center mb-2">
            Reset password untuk <span className="text-foreground/80 font-mono bg-white/[0.04] px-1.5 py-0.5 rounded">{email}</span>
          </p>
        )}

        {/* Password baru */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground/80 uppercase tracking-wider pl-1">
            Password Baru
          </label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors duration-200">
              <Lock size={16} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_hsl(217_91%_60%_/_0.1)] transition-all duration-300 text-sm"
              placeholder="Minimal 6 karakter"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground/70 transition-colors p-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Konfirmasi */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground/80 uppercase tracking-wider pl-1">
            Konfirmasi Password
          </label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors duration-200">
              <Lock size={16} />
            </div>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_hsl(217_91%_60%_/_0.1)] transition-all duration-300 text-sm"
              placeholder="Ulangi password baru"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground/70 transition-colors p-1"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Password strength indicator */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                password.length === 0
                  ? 'bg-white/[0.06]'
                  : password.length < 6
                  ? i <= 1 ? 'bg-red-500' : 'bg-white/[0.06]'
                  : password.length < 8
                  ? i <= 2 ? 'bg-yellow-500' : 'bg-white/[0.06]'
                  : password.length < 12
                  ? i <= 3 ? 'bg-emerald-500' : 'bg-white/[0.06]'
                  : 'bg-emerald-400'
              }`}
            />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="relative w-full py-3 rounded-xl font-semibold text-sm text-white overflow-hidden disabled:opacity-50 disabled:pointer-events-none transition-shadow duration-300 hover:shadow-[0_0_30px_hsl(217_91%_60%_/_0.3)] group mt-2"
        >
          <div className="absolute inset-0 gradient-primary" />
          <span className="relative flex items-center justify-center gap-2">
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Mereset...</>
            ) : (
              'Reset Password'
            )}
          </span>
        </motion.button>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Kembali ke Login
        </Link>
      </motion.form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050510]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#050510] via-[#0a0a2e] to-[#050510]" />
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.15]"
          style={{ background: 'radial-gradient(circle, hsl(217 91% 60%) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <motion.div
          animate={{ x: [0, -30, 20, 0], y: [0, 30, -30, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, hsl(250 80% 60%) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(217 91% 60% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(217 91% 60% / 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[420px] mx-4 z-10"
      >
        <div className="absolute -inset-[1px] rounded-3xl opacity-20" style={{ background: 'linear-gradient(135deg, hsl(217 91% 60% / 0.4), hsl(250 80% 60% / 0.2), transparent)' }} />
        <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-8 sm:p-10 shadow-[0_8px_64px_rgba(0,0,0,0.5)]">
          {!codeInvalid && !success && !verifying && (
            <div className="flex flex-col items-center mb-8">
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="relative mb-5">
                <div className="absolute inset-0 rounded-2xl opacity-50 blur-xl" style={{ background: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(250 80% 60%))' }} />
                <div className="relative w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
                  <Lock className="w-7 h-7 text-white" />
                </div>
              </motion.div>
              <h1 className="text-xl font-bold text-gradient">Reset Password</h1>
              <p className="text-muted-foreground text-sm mt-1.5 text-center">Buat password baru untuk akun Anda</p>
            </div>
          )}
          {renderContent()}
        </div>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="absolute bottom-6 text-[11px] text-muted-foreground/30 tracking-wider">
        © 2026 AbsensiX
      </motion.p>
    </div>
  );
};

export default ResetPasswordPage;
