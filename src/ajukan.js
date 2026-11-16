import fs from 'node:fs';
import { ajukanAttendance } from './attendance/alur.js';
import { bukaBrowser, tutupBrowser } from './browser.js';
import { config } from './config.js';
import { ajukanLembur } from './lembur/alur.js';
import { bacaBerkasLembur } from './lembur/berkas.js';
import { bacaRiwayat } from './riwayat.js';
import { SesiHabis } from './sesi.js';

// Tanpa --kirim bot hanya menampilkan apa yang akan diajukan.
const sungguhan = process.argv.includes('--kirim');

if (!fs.existsSync(config.berkasLembur)) {
  console.error(`Belum ada ${config.berkasLembur}. Salin lembur.contoh.txt lalu isi.`);
  process.exit(1);
}

// Lembur ikut diproses selama lembur atau attendance-nya belum terkirim.
const riwayat = bacaRiwayat();
const antrean = bacaBerkasLembur(config.berkasLembur).filter(
  (l) => !riwayat[l.kunci] || !riwayat[`${l.tanggal} attendance`],
);
if (antrean.length === 0) {
  console.log('Tidak ada lembur yang belum diajukan.');
  process.exit(0);
}

// Bot berjalan tanpa jendela; --tampil memperlihatkan browsernya.
const { context, page } = await bukaBrowser({ headless: !process.argv.includes('--tampil') });
let gagal = 0;
try {
  const lembur = await ajukanLembur(page, antrean, { sungguhan });
  gagal = lembur.gagal + (await ajukanAttendance(page, lembur.beres, { sungguhan }));
} catch (galat) {
  if (!(galat instanceof SesiHabis)) throw galat;
  console.error(galat.message);
  gagal = 1;
} finally {
  await tutupBrowser(context);
}
process.exitCode = gagal ? 1 : 0;
