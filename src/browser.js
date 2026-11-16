import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { config } from './config.js';

const tanpaJendela = new WeakSet();

// Memakai Edge yang sudah terpasang, dengan profil milik bot.
export async function bukaBrowser({ headless = false } = {}) {
  const context = await chromium.launchPersistentContext(config.dirProfil, {
    channel: 'msedge',
    headless,
    viewport: null,
  });
  if (headless) tanpaJendela.add(context);
  if (fs.existsSync(config.berkasSesi)) {
    const { cookies } = JSON.parse(fs.readFileSync(config.berkasSesi, 'utf8'));
    await context.addCookies(cookies);
  }
  const page = context.pages()[0] ?? (await context.newPage());
  return { context, page };
}

// Tanpa jendela tidak ada tempat untuk login, jadi sesi yang habis harus dilaporkan.
export function berjalanTanpaJendela(page) {
  return tanpaJendela.has(page.context());
}

export async function tutupBrowser(context) {
  const { cookies } = await context.storageState();
  fs.writeFileSync(config.berkasSesi, JSON.stringify({ cookies }));
  await context.close();
}
