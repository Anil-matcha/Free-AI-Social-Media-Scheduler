"use client";

import { CreateAgentPage } from "ai-agent";
import "ai-agent/dist/tailwind.css";

// Mock user context to pass into components
const mockUseUser = () => ({
  user: {
    name: "Tester",
    username: "dev_user",
    profile_photo: "",
  }
});

export default function CreateAgentRoute() {
  return (
    <div className="w-full h-dvh bg-white">
      <CreateAgentPage useUser={mockUseUser} usedIn="muapiapp" />
    </div>
  );
}
