import React from "react";
import ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import "azure-devops-ui/Core/override.css";
import "./styles.css";
import { AchievementsHub } from "./AchievementsHub";

try {
  // applyTheme: true (default) causes ADO to inject its CSS variables into this iframe,
  // so our stylesheet automatically matches the host's light/dark theme.
  SDK.init({ applyTheme: true });
} catch (e) {
  console.warn("[Achievements] SDK.init() failed — not running inside ADO.", e);
}

ReactDOM.render(
  <React.StrictMode>
    <AchievementsHub />
  </React.StrictMode>,
  document.getElementById("root")
);
