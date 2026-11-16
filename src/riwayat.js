import fs from 'node:fs';
import { config } from './config.js';

// Catatan pengajuan yang sudah terkirim, supaya tidak terkirim dua kali.
export function bacaRiwayat() {
  if (!fs.existsSync(config.berkasRiwayat)) return {};
  return JSON.parse(fs.readFileSync(config.berkasRiwayat, 'utf8'));
}

export function catatTerkirim(kunci, rincian) {
  const riwayat = bacaRiwayat();
  riwayat[kunci] = { waktu: new Date().toISOString(), ...rincian };
  fs.writeFileSync(config.berkasRiwayat, `${JSON.stringify(riwayat, null, 2)}\n`);
}
