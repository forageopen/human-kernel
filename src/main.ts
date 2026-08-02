// Browser entry point. Loaded by index.html as a module script.
import { wireBrowserUI } from "./dashboard/app.js";
import { startLiveClock } from "./dashboard/clock.js";

const root = document.getElementById("app");
if (!root) {
  throw new Error("index.html is missing the #app root element");
}
void wireBrowserUI(root);

// Footer clock lives outside #app - it's page chrome, not dashboard data, so
// it's wired directly here rather than through render.ts/app.ts.
const clockEl = document.getElementById("hk-live-clock");
if (clockEl) startLiveClock(clockEl);
