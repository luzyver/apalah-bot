import { config } from '../config.js';
import { kirimForm } from '../talenta.js';
import { catatanGeser, geserAgarSehari, isianDurasi } from './hitung.js';
import { keMenit } from './waktu.js';

const BULAN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const urlLembur = `${config.urlAwal}my-info/over-time-info?id=${config.userId}`;

async function ambilJadwal(page, tanggal) {
  const { status, teks } = await kirimForm(page, '/my-info/get-overtime-shift', [
    ['date', tanggal],
    ['id', config.userId],
  ]);
  if (status !== 200) throw new Error(`Gagal mengambil jadwal ${tanggal} (status ${status})`);
  return JSON.parse(teks);
}

// Menyusun isian form lembur persis seperti yang dikirim halaman Talenta.
export async function susunPengajuan(page, lembur) {
  const jadwal = await ambilJadwal(page, lembur.tanggal);
  const shift = jadwal.shift?.[0];
  if (!shift) throw new Error(`Tidak ada jadwal kerja pada ${lembur.tanggal}`);
  const libur = Boolean(jadwal.dayOff);

  const { segmen, digeser } = geserAgarSehari(lembur.segmen);
  const keterangan = digeser ? `${lembur.keterangan}\n\n${catatanGeser(segmen)}` : lembur.keterangan;
  const [tahun, bulan, hari] = lembur.tanggal.split('-').map(Number);
  const durasi = isianDurasi({
    segmen,
    libur,
    jadwalMasuk: keMenit(shift.scheduleIn),
    jadwalPulang: keMenit(shift.scheduleOut),
  });

  const isian = [
    // Form mengisi kategori 1 untuk hari libur dan 0 untuk hari kerja.
    ['OvertimeRequest[category_id]', libur ? '1' : '0'],
    ['OvertimeRequest[user_id]', config.userId],
    ['overtime', `${hari} ${BULAN[bulan - 1]}, ${tahun}`],
    ['overtime_submit', lembur.tanggal],
    ['OvertimeRequest[date]', String(hari)],
    ['OvertimeRequest[month]', String(bulan)],
    ['OvertimeRequest[year]', String(tahun)],
    ['shift_id', String(shift.shiftId)],
    ...durasi,
    // Form asli mengirim ganti baris sebagai CRLF; tanpa itu catatan tampil satu baris.
    ['OvertimeRequest[description]', keterangan.replace(/\r?\n/g, '\r\n')],
    ['folder', 'dummy'],
    ['fileName', 'no-image.jpg'],
  ];
  return { isian, segmen, digeser, shift, libur };
}

export async function kirimPengajuan(page, isian) {
  const hasil = await kirimForm(page, '/my-info/add-overtime-request', isian);
  if (hasil.status !== 200) throw new Error(`Talenta menolak (status ${hasil.status}): ${hasil.teks.slice(0, 300)}`);
  return hasil;
}
