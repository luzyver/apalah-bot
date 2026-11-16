import assert from 'node:assert/strict';
import { test } from 'node:test';
import { catatanGeser, geserAgarSehari, isianDurasi } from '../src/lembur/hitung.js';
import { keMenit } from '../src/lembur/waktu.js';

const seg = (...pasangan) => pasangan.map(([mulai, selesai]) => ({ mulai: keMenit(mulai), selesai: keMenit(selesai) }));
const jadwal = { jadwalMasuk: keMenit('09:00:00'), jadwalPulang: keMenit('17:00:00') };
const nilai = (isian) => Object.fromEntries(isian.map(([k, v]) => [k.slice(16, -1), v]));

// Angka dari pengajuan 22 Okt 2026 yang direkam dari form asli.
test('hari kerja cocok dengan rekaman', () => {
  const segmen = seg(['20.15', '23.45']);
  assert.equal(catatanGeser(segmen), 'saya mundurin jadi 20.15 - 23.45 agar tidak submit beda hari');

  assert.deepEqual(nilai(isianDurasi({ segmen, libur: false, ...jadwal })), {
    actualHourIn: '', actualMinutesIn: '', actualHourOut: '', actualMinutesOut: '',
    hour_before: '0', minutes_before: '0', hour: '6', minutes: '45',
    hour_before_break: '0', minutes_before_break: '0', hour_after_break: '3', minutes_after_break: '15',
  });
});

// Angka dari pengajuan Sabtu 24 Okt 2026 yang direkam dari form asli.
test('hari libur dengan dua bagian cocok dengan rekaman', () => {
  const segmen = seg(['09.55', '15.15'], ['22.49', '23.59']);
  assert.deepEqual(nilai(isianDurasi({ segmen, libur: true, jadwalMasuk: 0, jadwalPulang: 0 })), {
    actualHourIn: '9', actualMinutesIn: '55', actualHourOut: '23', actualMinutesOut: '59',
    hour_before: '14', minutes_before: '4', hour: '0', minutes: '0',
    hour_before_break: '7', minutes_before_break: '34', hour_after_break: '0', minutes_after_break: '0',
  });
});

test('lewat tengah malam dimundurkan sampai selesai 23.59', () => {
  const { segmen, digeser } = geserAgarSehari(seg(['20.50', '00.49']));
  assert.equal(digeser, true);
  assert.deepEqual(segmen, seg(['20.00', '23.59']));
});

// Pemunduran 24 Okt 2026 seperti yang ditulis di pengajuan asli.
test('hanya bagian yang lewat tengah malam yang dimundurkan', () => {
  const { segmen } = geserAgarSehari(seg(['09.55', '15.15'], ['00.20', '01.30']));
  assert.deepEqual(segmen, seg(['09.55', '15.15'], ['22.49', '23.59']));
});

test('lembur sehari tidak digeser', () => {
  assert.equal(geserAgarSehari(seg(['21.43', '22.59'])).digeser, false);
});

test('selesai tepat 00.00 dimundurkan satu menit', () => {
  assert.deepEqual(geserAgarSehari(seg(['20.00', '00.00'])).segmen, seg(['19.59', '23.59']));
});

test('lembur yang bertumpuk jadwal kerja ditolak', () => {
  assert.throws(() => isianDurasi({ segmen: seg(['16.00', '19.00']), libur: false, ...jadwal }), /bertumpuk/);
});

test('bagian yang dimundurkan tidak boleh menabrak bagian sebelumnya', () => {
  assert.throws(() => geserAgarSehari(seg(['09.00', '23.30'], ['00.20', '01.30'])), /terlalu panjang/);
});
