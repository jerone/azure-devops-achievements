import React from "react";
import ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { MyAchievements } from "./MyAchievements";

// SDK.init() starts the handshake with the ADO host frame.
// It must be called before SDK.ready(). Wrapped in try/catch so the page
// doesn't hard-crash when opened directly in a browser (e.g. to trust the cert).
try {
  SDK.init();
} catch (e) {
  console.warn("[Achievements] SDK.init() failed — page may not be running inside ADO.", e);
}

ReactDOM.render(
  <React.StrictMode>
    <MyAchievements />
  </React.StrictMode>,
  document.getElementById("root")
);
