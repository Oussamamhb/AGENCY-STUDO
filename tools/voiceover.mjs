// Voice-over with Voicebox (https://voicebox.sh), line by line, synced to the film.
//
// 1) GENERATE - run on the computer where the Voicebox app is open (it listens on 127.0.0.1):
//      node tools/voiceover.mjs profiles
//      node tools/voiceover.mjs generate videos/<name>/vo.json --profile "<voice name>" [--engine qwen] [--seed 7] [--only 03-search,08-ai]
//    Writes one WAV per line to public/<name>/vo/<line-id>.wav. Commit and push them.
//    --only re-generates just those lines (try another --seed for a different take).
//    A line's "say" (if present) is what the voice speaks, e.g. "Acme A I" for AcmeAI; "text" is the script.
//
// 2) BUILD - anywhere with ffmpeg (the cloud session does this):
//      node tools/voiceover.mjs build videos/<name>/vo.json --out out/<name>/vo.wav --duration 46
//    Trims silence, speeds a line up (max 12%) if it overruns its slot, places every line at
//    its start time, and writes one full-length VO track. Then mix with tools/mix.sh (music
//    is ducked under the voice automatically when a VO track is given).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (k, d) => {
  const i = argv.indexOf("--" + k);
  return i >= 0 ? argv[i + 1] : d;
};
const API = opt("api", process.env.VOICEBOX_URL ?? "http://127.0.0.1:17493");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, init) {
  const res = await fetch(API + path, {
    ...init,
    headers: { "content-type": "application/json", "X-Voicebox-Client-Id": "pitch-motion", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} -> ${res.status} ${await res.text()}`);
  return res;
}

async function profiles() {
  const list = await (await api("/profiles")).json();
  if (!list.length) console.log("No voice profiles yet. Create or clone a voice in the Voicebox app first.");
  for (const p of list) console.log(`- ${p.name}  (${p.voice_type}${p.preset_engine ? ", " + p.preset_engine : ""}, id ${p.id})`);
  return list;
}

async function generate(file) {
  const vo = JSON.parse(readFileSync(file, "utf8"));
  const want = opt("profile");
  const list = await (await api("/profiles")).json();
  const profile = list.find((p) => p.name === want || p.id === want) ?? (list.length === 1 ? list[0] : null);
  if (!profile) {
    console.log(want ? `No profile named "${want}". Available:` : "Pick a voice with --profile. Available:");
    for (const p of list) console.log(`- ${p.name}`);
    process.exit(1);
  }
  const outDir = join("public", vo.video, "vo");
  mkdirSync(outDir, { recursive: true });
  const engine = opt("engine", profile.default_engine ?? profile.preset_engine ?? undefined);
  const seed = Number(opt("seed", 7));
  console.log(`Voice: ${profile.name}${engine ? ` · engine ${engine}` : ""} · ${vo.lines.length} lines`);
  const only = opt("only")?.split(",");
  for (const line of vo.lines) {
    if (only && !only.includes(line.id)) continue;
    const body = { profile_id: profile.id, text: line.say ?? line.text, language: vo.language ?? "en", seed, normalize: true };
    if (engine) body.engine = engine;
    if (vo.instruct && (!engine || engine.startsWith("qwen"))) body.instruct = line.instruct ?? vo.instruct;
    const gen = await (await api("/generate", { method: "POST", body: JSON.stringify(body) })).json();
    let status = gen.status;
    for (let i = 0; status !== "completed" && i < 600; i++) {
      await sleep(1000);
      const h = await (await api(`/history/${gen.id}`)).json();
      status = h.status ?? "completed";
      if (status === "failed") throw new Error(`Line ${line.id} failed: ${h.error}`);
    }
    const audio = Buffer.from(await (await api(`/audio/${gen.id}`)).arrayBuffer());
    writeFileSync(join(outDir, `${line.id}.wav`), audio);
    console.log(`✓ ${line.id}  "${line.text}"`);
  }
  console.log(`\nDone. Files in ${outDir}. Commit and push them, then run the build step.`);
}

// Full take: every line's `say ?? text` joined by blank lines in ONE /generate call (the method of
// Films 1-3: one natural read with pauses), saved as public/<video>/vo/vo-full.wav (or --out).
//   node tools/voiceover.mjs take videos/<name>/vo.json --profile "My Narrator" --seed 7
async function take(file) {
  const vo = JSON.parse(readFileSync(file, "utf8"));
  const list = await (await api("/profiles")).json();
  const want = opt("profile");
  const profile = list.find((p) => p.name === want || p.id === want);
  if (!profile) { console.log(`No profile "${want}". Available:`); list.forEach((p) => console.log(`  ${p.name}  (${p.id})`)); process.exit(1); }
  const out = opt("out", join("public", vo.video, "vo", "vo-full.wav"));
  mkdirSync(dirname(out), { recursive: true });
  const body = { profile_id: profile.id, text: vo.lines.map((l) => l.say ?? l.text).join("\n\n"), language: vo.language ?? "en", seed: Number(opt("seed", 7)), normalize: true };
  const engine = opt("engine", profile.default_engine ?? profile.preset_engine ?? undefined);
  if (engine) body.engine = engine;
  if (vo.instruct && (!engine || engine.startsWith("qwen"))) body.instruct = vo.instruct;
  console.log(`Voice: ${profile.name} · seed ${body.seed} · ${vo.lines.length} lines in one take`);
  const gen = await (await api("/generate", { method: "POST", body: JSON.stringify(body) })).json();
  let status = gen.status;
  for (let i = 0; status !== "completed" && i < 1200; i++) {
    await sleep(1000);
    const h = await (await api(`/history/${gen.id}`)).json();
    status = h.status ?? "completed";
    if (status === "failed") throw new Error(`Take failed: ${h.error}`);
  }
  writeFileSync(out, Buffer.from(await (await api(`/audio/${gen.id}`)).arrayBuffer()));
  console.log(`✓ ${out}  ${probe(out).toFixed(1)} s`);
}

const probe = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

function build(file) {
  const vo = JSON.parse(readFileSync(file, "utf8"));
  const out = opt("out", join("out", vo.video, "vo.wav"));
  const duration = Number(opt("duration", 60));
  const tmp = join(dirname(out), "vo-lines");
  mkdirSync(tmp, { recursive: true });
  const inputs = [];
  const report = [];
  for (const line of vo.lines) {
    const src = join("public", vo.video, "vo", `${line.id}.wav`);
    if (!existsSync(src)) { report.push(`MISSING ${line.id}`); continue; }
    const trimmed = join(tmp, `${line.id}.wav`);
    // trim leading/trailing silence, 48 kHz mono
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-af",
      "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse",
      "-ar", "48000", "-ac", "1", trimmed]);
    let len = probe(trimmed);
    let tempo = 1;
    if (line.max && len > line.max) tempo = Math.min(1.12, len / line.max);
    const fitted = join(tmp, `${line.id}.fit.wav`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", trimmed, "-af", `atempo=${tempo.toFixed(4)}`, fitted]);
    len = probe(fitted);
    const over = line.max ? len - line.max : 0;
    report.push(`${line.id.padEnd(14)} ${len.toFixed(2)}s / slot ${line.max ?? "-"}s${tempo > 1 ? ` · sped up ${((tempo - 1) * 100).toFixed(0)}%` : ""}${over > 0.05 ? ` · STILL ${over.toFixed(2)}s TOO LONG (shorten the text)` : ""}`);
    inputs.push({ f: fitted, at: line.start });
  }
  const args = ["-y", "-loglevel", "error"];
  inputs.forEach((i) => args.push("-i", i.f));
  const chains = inputs.map((i, k) => `[${k}:a]adelay=${Math.round(i.at * 1000)}|${Math.round(i.at * 1000)},apad[a${k}]`);
  const mixIn = inputs.map((_, k) => `[a${k}]`).join("");
  args.push("-filter_complex", `${chains.join(";")};${mixIn}amix=inputs=${inputs.length}:normalize=0,atrim=0:${duration}[v]`, "-map", "[v]", "-ar", "48000", out);
  execFileSync("ffmpeg", args);
  console.log(report.join("\n"));
  console.log(`VO track -> ${out}`);
}

if (cmd === "profiles") await profiles();
else if (cmd === "generate") await generate(argv[1]);
else if (cmd === "build") build(argv[1]);
else if (cmd === "take") await take(argv[1]);
else {
  console.log("Usage: node tools/voiceover.mjs profiles | generate <vo.json> --profile <name> | build <vo.json> --out <wav> --duration <s>");
  process.exit(1);
}
