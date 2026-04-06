export type UserRole = 'dev' | 'kepsek' | 'wakel' | 'km' | 'absensi' | 'siswa';

export interface User {
  uid: string;
  username: string;
  nama_lengkap: string;
  role: UserRole;
  kelas?: string;
  isStudent: boolean;
  isOsis: boolean;
  enabled: boolean;
  rfid_uid?: string;
}

export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alpha' | 'belum';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  nama: string;
  kelas: string;
  tanggal: string;
  jam: string;
  status: AttendanceStatus;
  late_seconds: number;
}

export interface ClassStats {
  kelas: string;
  total: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  belum: number;
  percentage: number;
}

export interface LeaderboardEntry {
  rank: number;
  nama: string;
  kelas: string;
  jam: string;
}

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  scheduledAt?: string; // ISO date string
  scheduledEnd?: string; // ISO date string
}

export const PERMISSIONS: Record<UserRole, string[]> = {
  dev: ['view_all', 'manage_users', 'dev_panel', 'export', 'edit_attendance'],
  kepsek: ['view_all', 'export'],
  wakel: ['view_class', 'edit_attendance', 'export'],
  km: ['view_class', 'view_self', 'export'],
  absensi: ['view_class', 'view_self', 'edit_attendance'],
  siswa: ['view_self'],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  dev: 'Developer',
  kepsek: 'Kepala Sekolah',
  wakel: 'Wali Kelas',
  km: 'Ketua Murid',
  absensi: 'Petugas Absensi',
  siswa: 'Siswa',
};
