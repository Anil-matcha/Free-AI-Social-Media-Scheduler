"use client";

import { AiAgent } from "ai-agent";
import "ai-agent/dist/tailwind.css";

// Mock user context to pass into AiAgent
const mockUseUser = () => ({
  user: {
    name: "Tester",
    username: "dev_user",
    profile_photo: "",
  }
});

export default function AgentClientWrapper({ initialAgentDetails, initialHistory = null }) {
  return (
    <div className="h-dvh w-full">
      <AiAgent 
        initialAgentDetails={initialAgentDetails} 
        initialHistory={initialHistory} 
        useUser={mockUseUser}
        usedIn="muapiapp"
      />
    </div>
  );
}
