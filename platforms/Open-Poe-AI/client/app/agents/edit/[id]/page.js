"use client";

import { EditAgentPage } from "ai-agent";
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

export default function EditAgentRoute() {
  const params = useParams();
  const id = params.id;

  return (
    <div className="h-dvh bg-white">
      <EditAgentPage id={id} useUser={mockUseUser} usedIn="muapiapp" />
    </div>
  );
}
