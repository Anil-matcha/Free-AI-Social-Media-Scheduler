"use client";

import EditAgent from "./components/EditAgent";
import { Toaster } from "react-hot-toast";

const EditAgentPage = ({ useUser, usedIn = "muapiapp" }) => {
  return (
    <div className="h-dvh w-full flex flex-col bg-blue-50/50 transition-all duration-300 ease-in-out">
      <Toaster position="top-center" reverseOrder={false} />
      <main className="flex flex-col items-center gap-2 w-full h-full overflow-y-auto pt-8">
        <EditAgent useUser={useUser} usedIn={usedIn} />
      </main>
    </div>
  );
};

export default EditAgentPage;
