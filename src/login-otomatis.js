import { config } from './config.js';

const BATAS_TUNGGU_MS = 60000;

export const bisaLoginOtomatis = () => Boolean(config.email && config.password);

// Mengisi form login Mekari Account dengan email dan password dari setelan.
// Mengembalikan true bila berhasil kembali ke Talenta; false bila ditolak atau
// halaman meminta hal lain (captcha, OTP), sehingga perlu login manual.
export async function loginOtomatis(page) {
  try {
    await page.fill('#user_email', config.email);
    await page.fill('#user_password', config.password);
    await page.click('#new-signin-button');
    await page.waitForURL((u) => u.hostname === new URL(config.urlAwal).hostname, {
      timeout: BATAS_TUNGGU_MS,
    });
    return true;
  } catch {
    return false;
  }
}
