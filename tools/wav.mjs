// Write a Float32Array (mono, -1..1) as a 16-bit PCM WAV file.
import { writeFileSync } from "node:fs";

export function writeWav(path, buf, SR = 48000) {
  const n = buf.length;
  const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i])) * 32767), 44 + i * 2);
  }
  writeFileSync(path, b);
}

// Seeded noise in -1..1 (never Math.random: renders must be identical every run).
export function noiseGen(seed = 42) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2147483648 - 1;
}
