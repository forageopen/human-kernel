// Browser entry point. Loaded by index.html as a module script.
import { wireBrowserUI } from "./dashboard/app.js";

const root = document.getElementById("app");
if (!root) {
  throw new Error("index.html is missing the #app root element");
}
void wireBrowserUI(root);
