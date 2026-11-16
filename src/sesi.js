import { berjalanTanpaJendela } from './browser.js';
import { config } from './config.js';
import { bisaLoginOtomatis, loginOtomatis } from './login-otomatis.js';

export class SesiHabis extends Error {
  constructor(sebab = 'Sesi login habis.') {
    super(`${sebab} Jalankan "npm run login", login di jendela yang terbuka, lalu ulangi.`);
  }
}

// Membuka halaman tujuan. Bila terlempar ke halaman login: login sendiri kalau email
// dan password ada di setelan, kalau tidak menunggu login manual di jendela browser.
export async function bukaDenganLogin(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  if (new URL(page.url()).hostname !== config.hostLogin) return;

  if (bisaLoginOtomatis()) {
    console.log('Sesi habis, login otomatis...');
    if (await loginOtomatis(page)) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      return;
    }
    console.log('Login otomatis gagal (password salah, atau diminta captcha/OTP).');
  }
  if (berjalanTanpaJendela(page)) {
    throw new SesiHabis(bisaLoginOtomatis() ? 'Login otomatis gagal.' : undefined);
  }

  console.log('Login dulu di jendela browser yang terbuka, bot menunggu...');
  await page.waitForURL((u) => u.hostname === new URL(config.urlAwal).hostname, {
    timeout: config.batasTungguLoginMs,
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}
