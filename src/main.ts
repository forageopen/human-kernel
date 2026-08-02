// Browser entry point. Loaded by index.html as a module script.
import { wireBrowserUI } from "./dashboard/app.js";
import { startLiveClock } from "./dashboard/clock.js";
import { initParticles } from "./dashboard/particles.js";

const root = document.getElementById("app");
if (!root) {
  throw new Error("index.html is missing the #app root element");
}
void wireBrowserUI(root);

// Footer clock lives outside #app - it's page chrome, not dashboard data, so
// it's wired directly here rather than through render.ts/app.ts.
const clockEl = document.getElementById("hk-live-clock");
if (clockEl) startLiveClock(clockEl);

// Ambient background particles - same reasoning as the clock: page chrome,
// not dashboard data, wired directly rather than through render.ts/app.ts.
const particlesEl = document.getElementById("hk-particles");
if (particlesEl) initParticles(particlesEl);
