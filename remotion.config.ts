import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);

// In the cloud session a headless Chromium is already installed, so use it
// instead of letting Remotion download its own copy.
const cloudChromium =
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (existsSync(cloudChromium)) {
  Config.setBrowserExecutable(cloudChromium);
}
