import { keJam, pecah } from './waktu.js';

const SEHARI = 24 * 60;
const total = (segmen) => segmen.reduce((jumlah, s) => jumlah + (s.selesai - s.mulai), 0);

// Jam yang lebih kecil dari jam sebelumnya dianggap sudah masuk hari berikutnya,
// misalnya "09.55 - 15.15 & 00.20 - 01.30" atau "21.15 - 00.45".
export function urutkan(segmenMentah) {
  let akhir = 0;
  return segmenMentah.map(({ mulai, selesai }) => {
    while (mulai < akhir) mulai += SEHARI;
    while (selesai <= mulai) selesai += SEHARI;
    akhir = selesai;
    return { mulai, selesai };
  });
}

// Talenta mencatat lembur pada satu tanggal. Bagian yang lewat tengah malam dimundurkan
// sampai selesai tepat 23.59, dengan lama lembur tetap sama.
export function geserAgarSehari(segmenMentah) {
  const segmen = urutkan(segmenMentah);
  const akhir = segmen.at(-1).selesai;
  if (akhir < SEHARI) return { segmen, digeser: false };

  const geser = akhir - (SEHARI - 1);
  let batas = 0;
  const hasil = segmen.map((s) => {
    const baru = s.selesai >= SEHARI ? { mulai: s.mulai - geser, selesai: s.selesai - geser } : s;
    if (baru.mulai < batas) throw new Error('Lembur terlalu panjang untuk dimuat dalam satu tanggal');
    batas = baru.selesai;
    return baru;
  });
  return { segmen: hasil, digeser: true };
}

// Hari kerja: lama lembur dihitung dari batas jadwal kerja, dan waktu yang tidak dipakai
// lembur diisi sebagai istirahat. Contoh: jadwal pulang 17.00, lembur 20.15-23.45 menjadi
// lembur 6 jam 45 menit dengan istirahat 3 jam 15 menit.
function durasiHariKerja(segmen, jadwalMasuk, jadwalPulang) {
  const sebelum = segmen.filter((s) => s.selesai <= jadwalMasuk);
  const sesudah = segmen.filter((s) => s.mulai >= jadwalPulang);
  if (sebelum.length + sesudah.length !== segmen.length) {
    throw new Error(`Lembur bertumpuk dengan jadwal kerja ${keJam(jadwalMasuk)}-${keJam(jadwalPulang)}`);
  }
  const rentangSebelum = sebelum.length ? jadwalMasuk - sebelum[0].mulai : 0;
  const rentangSesudah = sesudah.length ? sesudah.at(-1).selesai - jadwalPulang : 0;
  return {
    sebelum: rentangSebelum,
    jedaSebelum: rentangSebelum - total(sebelum),
    sesudah: rentangSesudah,
    jedaSesudah: rentangSesudah - total(sesudah),
  };
}

// Hari libur: form meminta jam masuk dan keluar, seluruh rentangnya masuk kolom
// "sebelum", dan jeda di antara bagian lembur diisi sebagai istirahat.
function durasiHariLibur(segmen) {
  const rentang = segmen.at(-1).selesai - segmen[0].mulai;
  return { sebelum: rentang, jedaSebelum: rentang - total(segmen), sesudah: 0, jedaSesudah: 0 };
}

export function isianDurasi({ segmen, libur, jadwalMasuk, jadwalPulang }) {
  const d = libur ? durasiHariLibur(segmen) : durasiHariKerja(segmen, jadwalMasuk, jadwalPulang);
  const masuk = libur ? pecah(segmen[0].mulai) : { jam: '', menit: '' };
  const keluar = libur ? pecah(segmen.at(-1).selesai) : { jam: '', menit: '' };

  return [
    ['OvertimeRequest[actualHourIn]', masuk.jam],
    ['OvertimeRequest[actualMinutesIn]', masuk.menit],
    ['OvertimeRequest[actualHourOut]', keluar.jam],
    ['OvertimeRequest[actualMinutesOut]', keluar.menit],
    ['OvertimeRequest[hour_before]', pecah(d.sebelum).jam],
    ['OvertimeRequest[minutes_before]', pecah(d.sebelum).menit],
    ['OvertimeRequest[hour]', pecah(d.sesudah).jam],
    ['OvertimeRequest[minutes]', pecah(d.sesudah).menit],
    ['OvertimeRequest[hour_before_break]', pecah(d.jedaSebelum).jam],
    ['OvertimeRequest[minutes_before_break]', pecah(d.jedaSebelum).menit],
    ['OvertimeRequest[hour_after_break]', pecah(d.jedaSesudah).jam],
    ['OvertimeRequest[minutes_after_break]', pecah(d.jedaSesudah).menit],
  ].map(([nama, nilai]) => [nama, String(nilai)]);
}

export function tulisSegmen(segmen) {
  return segmen.map((s) => `${keJam(s.mulai)} - ${keJam(s.selesai)}`).join(' & ');
}

export function catatanGeser(segmen) {
  return `saya mundurin jadi ${tulisSegmen(segmen)} agar tidak submit beda hari`;
}
