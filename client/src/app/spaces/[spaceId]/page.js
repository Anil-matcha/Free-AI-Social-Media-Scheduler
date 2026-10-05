"use client";

import React from "react";
import { useParams } from "next/navigation";
import OpenSpacesApp from "../../../components/OpenSpacesApp";

export default function SpaceRoute() {
  const params = useParams();
  const spaceId = params?.spaceId;

  return (
    <OpenSpacesApp
      initialRailTab="spaces"
      initialSpaceId={spaceId}
      initialPageId={null}
    />
  );
}
