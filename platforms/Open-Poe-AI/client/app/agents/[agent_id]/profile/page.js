"use client";

import { AgentProfile } from "ai-agent";
import "ai-agent/dist/tailwind.css";
import { useParams } from "next/navigation";

// Mock user context to pass into components
const mockUseUser = () => ({
  user: {
    name: "Tester",
    username: "dev_user",
    profile_photo: "",
  }
});

export default function AgentProfileRoute() {
  const params = useParams();
  const agent_id = params.agent_id;

  return (
    <div className="w-full h-dvh bg-white">
      <AgentProfile agent_id={agent_id} useUser={mockUseUser} usedIn="muapiapp" />
    </div>
  );
}
