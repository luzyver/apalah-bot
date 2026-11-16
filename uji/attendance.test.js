import assert from 'node:assert/strict';
import { test } from 'node:test';
import { susunAttendance } from '../src/attendance/hitung.js';
import { keMenit } from '../src/lembur/waktu.js';

// Jadwal 22 Okt 2026 (hari kerja) seperti jawaban Talenta yang direkam.
const jadwal = {
  current_shift_id: 1001,
  current_shift_sc_in: '09:00:00',
  current_shift_sc_out: '17:00:00',
  is_check_in: true,
  actual_check_in: '09:12:30',
  is_check_out: true,
  actual_check_out: '17:42:05',
  locked: false,
  ci_timezone: 'Asia/Jakarta',
  co_timezone: 'Asia/Jakarta',
};
const dasar = {
  tanggal: '2026-10-22',
  mulaiLembur: keMenit('20.15'),
  selesaiLembur: keMenit('23.45'),
  libur: false,
  jadwal,
  zonaWaktu: 'Asia/Jakarta',
};

test('hari kerja: jam masuk mengikuti jadwal, jam pulang mengikuti selesai lembur', () => {
  const { isian } = susunAttendance(dasar);
  assert.deepEqual(isian, [
    ['attendance_date', '2026-10-22'],
    ['reason', 'Overtime'],
    ['shift_id', '1001'],
    ['checkin', '2026-10-22T09:00:00'],
    ['checkin_timezone', 'Asia/Jakarta'],
    ['checkout', '2026-10-22T23:45:00'],
    ['checkout_timezone', 'Asia/Jakarta'],
  ]);
});

// Jadwal dan pengajuan Sabtu 24 Okt 2026 seperti yang direkam.
test('hari libur tanpa clock in cocok dengan rekaman', () => {
  const libur = {
    current_shift_id: 1002,
    current_shift_sc_in: '00:00:00',
    current_shift_sc_out: '00:00:00',
    is_check_in: false,
    actual_check_in: '00:00:00',
    is_check_out: false,
    actual_check_out: '00:00:00',
    locked: false,
    ci_timezone: null,
    co_timezone: null,
  };
  const { isian } = susunAttendance({
    ...dasar,
    tanggal: '2026-10-24',
    mulaiLembur: keMenit('09.55'),
    selesaiLembur: keMenit('23.59'),
    libur: true,
    jadwal: libur,
  });
  assert.deepEqual(isian, [
    ['attendance_date', '2026-10-24'],
    ['reason', 'Overtime'],
    ['shift_id', '1002'],
    ['checkin', '2026-10-24T09:55:00'],
    ['checkin_timezone', 'Asia/Jakarta'],
    ['checkout', '2026-10-24T23:59:00'],
    ['checkout_timezone', 'Asia/Jakarta'],
  ]);
});

test('dilewati bila clock out tercatat sudah mencakup lembur', () => {
  const hasil = susunAttendance({ ...dasar, jadwal: { ...jadwal, actual_check_out: '23:50:10' } });
  assert.match(hasil.lewati, /sudah mencakup/);
});

test('dilewati bila tidak ada clock in di hari kerja atau attendance dikunci', () => {
  assert.match(susunAttendance({ ...dasar, jadwal: { ...jadwal, is_check_in: false } }).lewati, /clock in/);
  assert.match(susunAttendance({ ...dasar, jadwal: { ...jadwal, locked: true } }).lewati, /dikunci/);
});
