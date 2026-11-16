# talenta-bot

Bot untuk mengajukan lembur (overtime) di Talenta beserta pengajuan attendance pada hari lembur itu, memakai akun karyawan sendiri. Bot membuka Talenta lewat Edge dengan login Anda, lalu mengirim pengajuan yang sama seperti yang dikirim form Talenta.

Bot ini bukan produk resmi Mekari dan tidak memakai API resmi Talenta. Bentuk pengajuannya ditiru dari form Talenta pada satu perusahaan, jadi di perusahaan lain bisa saja berbeda: selalu periksa dulu hasil `npm run ajukan` sebelum mengirim.

## Yang dibutuhkan

- Windows dengan Microsoft Edge
- Node.js 20 atau lebih baru

## Pasang

```
npm install
copy setelan.contoh.json setelan.json
copy lembur.contoh.txt lembur.txt
npm run login
```

Isi `setelan.json`:

- `userId`: ID karyawan, terlihat di alamat halaman My Info Talenta (`...?id=1234567`).
- `companyId`: ID perusahaan, terlihat di alamat panggilan ke `api.mekari.com` (`/companies/1234/...`) pada tab Network di DevTools.

- `email` dan `password` (opsional): bila diisi, bot login sendiri saat sesi habis. Hanya untuk login email + password; bila Mekari meminta captcha atau OTP, login tetap harus manual. Password tersimpan apa adanya di berkas ini, jadi isi hanya di komputer pribadi. Sebagai ganti berkas, keduanya bisa diberikan lewat variabel lingkungan `TALENTA_EMAIL` dan `TALENTA_PASSWORD`.

`npm run login` membuka jendela Edge untuk login ke Talenta. Sesi login disimpan di folder `profil/` dan dipakai lagi pada perintah berikutnya.

## Menulis lembur.txt

Tiap lembur diawali baris tanggal, lalu keterangannya. Keterangan harus memuat satu baris jam dalam kurung siku; seluruh keterangan dikirim sebagai catatan lembur.

```
## 2026-11-04
[21.43 - 22.59] Disuruh atasan
- Kegiatan pertama
- Kegiatan kedua

## 2026-11-07
[09.55 - 15.15 & 00.20 - 01.30] Disuruh atasan
- Lembur yang terputus, tiap bagian dipisah dengan &
```

Satu tanggal ditulis satu kali. Lembur yang terputus digabung dalam satu baris jam dengan `&`.

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `npm run ajukan` | Menampilkan apa yang akan diajukan, tanpa mengirim |
| `npm run kirim` | Mengirim lembur dan attendance yang belum terkirim |
| `npm run login` | Login ulang bila sesi habis |
| `npm run rekam` | Merekam pengajuan manual sebagai bahan pengembangan |
| `npm test` | Menjalankan tes |

`ajukan` dan `kirim` berjalan tanpa jendela browser. Untuk memperlihatkan browsernya: `node src/ajukan.js --tampil` (tambah `--kirim` untuk mengirim).

## Aturan yang dipakai bot

- **Hari kerja:** lama lembur dihitung dari jam pulang jadwal sampai jam selesai lembur, dan jeda sebelum lembur dimulai diisi sebagai istirahat.
- **Hari libur:** jam masuk dan keluar diisi dari jam lembur, dan jeda di antara bagian lembur diisi sebagai istirahat.
- **Lewat tengah malam:** bagian yang melewati 00.00 dimundurkan sampai selesai tepat 23.59 dengan lama yang sama, dan catatan lembur diberi keterangan soal pemunduran itu.
- **Attendance hari kerja:** jam masuk ditulis sebagai jam masuk jadwal, jam pulang sebagai jam selesai lembur. Hari kerja tanpa clock in dilewati.
- **Attendance hari libur:** jam masuk mengikuti jam mulai lembur, jam pulang mengikuti jam selesai lembur.
- **Agar tidak dobel:** yang sudah terkirim dicatat di `terkirim.json` dan dilewati. Attendance juga dilewati bila di Talenta sudah ada pengajuan untuk tanggal itu. Lembur ganda di Talenta tidak terdeteksi, jadi jangan menghapus `terkirim.json` dan jangan memasukkan lembur yang sudah diajukan manual.

## Berkas yang tidak boleh dibagikan

`profil/` (cookie login), `rekaman/`, `lembur.txt`, `terkirim.json`, dan `setelan.json` berisi data pribadi dan sudah dikecualikan lewat `.gitignore`.
