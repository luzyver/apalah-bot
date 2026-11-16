// Jam ditulis "21.15" atau "21:15"; di dalam bot dihitung sebagai menit sejak 00.00.
export function keMenit(jam) {
  const cocok = /^(\d{1,2})[.:](\d{2})(?::\d{2})?$/.exec(jam.trim());
  if (!cocok) throw new Error(`Jam tidak dikenali: "${jam}"`);
  const [j, m] = [Number(cocok[1]), Number(cocok[2])];
  if (j > 23 || m > 59) throw new Error(`Jam tidak sah: "${jam}"`);
  return j * 60 + m;
}

export function keJam(menit) {
  const j = String(Math.floor(menit / 60)).padStart(2, '0');
  const m = String(menit % 60).padStart(2, '0');
  return `${j}.${m}`;
}

export function pecah(menit) {
  return { jam: Math.floor(menit / 60), menit: menit % 60 };
}
