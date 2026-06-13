"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "@/context/ApiContext";
import { CreativeCanvas } from "design-agent";
import "design-agent/dist/tailwind.css";
import { useTheme } from "next-themes";

function CanvasLoader() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const initialAssetParam = searchParams.get("a");
  const { userData } = useApi();
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <CreativeCanvas
      sessionId={sessionId}
      initialAssetParam={initialAssetParam}
      user={userData}
      isAuthorized={true}
      theme={resolvedTheme}
      setTheme={setTheme}
    />
  );
}

export default function CanvasPage() {
  return (
    <div className="h-dvh w-full">
      <Suspense fallback={<div className="h-full w-full flex items-center justify-center">Loading Workspace...</div>}>
        <CanvasLoader />
      </Suspense>
    </div>
  );
}
