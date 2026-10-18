import { createRoot } from "react-dom/client";
import { VellumApp } from "@/components/vellum/app";
import "@/styles.css";

const root = document.getElementById("root");
if (root) createRoot(root).render(<VellumApp />);
