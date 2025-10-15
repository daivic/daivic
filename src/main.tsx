import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BACKGROUND_COLOR_CSS } from "./config/constants.ts";

// Reset default browser styles
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";

// Also reset the root element
const rootEl = document.getElementById("root");
if (rootEl) {
  rootEl.style.margin = "0";
  rootEl.style.padding = "0";
  rootEl.style.width = "100vw";
  rootEl.style.height = "100vh";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div
      style={{
        background: BACKGROUND_COLOR_CSS,
        margin: 0,
        padding: 0,
        width: "100vw",
        height: "100vh",
      }}
    >
      <App />
    </div>
  </StrictMode>
);
