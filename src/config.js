import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ID akun disimpan di setelan.json, yang tidak ikut ke repo.
function bacaSetelan() {
  const berkas = path.join(root, 'setelan.json');
  if (!fs.existsSync(berkas)) {
    throw new Error(`Belum ada ${berkas}. Salin setelan.contoh.json lalu isi ID Anda.`);
  }
  const { userId, companyId } = JSON.parse(fs.readFileSync(berkas, 'utf8'));
  if (!userId || !companyId) throw new Error(`${berkas} harus memuat userId dan companyId.`);
  return { userId: String(userId), companyId: String(companyId) };
}

export const config = {
  urlAwal: 'https://hr.talenta.co/',
  hostLogin: 'account.mekari.com',
  // userId: ID karyawan di Talenta, terlihat di alamat halaman My Info (?id=...).
  // companyId: ID perusahaan, terlihat di alamat panggilan api.mekari.com (/companies/...).
  ...bacaSetelan(),
  // Dipakai bila Talenta tidak menyebut zona waktu, misalnya di hari libur.
  zonaWaktu: 'Asia/Jakarta',
  // Profil browser tersendiri, tidak bercampur dengan Edge harian.
  dirProfil: path.join(root, 'profil'),
  // Cookie sesi disimpan terpisah karena Edge membuangnya saat ditutup.
  berkasSesi: path.join(root, 'profil', 'sesi.json'),
  dirRekaman: path.join(root, 'rekaman'),
  berkasLembur: path.join(root, 'lembur.txt'),
  berkasRiwayat: path.join(root, 'terkirim.json'),
  // Hanya permintaan ke domain ini yang dicatat.
  domainDicatat: ['talenta.co', 'mekari.com'],
  batasTungguLoginMs: 5 * 60 * 1000,
};
