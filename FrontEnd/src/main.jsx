import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";

if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
