import { config } from './config.js';
import { bukaDenganLogin } from './sesi.js';

const HOST_API = 'api.mekari.com';

// Halaman Talenta memanggil api.mekari.com dengan token di header Authorization.
// Token itu diambil dari panggilan halaman sendiri dan hanya disimpan di memori.
// Hanya panggilan yang diterima api.mekari.com yang dipakai: halaman kadang mencoba
// token lama dulu, ditolak (401), lalu mengulang dengan token baru.
export async function bukaDenganToken(page, url) {
  const menunggu = page.waitForResponse(
    (r) =>
      new URL(r.url()).hostname === HOST_API &&
      r.status() < 300 &&
      Boolean(r.request().headers().authorization),
    { timeout: config.batasTungguLoginMs + 60000 },
  );
  // Bila harus login dulu, permintaan ber-token baru muncul setelahnya.
  menunggu.catch(() => {});
  await bukaDenganLogin(page, url);
  const respons = await menunggu;
  return respons.request().headers().authorization;
}

// Memanggil api.mekari.com dari dalam halaman. `form` dikirim sebagai multipart.
export async function panggilApi(page, token, jalur, { form } = {}) {
  const hasil = await page.evaluate(
    async ({ url, token, form }) => {
      const opsi = { headers: { Authorization: token, Accept: 'application/json' } };
      if (form) {
        opsi.method = 'POST';
        opsi.body = new FormData();
        for (const [nama, nilai] of form) opsi.body.append(nama, nilai);
      }
      const respons = await fetch(url, opsi);
      return { status: respons.status, teks: await respons.text() };
    },
    { url: `https://${HOST_API}${jalur}`, token, form },
  );
  if (hasil.status >= 300) throw new Error(`Talenta menolak (status ${hasil.status}): ${hasil.teks.slice(0, 300)}`);
  return hasil;
}
