import { bukaBrowser, tutupBrowser } from './browser.js';
import { urlLembur } from './lembur/kirim.js';
import { bukaDenganLogin } from './sesi.js';

// Membuka jendela browser untuk login, lalu menyimpan sesinya untuk dipakai bot.
const { context, page } = await bukaBrowser();
try {
  await bukaDenganLogin(page, urlLembur);
  console.log('Login tersimpan.');
} finally {
  await tutupBrowser(context);
}
