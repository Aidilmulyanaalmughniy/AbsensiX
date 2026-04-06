import type { AttendanceRecord, ClassStats, LeaderboardEntry } from '@/types';

const KELAS_LIST = ['10-A', '10-B', '11-A', '11-B', '12-A', '12-B'];
const NAMA_LIST = [
  'Andi Pratama', 'Budi Santoso', 'Citra Dewi', 'Dian Safitri', 'Eka Putra',
  'Fajar Hidayat', 'Gita Lestari', 'Hendra Wijaya', 'Indah Permata', 'Joko Susilo',
  'Kartika Sari', 'Lukman Hakim', 'Maya Anggraeni', 'Nadia Putri', 'Omar Faruk',
  'Putri Ayu', 'Rahmat Kurniawan', 'Sari Wulandari', 'Taufik Ismail', 'Umar Bakri',
  'Vina Oktavia', 'Wahyu Nugroho', 'Xena Maharani', 'Yoga Pratama', 'Zahra Amelia',
  'Agus Riyanto', 'Bayu Firmansyah', 'Cantika Puspita', 'Dewi Ratnasari', 'Erwin Saputra',
];

const today = new Date().toISOString().split('T')[0];

export const generateAttendance = (kelas?: string): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const filteredNames = kelas ? NAMA_LIST.slice(0, 15) : NAMA_LIST;
  const statuses: AttendanceRecord['status'][] = ['hadir', 'hadir', 'hadir', 'hadir', 'sakit', 'izin', 'alpha', 'belum', 'hadir', 'hadir'];

  filteredNames.forEach((nama, i) => {
    const status = statuses[i % statuses.length];
    const hour = 6 + Math.floor(Math.random() * 2);
    const minute = Math.floor(Math.random() * 60);
    const jam = status === 'hadir' ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` : '-';
    const late = status === 'hadir' && hour >= 7 && minute > 0 ? minute * 60 : 0;

    records.push({
      id: `${today}_${i}`,
      student_id: `STD${String(i + 1).padStart(3, '0')}`,
      nama,
      kelas: kelas || KELAS_LIST[i % KELAS_LIST.length],
      tanggal: today,
      jam,
      status,
      late_seconds: late,
    });
  });
  return records;
};

export const generateClassStats = (): ClassStats[] =>
  KELAS_LIST.map(kelas => {
    const total = 30;
    const hadir = 20 + Math.floor(Math.random() * 8);
    const sakit = Math.floor(Math.random() * 3);
    const izin = Math.floor(Math.random() * 3);
    const alpha = Math.floor(Math.random() * 2);
    const belum = total - hadir - sakit - izin - alpha;
    return { kelas, total, hadir, sakit, izin, alpha, belum: Math.max(0, belum), percentage: Math.round((hadir / total) * 100) };
  });

export const generateLeaderboard = (kelas?: string): LeaderboardEntry[] => {
  const names = kelas ? NAMA_LIST.slice(0, 10) : NAMA_LIST.slice(0, 15);
  return names
    .map((nama, i) => ({
      rank: 0,
      nama,
      kelas: kelas || KELAS_LIST[i % KELAS_LIST.length],
      jam: `06:${String(5 + i * 3).padStart(2, '0')}`,
    }))
    .sort((a, b) => a.jam.localeCompare(b.jam))
    .map((e, i) => ({ ...e, rank: i + 1 }));
};

export const generateWeeklyData = () => {
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
  return days.map(day => ({
    day,
    hadir: 140 + Math.floor(Math.random() * 30),
    sakit: Math.floor(Math.random() * 10),
    izin: Math.floor(Math.random() * 8),
    alpha: Math.floor(Math.random() * 5),
  }));
};

export { KELAS_LIST };
