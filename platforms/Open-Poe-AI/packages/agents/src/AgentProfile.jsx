"use client";

import { Toaster } from "react-hot-toast";
import ProfileAgent from "./components/ProfileAgent";

const AgentProfile = ({ useUser, usedIn = "muapiapp" }) => {
  return (
    <div className="h-screen w-full flex flex-col bg-blue-50/50 transition-all duration-300 ease-in-out">
      <Toaster position="top-center" reverseOrder={false} />
      <main className="flex flex-col items-center gap-2 w-full h-full overflow-y-auto pt-8">
        <ProfileAgent useUser={useUser} usedIn={usedIn} />
      </main>
    </div>
  );
};

export default AgentProfile;
