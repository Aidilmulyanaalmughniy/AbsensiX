import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AttendanceRecord, ClassStats, LeaderboardEntry } from '@/types';

// ===== ATTENDANCE HOOK =====
export const useAttendance = (kelas?: string, tanggal?: string, uid?: string) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
 
  setLoading(true);

  const constraints: any[] = [];

if (uid) {
  constraints.push(where('student_id', '==', uid));
}

if (kelas) {
  constraints.push(where('kelas', '==', kelas));
}

if (tanggal) {
  constraints.push(where('tanggal', '==', tanggal));
}
  const q = query(collection(db, 'attendance'), ...constraints);

  const unsub = onSnapshot(q, (snap) => {
    const data: AttendanceRecord[] = [];
    snap.forEach(d => data.push({ id: d.id, ...d.data() } as AttendanceRecord));

    console.log("HASIL:", data); // 🔥 DEBUG

    setRecords(data);
    setLoading(false);
  });

  return unsub;
}, [kelas, tanggal, uid]);

  const updateStatus = useCallback(async (id: string, status: AttendanceRecord['status']) => {
    await setDoc(doc(db, 'attendance', id), { status }, { merge: true });
  }, []);

  return { records, loading, updateStatus };
};

// ===== CLASS STATS HOOK =====
export const useClassStats = (kelas?: string) => {
  const [stats, setStats] = useState<ClassStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
const offset = now.getTimezoneOffset() * 60000;
const local = new Date(now.getTime() - offset);
const today = local.toISOString().split('T')[0];
    const constraints: any[] = [where('tanggal', '==', today)];
    if (kelas) constraints.push(where('kelas', '==', kelas));

    const q = query(collection(db, 'attendance'), ...constraints);
    
    const unsub = onSnapshot(q, async (snap) => {
      const records: AttendanceRecord[] = [];
      snap.forEach(d => records.push({ id: d.id, ...d.data() } as AttendanceRecord));

      // Get classes
      const classSnap = await getDocs(collection(db, 'classes'));
      const classMap = new Map<string, number>();
      classSnap.forEach(d => {
        const data = d.data();
        if (!kelas || data.nama === kelas) {
          classMap.set(data.nama, data.totalSiswa || 30);
        }
      });

      const statsMap = new Map<string, ClassStats>();
      classMap.forEach((total, kelasName) => {
        statsMap.set(kelasName, {
          kelas: kelasName, total, hadir: 0, sakit: 0, izin: 0, alpha: 0, belum: total, percentage: 0
        });
      });

      records.forEach(r => {
        const s = statsMap.get(r.kelas);
        if (!s) return;
        if (r.status === 'hadir') { s.hadir++; s.belum--; }
        else if (r.status === 'sakit') { s.sakit++; s.belum--; }
        else if (r.status === 'izin') { s.izin++; s.belum--; }
        else if (r.status === 'alpha') { s.alpha++; s.belum--; }
      });

      statsMap.forEach(s => {
        s.belum = Math.max(0, s.belum);
        s.percentage = s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0;
      });

      setStats(Array.from(statsMap.values()));
      setLoading(false);
    });

    return unsub;
  }, [kelas]);

  return { stats, loading };
};

// ===== LEADERBOARD HOOK =====
export const useLeaderboard = (kelas?: string) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
const offset = now.getTimezoneOffset() * 60000;
const local = new Date(now.getTime() - offset);
const today = local.toISOString().split('T')[0];
    const constraints: any[] = [
      where('tanggal', '==', today),
      where('status', '==', 'hadir'),
    ];
    if (kelas) constraints.push(where('kelas', '==', kelas));

    const q = query(collection(db, 'attendance'), ...constraints);
    
    const unsub = onSnapshot(q, (snap) => {
      const data: { nama: string; kelas: string; jam: string }[] = [];
      snap.forEach(d => {
        const r = d.data();
        if (r.jam && r.jam !== '-') {
          data.push({ nama: r.nama, kelas: r.kelas, jam: r.jam });
        }
      });

      const sorted = data
        .sort((a, b) => a.jam.localeCompare(b.jam))
        .map((e, i) => ({ ...e, rank: i + 1 }));

      setEntries(sorted);
      setLoading(false);
    });

    return unsub;
  }, [kelas]);

  return { entries, loading };
};

// ===== WEEKLY DATA HOOK =====
export const useWeeklyData = () => {
  const [data, setData] = useState<{ day: string; hadir: number; sakit: number; izin: number; alpha: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeekly = async () => {
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const today = new Date();
      const weekData: typeof data = [];

      for (let i = 4; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const offset = d.getTimezoneOffset() * 60000;
const local = new Date(d.getTime() - offset);
const dateStr = local.toISOString().split('T')[0];
        const dayName = days[d.getDay()];
        const q = query(collection(db, 'attendance'), where('tanggal', '==', dateStr));
        const snap = await getDocs(q);
        
        let hadir = 0, sakit = 0, izin = 0, alpha = 0;
        snap.forEach(doc => {
          const r = doc.data();
          if (r.status === 'hadir') hadir++;
          else if (r.status === 'sakit') sakit++;
          else if (r.status === 'izin') izin++;
          else if (r.status === 'alpha') alpha++;
        });

        weekData.push({ day: dayName, hadir, sakit, izin, alpha });
      }

      setData(weekData);
      setLoading(false);
    };

    fetchWeekly();
  }, []);

  return { data, loading };
};

// ===== CLASSES HOOK =====
export interface ClassData {
  id: string;
  nama: string;
  waliKelas: string;
  totalSiswa: number;
  tahunAjaran: string;
}

export const useClasses = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classes'), (snap) => {
      const data: ClassData[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() } as ClassData));
      setClasses(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const addClass = async (data: Omit<ClassData, 'id'>) => {
    const id = data.nama.replace(/\s/g, '-');
    await setDoc(doc(db, 'classes', id), data);
  };

  const updateClass = async (id: string, data: Partial<ClassData>) => {
    await setDoc(doc(db, 'classes', id), data, { merge: true });
  };

  const deleteClass = async (id: string) => {
    await deleteDoc(doc(db, 'classes', id));
  };

  return { classes, loading, addClass, updateClass, deleteClass };
};

// ===== KELAS LIST from Firestore =====
export const useKelasList = () => {
  const [kelasList, setKelasList] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classes'), (snap) => {
      const names: string[] = [];
      snap.forEach(d => names.push(d.data().nama || d.id));
      setKelasList(names.sort());
    });
    return unsub;
  }, []);

  return kelasList;
};
