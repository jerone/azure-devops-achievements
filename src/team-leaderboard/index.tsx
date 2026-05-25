import React from "react";
import ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { TeamLeaderboard } from "./TeamLeaderboard";

// SDK.init() starts the handshake with the ADO host frame.
// Wrapped in try/catch so the page doesn't hard-crash when opened directly in a browser.
try {
  SDK.init();
} catch (e) {
  console.warn("[Achievements] SDK.init() failed — page may not be running inside ADO.", e);
}

ReactDOM.render(
  <React.StrictMode>
    <TeamLeaderboard />
  </React.StrictMode>,
  document.getElementById("root")
);
