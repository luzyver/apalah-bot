import { config } from '../config.js';
import { panggilApi } from '../mekari.js';

const { companyId, userId } = config;
const jalurPengajuan = `/internal/talenta-time-off/v1/companies/${companyId}/users/${userId}/attendance-requests`;

export const urlAttendance = `${config.urlAwal}my-info/attendance?id=${userId}`;

export async function ambilJadwal(page, token, tanggal) {
  const { teks } = await panggilApi(
    page,
    token,
    `/internal/talenta-attendance-web/v1/organisations/${companyId}/attendance_schedules/active?schedule_date=${tanggal}&show_multiple=1&user_id=${userId}`,
  );
  const [jadwal] = JSON.parse(teks).data ?? [];
  if (!jadwal) throw new Error(`Tidak ada jadwal kerja pada ${tanggal}`);
  return jadwal;
}

const STATUS_BATAL = ['canceled', 'cancelled', 'rejected'];

// Daftar pengajuan dikelompokkan per bulan tanggal attendance. Pengajuan yang sudah
// dibatalkan atau ditolak tidak dihitung, sehingga tanggalnya bisa diajukan lagi.
export async function sudahDiajukan(page, token, tanggal) {
  const { teks } = await panggilApi(page, token, `${jalurPengajuan}?page=1&limit=100&month=${tanggal.slice(0, 7)}`);
  const daftar = JSON.parse(teks).data?.data ?? [];
  return daftar.some(
    (p) => p.attendance_date === tanggal && !STATUS_BATAL.includes(String(p.status).toLowerCase()),
  );
}

export async function kirimAttendance(page, token, isian) {
  return panggilApi(page, token, jalurPengajuan, { form: isian });
}
