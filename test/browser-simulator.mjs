import { chromium } from "playwright";
import { runBrowserSimulation } from "./browser-simulator-core.mjs";

const executablePath = process.env.SUPACHESS_CHROME_PATH || undefined;
const url = process.env.SUPACHESS_TEST_URL || undefined;
const report = await runBrowserSimulation({ chromium, executablePath, url });
console.log(JSON.stringify(report, null, 2));

