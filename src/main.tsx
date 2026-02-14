import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LibraryProvider } from "./store/LibraryContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LibraryProvider>
        <App />
      </LibraryProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
