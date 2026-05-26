import React, { useState } from "react";
import { Page } from "azure-devops-ui/Page";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Tab, TabBar, TabSize } from "azure-devops-ui/Tabs";
import { MyAchievementsTab } from "./tabs/MyAchievementsTab";
import { MyTeamTab } from "./tabs/MyTeamTab";

type TabId = "my-achievements" | "my-team";

export const AchievementsHub: React.FC = () => {
  const [selectedTabId, setSelectedTabId] = useState<TabId>("my-achievements");

  return (
    <Page className="flex-grow">
      <Header
        title="Achievements"
        titleSize={TitleSize.Large}
      />
      <TabBar
        selectedTabId={selectedTabId}
        onSelectedTabChanged={(newTabId: string) => setSelectedTabId(newTabId as TabId)}
        tabSize={TabSize.Tall}
      >
        <Tab id="my-achievements" name="My Achievements" />
        <Tab id="my-team"         name="My Team" />
      </TabBar>

      <div className="page-content page-content-top">
        {selectedTabId === "my-achievements" && <MyAchievementsTab />}
        {selectedTabId === "my-team"         && <MyTeamTab />}
      </div>
    </Page>
  );
};

