import { config } from '../config.js';
import { bukaDenganToken } from '../mekari.js';
import { bacaRiwayat, catatTerkirim } from '../riwayat.js';
import { susunAttendance } from './hitung.js';
import { ambilJadwal, kirimAttendance, sudahDiajukan, urlAttendance } from './kirim.js';

// `daftarLembur` berisi { tanggal, mulai, selesai, libur } dengan jam yang sudah dimundurkan.
export async function ajukanAttendance(page, daftarLembur, { sungguhan }) {
  const riwayat = bacaRiwayat();
  const antrean = daftarLembur.filter((l) => !riwayat[`${l.tanggal} attendance`]);
  if (antrean.length === 0) return 0;

  const token = await bukaDenganToken(page, urlAttendance);
  let gagal = 0;

  for (const { tanggal, mulai, selesai, libur } of antrean) {
    try {
      const jadwal = await ambilJadwal(page, token, tanggal);
      const pengajuan = susunAttendance({
        tanggal,
        mulaiLembur: mulai,
        selesaiLembur: selesai,
        libur,
        jadwal,
        zonaWaktu: config.zonaWaktu,
      });
      if (pengajuan.lewati) {
        console.log(`\n${tanggal}  attendance dilewati: ${pengajuan.lewati}`);
        continue;
      }
      const tercatat = jadwal.is_check_in
        ? `${jadwal.actual_check_in} - ${jadwal.is_check_out ? jadwal.actual_check_out : '(belum clock out)'}`
        : '(tidak ada)';
      console.log(`\n${tanggal}  attendance ${pengajuan.masuk.slice(11)} - ${pengajuan.pulang.slice(11)}`);
      console.log(`  tercatat        ${tercatat}`);

      if (await sudahDiajukan(page, token, tanggal)) {
        console.log('  dilewati: sudah ada pengajuan attendance untuk tanggal ini');
        continue;
      }
      if (!sungguhan) {
        console.log('  belum dikirim (kirim dengan: npm run kirim)');
        continue;
      }
      const hasil = await kirimAttendance(page, token, pengajuan.isian);
      catatTerkirim(`${tanggal} attendance`, { jawaban: hasil.teks.slice(0, 500) });
      console.log(`  TERKIRIM. Jawaban Talenta: ${hasil.teks.slice(0, 200)}`);
    } catch (galat) {
      gagal += 1;
      console.log(`\n${tanggal}  attendance GAGAL: ${galat.message}`);
    }
  }
  return gagal;
}
