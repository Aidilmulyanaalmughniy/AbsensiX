import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, ArrowLeft, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email tidak boleh kosong');
      return;
    }
    if (!validateEmail(email)) {
      setError('Format email tidak valid');
      return;
    }

    setIsLoading(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setSuccess(true);
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/user-not-found') {
        setError('Email tidak terdaftar dalam sistem');
      } else if (code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan. Coba lagi nanti.');
      } else if (code === 'auth/invalid-email') {
        setError('Format email tidak valid');
      } else {
        setError('Gagal mengirim email reset. Periksa koneksi internet.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050510]">
      {/* Background */}
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

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[420px] mx-4 z-10"
      >
        <div className="absolute -inset-[1px] rounded-3xl opacity-20" style={{ background: 'linear-gradient(135deg, hsl(217 91% 60% / 0.4), hsl(250 80% 60% / 0.2), transparent)' }} />

        <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-8 sm:p-10 shadow-[0_8px_64px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative mb-5"
            >
              <div className="absolute inset-0 rounded-2xl opacity-50 blur-xl" style={{ background: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(250 80% 60%))' }} />
              <div className="relative w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
                <Mail className="w-7 h-7 text-white" />
              </div>
            </motion.div>
            <h1 className="text-xl font-bold text-gradient">Lupa Password</h1>
            <p className="text-muted-foreground text-sm mt-1.5 text-center max-w-[280px]">
              Masukkan email akun Anda untuk menerima link reset password
            </p>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5"
              >
                <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-emerald-300">Email Terkirim!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Link reset password telah dikirim ke <span className="text-foreground/80 font-mono">{email}</span>. Periksa inbox atau folder spam.
                    </p>
                  </div>
                </div>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium text-primary/80 border border-white/[0.08] hover:bg-white/[0.04] transition-all duration-200"
                >
                  <ArrowLeft size={16} /> Kembali ke Login
                </Link>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-muted-foreground/80 uppercase tracking-wider pl-1">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors duration-200">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_hsl(217_91%_60%_/_0.1)] transition-all duration-300 text-sm"
                      placeholder="contoh@email.com"
                      autoFocus
                    />
                  </div>
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
                      <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                    ) : (
                      'Kirim Link Reset'
                    )}
                  </span>
                </motion.button>

                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    <ArrowLeft size={14} /> Kembali ke Login
                  </Link>
                  <a
                    href="https://wa.me/6282130892384?text=Halo%20admin%2C%20saya%20butuh%20bantuan%20reset%20password%20AbsensiX."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors duration-200"
                  >
                    <MessageCircle size={14} /> Hubungi Admin via WhatsApp
                  </a>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-6 text-[11px] text-muted-foreground/30 tracking-wider"
      >
        © 2026 AbsensiX
      </motion.p>
    </div>
  );
};

export default ForgotPasswordPage;
