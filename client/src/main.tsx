import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n"; // Import i18n configuration before rendering

// Wait for i18n initialization before rendering
import i18next from "i18next";

i18next.init().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});