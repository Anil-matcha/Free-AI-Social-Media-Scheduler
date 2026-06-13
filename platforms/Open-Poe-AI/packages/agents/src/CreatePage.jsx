"use client";

import CreateAgent from "./components/CreateAgent";
import { Toaster } from "react-hot-toast";

const CreateAgentPage = ({ useUser, usedIn = "muapiapp" }) => {
  return (
    <div className="h-screen w-full flex flex-col bg-gray-100 transition-all duration-300 ease-in-out">
      <main className="flex flex-col items-center gap-2 w-full h-full overflow-y-auto pt-8">
        <CreateAgent useUser={useUser} usedIn={usedIn} />
      </main>
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

export default CreateAgentPage;
