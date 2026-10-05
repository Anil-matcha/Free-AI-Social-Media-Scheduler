"use client";

import React from "react";
import OpenSpacesApp from "../components/OpenSpacesApp";

export default function HomePage() {
  return (
    <OpenSpacesApp
      initialRailTab="spaces" // Default to pages & spaces on homepage
    />
  );
}
