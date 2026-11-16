import { keJam, keMenit } from '../lembur/waktu.js';

const jamLengkap = (menit) => `${keJam(menit).replace('.', ':')}:00`;

// Hari kerja: jam masuk selalu ditulis sebagai jam masuk jadwal (09.00). Hari libur
// biasanya tidak punya clock in, jadi jam masuk mengikuti jam mulai lembur.
function jamMasuk({ libur, jadwal, mulaiLembur }) {
  if (!libur) return jadwal.current_shift_sc_in;
  return jadwal.is_check_in ? jadwal.actual_check_in : jamLengkap(mulaiLembur);
}

// Menyusun pengajuan attendance untuk hari lembur: jam pulang diubah ke jam selesai lembur.
// `jadwal` adalah satu baris jawaban attendance_schedules/active.
export function susunAttendance({ tanggal, mulaiLembur, selesaiLembur, libur, jadwal, zonaWaktu }) {
  if (jadwal.locked) return { lewati: 'attendance tanggal ini sudah dikunci' };
  if (!libur) {
    if (!jadwal.is_check_in) return { lewati: 'tidak ada clock in tercatat, ajukan attendance manual' };
    if (selesaiLembur <= keMenit(jadwal.current_shift_sc_out)) {
      return { lewati: 'lembur sebelum jam masuk, attendance tidak diubah' };
    }
  }
  if (jadwal.is_check_in && jadwal.is_check_out && keMenit(jadwal.actual_check_out) >= selesaiLembur) {
    return { lewati: `clock out tercatat ${jadwal.actual_check_out} sudah mencakup lembur` };
  }

  const masuk = `${tanggal}T${jamMasuk({ libur, jadwal, mulaiLembur })}`;
  const pulang = `${tanggal}T${jamLengkap(selesaiLembur)}`;
  return {
    masuk,
    pulang,
    isian: [
      ['attendance_date', tanggal],
      ['reason', 'Overtime'],
      ['shift_id', String(jadwal.current_shift_id)],
      ['checkin', masuk],
      ['checkin_timezone', jadwal.ci_timezone ?? zonaWaktu],
      ['checkout', pulang],
      ['checkout_timezone', jadwal.co_timezone ?? zonaWaktu],
    ],
  };
}
