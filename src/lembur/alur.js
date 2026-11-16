import { bacaRiwayat, catatTerkirim } from '../riwayat.js';
import { bukaDenganLogin } from '../sesi.js';
import { tulisSegmen } from './hitung.js';
import { kirimPengajuan, susunPengajuan, urlLembur } from './kirim.js';

function tampilkan(lembur, { isian, segmen, digeser, shift, libur }) {
  const n = Object.fromEntries(isian);
  const f = (nama) => n[`OvertimeRequest[${nama}]`];
  console.log(`\n${lembur.tanggal}  lembur ${tulisSegmen(segmen)}${digeser ? ' (dimundurkan)' : ''}`);
  console.log(libur ? '  hari libur' : `  jadwal kerja    ${shift.scheduleIn}-${shift.scheduleOut}`);
  console.log(`  sebelum jadwal  ${f('hour_before')}j ${f('minutes_before')}m, istirahat ${f('hour_before_break')}j ${f('minutes_before_break')}m`);
  console.log(`  sesudah jadwal  ${f('hour')}j ${f('minutes')}m, istirahat ${f('hour_after_break')}j ${f('minutes_after_break')}m`);
}

// Mengembalikan lembur yang berhasil disusun (untuk attendance) dan jumlah yang gagal.
export async function ajukanLembur(page, daftar, { sungguhan }) {
  const riwayat = bacaRiwayat();
  const beres = [];
  let gagal = 0;

  await bukaDenganLogin(page, urlLembur);
  for (const lembur of daftar) {
    try {
      const pengajuan = await susunPengajuan(page, lembur);
      tampilkan(lembur, pengajuan);

      if (riwayat[lembur.kunci]) {
        console.log('  sudah terkirim sebelumnya');
      } else if (!sungguhan) {
        console.log('  belum dikirim (kirim dengan: npm run kirim)');
      } else {
        const hasil = await kirimPengajuan(page, pengajuan.isian);
        catatTerkirim(lembur.kunci, { jawaban: hasil.teks.slice(0, 500) });
        console.log(`  TERKIRIM. Jawaban Talenta: ${hasil.teks.slice(0, 200) || '(kosong)'}`);
      }
      beres.push({
        tanggal: lembur.tanggal,
        mulai: pengajuan.segmen[0].mulai,
        selesai: pengajuan.segmen.at(-1).selesai,
        libur: pengajuan.libur,
      });
    } catch (galat) {
      gagal += 1;
      console.log(`\n${lembur.tanggal}  lembur GAGAL: ${galat.message}`);
    }
  }
  return { beres, gagal };
}
