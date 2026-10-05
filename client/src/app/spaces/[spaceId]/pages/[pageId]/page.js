"use client";

import React from "react";
import { useParams } from "next/navigation";
import OpenSpacesApp from "../../../../../components/OpenSpacesApp";

export default function SpacePageDocRoute() {
  const params = useParams();
  const spaceId = params?.spaceId;
  const pageId = params?.pageId;

  return (
    <OpenSpacesApp
      initialRailTab="spaces"
      initialSpaceId={spaceId}
      initialPageId={pageId}
    />
  );
}
