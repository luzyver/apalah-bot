import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const HEADER_RAHASIA = ['cookie', 'set-cookie', 'authorization', 'x-csrf-token', 'x-xsrf-token'];
const KUNCI_RAHASIA = /pass(word)?|token|secret|otp|pin|csrf/i;
const BATAS_ISI = 200000;

function domainCocok(url) {
  const host = new URL(url).hostname;
  return config.domainDicatat.some((d) => host === d || host.endsWith(`.${d}`));
}

// Nilai header rahasia diganti penanda, supaya berkas rekaman aman dibaca dan dibagikan.
function samarkanHeader(headers) {
  const hasil = {};
  for (const [nama, nilai] of Object.entries(headers)) {
    hasil[nama] = HEADER_RAHASIA.includes(nama.toLowerCase()) ? `<disamarkan ${nilai.length} karakter>` : nilai;
  }
  return hasil;
}

// Hanya isi JSON dan isi form yang dibongkar; HTML dan teks lain dicatat apa adanya.
function samarkanIsi(teks, tipe = '') {
  if (!teks) return teks;
  if (/json/.test(tipe) || /^\s*[[{]/.test(teks)) {
    try {
      return JSON.stringify(samarkanObjek(JSON.parse(teks))).slice(0, BATAS_ISI);
    } catch {
      return teks.slice(0, BATAS_ISI);
    }
  }
  if (/x-www-form-urlencoded/.test(tipe)) {
    const params = new URLSearchParams(teks);
    for (const kunci of [...params.keys()]) {
      if (KUNCI_RAHASIA.test(kunci)) params.set(kunci, '<disamarkan>');
    }
    return params.toString().slice(0, BATAS_ISI);
  }
  return teks.slice(0, BATAS_ISI);
}

function samarkanObjek(data) {
  if (Array.isArray(data)) return data.map(samarkanObjek);
  if (data && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, KUNCI_RAHASIA.test(k) ? '<disamarkan>' : samarkanObjek(v)]),
    );
  }
  return data;
}

// Mencatat permintaan XHR/fetch dan pengiriman form ke Talenta, satu baris JSON per permintaan.
export function pasangPencatat(context) {
  fs.mkdirSync(config.dirRekaman, { recursive: true });
  const cap = new Date().toISOString().replace(/[:.]/g, '-');
  const berkas = path.join(config.dirRekaman, `rekaman-${cap}.jsonl`);
  let jumlah = 0;

  context.on('requestfinished', async (request) => {
    try {
      const jenis = request.resourceType();
      const metode = request.method();
      if (!domainCocok(request.url())) return;
      if (!['xhr', 'fetch'].includes(jenis) && !(jenis === 'document' && metode !== 'GET')) return;

      const response = await request.response();
      const tipe = response?.headers()['content-type'] ?? '';
      let isiRespons = null;
      if (response && /json|text/.test(tipe)) {
        isiRespons = samarkanIsi(await response.text().catch(() => null), tipe);
      }

      const catatan = {
        waktu: new Date().toISOString(),
        halaman: request.frame()?.page()?.url() ?? null,
        metode,
        url: request.url(),
        jenis,
        header: samarkanHeader(request.headers()),
        isi: samarkanIsi(request.postData(), request.headers()['content-type'] ?? ''),
        status: response?.status() ?? null,
        tipeRespons: tipe,
        isiRespons,
      };
      fs.appendFileSync(berkas, `${JSON.stringify(catatan)}\n`);
      jumlah += 1;
    } catch {
      // Halaman bisa tertutup saat respons dibaca; permintaan itu dilewati saja.
    }
  });

  return { berkas, jumlah: () => jumlah };
}
