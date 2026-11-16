import { berjalanTanpaJendela } from './browser.js';
import { config } from './config.js';

export class SesiHabis extends Error {
  constructor() {
    super('Sesi login habis. Jalankan "npm run login", login di jendela yang terbuka, lalu ulangi.');
  }
}

// Membuka halaman tujuan; bila terlempar ke halaman login, menunggu sampai login selesai.
export async function bukaDenganLogin(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  if (new URL(page.url()).hostname !== config.hostLogin) return;
  if (berjalanTanpaJendela(page)) throw new SesiHabis();

  console.log('Sesi habis. Login dulu di jendela browser yang terbuka, bot menunggu...');
  await page.waitForURL((u) => u.hostname === new URL(config.urlAwal).hostname, {
    timeout: config.batasTungguLoginMs,
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}
