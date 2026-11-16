// Mengirim form dari dalam halaman Talenta yang sedang terbuka, sehingga cookie dan
// token CSRF halaman itu ikut terpakai persis seperti saat form dikirim manual.
export async function kirimForm(page, jalur, isian) {
  return page.evaluate(
    async ({ jalur, isian }) => {
      const csrf =
        document.querySelector('meta[name="csrf-token"]')?.content ??
        document.querySelector('input[name="_csrf"]')?.value;
      if (!csrf) throw new Error('Token CSRF tidak ditemukan di halaman');

      const body = new URLSearchParams([['_csrf', csrf], ...isian]);
      const respons = await fetch(jalur, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json, text/javascript, */*; q=0.01',
        },
        body,
      });
      return { status: respons.status, teks: await respons.text() };
    },
    { jalur, isian },
  );
}
