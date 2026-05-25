import React, { useState } from "react";
import { MyAchievementsTab } from "./tabs/MyAchievementsTab";
import { MyTeamTab } from "./tabs/MyTeamTab";
import "../achievements/styles.css";

type TabId = "my-achievements" | "my-team";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: "my-achievements", label: "My Achievements", icon: "🏅" },
  { id: "my-team",         label: "My Team",         icon: "👥" },
];

export const AchievementsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("my-achievements");

  return (
    <div className="hub-shell">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="hub-header">
        <div className="hub-title-row">
          <span style={{ fontSize: "1.4rem" }}>🏆</span>
          <h1>Achievements</h1>
        </div>

        {/* ── Tab bar ───────────────────────────────────────────────── */}
        <ul className="tab-bar" role="tablist">
          {TABS.map((tab) => (
            <li
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tab-bar__item${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}&nbsp;&nbsp;{tab.label}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────── */}
      <div className="hub-content" role="tabpanel">
        {activeTab === "my-achievements" && <MyAchievementsTab />}
        {activeTab === "my-team"         && <MyTeamTab />}
      </div>
    </div>
  );
};
