import fs from 'node:fs';
import { keMenit } from './waktu.js';

const POLA_TANGGAL = /^##\s*(\d{4})-(\d{2})-(\d{2})\s*$/;
const POLA_JAM = /^\[([^\]]+)\]/m;
const POLA_SEGMEN = /^\s*(\d{1,2}[.:]\d{2})\s*-\s*(\d{1,2}[.:]\d{2})\s*$/;

function bacaSegmen(tanggal, teks) {
  return teks.split('&').map((bagian) => {
    const cocok = POLA_SEGMEN.exec(bagian);
    if (!cocok) throw new Error(`Lembur ${tanggal}: jam "${bagian.trim()}" tidak dikenali`);
    return { mulai: keMenit(cocok[1]), selesai: keMenit(cocok[2]) };
  });
}

// Membaca lembur.txt: tiap lembur diawali baris "## 2026-10-22", lalu keterangan yang
// memuat baris jam, misalnya "[21.15 - 00.45] Disuruh atasan". Lembur yang terputus
// ditulis dengan "&": "[09.55 - 15.15 & 00.20 - 01.30]".
export function bacaBerkasLembur(jalur) {
  const daftar = [];
  let kini = null;

  for (const baris of fs.readFileSync(jalur, 'utf8').split(/\r?\n/)) {
    const tanggal = POLA_TANGGAL.exec(baris);
    if (tanggal) {
      kini = { tanggal: `${tanggal[1]}-${tanggal[2]}-${tanggal[3]}`, baris: [] };
      daftar.push(kini);
    } else if (kini) {
      kini.baris.push(baris);
    }
  }

  return daftar.map(({ tanggal, baris }) => {
    const keterangan = baris.join('\n').trim();
    const jam = POLA_JAM.exec(keterangan);
    if (!jam) throw new Error(`Lembur ${tanggal}: tidak ada baris jam, contoh "[21.15 - 00.45]"`);
    return { tanggal, segmen: bacaSegmen(tanggal, jam[1]), keterangan, kunci: `${tanggal} lembur` };
  });
}
