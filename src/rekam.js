import readline from 'node:readline/promises';
import { bukaBrowser, tutupBrowser } from './browser.js';
import { config } from './config.js';
import { pasangPencatat } from './pencatat.js';

// Merekam pengajuan yang dilakukan manual, sebagai contoh bagi bot.
const { context, page } = await bukaBrowser();
const pencatat = pasangPencatat(context);
await page.goto(config.urlAwal);

console.log(`
Browser sudah terbuka.
1. Login ke Talenta bila diminta.
2. Lakukan pengajuan yang mau dicontohkan (yang memang benar) sampai terkirim.
3. Kembali ke jendela ini lalu tekan Enter.
`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
await rl.question('Tekan Enter setelah pengajuan terkirim... ');
rl.close();

await tutupBrowser(context);
console.log(`\n${pencatat.jumlah()} permintaan dicatat di:\n${pencatat.berkas}`);
